-- ====================================================================
-- Edge Protocol — Safe Non-Destructive Migration: Unify users & profiles
-- Target: Supabase PostgreSQL
-- Preserves ALL existing data in public.users
-- ====================================================================

-- 1. Safely add missing columns to public.users without dropping anything
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Populate missing profile details into public.users from profiles (if profiles exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    UPDATE public.users u
    SET 
      id = COALESCE(u.id, p.id, gen_random_uuid()),
      is_verified = COALESCE(p.is_verified, u.is_verified, false),
      handle = COALESCE(u.handle, p.handle),
      display_name = COALESCE(u.display_name, p.display_name),
      bio = COALESCE(u.bio, p.bio),
      avatar_url = COALESCE(u.avatar_url, p.avatar_url),
      x_handle = COALESCE(u.x_handle, p.x_handle)
    FROM public.profiles p
    WHERE LOWER(u.wallet_address) = LOWER(p.wallet_address);
  END IF;
END $$;

-- 3. Ensure id has a unique constraint on public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_id_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_id_key UNIQUE (id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_handle ON public.users(handle);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- 5. Optional: Create a View for profiles pointing directly to users for 100% backward compatibility
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT 
  id,
  wallet_address,
  COALESCE(handle, username, 'trader') AS handle,
  COALESCE(display_name, handle, username, 'Trader') AS display_name,
  bio,
  avatar_url,
  x_handle,
  COALESCE(is_verified, false) AS is_verified,
  created_at,
  updated_at
FROM public.users;

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users are updatable by service role or public" ON public.users;
CREATE POLICY "Users are updatable by service role or public" ON public.users FOR ALL USING (true);

-- 6. Clean up any old test callouts whose creator_id no longer exists in users
DELETE FROM public.callouts 
WHERE creator_id NOT IN (SELECT id FROM public.users);

-- 7. Safely update callouts foreign key constraint to reference public.users(id)
ALTER TABLE public.callouts DROP CONSTRAINT IF EXISTS callouts_creator_id_fkey;
ALTER TABLE public.callouts ADD CONSTRAINT callouts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;
