"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, AlertCircle } from "lucide-react"
import Image from "next/image"
import { DataLossConfirmationDialog } from "@/components/data-loss-confirmation-dialog"

interface GroupCreationProps {
  onGroupCreated: (members: string[]) => void
  onBack: () => void
}

export function GroupCreation({ onGroupCreated, onBack }: GroupCreationProps) {
  const [step, setStep] = useState<"count" | "names">("count")
  const [memberCount, setMemberCount] = useState<string>("")
  const [memberNames, setMemberNames] = useState<string[]>([])
  const [errors, setErrors] = useState<{ count?: string; names?: string[]; duplicate?: string }>({})
  const [showDataLossWarning, setShowDataLossWarning] = useState(false)

  useEffect(() => {
    if (step === "names" && memberCount) {
      const count = parseInt(memberCount)
      setMemberNames(new Array(count).fill(""))
    }
  }, [step, memberCount])

  const handleCountSubmit = () => {
    const count = parseInt(memberCount)
    if (!memberCount || isNaN(count) || count < 2) {
      setErrors({ count: "Please enter at least 2 members" })
      return
    }
    if (count > 50) {
      setErrors({ count: "Maximum 50 members allowed" })
      return
    }
    setErrors({})
    setStep("names")
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...memberNames]
    newNames[index] = value
    setMemberNames(newNames)
    setErrors((prev) => ({ ...prev, duplicate: undefined }))
  }

  const validateNames = (): boolean => {
    const nameErrors: string[] = []
    const trimmedNames = memberNames.map((n) => n.trim().toLowerCase())

    memberNames.forEach((name, index) => {
      const trimmed = name.trim()
      if (!trimmed) {
        nameErrors[index] = "Name is required"
      } else if (trimmed.length > 30) {
        nameErrors[index] = "Name must be 30 characters or less"
      }
    })

    // Check for duplicates
    const duplicates = trimmedNames.filter((name, index) => 
      name && trimmedNames.indexOf(name) !== index
    )

    if (duplicates.length > 0) {
      setErrors({ names: nameErrors, duplicate: "Duplicate names are not allowed" })
      return false
    }

    if (nameErrors.some((e) => e)) {
      setErrors({ names: nameErrors })
      return false
    }

    return true
  }

  const handleCreateGroup = () => {
    if (!validateNames()) return
    onGroupCreated(memberNames.map((n) => n.trim()))
  }

  const hasUnsavedData = memberCount !== "" || memberNames.some((name) => name.trim() !== "")

  const handleBackClick = () => {
    if (hasUnsavedData && step === "names") {
      setShowDataLossWarning(true)
    } else if (step === "names") {
      setStep("count")
    } else {
      onBack()
    }
  }

  const confirmDataLoss = () => {
    setShowDataLossWarning(false)
    onBack()
  }
  const allNamesFilled = memberNames.every((name) => name.trim() !== "")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Button
        variant="ghost"
        className="absolute left-4 top-4"
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <DataLossConfirmationDialog
        isOpen={showDataLossWarning}
        onConfirm={confirmDataLoss}
        onCancel={() => setShowDataLossWarning(false)}
        title="Discard Member List?"
        description="You have entered member names. Since GhostSplits doesn't use login, your data won't be saved. Are you sure you want to go back and discard these changes?"
      />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image src="/GhostSplits_LOGO.png" alt="GhostSplits" width={48} height={48} className="object-contain" />
          </div>
          <CardTitle className="text-2xl">
            {step === "count" ? "Create Your Group" : "Name Your Members"}
          </CardTitle>
          <CardDescription>
            {step === "count"
              ? "How many people are in your group?"
              : "Enter the name of each member in your group"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "count" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberCount">No of members in your group</Label>
                <Input
                  id="memberCount"
                  type="number"
                  min="2"
                  max="50"
                  placeholder="Enter number (minimum 2)"
                  value={memberCount}
                  onChange={(e) => {
                    setMemberCount(e.target.value)
                    setErrors({})
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCountSubmit()
                  }}
                />
                {errors.count && (
                  <p className="flex items-center text-sm text-destructive">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {errors.count}
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={handleCountSubmit}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.duplicate && (
                <div className="flex items-center rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {errors.duplicate}
                </div>
              )}
              
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {memberNames.map((name, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`member-${index}`}>Member {index + 1}</Label>
                    <Input
                      id={`member-${index}`}
                      type="text"
                      placeholder={`Enter name for Member ${index + 1}`}
                      value={name}
                      maxLength={30}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                    />
                    {errors.names?.[index] && (
                      <p className="text-sm text-destructive">{errors.names[index]}</p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={handleCreateGroup}
                disabled={!allNamesFilled}
              >
                Create
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          NO LOGIN required, come use and go
        </p>
      </footer>
    </div>
  )
}
