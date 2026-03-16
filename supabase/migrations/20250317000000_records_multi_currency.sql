-- Multi-currency fields for mobile-first capture and ledger summary.
alter table public.records
  add column if not exists amount_original numeric,
  add column if not exists amount_base numeric,
  add column if not exists base_currency text,
  add column if not exists fx_rate numeric,
  add column if not exists fx_source text;

-- Backfill existing rows from legacy amount/currency.
update public.records
set
  amount_original = coalesce(amount_original, amount),
  amount_base = coalesce(amount_base, amount),
  base_currency = coalesce(base_currency, 'CNY'),
  fx_rate = coalesce(fx_rate, 1),
  fx_source = coalesce(fx_source, 'legacy')
where amount_original is null
   or amount_base is null
   or base_currency is null
   or fx_rate is null
   or fx_source is null;
