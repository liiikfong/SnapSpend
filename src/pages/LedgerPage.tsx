import { useMemo, useState } from 'react'
import MobileShell from '@/components/MobileShell'
import RecordForm, { type RecordFormValues } from '@/components/RecordForm'
import RecordList from '@/components/RecordList'
import { BASE_CURRENCY, formatMoney, normalizeCurrency } from '@/lib/currency'
import { useRecords } from '@/hooks/useRecords'

const CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '生活', '医疗', '教育', '转账', '其他']

export default function LedgerPage() {
  const { records, loading, updateRecord, deleteRecord } = useRecords()
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = editingId ? records.find((r) => r.id === editingId) : null

  const summary = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    let income = 0
    let expense = 0
    for (const row of records) {
      const d = new Date(row.date)
      if (d.getMonth() !== month || d.getFullYear() !== year) continue
      const value = Number(row.amount_base ?? row.amount)
      if (value >= 0) income += value
      else expense += value
    }
    return { income, expense, net: income + expense }
  }, [records])

  async function handleUpdate(values: RecordFormValues) {
    if (!editing) return
    await updateRecord(editing.id, values)
    setEditingId(null)
  }

  return (
    <MobileShell active="ledger" title="账单总览" subtitle="按基准币种统一汇总，支持多币种记录">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-center">
          <p className="text-[11px] text-emerald-700/80">本月收入</p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">{formatMoney(summary.income, BASE_CURRENCY)}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-center">
          <p className="text-[11px] text-rose-700/80">本月支出</p>
          <p className="mt-1 text-sm font-semibold text-rose-700">{formatMoney(summary.expense, BASE_CURRENCY)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/90 p-3 text-center">
          <p className="text-[11px] text-[#C72D4A]/80">本月结余</p>
          <p className="mt-1 text-sm font-semibold text-[#C72D4A]">{formatMoney(summary.net, BASE_CURRENCY)}</p>
        </div>
      </div>

      {editing && (
        <div className="mb-5">
          <RecordForm
            key={`edit-${editing.id}`}
            categories={CATEGORIES}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
            submitLabel="保存修改"
            initialValues={{
              amount: Number(editing.amount_original ?? editing.amount),
              currency: normalizeCurrency(editing.currency),
              merchant: editing.merchant ?? '',
              category: editing.category ?? '',
              date: editing.date,
              note: editing.note ?? '',
            }}
          />
        </div>
      )}

      <h2 className="mb-3 text-xs tracking-wide text-slate-500">最近账单</h2>
      {loading ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : records.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-5 text-sm text-slate-500">还没有记录，去「录入」页记第一笔吧。</p>
      ) : (
        <RecordList records={records} onEdit={(id) => setEditingId(id)} onDelete={deleteRecord} />
      )}
    </MobileShell>
  )
}
