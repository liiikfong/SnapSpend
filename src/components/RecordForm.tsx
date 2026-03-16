import { useState } from 'react'
import { CURRENCIES } from '@/lib/currency'

export type RecordFormValues = {
  amount: number
  currency: string
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
  conversionHint?: string
}

const defaultValues: RecordFormValues = {
  amount: 0,
  currency: 'CNY',
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
  conversionHint,
}: Props) {
  const fieldClass =
    'h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
  const [amount, setAmount] = useState(String(initialValues?.amount ?? defaultValues.amount))
  const [currency, setCurrency] = useState(initialValues?.currency ?? defaultValues.currency)
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
        currency,
        merchant: merchant.trim(),
        category: category.trim(),
        date,
        note: note.trim(),
      })
      setAmount(String(defaultValues.amount))
      setCurrency(defaultValues.currency)
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur">
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-600">
            金额 *
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldClass}
            placeholder="0.00"
            required
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-slate-600">
            币种
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={fieldClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-600">
            日期 *
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldClass} date-input`}
            required
          />
        </div>
      </div>
      {conversionHint && (
        <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
          {conversionHint}
        </p>
      )}
      <div className="mt-4">
        <label htmlFor="merchant" className="mb-1 block text-sm font-medium text-slate-600">
          商户 / 对方
        </label>
        <input
          id="merchant"
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={fieldClass}
          placeholder="如：星巴克、张三"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-600">
          分类
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClass}
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
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-600">
          备注
        </label>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={fieldClass}
          placeholder="可选"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-cyan-600 py-2.5 font-medium text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {submitting ? '保存中…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
