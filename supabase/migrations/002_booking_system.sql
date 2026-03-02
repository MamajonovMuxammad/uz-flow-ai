-- ============================================
-- BOT SERVICES (Каталог услуг)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bot_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price BIGINT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bot_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage services for own bots" ON public.bot_services;
CREATE POLICY "Users can manage services for own bots" ON public.bot_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_services.bot_id AND bots.owner_id = auth.uid())
  );

-- ============================================
-- BOT SCHEDULE (Расписание работы)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bot_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '10:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_working BOOLEAN NOT NULL DEFAULT true,
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  UNIQUE(bot_id, day_of_week)
);

ALTER TABLE public.bot_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage schedule for own bots" ON public.bot_schedule;
CREATE POLICY "Users can manage schedule for own bots" ON public.bot_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_schedule.bot_id AND bots.owner_id = auth.uid())
  );

-- ============================================
-- BOOKINGS (Записи на услуги)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.bot_services(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  telegram_id BIGINT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT DEFAULT '',
  service_name TEXT NOT NULL DEFAULT '',
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bookings for own bots" ON public.bookings;
CREATE POLICY "Users can manage bookings for own bots" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bookings.bot_id AND bots.owner_id = auth.uid())
  );

-- ============================================
-- BOT MENU BUTTONS (Кастомные кнопки меню)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bot_menu_buttons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '📌',
  action TEXT NOT NULL DEFAULT 'text',
  action_value TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.bot_menu_buttons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage menu buttons for own bots" ON public.bot_menu_buttons;
CREATE POLICY "Users can manage menu buttons for own bots" ON public.bot_menu_buttons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_menu_buttons.bot_id AND bots.owner_id = auth.uid())
  );

-- ============================================
-- BOT BLOCKED DATES (Заблокированные даты)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bot_blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT DEFAULT 'Выходной',
  UNIQUE(bot_id, blocked_date)
);

ALTER TABLE public.bot_blocked_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage blocked dates for own bots" ON public.bot_blocked_dates;
CREATE POLICY "Users can manage blocked dates for own bots" ON public.bot_blocked_dates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_blocked_dates.bot_id AND bots.owner_id = auth.uid())
  );
