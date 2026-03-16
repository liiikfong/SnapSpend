import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MobileShell from '@/components/MobileShell'
import RecordForm, { type RecordFormValues } from '@/components/RecordForm'
import { BASE_CURRENCY, formatMoney, getFxQuote, normalizeCurrency } from '@/lib/currency'
import { useRecords } from '@/hooks/useRecords'

const CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '生活', '医疗', '教育', '转账', '其他']
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

type RecognitionResponse = {
  amount: number
  currency?: string
  merchant?: string
  category?: string
  date?: string
  note?: string
  type?: string
}

export default function CapturePage() {
  const { createRecord } = useRecords()
  const [searchParams, setSearchParams] = useSearchParams()
  const [prefill, setPrefill] = useState<RecordFormValues | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [recognizeError, setRecognizeError] = useState('')
  const [conversionHint, setConversionHint] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return
    setRecognizing(true)
    setRecognizeError('')
    fetch(`${API_BASE}/api/recognize?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('识别结果已失效或不存在'))))
      .then((data: RecognitionResponse) => {
        const d: RecordFormValues = {
          amount: Number(data.amount),
          currency: normalizeCurrency(data.currency),
          merchant: data.merchant ?? '',
          category: data.category ?? '',
          date: data.date ?? new Date().toISOString().slice(0, 10),
          note: data.note ?? '',
        }
        setPrefill(d)
        refreshHint(d.amount, d.currency)
        setSearchParams({}, { replace: true })
      })
      .catch((e) => setRecognizeError(e instanceof Error ? e.message : '获取识别结果失败'))
      .finally(() => setRecognizing(false))
  }, [token, setSearchParams])

  async function refreshHint(amount: number, currency: string) {
    try {
      const quote = await getFxQuote(currency, BASE_CURRENCY)
      const base = Number((amount * quote.rate).toFixed(2))
      setConversionHint(`折算预估：${formatMoney(base, BASE_CURRENCY)} (${normalizeCurrency(currency)}→${BASE_CURRENCY} @ ${quote.rate.toFixed(4)})`)
    } catch {
      setConversionHint('')
    }
  }

  async function handleSubmit(values: RecordFormValues) {
    await createRecord(values)
    await refreshHint(values.amount, values.currency)
    setPrefill(null)
  }

  async function handleRecognizeImage(file: File) {
    setRecognizing(true)
    setRecognizeError('')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const split = dataUrl.indexOf(',')
          resolve(split >= 0 ? dataUrl.slice(split + 1) : dataUrl)
        }
        reader.onerror = () => reject(new Error('读取图片失败'))
        reader.readAsDataURL(file)
      })
      const res = await fetch(`${API_BASE}/api/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || res.statusText)
      }
      const data = (await res.json()) as RecognitionResponse
      const d: RecordFormValues = {
        amount: Number(data.amount),
        currency: normalizeCurrency(data.currency),
        merchant: data.merchant ?? '',
        category: '',
        date: data.date ?? new Date().toISOString().slice(0, 10),
        note: data.note ?? '',
      }
      setPrefill(d)
      await refreshHint(d.amount, d.currency)
    } catch (e) {
      setRecognizeError(e instanceof Error ? e.message : '识别失败')
    } finally {
      setRecognizing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <MobileShell active="capture" title="SnapSpend" subtitle="录入账单 · 图片识别 + 手动补全">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleRecognizeImage(f)
        }}
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={recognizing}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/25 disabled:opacity-60"
        >
          {recognizing ? '识别中…' : '从图片识别'}
        </button>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400">默认基准币种</p>
          <p className="mt-1 text-sm font-medium text-slate-100">{BASE_CURRENCY}</p>
        </div>
      </div>

      {recognizeError && (
        <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-200/10 px-3 py-2 text-sm text-amber-200">
          {recognizeError}
        </div>
      )}

      <RecordForm
        key={prefill ? `prefill-${prefill.amount}-${prefill.currency}` : 'capture-new'}
        categories={CATEGORIES}
        onSubmit={handleSubmit}
        initialValues={prefill ?? undefined}
        submitLabel="保存记账"
        conversionHint={conversionHint}
      />
    </MobileShell>
  )
}
