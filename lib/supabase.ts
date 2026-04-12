import { createClient } from '@supabase/supabase-js'
import type { GroupData } from '@/app/page'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function loadGroupData(groupId: string): Promise<GroupData | null> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('id,creator,members,transactions,created_at')
      .eq('id', groupId)
      .single()

    if (error) {
      console.error('Error loading group:', error.message)
      return null
    }

    if (!data) {
      console.warn('Group not found:', groupId)
      return null
    }

    return {
      id: data.id,
      creator: data.creator,
      members: data.members ?? [],
      transactions: data.transactions ?? [],
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Load group exception:', err)
    return null
  }
}

export async function saveGroupData(groupData: GroupData): Promise<void> {
  const { error } = await supabase.from('groups').upsert({
    id: groupData.id,
    creator: groupData.creator,
    members: groupData.members,
    transactions: groupData.transactions,
    created_at: groupData.createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error saving group:', error.message)
    throw new Error(`Failed to save group: ${error.message}`)
  }
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
