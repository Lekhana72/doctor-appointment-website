-- Create trigger function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, user_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'patient')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at triggers to all tables
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger doctors_updated_at
  before update on public.doctors
  for each row
  execute function public.handle_updated_at();

create trigger appointments_updated_at
  before update on public.appointments
  for each row
  execute function public.handle_updated_at();
