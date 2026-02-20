"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Trash2, ExternalLink, FileText, MoreHorizontal, Loader2 } from "lucide-react"
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
    const [showOptions, setShowOptions] = useState(false)

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletePassword, setDeletePassword] = useState("")
    const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null)

    const formattedEventDate = new Date(event.eventDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    })

    const formattedCreatedAt = new Date(event.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })

    const recipeIds = event.recipes.map(r => r.cocktailId).join(",")
    const servings = event.recipes.map(r => r.servings).join(",")

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
                const errorData = await res.json().catch(() => ({ error: 'Failed to delete event' }))
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
            const cocktailsRes = await fetch('/api/cocktails')

            if (!cocktailsRes.ok) throw new Error("Failed to fetch cocktail data")

            const cocktailsData = await cocktailsRes.json()
            const allCocktails: CocktailRecipe[] = cocktailsData.cocktails || []

            // Map event recipes to full cocktail data
            const batches: BatchState[] = event.recipes.map((r, index): BatchState | null => {
                const cocktail = allCocktails.find(c => c.id === r.cocktailId)
                if (!cocktail) return null

                return {
                    id: index + 1,
                    selectedCocktail: cocktail,
                    editableRecipe: JSON.parse(JSON.stringify(cocktail)) as CocktailRecipe, // Create a deep copy
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{formattedEventDate}</p>
                </div>

                {/* Options Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showOptions && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-10 overflow-hidden">
                            <button
                                onClick={() => {
                                    setShowOptions(false)
                                    setShowDeleteConfirm(true)
                                    setDeletePassword("")
                                    setDeletePasswordError(null)
                                }}
                                disabled={deleting}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center justify-between disabled:opacity-50"
                            >
                                Delete <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipe list */}
            <ul className="space-y-1.5">
                {event.recipes.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium truncate">{r.cocktailName}</span>
                        {r.servings > 0 && (
                            <span className="text-gray-400 font-normal ml-2 flex-shrink-0">× {r.servings}</span>
                        )}
                    </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                <p className="text-xs text-gray-400">Saved {formattedCreatedAt}</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInvoice}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {generating ? "..." : "Invoice"}
                    </button>
                    <Link
                        href={`/batch-calculator/review?recipes=${recipeIds}&servings=${servings}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Re-open
                    </Link>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="bg-gradient-to-br from-white via-gray-50/90 to-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-200/80 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete &quot;{event.name}&quot;? This action cannot be undone.
                        </p>

                        {/* Password Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Enter password to confirm deletion:
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => {
                                    setDeletePassword(e.target.value)
                                    setDeletePasswordError(null)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && deletePassword.trim()) {
                                        handleDelete()
                                    }
                                }}
                                placeholder="Enter password"
                                className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-gray-900 text-base md:text-base min-h-[44px] md:min-h-0 transition-colors"
                                autoFocus
                                inputMode="text"
                            />
                            {deletePasswordError && (
                                <p className="mt-2 text-sm text-red-600">{deletePasswordError}</p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setDeletePassword("")
                                    setDeletePasswordError(null)
                                }}
                                disabled={deleting}
                                className="w-full sm:w-auto px-4 py-3 md:py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 min-h-[44px] md:min-h-0"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting || !deletePassword.trim()}
                                className="w-full sm:w-auto px-4 py-3 md:py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
