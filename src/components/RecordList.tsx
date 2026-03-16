import type { RecordRow } from '@/types/database'

type Props = {
  records: RecordRow[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function formatAmount(amount: number) {
  const n = Number(amount)
  const sign = n >= 0 ? '+' : ''
  return `${sign}¥${Math.abs(n).toFixed(2)}`
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
    <ul className="space-y-1">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${Number(r.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {formatAmount(Number(r.amount))}
              </span>
              {r.merchant && (
                <span className="truncate text-slate-300">{r.merchant}</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              <span>{formatDate(r.date)}</span>
              {r.category && (
                <>
                  <span>·</span>
                  <span>{r.category}</span>
                </>
              )}
              {r.note && (
                <>
                  <span>·</span>
                  <span className="truncate">{r.note}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit(r.id)}
              className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => onDelete(r.id)}
              className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            >
              删除
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
