-- ============================================
-- ОБНОВЛЕНИЕ ПРОФИЛЕЙ
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'none' CHECK (subscription_plan IN ('none', 'starter', 'business', 'premium'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_bots INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_messages_per_month INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS messages_used INT DEFAULT 0;

-- Установить админа
UPDATE public.profiles SET is_admin = true, subscription_plan = 'premium', max_bots = 999, max_messages_per_month = 999999
WHERE email = 'fltgenius13@gmail.com';

-- ============================================
-- ОБНОВЛЕНИЕ ЗАПИСЕЙ — добавить причину отказа
-- ============================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
