"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Settings, Home } from "lucide-react"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/", id: "dashboard", color: "var(--google-blue)" },
    { icon: FileText, label: "Drafts", href: "/drafts", id: "drafts", color: "var(--google-green)" },
    { icon: Settings, label: "Settings", href: "/settings", id: "settings", color: "var(--google-red)" },
  ]

  return (
    <div
      className={`${collapsed ? "w-20" : "w-64"} transition-glass glass-lg sticky left-0 top-0 h-screen flex flex-col p-4 gap-6 overflow-y-auto`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 justify-between animate-scale-up">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-400 to-purple-600 text-white font-bold text-lg shadow-lg flex items-center justify-center border-2 border-purple-300 hover:animate-pulse-glow transition-all hover:scale-125">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-slide-in">
              <span className="font-bold text-sm text-text-primary">Synesthesia</span>
              <span className="text-xs text-text-muted">Email Agent</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-primary/10 rounded-lg transition-glass text-text-secondary hover:scale-110 active:scale-95"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <div className="space-y-2">
          {navItems.map((item, idx) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/40 transition-all duration-300 group cursor-glow glass-shimmer border-2 border-transparent hover:border-white/30 animate-slide-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
              title={collapsed ? item.label : ""}
            >
              {item.icon && (
                <item.icon
                  size={22}
                  className="flex-shrink-0 transition-all group-hover:scale-125 group-hover:rotate-12"
                  style={{ color: item.color }}
                />
              )}
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {item.id === "dashboard" && <span className="ml-auto w-2 h-2 bg-neo-blue rounded-full animate-pulse" />}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/20">
        {!collapsed && (
          <div className="text-xs text-text-muted text-center animate-fade-in space-y-1">
            <p className="font-semibold">Email Productivity</p>
            <p className="text-xs">Powered by AI</p>
          </div>
        )}
      </div>
    </div>
  )
}
