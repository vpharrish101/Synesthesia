"use client"

import type React from "react"
import { useState, useRef } from "react"

interface StatCardProps {
  label: string
  value: string | number
  gradient:
    | "from-red-400 to-pink-300"
    | "from-blue-400 to-blue-300"
    | "from-yellow-400 to-orange-300"
    | "from-green-400 to-emerald-300"
  detail?: string
}

export function StatCard({ label, value, gradient, detail }: StatCardProps) {
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setGlowPos({ x, y })
  }

  return (
    <div
      ref={cardRef}
      className="glass-shimmer cursor-glow rounded-2xl p-6 overflow-hidden relative group transition-all duration-300 ease-out hover:scale-[1.02]"
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute pointer-events-none rounded-full transition-opacity opacity-0 group-hover:opacity-100"
        style={{
          left: `${glowPos.x}px`,
          top: `${glowPos.y}px`,
          width: "250px",
          height: "250px",
          marginLeft: "-125px",
          marginTop: "-125px",
          background:
            "radial-gradient(circle, rgba(255, 179, 160, 0.85) 0%, rgba(255, 179, 160, 0.45) 35%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />

      <div
        className={`absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br ${gradient} opacity-60 rounded-full blur-3xl transition-all duration-500`}
        style={{
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">{label}</p>
          <h3 className="text-4xl font-bold text-text-primary mb-2">{value}</h3>
          {detail && <p className="text-xs text-text-secondary font-medium">{detail}</p>}
        </div>
      </div>
    </div>
  )
}
