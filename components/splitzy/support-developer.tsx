"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Heart } from "lucide-react"

interface SupportDeveloperProps {
  variant?: "button" | "card"
}

const UPI_ID = "6305171277@fam"

export function SupportDeveloper({ variant = "button" }: SupportDeveloperProps) {
  const [open, setOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadQR = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg")
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        
        canvas.width = svg.clientWidth
        canvas.height = svg.clientHeight
        
        img.onload = () => {
          ctx?.drawImage(img, 0, 0)
          const link = document.createElement("a")
          link.href = canvas.toDataURL("image/png")
          link.download = "support-developer-qr.png"
          link.click()
        }
        
        img.src = "data:image/svg+xml;base64," + btoa(svgData)
      }
    }
  }

  return (
    <>
      {variant === "button" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Heart className="h-4 w-4" />
          Buy me a chocolate
        </Button>
      )}

      {variant === "card" && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="mb-4 font-semibold text-foreground">
            You can buy a chocolate for developer
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            Pay Now
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              You can buy a chocolate for developer
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code or use UPI ID: {UPI_ID}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {/* QR Code */}
            <div
              ref={qrRef}
              className="rounded-lg border border-border p-4"
            >
              <QRCodeSVG
                value={`upi://pay?pa=${UPI_ID}&pn=GhostSplits&tn=Support`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* UPI ID Display */}
            <div className="w-full rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
              <p className="font-mono font-semibold text-foreground break-all">
                {UPI_ID}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={downloadQR}
                className="flex-1"
              >
                Download QR
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
