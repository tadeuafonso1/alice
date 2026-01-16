-- Consolidated migration to fix LivePix and Subscriber Goals schema

-- 1. Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. LivePix Settings
CREATE TABLE IF NOT EXISTS public.live_pix_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    client_id TEXT,
    client_secret TEXT,
    skip_queue_enabled BOOLEAN DEFAULT false,
    skip_queue_price DECIMAL(10, 2) DEFAULT 5.00,
    skip_queue_message TEXT DEFAULT '🚀🚀 ALERTA: @{user} acaba de furar a fila com um Pix! 🚀🚀',
    points_per_real INTEGER DEFAULT 100,
    webhook_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.live_pix_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'live_pix_settings' AND policyname = 'Users can view their own LivePix settings') THEN
        CREATE POLICY "Users can view their own LivePix settings" ON public.live_pix_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'live_pix_settings' AND policyname = 'Users can insert their own LivePix settings') THEN
        CREATE POLICY "Users can insert their own LivePix settings" ON public.live_pix_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'live_pix_settings' AND policyname = 'Users can update their own LivePix settings') THEN
        CREATE POLICY "Users can update their own LivePix settings" ON public.live_pix_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_live_pix_settings_updated_at ON public.live_pix_settings;
CREATE TRIGGER set_live_pix_settings_updated_at
    BEFORE UPDATE ON public.live_pix_settings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 3. Subscriber Goals
CREATE TABLE IF NOT EXISTS public.subscriber_goals (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_subs INTEGER DEFAULT 0,
    initial_subs INTEGER DEFAULT 0,
    current_goal INTEGER DEFAULT 20,
    step INTEGER DEFAULT 20,
    auto_update BOOLEAN DEFAULT true,
    bar_color TEXT DEFAULT '#2563eb',
    bg_color TEXT DEFAULT '#ffffff1a',
    border_color TEXT DEFAULT '#ffffffcc',
    text_color TEXT DEFAULT '#ffffff',
    stream_found BOOLEAN DEFAULT false,
    debug_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriber_goals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriber_goals' AND policyname = 'Users can view their own subscriber goals') THEN
        CREATE POLICY "Users can view their own subscriber goals" ON public.subscriber_goals FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriber_goals' AND policyname = 'Public can read subscriber goals by user_id') THEN
        CREATE POLICY "Public can read subscriber goals by user_id" ON public.subscriber_goals FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriber_goals' AND policyname = 'Users can insert their own subscriber goals') THEN
        CREATE POLICY "Users can insert their own subscriber goals" ON public.subscriber_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriber_goals' AND policyname = 'Users can update their own subscriber goals') THEN
        CREATE POLICY "Users can update their own subscriber goals" ON public.subscriber_goals FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_subscriber_goals_updated_at ON public.subscriber_goals;
CREATE TRIGGER set_subscriber_goals_updated_at
    BEFORE UPDATE ON public.subscriber_goals
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 4. Bot Notifications
CREATE TABLE IF NOT EXISTS public.bot_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bot_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.bot_notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_notifications' AND policyname = 'Users can manage their own notifications') THEN
        CREATE POLICY "Users can manage their own notifications" ON public.bot_notifications FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_notifications' AND policyname = 'Public can view notifications for OBS') THEN
        CREATE POLICY "Public can view notifications for OBS" ON public.bot_notifications FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Enable Realtime for notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bot_notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bot_notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If publication doesn't exist, create it
        IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            CREATE PUBLICATION supabase_realtime FOR TABLE bot_notifications;
        ELSE
            RAISE NOTICE 'Could not add table to publication';
        END IF;
END $$;

-- 6. Add Loyalty Points RPC (Required for LivePix)
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
    p_user_id UUID,
    p_username TEXT,
    p_points INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.loyalty_points (username, points, owner_id)
    VALUES (p_username, p_points, p_user_id)
    ON CONFLICT (owner_id, username)
    DO UPDATE SET 
        points = loyalty_points.points + EXCLUDED.points,
        last_seen = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_loyalty_points(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_loyalty_points(UUID, TEXT, INTEGER) TO service_role;
