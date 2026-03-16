import { createClient } from '@supabase/supabase-js'

type VercelRequest = { method?: string; query?: Record<string, string | string[] | undefined>; body?: unknown; headers?: Record<string, string | undefined> }
type VercelResponse = { setHeader: (k: string, v: string) => void; status: (n: number) => { end: () => void; json: (o: unknown) => void }; end: () => void; json: (o: unknown) => void }

const RECOGNITION_PROMPT = `你是一张账单/收款/转账截图的识别助手。图片可能是：银行推送通知、付款成功页、微信/支付宝转账截图等。
请从图片中识别并提取以下信息，严格按 JSON 格式输出，不要输出其他文字：
{
  "amount": 数字（金额，支出为负数，收入为正数；若无法区分则支出为负）,
  "merchant": "商户或对方名称，没有则空字符串",
  "date": "YYYY-MM-DD，没有则用今天日期",
  "type": "支出 或 收入",
  "note": "可选备注，没有则空字符串"
}
只输出这一份 JSON，不要 markdown 包裹。`

export type RecognitionResult = {
  amount: number
  merchant: string
  date: string
  type: string
  note: string
}

async function recognizeWithVision(imageBase64: string, mimeType: string): Promise<RecognitionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  // 优先用 1.5-flash（免费额度通常更宽松），若你 2.0 有配额可改为 gemini-2.0-flash
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: RECOGNITION_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    if (res.status === 429) {
      throw new Error('识别服务已达当前配额上限，请明天再试或到 Google AI Studio 查看用量与配额。')
    }
    throw new Error('Gemini API error: ' + res.status + ' ' + err)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }
  if (data.error) throw new Error(data.error.message || 'Gemini API error')
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!content) throw new Error('No content in Gemini response')

  // 允许被 markdown 代码块包裹
  const jsonStr = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>
  const amount = Number(parsed.amount)
  if (Number.isNaN(amount)) throw new Error('Invalid amount from recognition')

  const date = typeof parsed.date === 'string' ? parsed.date : new Date().toISOString().slice(0, 10)
  return {
    amount,
    merchant: typeof parsed.merchant === 'string' ? parsed.merchant : '',
    date,
    type: typeof parsed.type === 'string' ? parsed.type : '支出',
    note: typeof parsed.note === 'string' ? parsed.note : '',
  }
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  return createClient(url, key)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method === 'GET') {
    const token = typeof req.query.token === 'string' ? req.query.token : null
    if (!token) return res.status(400).json({ error: 'Missing token' })

    try {
      const supabase = getSupabaseAdmin()
      const { data: row, error: fetchErr } = await supabase
        .from('pending_recognitions')
        .select('result, expires_at')
        .eq('token', token)
        .single()

      if (fetchErr || !row) return res.status(404).json({ error: 'Token not found or expired' })
      if (new Date(row.expires_at) < new Date()) {
        await supabase.from('pending_recognitions').delete().eq('token', token)
        return res.status(404).json({ error: 'Token expired' })
      }

      await supabase.from('pending_recognitions').delete().eq('token', token)
      return res.status(200).json(row.result as RecognitionResult)
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'Failed to fetch recognition' })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body as { image?: string; mimeType?: string } | null
  if (!body?.image) return res.status(400).json({ error: 'Missing image (base64). POST JSON: { image: "<base64>", mimeType?: "image/png" }' })
  const imageBase64 = body.image
  const mimeType = body.mimeType || 'image/jpeg'

  try {
    const result = await recognizeWithVision(imageBase64, mimeType)
    const supabase = getSupabaseAdmin()
    const { data: inserted, error: insertErr } = await supabase
      .from('pending_recognitions')
      .insert({ result })
      .select('token')
      .single()

    if (insertErr) {
      console.error(insertErr)
      return res.status(500).json({ error: 'Failed to store token' })
    }

    return res.status(200).json({ token: inserted?.token, ...result })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Recognition failed' })
  }
}
