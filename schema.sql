-- Supabase schema for GhostSplits expense groups

create table if not exists groups (
  id text primary key,
  creator text not null,
  members jsonb not null default '[]',
  transactions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Guard against oversized payloads
  constraint members_max_size check (jsonb_array_length(members) <= 50)
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

-- Row Level Security
-- Groups are secured by obscure ID; anon users may read/write any group they know the ID of.
alter table groups enable row level security;

create policy "anon_select" on groups for select using (true);
create policy "anon_insert" on groups for insert with check (true);
create policy "anon_update" on groups for update using (true) with check (true);
create policy "anon_delete" on groups for delete using (true);
