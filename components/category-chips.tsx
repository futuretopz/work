"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

interface CategoryChipsProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryChips({ selectedCategory, onSelectCategory }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener("resize", updateArrows)
    return () => window.removeEventListener("resize", updateArrows)
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setTimeout(updateArrows, 300)
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Left fade and arrow */}
      {showLeftArrow && (
        <div className="absolute left-0 z-10 flex items-center bg-gradient-to-r from-background via-background to-transparent pr-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Chips container */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto px-1 py-1"
        onScroll={updateArrows}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Right fade and arrow */}
      {showRightArrow && (
        <div className="absolute right-0 z-10 flex items-center bg-gradient-to-l from-background via-background to-transparent pl-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
