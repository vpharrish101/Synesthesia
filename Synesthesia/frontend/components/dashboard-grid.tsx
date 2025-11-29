"use client"

import { useState, useEffect } from "react"
import { EmailList } from "./email-list"
import { EmailDetail } from "./email-detail"
import { SearchBar } from "./search-bar"
import { ComposeModal } from "./compose-modal"
import { StatCard } from "./stat-card"
import { api } from "@/lib/api"

interface Email {
  _id: string
  id: string
  sender: string
  subject: string
  timestamp: string
  body: string
  category: string
  actions: Array<{ task: string; deadline: string }>
  summary?: string
  draft_reply?: string
}

export function DashboardGrid({ onSelectEmail }) {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [rafResults, setRafResults] = useState<Email[] | null>(null)
  const [showCompose, setShowCompose] = useState(false)

  useEffect(() => {
    loadEmails()
  }, [])

  const loadEmails = async () => {
    setLoading(true)
    try {
      const data = await api.getEmails()

      // 🔥 Normalize IDs so ChatWidget ALWAYS receives a usable one
      const normalized = (data || []).map(e => ({
        ...e,
        id: e.id || e._id,
        _id: e._id || e.id
      }))

      const sorted = normalized.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setEmails(sorted)
    } catch (error) {
      console.error("[v0] Failed to load emails:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = emails.filter((e) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      e.subject.toLowerCase().includes(term) ||
      e.sender.toLowerCase().includes(term) ||
      e.body.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* HEADER */}
        <div className="flex items-start justify-between animate-slide-in gap-4">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Your Inbox</h1>
            <p className="text-sm text-text-secondary font-medium">
              Manage emails with AI-powered assistance
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="glass rounded-2xl p-4 cursor-glow glass-shimmer animate-slide-in">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSemanticSearch={async (q) => {
              try {
                const results = await api.search(q)

                // Normalize RAG results too
                setRafResults(
                  results.map(e => ({
                    ...e,
                    id: e.id || e._id,
                    _id: e._id || e.id
                  }))
                )
              } catch (err) {
                console.error("Search failed:", err)
              }
            }}
            onCompose={() => setShowCompose(true)}
          />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in">
          <StatCard label="Total Emails" value={emails.length} gradient="from-red-500 to-pink-300" detail="in your inbox" />
          <StatCard label="Unread" value={Math.floor(emails.length * 0.3)} gradient="from-blue-500 to-blue-300" detail="awaiting review" />
          <StatCard label="Actions" value={emails.reduce((sum, e) => sum + e.actions.length, 0)} gradient="from-yellow-500 to-orange-300" detail="to complete" />
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* EMAIL LIST */}
          <div className="lg:col-span-[1.5] glass rounded-2xl p-4 h-96 overflow-y-auto custom-scroll">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-lg">
              <span className="w-3 h-3 rounded-full bg-neo-blue animate-pulse" />
              Recent Emails
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-12 h-12 border-4 border-neo-purple border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text-secondary font-medium">Loading emails...</p>
              </div>
            ) : rafResults ? (
              <>
                <div className="text-xs font-bold text-neo-blue mb-3 flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg border-2 border-blue-300 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-neo-blue animate-pulse" />
                  AI Results
                  <span className="ml-auto">✨</span>
                </div>

                <EmailList
                  emails={rafResults}
                  selected={selectedEmail}
                  onSelect={(email) => {
                    const id = email.id || email._id
                    setSelectedEmail(email)
                    onSelectEmail(id)
                    setRafResults(null)
                  }}
                />
              </>
            ) : (
              <EmailList
                emails={filteredEmails}
                selected={selectedEmail}
                onSelect={(email) => {
                  const id = email.id || email._id
                  setSelectedEmail(email)
                  onSelectEmail(id)
                }}
              />
            )}
          </div>

          {/* EMAIL DETAIL */}
          {selectedEmail ? (
            <div className="lg:col-span-2 glass rounded-2xl p-6 overflow-y-auto glass-shimmer">
              <EmailDetail
                email={selectedEmail}
                onClose={() => {
                  setSelectedEmail(null)
                  onSelectEmail(null)
                }}
                onRefresh={loadEmails}
              />
            </div>
          ) : (
            <div className="lg:col-span-2 glass rounded-2xl p-6 flex items-center justify-center flex-col gap-4 glass-shimmer">
              <div className="text-7xl animate-float">📧</div>
              <p className="text-sm font-semibold text-text-primary">Select an email to view details</p>
              <p className="text-xs text-text-secondary mt-2">Or create a new one with Compose</p>
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onRefresh={loadEmails} />}
    </div>
  )
}
