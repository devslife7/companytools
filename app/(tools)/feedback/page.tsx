"use client"

import { useState, useEffect, useCallback } from "react"
import { Bug, Lightbulb, Send, Clock, ChevronDown } from "lucide-react"

type FeedbackType = "bug" | "improvement"

interface FeedbackEntry {
  id: number
  type: FeedbackType
  page: string
  message: string
  createdAt: string
}

const PAGES = [
  "Batch Calculator — Gallery",
  "Batch Calculator — Review",
  "Saved Events",
  "Sidebar / Navigation",
  "Other",
]

const TYPE_CONFIG = {
  bug: {
    label: "Bug Report",
    icon: Bug,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    activeBg: "bg-red-600",
    activeText: "text-white",
    badge: "bg-red-100 text-red-700",
  },
  improvement: {
    label: "Improvement",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    badge: "bg-amber-100 text-amber-700",
  },
} as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("bug")
  const [page, setPage] = useState(PAGES[0])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null)
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback")
      const data = await res.json()
      setEntries(data.feedback ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, page, message: message.trim() }),
      })
      if (!res.ok) throw new Error()
      showToast("success", "Thanks! Your feedback was submitted.")
      setMessage("")
      fetchFeedback()
    } catch {
      showToast("error", "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const config = TYPE_CONFIG[type]

  return (
    <div className="min-h-screen font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.kind === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">
          Report a bug or suggest an improvement for any tool.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {/* Type toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {(["bug", "improvement"] as FeedbackType[]).map((t) => {
                const c = TYPE_CONFIG[t]
                const Icon = c.icon
                const isActive = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      isActive
                        ? `${c.activeBg} ${c.activeText} border-transparent shadow-sm`
                        : `bg-white ${c.color} ${c.border} hover:${c.bg}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Page selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Which page?
            </label>
            <div className="relative">
              <select
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                {PAGES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {type === "bug" ? "Describe the bug" : "Describe the improvement"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? "What happened? What did you expect to happen?"
                  : "What would make this tool better?"
              }
              rows={5}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#f54900] text-white rounded-lg text-sm font-semibold hover:bg-[#d13e00] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting…" : "Submit Feedback"}
          </button>
        </form>

        {/* Submissions list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Previous Submissions
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-xl">
              <div className="p-4 rounded-2xl bg-gray-50 text-gray-300 mb-3">
                <Send className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No feedback yet</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Be the first to submit a bug report or improvement suggestion.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const c = TYPE_CONFIG[entry.type as FeedbackType] ?? TYPE_CONFIG.bug
                const Icon = c.icon
                return (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                          <Icon className="w-3 h-3" />
                          {c.label}
                        </span>
                        <span className="text-xs text-gray-400">{entry.page}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{entry.message}</p>
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
