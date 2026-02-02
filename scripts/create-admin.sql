-- ============================================
-- CREATE ADMIN USER FOR GREENLIGHT FITNESS
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- 
-- WICHTIG: Dieser User muss ZUERST über die Supabase Auth UI 
-- oder die Sign-Up Funktion erstellt werden!
-- 
-- Schritte:
-- 1. Gehe zu Supabase Dashboard > Authentication > Users
-- 2. Klicke "Add User" > "Create New User"
-- 3. Email: admin@mail.com, Password: 123456
-- 4. Dann führe dieses Script aus, um die Rolle zu setzen

-- Update user role to admin (nach Auth-Erstellung)
UPDATE public.users 
SET role = 'admin'
WHERE email = 'admin@mail.com';

-- Verify the update
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'admin@mail.com';
