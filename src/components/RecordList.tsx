import type { RecordRow } from '@/types/database'
import { BASE_CURRENCY, currencySymbol, formatMoney, normalizeCurrency } from '@/lib/currency'

type Props = {
  records: RecordRow[]
  onEdit?: (id: string) => void
  onDelete: (id: string) => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return '今天'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function RecordList({ records, onEdit, onDelete }: Props) {
  return (
    <ul className="space-y-3">
      {records.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-800">{r.merchant || '未命名交易'}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(r.date)}</p>
            </div>
            <div className="text-right">
              <p className={`text-base font-semibold ${Number(r.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatMoney(Number(r.amount_base ?? r.amount), normalizeCurrency(r.base_currency ?? BASE_CURRENCY))}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {currencySymbol(r.currency)}{Number(r.amount_original ?? r.amount).toFixed(2)} {normalizeCurrency(r.currency)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="truncate text-xs text-slate-500">
              {[r.category, r.note].filter(Boolean).join(' · ') || '无分类 / 无备注'}
            </p>
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(r.id)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  编辑
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(r.id)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-100"
              >
                删除
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
