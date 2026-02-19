"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, ExternalLink } from "lucide-react"

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

    const handleDelete = async () => {
        if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" })
            if (res.ok) {
                onDeleted(event.id)
            } else {
                alert("Failed to delete event. Please try again.")
                setDeleting(false)
            }
        } catch {
            alert("Failed to delete event. Please try again.")
            setDeleting(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{formattedEventDate}</p>
                </div>
                <span className="flex-shrink-0 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                    {event.recipes.length} {event.recipes.length === 1 ? "cocktail" : "cocktails"}
                </span>
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
                        onClick={handleDelete}
                        disabled={deleting}
                        aria-label="Delete event"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                        href={`/batch-calculator/review?recipes=${recipeIds}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Re-open
                    </Link>
                </div>
            </div>
        </div>
    )
}
