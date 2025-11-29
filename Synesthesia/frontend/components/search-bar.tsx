"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSemanticSearch: (query: string) => void
  onCompose: () => void
}

export function SearchBar({ value, onChange, onSemanticSearch, onCompose }: SearchBarProps) {
  const [isSearching, setIsSearching] = useState(false)

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      setIsSearching(true)
      await onSemanticSearch(value)
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative cursor-glow">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails... (Enter for AI)"
            className="w-full pl-10 pr-4 py-3 rounded-xl glass glass-shimmer border-2 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all text-sm font-medium"
          />
        </div>
      </div>
      {isSearching && (
        <p className="text-xs text-text-muted flex items-center gap-2 animate-fade-in">
          <span className="inline-block w-2 h-2 rounded-full bg-neo-purple animate-bounce" />
          <span
            className="inline-block w-2 h-2 rounded-full bg-neo-purple animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full bg-neo-purple animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          Searching with AI...
        </p>
      )}
    </div>
  )
}
