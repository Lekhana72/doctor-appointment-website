-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'system', 'ai_alert')) not null,
  is_read boolean default false,
  appointment_id uuid references public.appointments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- RLS policies for notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_system"
  on public.notifications for insert
  with check (true); -- Allow system to create notifications

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);
