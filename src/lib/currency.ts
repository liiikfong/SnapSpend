const FX_CACHE = new Map<string, { rate: number; at: number }>()
const TEN_MINUTES = 10 * 60 * 1000

export const BASE_CURRENCY = 'CNY'
export const CURRENCIES = ['CNY', 'USD', 'HKD', 'JPY', 'EUR', 'GBP', 'SGD'] as const

export type FxQuote = {
  rate: number
  source: string
}

export function normalizeCurrency(code: string | null | undefined): string {
  const c = (code || 'CNY').toUpperCase().trim()
  return c || 'CNY'
}

export function currencySymbol(code: string): string {
  const map: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    HKD: 'HK$',
    JPY: '¥',
    EUR: '€',
    GBP: '£',
    SGD: 'S$',
  }
  return map[normalizeCurrency(code)] ?? normalizeCurrency(code)
}

export function formatMoney(amount: number, currency: string): string {
  const c = normalizeCurrency(currency)
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: c === 'JPY' ? 0 : 2,
  }).format(amount)
}

export async function getFxQuote(fromCurrency: string, toCurrency: string): Promise<FxQuote> {
  const from = normalizeCurrency(fromCurrency)
  const to = normalizeCurrency(toCurrency)
  if (from === to) return { rate: 1, source: 'same-currency' }

  const key = `${from}-${to}`
  const now = Date.now()
  const cached = FX_CACHE.get(key)
  if (cached && now - cached.at < TEN_MINUTES) {
    return { rate: cached.rate, source: 'frankfurter-cache' }
  }

  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
  if (!res.ok) throw new Error('获取汇率失败，请稍后重试')
  const data = (await res.json()) as { rates?: Record<string, number> }
  const rate = data.rates?.[to]
  if (!rate || !Number.isFinite(rate)) throw new Error('当前币种暂不支持自动折算')
  FX_CACHE.set(key, { rate, at: now })
  return { rate, source: 'frankfurter' }
}
