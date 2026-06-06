-- 005_system_config.sql
CREATE TABLE IF NOT EXISTS public.system_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Note: We don't enable RLS or we make it restricted to service role only
-- Actually, let's just make it only readable/writable by the server.
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
-- No policies means NO ONE can read/write except service_role keys. Perfect for our server!
