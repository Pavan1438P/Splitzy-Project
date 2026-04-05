-- Supabase schema for Splitzy expense groups

create table if not exists groups (
  id text primary key,
  creator text not null,
  members jsonb not null default '[]',
  transactions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_group_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger groups_updated_at
before insert or update on groups
for each row execute function set_group_updated_at();
