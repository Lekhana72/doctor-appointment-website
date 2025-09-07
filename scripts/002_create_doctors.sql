-- Create doctors table for doctor-specific information
create table if not exists public.doctors (
  id uuid primary key references public.profiles(id) on delete cascade,
  specialization text not null,
  license_number text unique not null,
  years_of_experience integer default 0,
  bio text,
  consultation_fee decimal(10,2),
  available_days text[] default '{}', -- Array of days: ['monday', 'tuesday', etc.]
  available_hours jsonb default '{}', -- JSON object with time slots
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.doctors enable row level security;

-- RLS policies for doctors
create policy "doctors_select_own"
  on public.doctors for select
  using (auth.uid() = id);

create policy "doctors_insert_own"
  on public.doctors for insert
  with check (auth.uid() = id);

create policy "doctors_update_own"
  on public.doctors for update
  using (auth.uid() = id);

create policy "doctors_delete_own"
  on public.doctors for delete
  using (auth.uid() = id);

-- Allow patients to view active doctors for booking
create policy "doctors_select_active"
  on public.doctors for select
  using (is_active = true);
