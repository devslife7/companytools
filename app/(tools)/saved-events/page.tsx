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

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcoming = events
        .filter(e => new Date(e.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

    const past = events
        .filter(e => new Date(e.eventDate) < now)
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
                Loading…
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Page header */}
                <div className="mb-10">
                    <h1 className="text-xl font-bold text-gray-900">Saved Events</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {events.length === 0
                            ? "No events saved yet"
                            : `${events.length} ${events.length === 1 ? "event" : "events"}${upcoming.length > 0 ? ` · ${upcoming.length} upcoming` : ""}`}
                    </p>
                </div>

                {/* Empty state */}
                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-4 rounded-2xl bg-gray-50 text-gray-200 mb-4">
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">No events saved yet</p>
                        <p className="text-xs text-gray-400 max-w-xs">
                            Events saved from the batch calculator will appear here.
                        </p>
                    </div>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                    <section className="mb-8">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Upcoming</p>
                        <div className="flex flex-col gap-2">
                            {upcoming.map(event => (
                                <EventCard key={event.id} event={event} onDeleted={handleDeleted} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Past */}
                {past.length > 0 && (
                    <section>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Past</p>
                        <div className="flex flex-col gap-2">
                            {past.map(event => (
                                <EventCard key={event.id} event={event} onDeleted={handleDeleted} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    )
}
