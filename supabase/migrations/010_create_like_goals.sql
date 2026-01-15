-- Create a table to store like goal settings per user
create table if not exists public.like_goals (
  user_id uuid references auth.users not null primary key,
  current_goal int not null default 100,
  step int not null default 50,
  auto_update boolean not null default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.like_goals enable row level security;

-- Policies
create policy "Users can view their own goal settings"
  on public.like_goals for select
  using (auth.uid() = user_id);

create policy "Users can update their own goal settings"
  on public.like_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goal settings update"
  on public.like_goals for update
  using (auth.uid() = user_id);

-- Allow public access (for OBS) via a secure function or open read if using client-side ID
-- For simplicity in this specific "OBS Overlay" context where the User ID is in the URL,
-- we'll allow public read access if we want the frontend to query it directly,
-- OR we can handle it entirely in the Edge Function (safer).
-- Let's stick to RLS for now and use the Edge Function for the OBS overlay data fetching.
