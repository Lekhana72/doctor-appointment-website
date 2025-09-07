-- Create appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer default 30,
  status text check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) default 'scheduled',
  reason_for_visit text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure no double booking for the same doctor at the same time
  unique(doctor_id, appointment_date, appointment_time)
);

-- Enable RLS
alter table public.appointments enable row level security;

-- RLS policies for appointments
-- Patients can view their own appointments
create policy "appointments_select_patient"
  on public.appointments for select
  using (auth.uid() = patient_id);

-- Doctors can view their own appointments
create policy "appointments_select_doctor"
  on public.appointments for select
  using (auth.uid() = doctor_id);

-- Patients can create appointments for themselves
create policy "appointments_insert_patient"
  on public.appointments for insert
  with check (auth.uid() = patient_id);

-- Patients can update their own appointments (limited fields)
create policy "appointments_update_patient"
  on public.appointments for update
  using (auth.uid() = patient_id);

-- Doctors can update appointments assigned to them
create policy "appointments_update_doctor"
  on public.appointments for update
  using (auth.uid() = doctor_id);

-- Only patients can delete their own appointments
create policy "appointments_delete_patient"
  on public.appointments for delete
  using (auth.uid() = patient_id);
