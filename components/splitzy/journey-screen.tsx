"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, Copy, Eye, Flag, Share2, Zap } from "lucide-react"
import Image from "next/image"
import type { Transaction } from "@/app/page"
import { formatCurrency, hasDecimal, suggestEqualSplits } from "@/lib/currency"
import { DataLossConfirmationDialog } from "@/components/data-loss-confirmation-dialog"

interface JourneyScreenProps {
  groupId: string
  members: string[]
  transactions: Transaction[]
  onAddTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  onCompleteTransaction?: (transactionId: string) => void
  onEndJourney: () => void
  permission?: "creator" | "editor" | "viewer"
  canEndJourney?: boolean
}

export function JourneyScreen({
  groupId,
  members,
  transactions,
  onAddTransaction,
  onCompleteTransaction,
  onEndJourney,
  permission = "creator",
  canEndJourney = true,
}: JourneyScreenProps) {
  const [selectedPayer, setSelectedPayer] = useState("")
  const [amount, setAmount] = useState("")
  const [onWhom, setOnWhom] = useState("")
  const [description, setDescription] = useState("")
  const [copied, setCopied] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false)
  const [suggestedSplits, setSuggestedSplits] = useState<Record<string, number[]>>({})
  const [selectedForSplit, setSelectedForSplit] = useState<string | null>(null)
  const [showDataLossWarning, setShowDataLossWarning] = useState(false)

  const activeTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status !== "completed"),
    [transactions],
  )

  const selectedTransaction = useMemo(
    () => activeTransactions.find((transaction) => transaction.id === selectedForSplit) ?? null,
    [activeTransactions, selectedForSplit],
  )

  const getShareBaseUrl = () => {
    if (typeof window === "undefined") return ""
    return window.location.origin
  }

  const handleCopyLink = () => {
    const baseUrl = getShareBaseUrl()
    navigator.clipboard.writeText(`${baseUrl}?group=${groupId}&perm=creator`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (invitePermission: "edit" | "view") => {
    const baseUrl = getShareBaseUrl()
    const shareUrl = `${baseUrl}?group=${groupId}&perm=${invitePermission === "edit" ? "editor" : "viewer"}`
    const shareText = `Join my GhostSplits group!\n\n${shareUrl}\n\nPermission: ${invitePermission === "edit" ? "Can Edit Transactions" : "View Only"}`

    if (navigator.share) {
      navigator.share({
        title: "GhostSplits Group Invite",
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareText)
    }

    setShareDialogOpen(false)
  }

  const parseBeneficiaries = (beneficiaryText: string) => {
    if (beneficiaryText.toLowerCase().trim() === "everyone") {
      return members
    }
    return beneficiaryText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  }

  const handleMakeTransaction = () => {
    if (!selectedPayer || !amount || !onWhom || !description) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000) {
      alert("Amount must be between ₹1 and ₹10,00,000.")
      return
    }

    const trimmedOnWhom = onWhom.trim()
    const beneficiaries = parseBeneficiaries(trimmedOnWhom)

    if (beneficiaries.length === 0) {
      alert("Please enter at least one valid member name or Everyone.")
      return
    }

    const invalidNames = beneficiaries.filter(
      (name) => !members.some((member) => member.toLowerCase() === name.toLowerCase()),
    )
    if (trimmedOnWhom.toLowerCase() !== "everyone" && invalidNames.length > 0) {
      alert(`Invalid member names: ${invalidNames.join(", ")}. Please use names from your group.`)
      return
    }

    onAddTransaction({
      payer: selectedPayer,
      amount: parsedAmount,
      onWhom: trimmedOnWhom,
      description,
      status: "active",
    })

    setSelectedPayer("")
    setAmount("")
    setOnWhom("")
    setDescription("")
  }

  const handleSuggestSplit = (transactionId: string, transaction: Transaction) => {
    const beneficiaries = parseBeneficiaries(transaction.onWhom)
    const suggested = suggestEqualSplits(transaction.amount, beneficiaries.length)
    setSuggestedSplits((prev) => ({ ...prev, [transactionId]: suggested }))
  }

  const handleInstantSplitDone = (transactionId: string, transaction: Transaction) => {
    const beneficiaries = parseBeneficiaries(transaction.onWhom)
    const suggested = suggestedSplits[transactionId] || suggestEqualSplits(transaction.amount, beneficiaries.length)

    beneficiaries.forEach((beneficiary, index) => {
      onAddTransaction({
        payer: transaction.payer,
        amount: suggested[index],
        onWhom: beneficiary,
        description: `${transaction.description} (split)`,
        status: "active",
      })
    })

    onCompleteTransaction?.(transactionId)

    setSuggestedSplits((prev) => {
      const next = { ...prev }
      delete next[transactionId]
      return next
    })
    setSelectedForSplit(null)
  }

  const isFormValid = !!selectedPayer && !!onWhom && !!description &&

  const handleEndJourneyClick = () => {
    if (activeTransactions.length > 0) {
      setShowDataLossWarning(true)
    } else {
      onEndJourney()
    }
  }


        <DataLossConfirmationDialog
          isOpen={showDataLossWarning}
          onConfirm={confirmEndJourney}
          onCancel={() => setShowDataLossWarning(false)}
          title="End Journey?"
          description="You have unsaved transactions. Since GhostSplits doesn't use login, your data won't be saved if you exit now. Are you sure you want to end the journey without saving?"
        />
  const confirmEndJourney = () => {
    setShowDataLossWarning(false)
    onEndJourney()
  } !!amount && parseFloat(amount) > 0
  const canEdit = permission === "creator" || permission === "editor"

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/GhostSplits_LOGO.png" alt="GhostSplits" width={36} height={36} className="object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground">GhostSplits</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Group Link</CardTitle>
            <CardDescription>
              Share this link with your group members
              {permission !== "creator" && (
                <span className="mt-1 block text-sm text-orange-600">You have {permission} access to this group</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-muted px-4 py-3 font-mono text-sm">
                {typeof window !== "undefined"
                  ? `${window.location.origin}?group=${groupId}&perm=${permission}`
                  : groupId}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {permission === "creator" && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Share different permission levels</p>
                <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>Record an expense and split instantly when needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedPayer} onValueChange={setSelectedPayer} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              min="1"
              max="1000000"
              disabled={!canEdit}
            />

            <Input
              value={onWhom}
              onChange={(event) => setOnWhom(event.target.value)}
              placeholder="On whom? (e.g. Everyone or A, B, C)"
              maxLength={200}
              disabled={!canEdit}
            />

            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              maxLength={150}
              disabled={!canEdit}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleMakeTransaction} disabled={!isFormValid || !canEdit}>
                Add Transaction
              </Button>
              <Button variant="outline" onClick={() => setTransactionsDialogOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View Transactions ({activeTransactions.length})
              </Button>
              <Button variant="secondary" onClick={handleEndJourneyClick} disabled={!canEndJourney}>
                <Flag className="mr-2 h-4 w-4" />
                End Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Group</DialogTitle>
            <DialogDescription>Choose how others can access this group.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleShare("view")}>Share View Link</Button>
            <Button onClick={() => handleShare("edit")}>Share Edit Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Active Transactions</DialogTitle>
            <DialogDescription>
              Use Suggest Split to preview how amounts are divided. If an amount has decimals, GhostSplits converts it into clean integer shares.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {activeTransactions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No active transactions</p>
            ) : (
              activeTransactions.map((transaction) => {
                const beneficiaries = parseBeneficiaries(transaction.onWhom)
                const suggested = suggestedSplits[transaction.id]
                const hasTxnDecimal = hasDecimal(transaction.amount)

                return (
                  <div key={transaction.id} className="space-y-2 rounded-md border p-3">
                    <div className="text-sm">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-muted-foreground">
                        {transaction.payer} paid {formatCurrency(transaction.amount)} for {transaction.onWhom}
                      </p>
                      {hasTxnDecimal && (
                        <p className="text-xs text-orange-600">Decimal amount detected. Instant Split will use integer values.</p>
                      )}
                    </div>

                    {!suggested ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestSplit(transaction.id, transaction)}
                        className="w-full text-xs"
                      >
                        Suggest Split
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="space-y-1 rounded border border-green-200 bg-green-50 p-2 text-xs">
                          {beneficiaries.map((beneficiary, index) => (
                            <p key={`${transaction.id}-${beneficiary}-${index}`} className="text-green-700">
                              {beneficiary}: {formatCurrency(suggested[index])}
                            </p>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setSelectedForSplit(transaction.id)}
                          className="w-full bg-green-600 text-xs hover:bg-green-700"
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          Instant Split
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedForSplit} onOpenChange={(open) => !open && setSelectedForSplit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Instant Split</DialogTitle>
            <DialogDescription>
              Review each person's share. Clicking Done creates individual split transactions and marks the original transaction as completed.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                <p><strong>Description:</strong> {selectedTransaction.description}</p>
                <p><strong>Paid by:</strong> {selectedTransaction.payer}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedTransaction.amount)}</p>
              </div>

              <div className="space-y-1 rounded border border-green-200 bg-green-50 p-3 text-sm">
                {(suggestedSplits[selectedTransaction.id] ||
                  suggestEqualSplits(selectedTransaction.amount, parseBeneficiaries(selectedTransaction.onWhom).length)).map(
                  (splitAmount, index) => {
                    const beneficiaries = parseBeneficiaries(selectedTransaction.onWhom)
                    return (
                      <p key={`${selectedTransaction.id}-confirm-${index}`} className="text-green-700">
                        {beneficiaries[index]}: {formatCurrency(splitAmount)}
                      </p>
                    )
                  },
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedForSplit(null)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedTransaction) {
                  handleInstantSplitDone(selectedTransaction.id, selectedTransaction)
                }
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}