-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Companies Table
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  country text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Employees Table
create table public.employees (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  email text not null,
  country text not null,
  currency text not null,
  salary numeric not null,
  status text default 'active' check (status in ('active', 'on_leave', 'terminated')),
  wallet_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Payroll Runs Table
create table public.payroll_runs (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  total_gross numeric not null,
  total_net numeric not null,
  status text default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Transactions Table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  type text not null check (type in ('deposit', 'payroll', 'advance', 'withdrawal')),
  amount numeric not null,
  currency text not null,
  status text default 'completed' check (status in ('pending', 'completed', 'failed')),
  description text,
  receipt text,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.transactions enable row level security;

-- Create Policies (Simplified for MVP: all authenticated users can read/write everything in their company)
-- Note: In a real production app, we would join with auth.users and restrict based on role.

create policy "Enable read access for all authenticated users" on public.companies for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.companies for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.companies for update to authenticated using (true);

create policy "Enable read access for all authenticated users" on public.employees for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.employees for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.employees for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.employees for delete to authenticated using (true);

create policy "Enable read access for all authenticated users" on public.payroll_runs for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.payroll_runs for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.payroll_runs for update to authenticated using (true);

create policy "Enable read access for all authenticated users" on public.transactions for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.transactions for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.transactions for update to authenticated using (true);
