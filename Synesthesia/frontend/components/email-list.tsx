"use client"

import { Mail } from "lucide-react"
import { useState } from "react"

const categoryGradient = {
  important: "from-red-500 to-red-700",
  personal: "from-blue-500 to-blue-700",
  work: "from-green-500 to-green-700",
  spam: "from-gray-500 to-gray-700",
  meeting: "from-yellow-500 to-yellow-700",
  newsletter: "from-teal-500 to-cyan-700",
  other: "from-purple-500 to-pink-600",
}

const categoryRibbon = {
  important: "bg-red-600",
  personal: "bg-blue-600",
  work: "bg-green-600",
  spam: "bg-gray-600",
  meeting: "bg-yellow-600",
  newsletter: "bg-cyan-600",
  other: "bg-purple-600",
}

const categoryBadge = {
  important: "bg-red-100 text-red-700 border-red-300",
  personal: "bg-blue-100 text-blue-700 border-blue-300",
  work: "bg-green-100 text-green-700 border-green-300",
  spam: "bg-gray-100 text-gray-700 border-gray-300",
  meeting: "bg-yellow-100 text-yellow-700 border-yellow-300",
  newsletter: "bg-cyan-100 text-cyan-700 border-cyan-300",
  other: "bg-purple-100 text-purple-700 border-purple-300",
}

const categoryLabel = {
  important: "Important",
  personal: "Personal",
  work: "Work",
  spam: "Spam",
  meeting: "Meeting",
  newsletter: "Newsletter",
  other: "Other",
}

const CATEGORY_ORDER = [
  "important",
  "personal",
  "work",
  "meeting",
  "newsletter",
  "spam",
  "other"
]

export function EmailList({ emails, selected, onSelect }) {
  const [sorted, setSorted] = useState(false)

  if (!emails || emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Mail size={28} className="text-text-muted mb-2" />
        <p className="text-sm text-text-muted">No emails found</p>
      </div>
    )
  }

  const toggleSort = () => setSorted(!sorted)

  const displayedEmails = sorted
    ? [...emails].sort((a, b) => {
        const ca = (a.category || "other").toLowerCase()
        const cb = (b.category || "other").toLowerCase()
        return CATEGORY_ORDER.indexOf(ca) - CATEGORY_ORDER.indexOf(cb)
      })
    : emails

  return (
    <div className="flex flex-col gap-4 max-h-full overflow-y-auto custom-scroll">

      <div className="flex justify-end pr-2">
        <button
          onClick={toggleSort}
          className="
            text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 
            border border-purple-300 font-semibold hover:bg-purple-200 
            active:scale-95 transition
          "
        >
          {sorted ? "Unsort" : "Sort by Category"}
        </button>
      </div>

      {displayedEmails.map((email) => {
        const id = email.id || email._id
        const rawCat = email.category || "other"
        const cat = rawCat.toLowerCase()

        const grad = categoryGradient[cat] || categoryGradient["other"]
        const ribbon = categoryRibbon[cat] || categoryRibbon["other"]
        const badgeStyle = categoryBadge[cat] || categoryBadge["other"]
        const badgeText = categoryLabel[cat] || categoryLabel["other"]

        const isSelected = selected?._id === email._id

        return (
          <button
            key={email._id}
            onClick={() => onSelect({ ...email, id })}
            className={`
              relative w-full max-w-6xl mx-auto text-left rounded-xl p-[3px] 
              transition-all hover:scale-[1.03] active:scale-[0.97]
              ${isSelected ? "ring-2 ring-purple-400" : ""}
            `}
          >
            <div
              className={`
                absolute inset-0 rounded-xl blur-md opacity-80
                bg-gradient-to-br ${grad}
              `}
            />
            <div
              className={`
                absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${ribbon}
                z-20
              `}
            />

            <div
              className="
                relative z-10 rounded-xl bg-white/70 backdrop-blur-md
                border border-white/40 px-5 py-4 shadow-md flex flex-col gap-2
              "
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">{email.sender}</span>
                <span className="text-[10px] text-text-muted">
                  {new Date(email.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold line-clamp-1">{email.subject}</h4>

                <span
                  className={`
                    text-[10px] px-2 py-0.5 rounded-full border font-semibold 
                    whitespace-nowrap ${badgeStyle}
                  `}
                >
                  {badgeText}
                </span>
              </div>

              <p className="text-xs text-text-secondary line-clamp-2">
                {email.body}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
