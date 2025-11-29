"use client"

import { useState, useRef, useEffect } from "react"
import { api } from "@/lib/api"
import { X, Send } from "lucide-react"

export function ChatWidget({ selectedEmailId }: { selectedEmailId: string | null }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const msg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: msg }])
    setLoading(true)

    try {
      let payloadDescription = ""
      let res: any = null

      if (selectedEmailId) {
        // log payload for debugging
        console.log("[chat] calling /ds7m/ask with:", { email_id: selectedEmailId, question: msg })
        payloadDescription = `/ds7m/ask payload: { email_id: ${selectedEmailId}, question: "..."}`
        // call api.ask(email_id, question)
        res = await api.ask(selectedEmailId, msg)
      } else {
        // log payload for debugging
        console.log("[chat] calling /ds7m/superquery with:", { question: msg })
        payloadDescription = `/ds7m/superquery payload: { question: "..." }`
        res = await api.superquery(msg)
      }

      console.log("[chat] response:", res)
      let assistantText = ""
      if (res?.answer) {
        assistantText = res.answer
      } else if (res?.raw) {
        // 🔥 This makes your example print ONLY:
        // "This email is categorized as Spam. No further actions available."
        assistantText = res.raw
      } else if (typeof res === "string") {
        assistantText = res
      } else {
        assistantText = JSON.stringify(res, null, 2)
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }])
    } catch (err) {
      console.error("[chat] error:", err)
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xl shadow-lg border-2 border-orange-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        ✨
      </button>

      <div
        className={`fixed bottom-20 right-5 z-[9998] w-80 md:w-96 h-[420px] bg-white border border-gray-300 rounded-2xl shadow-xl flex flex-col overflow-hidden origin-bottom-right transition-all duration-300 ${open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
        style={{ transformOrigin: "bottom right" }}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">
            ✨ Synesthesia Assistant
            <span className="ml-2 text-[10px] px-2 py-0.5 bg-black/10 rounded-full">
              {selectedEmailId ? "Email Mode" : "Global Mode"}
            </span>
          </h3>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded transition active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm font-medium">Ask me anything…</p>
              <p className="text-xs mt-1">I'll help you with your inbox.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-xl text-sm max-w-[70%] ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2 bg-gray-50">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ring-orange-400"
          />
          <button onClick={handleSend} disabled={loading} className="px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 active:scale-95 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
