-- 004_add_missing_columns.sql
-- Add all columns that exist in code but were missing from the database schema

-- Add onboarding_step to employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'requested';

-- Add bank details (in case 003 was never run)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS pending_bank_details jsonb;

-- Add ILP grant columns to companies (in case 002 was never run)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ilp_grant_token text,
  ADD COLUMN IF NOT EXISTS ilp_grant_url text;

-- Add created_at to transactions (it was missing from the original schema — 'date' was there instead)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Backfill created_at from date for any existing rows
UPDATE public.transactions SET created_at = date WHERE created_at IS NULL;
