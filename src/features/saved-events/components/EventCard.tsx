"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Trash2, ExternalLink, FileText, Loader2, MoreHorizontal } from "lucide-react"
import { generateClientInvoicePdf } from "@/features/batch-calculator/lib/pdf-generator"
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import type { BatchState, CocktailRecipe } from "@/features/batch-calculator/types"

interface EventRecipe {
    cocktailId: number
    cocktailName: string
    servings: number
}

interface SavedEventData {
    id: number
    name: string
    eventDate: string
    recipes: EventRecipe[]
    createdAt: string
}

interface EventCardProps {
    event: SavedEventData
    onDeleted: (id: number) => void
}

export function EventCard({ event, onDeleted }: EventCardProps) {
    const [deleting, setDeleting] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletePassword, setDeletePassword] = useState("")
    const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const eventDate = new Date(event.eventDate)
    const month = eventDate.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()
    const day = eventDate.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" })
    const year = eventDate.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" })

    const recipeIds = event.recipes.map(r => r.cocktailId).join(",")
    const servings = event.recipes.map(r => r.servings).join(",")

    const recipeSummary = event.recipes
        .map(r => r.servings > 0 ? `${r.cocktailName} ×${r.servings}` : r.cocktailName)
        .join(" · ")

    const handleDelete = async () => {
        if (!deletePassword.trim()) {
            setDeletePasswordError("Password is required.")
            return
        }
        setDeletePasswordError(null)
        setDeleting(true)
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: deletePassword.trim() })
            })
            if (res.ok) {
                onDeleted(event.id)
                setShowDeleteConfirm(false)
            } else {
                const errorData = await res.json().catch(() => ({ error: "Failed to delete event" }))
                setDeletePasswordError(errorData.error || "Failed to delete event. Please try again.")
            }
        } catch {
            setDeletePasswordError("Failed to delete event. Please try again.")
        } finally {
            setDeleting(false)
        }
    }

    const handleInvoice = async () => {
        setGenerating(true)
        try {
            const cocktailsRes = await fetch("/api/cocktails")
            if (!cocktailsRes.ok) throw new Error("Failed to fetch cocktail data")

            const cocktailsData = await cocktailsRes.json()
            const allCocktails: CocktailRecipe[] = cocktailsData.cocktails || []

            const batches: BatchState[] = event.recipes.map((r, index): BatchState | null => {
                const cocktail = allCocktails.find(c => c.id === r.cocktailId)
                if (!cocktail) return null
                return {
                    id: index + 1,
                    selectedCocktail: cocktail,
                    editableRecipe: JSON.parse(JSON.stringify(cocktail)) as CocktailRecipe,
                    servings: r.servings,
                    targetLiters: FIXED_BATCH_LITERS
                }
            }).filter((b): b is BatchState => b !== null)

            if (batches.length === 0) {
                alert("Could not find recipe data for this event. The recipes may have been deleted.")
                return
            }

            generateClientInvoicePdf(batches, event)
        } catch (error) {
            console.error("Error generating invoice:", error)
            alert("Failed to generate invoice. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <>
            <div className="group flex items-center gap-3 sm:gap-5 px-4 sm:px-5 py-3 sm:py-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                {/* Date block */}
                <div className="flex-shrink-0 w-11 text-center select-none">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#f54900] leading-none">{month}</div>
                    <div className="text-[22px] font-bold text-gray-900 leading-tight tabular-nums">{day}</div>
                    <div className="text-[10px] text-gray-400 leading-none">{year}</div>
                </div>

                {/* Divider */}
                <div className="w-px h-9 bg-gray-100 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{event.name}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{recipeSummary}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleInvoice}
                        disabled={generating}
                        className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{generating ? "…" : "Invoice"}</span>
                    </button>
                    <Link
                        href={`/batch-calculator/review?recipes=${recipeIds}&servings=${servings}&name=${encodeURIComponent(event.name)}&date=${event.eventDate}`}
                        className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Re-open</span>
                    </Link>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="More options"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-20">
                                <button
                                    onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); setDeletePassword(""); setDeletePasswordError(null) }}
                                    disabled={deleting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete event?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            &quot;{event.name}&quot; will be permanently removed.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Password to confirm
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(null) }}
                                onKeyDown={(e) => { if (e.key === "Enter" && deletePassword.trim()) handleDelete() }}
                                placeholder="Enter password"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                                autoFocus
                            />
                            {deletePasswordError && (
                                <p className="mt-2 text-xs text-red-500">{deletePasswordError}</p>
                            )}
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeletePasswordError(null) }}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting || !deletePassword.trim()}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                                ) : (
                                    <><Trash2 className="w-3.5 h-3.5" /> Delete</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
