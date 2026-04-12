"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface DataLossConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  description?: string
}

export function DataLossConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Unsaved Changes",
  description = "You have unsaved data. Since GhostSplits doesn't use login, your data won't be saved if you go back. Are you sure you want to continue?",
}: DataLossConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-4">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Continue Editing</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive">
            Go Back
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
