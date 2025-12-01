"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { ChevronLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComposeModal } from "@/components/compose-modal"

export function EmailDetail({ email, onClose, onRefresh }) {
  const [completedActions, setCompletedActions] = useState(new Set())
  const [showCompose, setShowCompose] = useState(false)
  const [draftBody, setDraftBody] = useState("")
  const [isDrafting, setIsDrafting] = useState(false)

  const handleAutoDraft = async () => {
    setIsDrafting(true)
    setShowCompose(true)
    try {
      const result = await api.autodraft(email.id, "professional reply")
      setDraftBody(result?.draft || "")
    } catch (err) {
      console.error(err)
    }
    setIsDrafting(false)
  }

  return (
    <>
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-text-secondary hover:text-primary-dark transition mb-4"
      >
        <ChevronLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{email.subject}</h1>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>{email.sender}</span>
            <span>•</span>
            <span>{new Date(email.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
            {email.category}
          </span>
        </div>

        <pre className="bg-surface/40 p-4 rounded-lg text-text-primary whitespace-pre-wrap break-words text-sm">
          {email.body}
        </pre>

        {email.actions?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {email.actions.map((action, idx) => {
                const key = `${email._id}-${idx}`
                const done = completedActions.has(key)
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const updated = new Set(completedActions)
                      done ? updated.delete(key) : updated.add(key)
                      setCompletedActions(updated)
                    }}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      done
                        ? "bg-accent/30 text-accent line-through"
                        : "bg-primary/20 text-primary-dark hover:bg-primary/30"
                    }`}
                  >
                    <input type="checkbox" checked={done} readOnly className="mr-2" />
                    {action.task}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleAutoDraft} disabled={isDrafting} className="flex items-center gap-2">
            <Zap size={16} />
            Auto-Draft
          </Button>
          <Button variant="outline" onClick={() => setShowCompose(true)}>
            Reply / Edit
          </Button>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onRefresh={onRefresh}
          replyEmail={email}
        />
      )}
    </>
  )
}
