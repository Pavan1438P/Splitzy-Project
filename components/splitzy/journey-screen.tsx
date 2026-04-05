"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
import { Copy, Share2, Check, Receipt, Eye, Flag } from "lucide-react"
import type { Transaction } from "@/app/page"

interface JourneyScreenProps {
  groupId: string
  members: string[]
  transactions: Transaction[]
  onAddTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  onEndJourney: () => void
  permission?: "creator" | "editor" | "viewer"
  canEndJourney?: boolean
}

export function JourneyScreen({
  groupId,
  members,
  transactions,
  onAddTransaction,
  onEndJourney,
  permission = "creator",
  canEndJourney = true,
}: JourneyScreenProps) {
  const [selectedPayer, setSelectedPayer] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [onWhom, setOnWhom] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false)

  const getShareBaseUrl = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${window.location.pathname}`
  }

  const handleCopyLink = () => {
    const baseUrl = getShareBaseUrl()
    navigator.clipboard.writeText(`${baseUrl}?group=${groupId}&perm=creator`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (permission: "edit" | "view") => {
    const baseUrl = getShareBaseUrl()
    const shareUrl = `${baseUrl}?group=${groupId}&perm=${permission === "edit" ? "editor" : "viewer"}`
    const shareText = `Join my Splitzy group!\n\n${shareUrl}\n\nPermission: ${permission === "edit" ? "Can Edit Transactions" : "View Only"}`
    
    if (navigator.share) {
      navigator.share({
        title: "Splitzy Group Invite",
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareText)
    }
    setShareDialogOpen(false)
  }

  const handleMakeTransaction = () => {
    if (!selectedPayer || !amount || !onWhom || !description) return
    
    // Validate that onWhom contains valid member names
    const trimmedOnWhom = onWhom.trim()
    if (trimmedOnWhom.toLowerCase() !== "everyone") {
      const names = trimmedOnWhom.split(',').map(name => name.trim()).filter(name => name)
      const invalidNames = names.filter(name => {
        return !members.some(member => 
          member.toLowerCase() === name.toLowerCase()
        )
      })
      
      if (invalidNames.length > 0) {
        alert(`Invalid member names: ${invalidNames.join(', ')}. Please use member names from your group or "Everyone".`)
        return
      }
      
      if (names.length === 0) {
        alert('Please enter at least one valid member name or "Everyone".')
        return
      }
    }
    
    onAddTransaction({
      payer: selectedPayer,
      amount: parseFloat(amount),
      onWhom: trimmedOnWhom,
      description,
    })

    // Reset form
    setSelectedPayer("")
    setAmount("")
    setOnWhom("")
    setDescription("")
  }

  const isFormValid = selectedPayer && amount && parseFloat(amount) > 0 && onWhom && description

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Group Link Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Group Link</CardTitle>
            <CardDescription>
              Share this link with your group members
              {permission !== 'creator' && (
                <span className="block text-sm text-orange-600 mt-1">
                  You have {permission} access to this group
                </span>
              )}
              <span className="block text-sm text-blue-600 mt-1">
                Realtime updates are powered by Supabase.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-4 py-3 font-mono text-sm break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}?group=${groupId}&perm=${permission}` : groupId}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {permission === 'creator' && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Share different permission levels
                </p>
                <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey Section */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Start Your Journey</CardTitle>
            <CardDescription>Record expenses as they happen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Team Member</Label>
                <Select value={selectedPayer} onValueChange={setSelectedPayer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">How much money spending</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onWhom">On Whom</Label>
              <Input
                id="onWhom"
                type="text"
                placeholder="Who is this expense for? (e.g., Everyone, John, Mary, or John, Mary)"
                value={onWhom}
                onChange={(e) => setOnWhom(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter "Everyone" or specific names separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleMakeTransaction}
              disabled={!isFormValid}
            >
              Make Transaction
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setTransactionsDialogOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            See Transactions Until Now
          </Button>
          {canEndJourney && (
            <Button
              variant="default"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={onEndJourney}
            >
              <Flag className="mr-2 h-4 w-4" />
              End Journey
            </Button>
          )}
        </div>

        {/* Transaction Count */}
        {transactions.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} recorded
          </p>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Group Link</DialogTitle>
            <DialogDescription>
              Choose what permissions other users should have
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleShare("view")} className="flex-1">
              View Only
            </Button>
            <Button onClick={() => handleShare("edit")} className="flex-1">
              Can Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transactions Until Now</DialogTitle>
            <DialogDescription>
              All recorded expenses in this journey
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No transactions recorded yet
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{transaction.payer}</p>
                      <p className="text-sm text-muted-foreground">
                        paid for {transaction.onWhom}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm">{transaction.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {transaction.timestamp.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
