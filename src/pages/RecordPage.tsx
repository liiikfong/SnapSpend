import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { RecordRow, RecordInsert, RecordUpdate } from '@/types/database'
import type { RecordFormValues } from '@/components/RecordForm'
import RecordForm from '@/components/RecordForm'
import RecordList from '@/components/RecordList'

const CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '生活', '医疗', '教育', '转账', '其他']

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export default function RecordPage() {
  const { user, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [prefill, setPrefill] = useState<RecordFormValues | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [recognizeError, setRecognizeError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从 URL ?token=xxx 拉识别结果并预填
  useEffect(() => {
    if (!tokenFromUrl) return
    const base = API_BASE || ''
    setRecognizing(true)
    setRecognizeError('')
    fetch(`${base}/api/recognize?token=${encodeURIComponent(tokenFromUrl)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('识别结果已失效或不存在'))))
      .then((data: RecordFormValues & { type?: string }) => {
        setPrefill({
          amount: Number(data.amount),
          merchant: data.merchant ?? '',
          category: data.category ?? '',
          date: data.date ?? new Date().toISOString().slice(0, 10),
          note: data.note ?? '',
        })
        setSearchParams({}, { replace: true })
      })
      .catch((e) => setRecognizeError(e instanceof Error ? e.message : '获取识别结果失败'))
      .finally(() => setRecognizing(false))
  }, [tokenFromUrl, setSearchParams])

  useEffect(() => {
    if (!user) return

    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('fetch records error', error)
        return
      }
      setRecords((data as RecordRow[]) ?? [])
    }

    fetchRecords().finally(() => setLoading(false))

    const channel = supabase
      .channel('records-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${user.id}` },
        () => {
          fetchRecords()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function handleCreate(values: {
    amount: number
    merchant: string
    category: string
    date: string
    note: string
  }) {
    if (!user) return
    const row: RecordInsert = {
      user_id: user.id,
      amount: values.amount,
      merchant: values.merchant || null,
      category: values.category || null,
      date: values.date,
      note: values.note || null,
    }
    const { error } = await supabase.from('records').insert(row as never) // Supabase generic inference with custom Database type
    if (error) throw error
    setPrefill(null)
  }

  async function handleUpdate(
    id: string,
    values: { amount: number; merchant: string; category: string; date: string; note: string }
  ) {
    const patch: RecordUpdate = {
      amount: values.amount,
      merchant: values.merchant || null,
      category: values.category || null,
      date: values.date,
      note: values.note || null,
    }
    const { error } = await supabase.from('records').update(patch as never).eq('id', id)
    if (error) throw error
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('records').delete().eq('id', id)
    if (error) throw error
    setEditingId(null)
  }

  const editingRecord = editingId ? records.find((r) => r.id === editingId) : null

  async function handleRecognizeImage(file: File) {
    const base = API_BASE || ''
    setRecognizing(true)
    setRecognizeError('')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const dataUrl = r.result as string
          const i = dataUrl.indexOf(',')
          resolve(i >= 0 ? dataUrl.slice(i + 1) : dataUrl)
        }
        r.onerror = () => reject(new Error('读取图片失败'))
        r.readAsDataURL(file)
      })
      const res = await fetch(`${base}/api/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || res.statusText)
      }
      const data = (await res.json()) as RecordFormValues & { type?: string }
      setPrefill({
        amount: Number(data.amount),
        merchant: data.merchant ?? '',
        category: data.category ?? '',
        date: data.date ?? new Date().toISOString().slice(0, 10),
        note: data.note ?? '',
      })
      setEditingId(null)
    } catch (e) {
      setRecognizeError(e instanceof Error ? e.message : '识别失败')
    } finally {
      setRecognizing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-100">SnapSpend</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
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
        {(recognizeError || recognizing) && (
          <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3">
            {recognizing && <p className="text-sm text-slate-400">正在识别图片…</p>}
            {recognizeError && <p className="text-sm text-amber-400">{recognizeError}</p>}
          </div>
        )}
        <RecordForm
          key={editingId ?? (prefill ? 'prefill' : 'new')}
          categories={CATEGORIES}
          onSubmit={editingRecord ? (v) => handleUpdate(editingRecord.id, v) : handleCreate}
          onCancel={editingRecord ? () => setEditingId(null) : undefined}
          initialValues={
            editingRecord
              ? {
                  amount: editingRecord.amount,
                  merchant: editingRecord.merchant ?? '',
                  category: editingRecord.category ?? '',
                  date: editingRecord.date,
                  note: editingRecord.note ?? '',
                }
              : prefill ?? undefined
          }
          submitLabel={editingRecord ? '保存' : '记一笔'}
        />
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            disabled={recognizing}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            从图片识别
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-slate-400 mb-3">记账记录</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">加载中…</p>
          ) : records.length === 0 ? (
            <p className="text-slate-500 text-sm">暂无记录，记一笔吧</p>
          ) : (
            <RecordList
              records={records}
              onEdit={(id) => setEditingId(id)}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  )
}
