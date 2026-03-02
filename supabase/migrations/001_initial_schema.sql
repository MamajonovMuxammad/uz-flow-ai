-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES TABLE (linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  business_type TEXT DEFAULT 'general',
  phone TEXT DEFAULT '',
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- BOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Bot',
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  welcome_message TEXT NOT NULL DEFAULT 'Assalomu alaykum! Men sizning AI yordamchingizman. Qanday yordam bera olaman?',
  ai_prompt_context TEXT NOT NULL DEFAULT 'You are a professional sales assistant for a company in Uzbekistan. Be polite (use "Siz"), know the local context, and always try to get the customer''s phone number.',
  language TEXT NOT NULL DEFAULT 'auto' CHECK (language IN ('uz', 'ru', 'auto')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  openai_api_key TEXT,
  click_merchant_id TEXT,
  click_service_id TEXT,
  click_secret_key TEXT,
  payme_merchant_id TEXT,
  payme_secret_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bots" ON public.bots
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================
-- KNOWLEDGE BASE TABLE (RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Document',
  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'pdf', 'faq', 'product')),
  embedding_vector vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage knowledge base for own bots" ON public.knowledge_base
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots WHERE bots.id = knowledge_base.bot_id AND bots.owner_id = auth.uid()
    )
  );

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON public.knowledge_base USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  customer_phone TEXT,
  chat_summary TEXT,
  last_message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  language TEXT DEFAULT 'uz',
  total_messages INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bot_id, telegram_id)
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads for own bots" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots WHERE bots.id = leads.bot_id AND bots.owner_id = auth.uid()
    )
  );

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages for own bots" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots WHERE bots.id = chat_messages.bot_id AND bots.owner_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  provider TEXT NOT NULL CHECK (provider IN ('click', 'payme')),
  amount BIGINT NOT NULL, -- in tiyin (1 UZS = 100 tiyin)
  currency TEXT NOT NULL DEFAULT 'UZS',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  external_id TEXT,
  payment_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments for own bots" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots WHERE bots.id = payments.bot_id AND bots.owner_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  p_bot_id UUID
)
RETURNS TABLE (
  id UUID,
  content_text TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    knowledge_base.id,
    knowledge_base.content_text,
    1 - (knowledge_base.embedding_vector <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE knowledge_base.bot_id = p_bot_id
    AND 1 - (knowledge_base.embedding_vector <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding_vector <=> query_embedding
  LIMIT match_count;
$$;
