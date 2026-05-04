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
import { AlertCircle, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import Image from "next/image"
import type { Transaction, SplitDetail } from "@/app/page"
import { formatCurrency, suggestEqualSplits } from "@/lib/currency"
import { Input } from "@/components/ui/input"

interface EndJourneyScreenProps {
  transactions: Transaction[]
  members: string[]
  onContinue: () => void
  onDoneSplitting: () => void
  canEndJourney?: boolean
  isViewOnly?: boolean
  onCompleteTransaction?: (transactionId: string, splitDetails?: SplitDetail[]) => void
  permission?: "creator" | "editor" | "viewer"
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
  onCompleteTransaction,
  permission = "creator",
}: EndJourneyScreenProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [customSplitAmounts, setCustomSplitAmounts] = useState<Record<string, string>>({})
  
  const canEdit = permission === "creator" || permission === "editor"
  const activeTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status !== "completed"),
    [transactions],
  )

  // Calculate who owes whom
  const balances = useMemo(() => {
    // Track how much each person has paid and should pay
    const paid: Record<string, number> = {}
    const owes: Record<string, number> = {}

    members.forEach((member) => {
      paid[member] = 0
      owes[member] = 0
    })

    activeTransactions.forEach((t) => {
      paid[t.payer] = (paid[t.payer] || 0) + Math.round(t.amount)
      
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
      
      // Integer split: floor amount per person, distribute remainder 1 rupee at a time
      // This prevents floating-point fractions from compounding across multiple transactions
      const totalInt = Math.round(t.amount)
      const floorShare = Math.floor(totalInt / beneficiaries.length)
      const remainder = totalInt % beneficiaries.length
      beneficiaries.forEach((beneficiary, idx) => {
        const share = idx < remainder ? floorShare + 1 : floorShare
        owes[beneficiary] = (owes[beneficiary] || 0) + share
      })
    })

    // Calculate net balance for each person
    const netBalance: Record<string, number> = {}
    members.forEach((member) => {
      netBalance[member] = paid[member] - owes[member]
    })

    // Simplify debts using exact integer net balances
    // (no nearest-10 rounding here — that would lose rupees and break payer totals)
    const settlements: Balance[] = []
    const creditors = members.filter((m) => netBalance[m] > 0).sort((a, b) => netBalance[b] - netBalance[a])
    const debtors = members.filter((m) => netBalance[m] < 0).sort((a, b) => netBalance[a] - netBalance[b])

    const workingBalance = { ...netBalance }
    let i = 0
    let j = 0

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      const credit = workingBalance[creditor]
      const debt = -workingBalance[debtor]
      const amount = Math.min(credit, debt)

      if (amount > 0) {
        settlements.push({
          from: debtor,
          to: creditor,
          amount,
        })
      }

      workingBalance[creditor] -= amount
      workingBalance[debtor] += amount

      if (workingBalance[creditor] <= 0) i++
      if (workingBalance[debtor] >= 0) j++
    }

    return settlements
  }, [activeTransactions, members])

  const totalSpent = activeTransactions.reduce((sum, t) => sum + t.amount, 0)

  const parseBeneficiaries = (beneficiaryText: string): string[] => {
    if (beneficiaryText.toLowerCase().trim() === "everyone") {
      return members
    }
    return beneficiaryText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  }

  const handleSplitClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setCustomSplitAmounts({})
    setSplitDialogOpen(true)
  }

  const handleSplitDone = () => {
    if (!selectedTransaction) return
    
    const beneficiaries = parseBeneficiaries(selectedTransaction.onWhom)
    const suggested = suggestEqualSplits(selectedTransaction.amount, beneficiaries.length)
    
    const splitDetails: SplitDetail[] = beneficiaries.map((beneficiary, index) => ({
      beneficiary,
      amount: customSplitAmounts[`${selectedTransaction.id}-${index}`] 
        ? parseFloat(customSplitAmounts[`${selectedTransaction.id}-${index}`]) || 0
        : suggested[index],
    }))
    
    onCompleteTransaction?.(selectedTransaction.id, splitDetails)
    
    setSplitDialogOpen(false)
    setSelectedTransaction(null)
    setCustomSplitAmounts({})
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/GhostSplits_LOGO.png" alt="GhostSplits" width={36} height={36} className="object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground">GhostSplits</span>
        </div>
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
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">
                {activeTransactions.length} transaction{activeTransactions.length !== 1 ? "s" : ""}
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
                  {transactions.map((transaction) => {
                    const isCompleted = transaction.status === "completed"
                    return (
                      <div
                        key={transaction.id}
                        className={`rounded-lg border p-3 ${
                          isCompleted
                            ? "border-green-200 bg-green-50 opacity-75"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${ isCompleted ? "text-green-800" : "" }`}>
                                {transaction.payer}
                              </p>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed · Split
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              paid for {transaction.onWhom}
                            </p>
                            <p className={`mt-1 text-sm ${ isCompleted ? "line-through text-muted-foreground" : "" }`}>
                              {transaction.description}
                            </p>
                            {/* Split button for active transactions */}
                            {!isCompleted && canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSplitClick(transaction)}
                                className="mt-2 h-7 text-xs"
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                Split
                              </Button>
                            )}
                            {/* Show split details for completed transactions */}
                            {isCompleted && transaction.splitDetails && transaction.splitDetails.length > 0 && (
                              <div className="mt-2 rounded border border-green-200 bg-green-100/50 p-2 text-xs">
                                <p className="font-medium text-green-800 mb-1">Split breakdown:</p>
                                <div className="space-y-0.5">
                                  {transaction.splitDetails.map((split, idx) => (
                                    <p key={idx} className="text-green-700">
                                      {split.beneficiary}: {formatCurrency(split.amount)}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className={`font-semibold ${ isCompleted ? "text-green-700 line-through" : "text-primary" }`}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
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
                        {formatCurrency(balance.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {balances.length === 0 && activeTransactions.length > 0 && (
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

        {/* Contact & Feedback Footer */}
        <div className="border-t bg-card py-8 text-center mt-8">
          <div className="mb-4">
            <div className="flex flex-col items-center justify-center gap-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-2">Contact & Feedback</p>
                <div className="flex flex-col gap-2">
                  <a 
                    href="mailto:ghostsplits@gmail.com" 
                    className="text-primary hover:underline transition-colors"
                    aria-label="Email us at ghostsplits@gmail.com"
                  >
                    Gmail: ghostsplits@gmail.com
                  </a>
                  <a 
                    href="https://www.instagram.com/ghostsplits?igsh=MXBlaHo4Ym8xN2pwMw==&utm_source=ig_contact_invite" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline transition-colors"
                    aria-label="Follow us on Instagram"
                  >
                    Instagram: @ghostsplits
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {/* Split Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={(open) => !open && setSplitDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Split Transaction</DialogTitle>
            <DialogDescription>
              Set custom amounts for each person. The sum must equal the total.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                <p><strong>Description:</strong> {selectedTransaction.description}</p>
                <p><strong>Paid by:</strong> {selectedTransaction.payer}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedTransaction.amount)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Set split amounts:</p>
                {(() => {
                  const beneficiaries = parseBeneficiaries(selectedTransaction.onWhom)
                  const suggested = suggestEqualSplits(selectedTransaction.amount, beneficiaries.length)

                  const totalSplit = beneficiaries.reduce((sum, _, index) => {
                    const value = customSplitAmounts[`${selectedTransaction.id}-${index}`]
                    return sum + (value ? parseFloat(value) || 0 : suggested[index])
                  }, 0)

                  const isValid = Math.abs(totalSplit - selectedTransaction.amount) < 0.01

                  return (
                    <>
                      <div className="space-y-2 rounded border border-green-200 bg-green-50 p-3">
                        {beneficiaries.map((beneficiary, index) => {
                          const inputKey = `${selectedTransaction.id}-${index}`
                          const currentValue = customSplitAmounts[inputKey] ?? suggested[index].toString()

                          return (
                            <div key={inputKey} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-24 truncate">{beneficiary}:</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentValue}
                                onChange={(e) => {
                                  setCustomSplitAmounts((prev) => ({
                                    ...prev,
                                    [inputKey]: e.target.value,
                                  }))
                                }}
                                className="h-8 w-24 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">Rs</span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className={isValid ? "text-green-600" : "text-destructive"}>
                          Sum: {formatCurrency(totalSplit)}
                        </span>
                        {!isValid && (
                          <span className="text-xs text-destructive">
                            Must equal {formatCurrency(selectedTransaction.amount)}
                          </span>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={(() => {
                if (!selectedTransaction) return true
                const beneficiaries = parseBeneficiaries(selectedTransaction.onWhom)
                const suggested = suggestEqualSplits(selectedTransaction.amount, beneficiaries.length)
                const totalSplit = beneficiaries.reduce((sum, _, index) => {
                  const value = customSplitAmounts[`${selectedTransaction.id}-${index}`]
                  return sum + (value ? parseFloat(value) || 0 : suggested[index])
                }, 0)
                return Math.abs(totalSplit - selectedTransaction.amount) >= 0.01
              })()}
              onClick={handleSplitDone}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
