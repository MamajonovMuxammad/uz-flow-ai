-- Migration 006: AI Sales CRM Fields

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interested_in TEXT,
ADD COLUMN IF NOT EXISTS hotness_level TEXT DEFAULT 'cold' CHECK (hotness_level IN ('cold', 'warm', 'hot')),
ADD COLUMN IF NOT EXISTS objections_handled TEXT;

-- Notify user that this needs to be manually run
