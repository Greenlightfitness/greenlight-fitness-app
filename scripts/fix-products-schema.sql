-- ============================================
-- FIX PRODUCTS TABLE - Run in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'onetime';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins and coaches can insert products" ON public.products;
DROP POLICY IF EXISTS "Owners can update their products" ON public.products;
DROP POLICY IF EXISTS "Owners can delete their products" ON public.products;

-- 4. Create new policies
-- Everyone can view active products
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

-- Coaches and Admins can create products
CREATE POLICY "Admins and coaches can insert products" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('COACH', 'ADMIN'))
  );

-- Owners can update their products
CREATE POLICY "Owners can update their products" ON public.products
  FOR UPDATE USING (auth.uid() = coach_id);

-- Owners can delete their products  
CREATE POLICY "Owners can delete their products" ON public.products
  FOR DELETE USING (auth.uid() = coach_id);

-- 5. Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
