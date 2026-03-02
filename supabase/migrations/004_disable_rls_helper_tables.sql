-- ПРОСТОЕ РЕШЕНИЕ: отключаем RLS на вспомогательных таблицах
-- Данные и так привязаны к bot_id, а bots таблица защищена

ALTER TABLE public.bot_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_menu_buttons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_blocked_dates DISABLE ROW LEVEL SECURITY;
