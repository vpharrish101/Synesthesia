"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Loader2, Cog } from "lucide-react"

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const data = await api.getPrompts()
      const { _id, ...rest } = data
      setPrompts(rest)
    } catch (error) {
      console.error("Failed to load prompts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updatePrompts({ ...prompts, _id: "active_prompts" })
      alert("Prompts saved successfully!")
    } catch (error) {
      console.error("Failed to save prompts:", error)
      alert("Failed to save prompts")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />

      <div className="flex-1 p-6 overflow-y-auto flex justify-start">
        <div className="w-full max-w-2xl ml-4 space-y-6">

          <div className="flex items-center gap-3 mb-4">
            <Cog size={30} className="text-primary-dark animate-spin-slow" />
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Settings
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-dark" />
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {Object.entries(prompts).map(([key, value]) => (
                  <div
                    key={key}
                    className="
                      relative rounded-2xl p-[3px] transition-all
                      hover:scale-[1.015] active:scale-[0.985]
                    "
                  >
                    <div
                      className="
                        absolute inset-0 rounded-2xl blur-md opacity-80
                        bg-gradient-to-br from-blue-300 via-cyan-300 to-teal-400
                      "
                    />

                    <div
                      className="
                        absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl 
                        bg-cyan-600 z-20
                      "
                    />

                    <div
                      className="
                        relative z-10 glass rounded-2xl border border-white/30 
                        backdrop-blur-xl p-6 shadow-xl
                      "
                    >
                      <label className="block text-sm font-bold text-text-primary mb-3">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </label>

                      <textarea
                        value={value}
                        onChange={(e) =>
                          setPrompts({ ...prompts, [key]: e.target.value })
                        }
                        rows={5}
                        className="
                          w-full px-4 py-3 rounded-xl bg-surface/40 border 
                          border-border/20 text-text-primary font-mono text-sm 
                          resize-none focus:outline-none focus:ring-2 
                          focus:ring-cyan-400 shadow-inner
                        "
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                <Button variant="outline" onClick={loadPrompts}>
                  Reset
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
