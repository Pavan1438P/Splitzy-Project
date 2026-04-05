"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import type { Transaction } from "@/app/page"

interface EndJourneyScreenProps {
  transactions: Transaction[]
  members: string[]
  onContinue: () => void
  onDoneSplitting: () => void
  canEndJourney?: boolean
  isViewOnly?: boolean
}

type Balance = {
  from: string
  to: string
  amount: number
}

export function EndJourneyScreen({
  transactions,
  members,
  onContinue,
  onDoneSplitting,
  canEndJourney = true,
  isViewOnly = false,
}: EndJourneyScreenProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // Calculate who owes whom
  const balances = useMemo(() => {
    // Track how much each person has paid and should pay
    const paid: Record<string, number> = {}
    const owes: Record<string, number> = {}

    members.forEach((member) => {
      paid[member] = 0
      owes[member] = 0
    })

    transactions.forEach((t) => {
      paid[t.payer] = (paid[t.payer] || 0) + t.amount
      
      // Parse beneficiaries from onWhom field
      let beneficiaries: string[] = []
      
      if (t.onWhom.toLowerCase().trim() === "everyone") {
        beneficiaries = members
      } else {
        // Split by comma and trim whitespace, then filter to only valid members
        const names = t.onWhom.split(',').map(name => name.trim()).filter(name => name)
        beneficiaries = names
          .map(name => {
            // Find exact match first, then case-insensitive match
            return members.find(m => m === name) || 
                   members.find(m => m.toLowerCase() === name.toLowerCase())
          })
          .filter((matched): matched is string => matched !== undefined) // Remove undefined entries
      }
      
      // If no valid beneficiaries found, skip this transaction
      if (beneficiaries.length === 0) {
        console.warn(`Transaction "${t.description}" has no valid beneficiaries: "${t.onWhom}"`)
        return
      }
      
      const splitAmount = t.amount / beneficiaries.length
      beneficiaries.forEach((beneficiary) => {
        owes[beneficiary] = (owes[beneficiary] || 0) + splitAmount
      })
    })

    // Calculate net balance for each person
    const netBalance: Record<string, number> = {}
    members.forEach((member) => {
      netBalance[member] = paid[member] - owes[member]
    })

    // Simplify debts
    const settlements: Balance[] = []
    const creditors = members.filter((m) => netBalance[m] > 0.01).sort((a, b) => netBalance[b] - netBalance[a])
    const debtors = members.filter((m) => netBalance[m] < -0.01).sort((a, b) => netBalance[a] - netBalance[b])

    let i = 0
    let j = 0

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      const credit = netBalance[creditor]
      const debt = -netBalance[debtor]
      const amount = Math.min(credit, debt)

      if (amount > 0.01) {
        settlements.push({
          from: debtor,
          to: creditor,
          amount: Math.round(amount * 100) / 100,
        })
      }

      netBalance[creditor] -= amount
      netBalance[debtor] += amount

      if (netBalance[creditor] < 0.01) i++
      if (netBalance[debtor] > -0.01) j++
    }

    return settlements
  }, [transactions, members])

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Details of the Journey</CardTitle>
            <CardDescription>
              Here are all the transactions made during your journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold text-primary">${totalSpent.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* All Transactions */}
            <div className="space-y-3">
              <h3 className="font-semibold">All Transactions</h3>
              {transactions.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No transactions were recorded
                </p>
              ) : (
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{transaction.payer}</p>
                          <p className="text-sm text-muted-foreground">
                            paid for {transaction.onWhom}
                          </p>
                          <p className="mt-1 text-sm">{transaction.description}</p>
                        </div>
                        <p className="font-semibold text-primary">
                          ${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settlement Details */}
            {balances.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Settlement Details</h3>
                <p className="text-sm text-muted-foreground">
                  Who needs to pay whom to settle all expenses
                </p>
                <div className="space-y-2">
                  {balances.map((balance, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-accent/10 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{balance.from}</span>
                        <span className="text-sm text-muted-foreground">pays</span>
                        <span className="font-medium">{balance.to}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        ${balance.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {balances.length === 0 && transactions.length > 0 && (
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="font-medium">All Settled!</p>
                <p className="text-sm text-muted-foreground">
                  No outstanding balances between members
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Done Splitting Button */}
        {canEndJourney && !isViewOnly && (
          <Button
            className="w-full"
            size="lg"
            onClick={() => setConfirmDialogOpen(true)}
          >
            Done Splitting
          </Button>
        )}

        {isViewOnly && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              You are viewing this group in read-only mode. Only the group creator can end the journey.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Important Note</DialogTitle>
            <DialogDescription className="text-center">
              If you click Yes (Done), your whole transactions will be deleted permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false)
                onContinue()
              }}
              className="flex-1"
            >
              No, Continue
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDialogOpen(false)
                onDoneSplitting()
              }}
              className="flex-1"
            >
              Yes, Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
