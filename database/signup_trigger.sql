-- signup_trigger.sql
-- Run this ONCE in the Supabase SQL Editor (after schema.sql).
--
-- When someone signs up (GTR-8), Supabase creates them in auth.users.
-- This trigger then automatically creates their row in the profiles table,
-- using the name and role (GTR-13) they entered on the sign-up page.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, organization_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'attendee'),
    nullif(new.raw_user_meta_data ->> 'organization_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Let each logged-in user read their own profile
-- (needed later to send attendees and organizers to the right dashboard)
drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
