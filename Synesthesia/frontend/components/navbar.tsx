"use client"

import { useState } from "react"
import Link from "next/link"
import { Settings, FileText, Menu, X, Home } from "lucide-react"

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="glass-lg sticky top-0 z-50 px-6 py-3 border-b border-border/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* 🔥 HOME BUTTON (top-left, B/W icon, centered) */}
        <Link href="/" className="flex items-center gap-2">
          <div className="
            w-10 h-10 rounded-lg 
            bg-white shadow-sm border border-gray-200
            flex items-center justify-center 
          ">
            <Home size={20} className="text-black" />
          </div>

          <span className="
            text-lg font-semibold bg-gradient-to-r from-primary-dark to-accent 
            bg-clip-text text-transparent
          ">
            Home
          </span>
        </Link>
        {/* -------------------------------------------- */}

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/drafts"
            className="flex items-center gap-2 text-text-secondary hover:text-primary-dark transition"
          >
            <FileText size={18} />
            <span>Drafts</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2 text-text-secondary hover:text-primary-dark transition"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>

        {/* MOBILE BURGER */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* MOBILE NAV MENU */}
        {open && (
          <div className="absolute top-full left-0 right-0 glass-lg border-t border-border/10 p-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link href="/drafts" className="text-text-secondary hover:text-primary-dark">
                Drafts
              </Link>
              <Link href="/settings" className="text-text-secondary hover:text-primary-dark">
                Settings
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
