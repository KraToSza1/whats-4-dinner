-- Create user profile table and RLS policy
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text default 'free',
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'read own profile'
  ) then
    create policy "read own profile" on profiles for select using (auth.uid() = id);
  end if;
end$$;


