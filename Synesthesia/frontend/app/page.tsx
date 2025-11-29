"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardGrid } from "@/components/dashboard-grid"
import { ChatWidget } from "@/components/chat-widget"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // 🔥 GLOBAL selected email ID state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pass callback down */}
        <DashboardGrid onSelectEmail={(id: string | null) => setSelectedEmailId(id)} />

        {/* ChatWidget now ALWAYS receives the correct email */}
        <ChatWidget selectedEmailId={selectedEmailId} />
      </div>
    </div>
  )
}
