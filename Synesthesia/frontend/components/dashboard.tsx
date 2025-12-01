"use client"

import { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import { EmailList } from "./email-list"
import { EmailDetail } from "./email-detail"
import { SearchBar } from "./search-bar"
import { ComposeModal } from "./compose-modal"
import { Loader2 } from "lucide-react"

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

export function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCompose, setShowCompose] = useState(false)
  const [rafResults, setRafResults] = useState<Email[] | null>(null)

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
    } catch (error) {
      console.error("Failed to load emails:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = useMemo(() => {
    if (!searchTerm) return emails
    const term = searchTerm.toLowerCase()
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(term) ||
        e.sender.toLowerCase().includes(term) ||
        e.body.toLowerCase().includes(term)
    )
  }, [emails, searchTerm])

  const handleSemanticSearch = async (query: string) => {
    try {
      const res = await api.search(query)
      setRafResults(res)
    } catch (error) {
      console.error("Semantic search failed:", error)
    }
  }

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="w-full md:w-80 glass rounded-2xl p-4 flex flex-col overflow-hidden">

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSemanticSearch={handleSemanticSearch}
          onCompose={() => setShowCompose(true)}
        />

        <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-dark" />
            </div>
          ) : (
            <EmailList
              emails={rafResults || filteredEmails}
              selected={selectedEmail}
              onSelect={setSelectedEmail}
            />
          )}
        </div>
      </div>

      {selectedEmail && (
        <div className="hidden lg:flex flex-1 glass rounded-2xl p-6 overflow-y-auto">
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onRefresh={loadEmails}
          />
        </div>
      )}

      {!selectedEmail && (
        <div className="hidden 2xl:flex flex-1 glass rounded-2xl p-6 items-center justify-center">
          <p className="text-text-secondary">Select an email to view details.</p>
        </div>
      )}

      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} onRefresh={loadEmails} />
      )}
    </div>
  )
}
