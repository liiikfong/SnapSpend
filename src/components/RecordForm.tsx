import { useState } from 'react'

export type RecordFormValues = {
  amount: number
  merchant: string
  category: string
  date: string
  note: string
}

type Props = {
  categories: string[]
  onSubmit: (values: RecordFormValues) => Promise<void>
  onCancel?: () => void
  initialValues?: RecordFormValues
  submitLabel: string
}

const defaultValues: RecordFormValues = {
  amount: 0,
  merchant: '',
  category: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export default function RecordForm({
  categories,
  onSubmit,
  onCancel,
  initialValues,
  submitLabel,
}: Props) {
  const [amount, setAmount] = useState(String(initialValues?.amount ?? defaultValues.amount))
  const [merchant, setMerchant] = useState(initialValues?.merchant ?? defaultValues.merchant)
  const [category, setCategory] = useState(initialValues?.category ?? defaultValues.category)
  const [date, setDate] = useState(initialValues?.date ?? defaultValues.date)
  const [note, setNote] = useState(initialValues?.note ?? defaultValues.note)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (Number.isNaN(num) || num === 0) {
      setError('请输入有效金额')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        amount: num,
        merchant: merchant.trim(),
        category: category.trim(),
        date,
        note: note.trim(),
      })
      setAmount(String(defaultValues.amount))
      setMerchant(defaultValues.merchant)
      setCategory(defaultValues.category)
      setDate(defaultValues.date)
      setNote(defaultValues.note)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      {error && (
        <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">
            金额 *
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">
            日期 *
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="merchant" className="block text-sm font-medium text-slate-400 mb-1">
          商户 / 对方
        </label>
        <input
          id="merchant"
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="如：星巴克、张三"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">
          分类
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">选择分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="note" className="block text-sm font-medium text-slate-400 mb-1">
          备注
        </label>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="可选"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 transition disabled:opacity-50"
        >
          {submitting ? '保存中…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-slate-300 hover:bg-slate-700"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
