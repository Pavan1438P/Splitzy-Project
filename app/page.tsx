"use client"

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { WelcomeScreen } from '@/components/splitzy/welcome-screen'
import { GroupCreation } from '@/components/splitzy/group-creation'
import { JourneyScreen } from '@/components/splitzy/journey-screen'
import { EndJourneyScreen } from '@/components/splitzy/end-journey-screen'
import {
  loadGroupData,
  saveGroupData,
  deleteGroupData,
  subscribeToGroup,
} from '@/lib/supabase'

export type Transaction = {
  id: string
  payer: string
  amount: number
  onWhom: string
  description: string
  timestamp: Date
  status?: "active" | "completed"
}

export type AppState =
  | 'welcome'
  | 'createGroup'
  | 'journey'
  | 'endJourney'
  | 'sharedView'
  | 'sharedEdit'

export type Permission = 'creator' | 'editor' | 'viewer'

export type GroupData = {
  id: string
  members: string[]
  transactions: Transaction[]
  creator: string
  createdAt: Date
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [members, setMembers] = useState<string[]>([])
  const [groupId, setGroupId] = useState<string>('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [permission, setPermission] = useState<Permission>('creator')
  const [creator, setCreator] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [isSharedLink, setIsSharedLink] = useState(false)
  const [sharedLoading, setSharedLoading] = useState(false)
  const [sharedLoadError, setSharedLoadError] = useState<string | null>(null)
  const subscriptionCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const urlParams = new URLSearchParams(window.location.search)
    const sharedGroupId = urlParams.get('group')
    const sharedPermission = urlParams.get('perm')

    if (!sharedGroupId || !sharedPermission) return
    if (!['creator', 'editor', 'viewer'].includes(sharedPermission)) return

    const permissionValue = sharedPermission as Permission
    setIsSharedLink(true)
    setSharedLoading(true)
    setPermission(permissionValue)
    setGroupId(sharedGroupId)
    setAppState(permissionValue === 'viewer' ? 'sharedView' : 'sharedEdit')

    loadGroupData(sharedGroupId)
      .then((groupData) => {
        if (!groupData) {
          console.error('Failed to load group from Supabase:', sharedGroupId)
          setSharedLoadError('Group not found. Make sure the group exists and the link is correct.')
          return
        }

        console.log('Group loaded successfully:', groupData.id)
        setMembers(groupData.members)
        setTransactions(
          groupData.transactions.map((transaction) => ({
            ...transaction,
            timestamp: new Date(transaction.timestamp),
            status: transaction.status ?? "active",
          })),
        )
        setCreator(groupData.creator)

        if (subscriptionCleanup.current) {
          subscriptionCleanup.current()
        }

        subscriptionCleanup.current = subscribeToGroup(sharedGroupId, (updatedData) => {
          if (!updatedData) return
          setMembers(updatedData.members)
          setTransactions(
            updatedData.transactions.map((transaction) => ({
              ...transaction,
              timestamp: new Date(transaction.timestamp),
              status: transaction.status ?? "active",
            })),
          )
        })
      })
      .catch((err) => {
        console.error('Error loading shared group:', err)
        setSharedLoadError('Unable to load shared group. Please check your internet connection and try again.')
      })
      .finally(() => {
        setSharedLoading(false)
      })

    return () => {
      subscriptionCleanup.current?.()
      subscriptionCleanup.current = null
    }
  }, [isClient])

  const saveGroupState = async (
    id: string,
    memberList: string[],
    transactionList: Transaction[],
    groupCreator: string,
  ) => {
    const groupData: GroupData = {
      id,
      members: memberList,
      transactions: transactionList,
      creator: groupCreator,
      createdAt: new Date(),
    }

    await saveGroupData(groupData)
  }

  const handleCreateGroup = () => {
    setAppState('createGroup')
  }

  const handleGroupCreated = async (memberNames: string[]) => {
    const uniqueId = `GHOST-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`

    setMembers(memberNames)
    setGroupId(uniqueId)
    setCreator(memberNames[0])
    setPermission('creator')
    setTransactions([])
    await saveGroupState(uniqueId, memberNames, [], memberNames[0])
    setAppState('journey')

    if (subscriptionCleanup.current) {
      subscriptionCleanup.current()
    }
    subscriptionCleanup.current = subscribeToGroup(uniqueId, (updatedData) => {
      if (!updatedData) return
      setMembers(updatedData.members)
      setTransactions(updatedData.transactions.map((transaction) => ({
        ...transaction,
        timestamp: new Date(transaction.timestamp),
        status: transaction.status ?? "active",
      })))
    })
  }

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!groupId) return

    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      status: transaction.status ?? "active",
    }

    const updatedTransactions = [...transactions, newTransaction]
    setTransactions(updatedTransactions)
    await saveGroupState(groupId, members, updatedTransactions, creator)
  }

  const handleCompleteTransaction = async (transactionId: string) => {
    if (!groupId) return

    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === transactionId ? { ...transaction, status: "completed" as const } : transaction,
    )

    setTransactions(updatedTransactions)
    await saveGroupState(groupId, members, updatedTransactions, creator)
  }

  const handleEndJourney = () => {
    setAppState('endJourney')
  }

  const handleContinue = () => {
    setAppState('journey')
  }

  const handleDoneSplitting = async () => {
    if (permission !== 'creator') return

    setMembers([])
    setGroupId('')
    setTransactions([])
    setCreator('')
    setPermission('creator')
    setAppState('welcome')

    if (groupId) {
      await deleteGroupData(groupId)
      subscriptionCleanup.current?.()
      subscriptionCleanup.current = null
    }
  }

  return (
    <main className="min-h-screen">
      {!isClient ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Image src="/GhostSplits_LOGO.png" alt="GhostSplits" width={100} height={100} className="mx-auto mb-4 object-contain" />
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading GhostSplits...</p>
          </div>
        </div>
      ) : isSharedLink && sharedLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Image src="/GhostSplits_LOGO.png" alt="GhostSplits" width={100} height={100} className="mx-auto mb-4 object-contain" />
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading shared group...</p>
          </div>
        </div>
      ) : isSharedLink && sharedLoadError ? (
        <div className="flex min-h-screen items-center justify-center px-4 text-center">
          <div className="max-w-xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8">
            <h1 className="text-2xl font-semibold text-destructive">Shared link error</h1>
            <p className="mt-4 text-sm text-muted-foreground">{sharedLoadError}</p>
            <button
              className="mt-6 inline-flex rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-white"
              onClick={() => window.location.assign('/')}
            >
              Return to home
            </button>
          </div>
        </div>
      ) : (
        <>
          {appState === 'welcome' && <WelcomeScreen onCreateGroup={handleCreateGroup} />}
          {appState === 'createGroup' && (
            <GroupCreation onGroupCreated={handleGroupCreated} onBack={() => setAppState('welcome')} />
          )}
          {(appState === 'journey' || appState === 'sharedEdit') && (
            <JourneyScreen
              groupId={groupId}
              members={members}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onCompleteTransaction={handleCompleteTransaction}
              onEndJourney={handleEndJourney}
              permission={permission}
              canEndJourney={permission === 'creator'}
            />
          )}
          {appState === 'endJourney' && (
            <EndJourneyScreen
              transactions={transactions}
              members={members}
              onContinue={handleContinue}
              onDoneSplitting={handleDoneSplitting}
              canEndJourney={permission === 'creator'}
            />
          )}
          {appState === 'sharedView' && (
            <EndJourneyScreen
              transactions={transactions}
              members={members}
              onContinue={() => {}}
              onDoneSplitting={() => {}}
              canEndJourney={false}
              isViewOnly={true}
            />
          )}
        </>
      )}
    </main>
  )
}
