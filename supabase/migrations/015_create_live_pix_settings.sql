-- Create LivePix Settings table
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

-- Enable RLS
ALTER TABLE public.live_pix_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own LivePix settings"
    ON public.live_pix_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LivePix settings"
    ON public.live_pix_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LivePix settings"
    ON public.live_pix_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to handle internal updates to updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_live_pix_settings_updated_at
    BEFORE UPDATE ON public.live_pix_settings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
