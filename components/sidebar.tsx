"use client"

import { 
  Home, 
  History, 
  ThumbsUp,
  PlaySquare,
  Zap
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  isMini?: boolean
}

const mainLinks = [
  { icon: Home, label: "Home", href: "/", active: true },
]

const youLinks = [
  { icon: History, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
  { icon: Zap, label: "MEGA", href: "/mega" },
]



export function Sidebar({ isOpen, isMini = false }: SidebarProps) {
  const displayedYouLinks = youLinks

  // Mini sidebar for collapsed state
  if (isMini && !isOpen) {
    return (
      <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-[72px] flex-col bg-background lg:flex">
        <div className="flex flex-col items-center gap-1 py-2">
          {mainLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-4 text-[10px] hover:bg-secondary",
                link.active && "font-medium"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </a>
          ))}
          <a
            href="/you"
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-4 text-[10px] hover:bg-secondary"
          >
            <PlaySquare className="h-5 w-5" />
            <span>You</span>
          </a>
        </div>
      </aside>
    )
  }

  // Full sidebar
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => {}}
        />
      )}
      
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 transform bg-background transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2 p-3">
            {/* Main links */}
            <div className="flex flex-col">
              {mainLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-6 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary",
                    link.active && "bg-secondary font-medium"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            <div className="mx-3 border-t border-border" />

            {/* You section */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium">You</span>
              </div>
              {displayedYouLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-6 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>


          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
