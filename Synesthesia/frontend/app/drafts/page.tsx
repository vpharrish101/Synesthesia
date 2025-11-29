"use client"

import { Navbar } from "@/components/navbar"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([])
  const [sorted, setSorted] = useState(false)
  const [originalDrafts, setOriginalDrafts] = useState([])

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    try {
      const res = await api.getDrafts()

      // Store original order for unsorting
      setOriginalDrafts(res)
      setDrafts(res)
    } catch (e) {
      console.error("Failed to load drafts", e)
    }
  }

  // 🔥 Sort drafts by newest → oldest (timestamp)
  const toggleSort = () => {
    if (sorted) {
      const sortedList = [...drafts].sort((a, b) => {
        const ta = new Date(a.timestamp || 0).getTime()
        const tb = new Date(b.timestamp || 0).getTime()
        return tb - ta
      })
      setDrafts(sortedList)
    } else {
      // revert to original order
      setDrafts(originalDrafts)
    }
    setSorted(!sorted)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />

      <div className="flex-1 p-6 overflow-y-auto flex justify-start">
        <div className="w-full max-w-xl ml-4">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Drafts</h1>

            {/* 🔥 SORT BUTTON */}
            {drafts.length > 0 && (
              <button
                onClick={toggleSort}
                className="
                  text-xs px-3 py-1.5 rounded-lg 
                  bg-purple-100 text-purple-700 border border-purple-300 
                  font-semibold hover:bg-purple-200 active:scale-95 transition
                "
              >
                {sorted ? "Unsort" : "Sort by Newest"}
              </button>
            )}
          </div>

          {drafts.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p>No drafts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {drafts.map((d) => {
                const sender = d.recipient || "Me"
                const timestamp = d.timestamp
                  ? new Date(d.timestamp).toLocaleString()
                  : new Date().toLocaleString()

                return (
                  <div
                    key={d._id}
                    className="
                      relative rounded-2xl p-[3px] cursor-pointer transition-all 
                      hover:scale-[1.03] active:scale-[0.98]
                      w-full
                    "
                  >
                    {/* OUTER GRADIENT */}
                    <div
                      className="
                        absolute inset-0 rounded-2xl blur-md opacity-80
                        bg-gradient-to-br from-pink-400 to-red-400
                      "
                    />

                    {/* LEFT RIBBON */}
                    <div
                      className="
                        absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl 
                        bg-purple-400 z-20
                      "
                    />

                    {/* CARD BODY */}
                    <div
                      className="
                        relative z-10 glass rounded-2xl border border-white/30 
                        backdrop-blur-xl px-6 py-2 shadow-xl
                      "
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-text-primary line-clamp-1">
                          {d.subject}
                        </h3>

                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {timestamp}
                        </span>
                      </div>

                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {d.body}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="
                            text-[10px] px-2 py-1 rounded-full border 
                            bg-yellow-100 text-yellow-700 border-yellow-300 
                            font-semibold
                          "
                        >
                          Draft
                        </span>

                        <span className="text-xs text-text-muted">
                          To: <span className="font-medium">{sender}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
