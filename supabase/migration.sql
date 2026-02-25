-- Run this in the Supabase SQL Editor to create the channel_audits table
-- Dashboard: https://supabase.com/dashboard/project/vzwrvaadlttfrldimapa/sql/new

CREATE TABLE IF NOT EXISTS public.channel_audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  user_id uuid REFERENCES auth.users(id),
  channel_id text NOT NULL,
  channel_title text NOT NULL,
  channel_thumbnail text,
  channel_subs integer DEFAULT 0,
  analysis_data jsonb,
  recommendations jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.channel_audits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_channel_audits_user_id ON public.channel_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_audits_session_id ON public.channel_audits(session_id);

-- Also add audit.youtubeproducer.app to Supabase Auth redirect allowlist:
-- Dashboard: https://supabase.com/dashboard/project/vzwrvaadlttfrldimapa/auth/url-configuration
-- Add: https://audit.youtubeproducer.app/auth/callback
