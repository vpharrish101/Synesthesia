"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Send } from "lucide-react"
import { api } from "@/lib/api"

interface Email {
  _id?: string
  id?: string
  sender?: string
  subject?: string
  timestamp?: string
  body?: string
  category?: string
}

interface ComposeModalProps {
  onClose: () => void
  onRefresh: () => void
  replyEmail?: Email
}

export function ComposeModal({ onClose, onRefresh, replyEmail }: ComposeModalProps) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [body, setBody] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleKeyClose = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyClose)
    return () => document.removeEventListener("keydown", handleKeyClose)
  }, [handleKeyClose])

  useEffect(() => {
    if (replyEmail) {
      if (replyEmail.sender) setTo(replyEmail.sender)
      if (replyEmail.subject) setSubject((s) => (s || `Re: ${replyEmail.subject}`))
    }
  }, [replyEmail])

    const handleGenerateDraft = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const promptText = (aiPrompt ?? "").trim();
      if (!promptText) {
        console.error("Prompt empty, not calling autodraft");
        return;
      }

      const response = await api.autodraft(
        replyEmail?.id ?? "new_email",
        promptText
      );
      const text = response?.draft || "";  

      setBody(""); 
        let index = 0;

        const typer = setInterval(() => {
        if (index < text.length) {
          setBody(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typer);
          setIsGenerating(false);
        }
      }, 18);

      } catch (error) {
        console.error("Draft generation failed:", error);
        setIsGenerating(false);
      }
    };


  const handleSave = async () => {
  if (!to.trim() || !subject.trim() || !body.trim()) {
    console.warn("Missing fields, not saving draft.")
    return
  }

  try {
    await api.addDraft(to, subject, body)
    onRefresh()   
    onClose()     
  } catch (e) {
    console.error("Failed to save draft:", e)
  }
}


  return (
    <>
      <div
        className="
        fixed inset-0 z-[999] 
        bg-black/40 backdrop-blur-md 
        animate-fade-in
      "
        onClick={onClose}
      />

        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000]" />

        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6">

          <div
            className="
              w-full max-w-2xl
              bg-white/90 backdrop-blur-xl
              border border-white/20 
              rounded-2xl shadow-2xl
              p-8
              max-h-[90vh] overflow-y-auto
              animate-fade-in
            "
          >

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Compose Email</h2>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg transition 
                hover:bg-red-400/20 hover:scale-125 active:scale-95
              "
            >
              <X size={20} className="stroke-2" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-secondary">To:</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-lg glass border-2 
                  focus:ring-2 focus:ring-pink-400
                  text-text-primary placeholder-text-muted
                  transition cursor-glow
                "
                placeholder="someone@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-secondary">Subject:</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-lg glass border-2 
                  focus:ring-2 focus:ring-pink-400 
                  text-text-primary placeholder-text-muted
                  transition cursor-glow
                "
                placeholder="Enter a subject"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-secondary">AI Draft Prompt:</label>

              <div className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateDraft()}
                  placeholder="Tell AI what to write..."
                  className="
                    flex-1 px-4 py-3 rounded-lg glass border-2 
                    focus:ring-2 focus:ring-pink-400 
                    text-text-primary placeholder-text-muted transition
                  "
                />

                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="
                    px-4 py-3 rounded-lg 
                    bg-gradient-to-br from-orange-400 to-orange-500
                    text-white border-2 border-orange-600
                    font-bold flex items-center gap-2
                    hover:scale-110 active:scale-95 transition
                    disabled:opacity-50 disabled:hover:scale-100
                  "
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} className="stroke-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-secondary">Message:</label>
              <textarea
                value={body}
                onChange={(e) => !isGenerating && setBody(e.target.value)}
                rows={8}
                className="
                  w-full px-4 py-3 rounded-lg glass border-2 
                  focus:ring-2 focus:ring-pink-400
                  text-text-primary placeholder-text-muted resize-none
                "
                placeholder="Message body..."
              />

              {isGenerating && (
                <div className="flex items-center gap-2 mt-2 text-sm text-neo-blue font-bold">
                  <div className="w-2 h-2 bg-neo-blue rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neo-blue rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-neo-blue rounded-full animate-bounce delay-200" />
                  <span>Typing draft…</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSave}
              className="
                px-6 py-3 rounded-lg bg-black text-white 
                hover:bg-gray-900 border-2 border-black
                font-bold shadow-lg hover:scale-105 active:scale-95
              "
            >
              Save Draft
            </button>

            <button
              onClick={onClose}
              className="
                px-6 py-3 rounded-lg bg-white border-2 border-black 
                font-bold hover:bg-gray-100 hover:scale-105 active:scale-95
              "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
