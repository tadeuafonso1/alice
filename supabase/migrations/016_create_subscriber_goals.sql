-- Create Subscriber Goals table
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

-- Enable RLS
ALTER TABLE public.subscriber_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscriber goals"
    ON public.subscriber_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Public can read subscriber goals by user_id"
    ON public.subscriber_goals FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own subscriber goals"
    ON public.subscriber_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriber goals"
    ON public.subscriber_goals FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_subscriber_goals_updated_at
    BEFORE UPDATE ON public.subscriber_goals
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
