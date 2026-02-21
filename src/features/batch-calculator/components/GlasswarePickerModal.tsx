"use client"

import React, { useState, useMemo, useEffect } from "react"
import { X, Search } from "lucide-react"
import glasswareData from "@/lib/db/dcrental_glassware.json"

export interface GlasswareItem {
  name: string
  capacity_oz: number | null
  price: number
  image_url: string
  category: string
}

interface GlasswarePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: GlasswareItem | null) => void
  selectedGlass?: GlasswareItem | null
}

const CATEGORY_LABELS: Record<string, string> = {
  "all-purpose-barware": "All-Purpose",
  "colored-barware": "Colored Barware",
  "colored-stemware": "Colored Stemware",
  "cordials-and-specialty-glassware": "Cordials & Specialty",
  "pressed-glassware": "Pressed Glass",
  "stemware-patterns": "Stemware",
}

// Flatten JSON into GlasswareItem[]
const ALL_ITEMS: GlasswareItem[] = Object.entries(
  glasswareData as unknown as Record<string, Array<{ name: string; capacity_oz: number | null; price: number; image_url: string }>>
).flatMap(([category, items]) =>
  items.map(item => ({ ...item, category }))
)

const CATEGORIES = Object.keys(
  glasswareData as Record<string, unknown>
)

export function GlasswarePickerModal({ isOpen, onClose, onSelect, selectedGlass }: GlasswarePickerModalProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [pending, setPending] = useState<GlasswareItem | null>(selectedGlass ?? null)

  // Sync pending selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setPending(selectedGlass ?? null)
      setSearch("")
      setActiveCategory("all")
    }
  }, [isOpen, selectedGlass])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const filtered = useMemo(() => {
    return ALL_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === "all" || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Select Glassware</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search glassware…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f54900]/30 focus:border-[#f54900]"
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 pb-3 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeCategory === "all"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              No glassware matches your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((item, idx) => {
                const isSelected = pending?.name === item.name && pending?.category === item.category
                return (
                  <button
                    key={`${item.category}-${idx}`}
                    onClick={() => setPending(isSelected ? null : item)}
                    className={`rounded-xl border-2 overflow-hidden text-left transition-all focus:outline-none ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/30 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.capacity_oz != null ? `${item.capacity_oz} oz · ` : ""}<span className="text-gray-700 font-medium">${item.price.toFixed(2)}/glass</span>
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => { onSelect(null); onClose() }}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => { onSelect(pending ?? null); onClose() }}
            disabled={!pending}
            className="px-5 py-2 bg-[#f54900] text-white text-sm font-semibold rounded-lg hover:bg-[#d13e00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
