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
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(2,8,23,0.35)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">{r.merchant || '未命名交易'}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(r.date)}</p>
            </div>
            <div className="text-right">
              <p className={`text-base font-semibold ${Number(r.amount) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatMoney(Number(r.amount_base ?? r.amount), normalizeCurrency(r.base_currency ?? BASE_CURRENCY))}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {currencySymbol(r.currency)}{Number(r.amount_original ?? r.amount).toFixed(2)} {normalizeCurrency(r.currency)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="truncate text-xs text-slate-400">
              {[r.category, r.note].filter(Boolean).join(' · ') || '无分类 / 无备注'}
            </p>
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(r.id)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                >
                  编辑
                </button>
              )}
            <button
              type="button"
              onClick={() => onDelete(r.id)}
              className="rounded-lg border border-rose-300/20 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-300/20"
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
