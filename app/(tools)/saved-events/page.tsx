"use client"

import { useState, useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { EventCard } from "@/features/saved-events/components/EventCard"

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

export default function SavedEventsPage() {
    const [events, setEvents] = useState<SavedEventData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/events")
            .then(res => res.ok ? res.json() : { events: [] })
            .then(data => setEvents(data.events ?? []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false))
    }, [])

    const handleDeleted = (id: number) => {
        setEvents(prev => prev.filter(e => e.id !== id))
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
                Loading saved events…
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Page header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-2.5 rounded-xl bg-[#f54900]/10 text-[#f54900]">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Saved Events</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {events.length > 0
                                ? `${events.length} saved ${events.length === 1 ? "event" : "events"}`
                                : "No saved events yet"}
                        </p>
                    </div>
                </div>

                {/* Empty state */}
                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-4 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                            <CalendarDays className="w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">No saved events</h2>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Events you save from the batch calculator review page will appear here.
                        </p>
                    </div>
                )}

                {/* Events grid */}
                {events.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {events.map(event => (
                            <EventCard key={event.id} event={event} onDeleted={handleDeleted} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
