# Splitzy - Expense Splitter App

A modern expense splitting app built with Next.js, TypeScript, and Tailwind CSS.
Here is the website link:- https://splitzy-project.vercel.app/
## Features

- ✅ Create groups and add members
- ✅ Record expenses with multiple beneficiaries
- ✅ Real-time settlement calculations
- ✅ Shareable links with different permission levels
- ✅ Realtime updates across all users via Supabase
- ✅ No login required
- ✅ Creator-only controls for ending journeys

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase configuration
4. Run the development server: `npm run dev`

## Supabase Setup

1. Create a Supabase project at https://app.supabase.com/
2. Create a new table named `groups`
3. Open the SQL editor and run the schema below
4. Copy your Supabase project URL and anon key to `.env.local`

### `.env.local` values

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase SQL schema

> Important: paste only the SQL below into the Supabase SQL editor. Do not paste any JavaScript or TypeScript code into the SQL editor.

```sql
drop trigger if exists groups_updated_at on groups;
drop function if exists set_group_updated_at();

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
```

### App-side Supabase client

Use this code in `lib/supabase.ts` in your app, not in the Supabase SQL editor:

```ts
import { createClient } from '@supabase/supabase-js'
import type { GroupData } from '@/app/page'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function loadGroupData(groupId: string): Promise<GroupData | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('id,creator,members,transactions,created_at')
    .eq('id', groupId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    creator: data.creator,
    members: data.members ?? [],
    transactions: data.transactions ?? [],
    createdAt: new Date(data.created_at),
  }
}

export async function saveGroupData(groupData: GroupData): Promise<void> {
  await supabase.from('groups').upsert({
    id: groupData.id,
    creator: groupData.creator,
    members: groupData.members,
    transactions: groupData.transactions,
    created_at: groupData.createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  })
}

export async function deleteGroupData(groupId: string): Promise<void> {
  await supabase.from('groups').delete().eq('id', groupId)
}

export function subscribeToGroup(
  groupId: string,
  callback: (groupData: GroupData | null) => void,
) {
  const channel = supabase
    .channel(`group-${groupId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null)
          return
        }

        const row = payload.new
        if (row) {
          callback({
            id: row.id,
            creator: row.creator,
            members: row.members ?? [],
            transactions: row.transactions ?? [],
            createdAt: new Date(row.created_at),
          })
        }
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
```

## Deployment

The app will automatically use the correct domain for shareable links when deployed. No additional configuration is needed.

## Permission Levels

- **Creator**: Full access, can end journey and delete data
- **Editor**: Can add transactions, view details
- **Viewer**: Read-only access to journey details
