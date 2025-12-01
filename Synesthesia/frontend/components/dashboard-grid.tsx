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
}

export function DashboardGrid({
  onSelectEmail,
}: {
  onSelectEmail: (id: string | null) => void
}) {
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
      const sorted = (data || []).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setEmails(sorted)
    } catch (err) {
      console.error("[ERR] Failed to load emails:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = !searchTerm
    ? emails
    : emails.filter((e) => {
        const t = searchTerm.toLowerCase()
        return (
          e.subject.toLowerCase().includes(t) ||
          e.sender.toLowerCase().includes(t) ||
          e.body.toLowerCase().includes(t)
        )
      })

  const handleJSONUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      alert("Only JSON files allowed.")
      return
    }

    try {
      alert("Uploading…")
      await api.uploadEmails(file)
      alert("Uploaded successfully!")
      loadEmails()
    } catch (err) {
      console.error("JSON Upload failed:", err)
      alert("Upload failed.")
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-start justify-between animate-slide-in gap-4">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Your Inbox</h1>
            <p className="text-sm text-text-secondary font-medium">
              Manage emails with AI-powered assistance
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              id="json-upload"
              className="hidden"
              onChange={handleJSONUpload}
            />
            <label
              htmlFor="json-upload"
              className="cursor-pointer text-xs px-3 py-2 rounded-lg border bg-black/10 text-black/70 font-semibold hover:bg-black/20 transition"
            >
              Import Emails (JSON)
            </label>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 cursor-glow glass-shimmer animate-slide-in">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSemanticSearch={async (q) => {
              try {
                const results = await api.search(q)
                setRafResults(results)
              } catch (err) {
                console.error("Search Failed:", err)
              }
            }}
            onCompose={() => setShowCompose(true)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in">
          <StatCard label="Total Emails" value={emails.length} gradient="from-red-400 to-pink-300" />
          <StatCard label="Unread" value={Math.floor(emails.length * 0.3)} gradient="from-blue-400 to-blue-300" />
          <StatCard label="Actions" value={emails.reduce((s, e) => s + e.actions.length, 0)} gradient="from-yellow-400 to-orange-300" />
          <StatCard label="Sent" value={0} gradient="from-green-400 to-emerald-300" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-[1.5] glass rounded-2xl p-4 h-96 overflow-y-auto custom-scroll">
            <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-lg">
              <span className="w-3 h-3 rounded-full bg-neo-blue animate-pulse" />
              Recent Emails
            </h2>

            {(rafResults || filteredEmails).length === 0 ? (
              <p className="text-sm text-text-muted">No emails found</p>
            ) : (
              <EmailList
                emails={rafResults || filteredEmails}
                selected={selectedEmail}
                onSelect={(e) => {
                  setSelectedEmail(e)
                  onSelectEmail(e?.id ?? null)  
                }}
              />
            )}
          </div>

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
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary">Select an email to view details</p>
                <p className="text-xs text-text-secondary mt-2">
                  Or use the assistant below
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onRefresh={loadEmails} />}
    </div>
  )
}
