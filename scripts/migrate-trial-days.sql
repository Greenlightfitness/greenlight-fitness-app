-- Add trial_days column to products table for free trial support
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
