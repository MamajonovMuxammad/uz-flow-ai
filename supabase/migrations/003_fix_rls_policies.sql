-- Fix: Drop old policies and recreate with proper WITH CHECK for INSERT

-- BOT SERVICES
ALTER TABLE public.bot_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage services for own bots" ON public.bot_services;
DROP POLICY IF EXISTS "services_select" ON public.bot_services;
DROP POLICY IF EXISTS "services_insert" ON public.bot_services;
DROP POLICY IF EXISTS "services_update" ON public.bot_services;
DROP POLICY IF EXISTS "services_delete" ON public.bot_services;
DROP POLICY IF EXISTS "service_role_all" ON public.bot_services;

CREATE POLICY "services_select" ON public.bot_services FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_services.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "services_insert" ON public.bot_services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_services.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "services_update" ON public.bot_services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_services.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "services_delete" ON public.bot_services FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_services.bot_id AND bots.owner_id = auth.uid())
);

-- BOT SCHEDULE
ALTER TABLE public.bot_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage schedule for own bots" ON public.bot_schedule;
DROP POLICY IF EXISTS "schedule_select" ON public.bot_schedule;
DROP POLICY IF EXISTS "schedule_insert" ON public.bot_schedule;
DROP POLICY IF EXISTS "schedule_update" ON public.bot_schedule;
DROP POLICY IF EXISTS "schedule_delete" ON public.bot_schedule;

CREATE POLICY "schedule_select" ON public.bot_schedule FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_schedule.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "schedule_insert" ON public.bot_schedule FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_schedule.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "schedule_update" ON public.bot_schedule FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_schedule.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "schedule_delete" ON public.bot_schedule FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_schedule.bot_id AND bots.owner_id = auth.uid())
);

-- BOOKINGS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bookings for own bots" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete" ON public.bookings;

CREATE POLICY "bookings_select" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bookings.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bookings.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "bookings_delete" ON public.bookings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bookings.bot_id AND bots.owner_id = auth.uid())
);

-- BOT MENU BUTTONS
ALTER TABLE public.bot_menu_buttons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage menu buttons for own bots" ON public.bot_menu_buttons;
DROP POLICY IF EXISTS "menu_select" ON public.bot_menu_buttons;
DROP POLICY IF EXISTS "menu_insert" ON public.bot_menu_buttons;
DROP POLICY IF EXISTS "menu_update" ON public.bot_menu_buttons;
DROP POLICY IF EXISTS "menu_delete" ON public.bot_menu_buttons;

CREATE POLICY "menu_select" ON public.bot_menu_buttons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_menu_buttons.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "menu_insert" ON public.bot_menu_buttons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_menu_buttons.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "menu_update" ON public.bot_menu_buttons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_menu_buttons.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "menu_delete" ON public.bot_menu_buttons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_menu_buttons.bot_id AND bots.owner_id = auth.uid())
);

-- BOT BLOCKED DATES
ALTER TABLE public.bot_blocked_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage blocked dates for own bots" ON public.bot_blocked_dates;
DROP POLICY IF EXISTS "blocked_select" ON public.bot_blocked_dates;
DROP POLICY IF EXISTS "blocked_insert" ON public.bot_blocked_dates;
DROP POLICY IF EXISTS "blocked_delete" ON public.bot_blocked_dates;

CREATE POLICY "blocked_select" ON public.bot_blocked_dates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_blocked_dates.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "blocked_insert" ON public.bot_blocked_dates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_blocked_dates.bot_id AND bots.owner_id = auth.uid())
);
CREATE POLICY "blocked_delete" ON public.bot_blocked_dates FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_blocked_dates.bot_id AND bots.owner_id = auth.uid())
);
