"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface WelcomeScreenProps {
  onCreateGroup: () => void
}

export function WelcomeScreen({ onCreateGroup }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/GhostSplits_LOGO.png"
            alt="GhostSplits logo"
            width={200}
            height={200}
            priority
            className="object-contain"
            onError={(e) => {
              // Fallback: hide broken image so the icon below shows
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = "flex"
            }}
          />
          <div
            className="hidden items-center justify-center rounded-full bg-primary/10 p-6"
            aria-hidden="true"
          >
            <Users className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Welcome to GhostSplits
        </h1>
        
        <p className="mb-2 max-w-2xl text-balance text-xl text-foreground/80 md:text-2xl">
          I am here to maintain your expenses records and help to split among yourselves
        </p>
        
        <p className="mb-10 max-w-xl text-balance text-muted-foreground">
          Track who paid what, and see exactly who owes whom at the end of your trip, dinner, or any shared expense.
        </p>
        
        <Button 
          size="lg" 
          onClick={onCreateGroup}
          className="px-8 py-6 text-lg font-semibold"
        >
          Create Group
        </Button>
      </div>
      
      <footer className="border-t bg-card py-8 text-center">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            NO LOGIN required, come use and go
          </p>
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
      </footer>
    </div>
  )
}
