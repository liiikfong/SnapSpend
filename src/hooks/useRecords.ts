import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BASE_CURRENCY, getFxQuote, normalizeCurrency } from '@/lib/currency'
import type { RecordInsert, RecordRow, RecordUpdate } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

export type RecordDraft = {
  amount: number
  currency: string
  merchant: string
  category: string
  date: string
  note: string
}

export function useRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

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
      if (!cancelled) setRecords((data as RecordRow[]) ?? [])
    }

    fetchRecords().finally(() => setLoading(false))

    const channel = supabase
      .channel('records-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${user.id}` },
        () => fetchRecords()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  async function toInsertPayload(draft: RecordDraft): Promise<RecordInsert> {
    if (!user) throw new Error('未登录')
    const currency = normalizeCurrency(draft.currency)
    const amountOriginal = Number(draft.amount)
    const quote = await getFxQuote(currency, BASE_CURRENCY)
    const amountBase = Number((amountOriginal * quote.rate).toFixed(2))
    return {
      user_id: user.id,
      amount: amountBase,
      currency,
      amount_original: amountOriginal,
      amount_base: amountBase,
      base_currency: BASE_CURRENCY,
      fx_rate: quote.rate,
      fx_source: quote.source,
      merchant: draft.merchant || null,
      category: draft.category || null,
      date: draft.date,
      note: draft.note || null,
    }
  }

  async function createRecord(draft: RecordDraft) {
    const row = await toInsertPayload(draft)
    const { error } = await supabase.from('records').insert(row as never)
    if (error) throw error
  }

  async function updateRecord(id: string, draft: RecordDraft) {
    const currency = normalizeCurrency(draft.currency)
    const quote = await getFxQuote(currency, BASE_CURRENCY)
    const amountOriginal = Number(draft.amount)
    const amountBase = Number((amountOriginal * quote.rate).toFixed(2))
    const patch: RecordUpdate = {
      amount: amountBase,
      currency,
      amount_original: amountOriginal,
      amount_base: amountBase,
      base_currency: BASE_CURRENCY,
      fx_rate: quote.rate,
      fx_source: quote.source,
      merchant: draft.merchant || null,
      category: draft.category || null,
      date: draft.date,
      note: draft.note || null,
    }
    const { error } = await supabase.from('records').update(patch as never).eq('id', id)
    if (error) throw error
  }

  async function deleteRecord(id: string) {
    const { error } = await supabase.from('records').delete().eq('id', id)
    if (error) throw error
  }

  return { records, loading, createRecord, updateRecord, deleteRecord }
}
