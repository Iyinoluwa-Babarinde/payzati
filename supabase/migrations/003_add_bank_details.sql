-- 003_add_bank_details.sql
-- Add bank account details to the employees table

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS pending_bank_details jsonb;
