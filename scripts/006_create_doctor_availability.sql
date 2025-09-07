-- Create doctor availability table for managing available time slots
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  day_of_week integer check (day_of_week >= 0 and day_of_week <= 6) not null, -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure no overlapping time slots for the same doctor on the same day
  constraint no_overlap_slots exclude using gist (
    doctor_id with =,
    day_of_week with =,
    tsrange(start_time::text::timestamp, end_time::text::timestamp) with &&
  ) where (is_active = true)
);

-- Enable RLS
alter table public.doctor_availability enable row level security;

-- RLS policies for doctor availability
-- Doctors can manage their own availability
create policy "availability_select_doctor"
  on public.doctor_availability for select
  using (auth.uid() = doctor_id);

create policy "availability_insert_doctor"
  on public.doctor_availability for insert
  with check (auth.uid() = doctor_id);

create policy "availability_update_doctor"
  on public.doctor_availability for update
  using (auth.uid() = doctor_id);

create policy "availability_delete_doctor"
  on public.doctor_availability for delete
  using (auth.uid() = doctor_id);

-- Patients can view doctor availability (for booking)
create policy "availability_select_public"
  on public.doctor_availability for select
  using (is_active = true);
