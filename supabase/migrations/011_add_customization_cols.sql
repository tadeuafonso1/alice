ALTER TABLE public.like_goals
ADD COLUMN IF NOT EXISTS bar_color TEXT DEFAULT '#2563eb', -- Blue-600
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#ffffff1a', -- White/10
ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT '#ffffffcc', -- White/80
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff'; -- White
