"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Save,
    FileDown,
    ChevronDown,
    Settings2,
    Plus,
    X
} from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generateShoppingListPdf, generateBatchCalculationsPdf, generatePdfReport } from "@/features/batch-calculator/lib/pdf-generator"
import type { LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"

// Hooks
import { useCocktails } from "@/features/batch-calculator/hooks"

// Components
import { ReviewDrinkSelection } from "@/features/batch-calculator/components/ReviewDrinkSelection"
import { ReviewBatchSheet } from "@/features/batch-calculator/components/ReviewBatchSheet"
import { BatchingInstructionsModal } from "@/features/batch-calculator/components/BatchingInstructionsModal"
import { RecipeModal } from "@/features/batch-calculator/components/RecipeModal"
import { EditRecipeModal } from "@/features/batch-calculator/components/EditRecipeModal"

// ── Save Event Modal ──────────────────────────────────────────────────────────

interface SaveEventModalProps {
    eventName: string
    onClose: () => void
    onSave: (eventDate: string, eventName: string) => Promise<void>
    saveStatus: "idle" | "saving" | "saved" | "error"
}

function SaveEventModal({ eventName, onClose, onSave, saveStatus }: SaveEventModalProps) {
    const [eventDate, setEventDate] = useState("")
    const [editableName, setEditableName] = useState(eventName || "Untitled Event")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!eventDate) return
        await onSave(eventDate, editableName.trim() || "Untitled Event")
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Save Event</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Name
                        </label>
                        <input
                            id="event-name"
                            type="text"
                            value={editableName}
                            onChange={(e) => setEditableName(e.target.value)}
                            placeholder="Untitled Event"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#f54900] focus:border-[#f54900] outline-none"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                    </div>

                    <div>
                        <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="event-date"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#f54900] focus:border-[#f54900] outline-none"
                        />
                    </div>

                    {saveStatus === "error" && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                            Failed to save event. Please try again.
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!eventDate || saveStatus === "saving"}
                            className="flex-1 px-4 py-2.5 bg-[#f54900] text-white rounded-lg text-sm font-semibold hover:bg-[#d13e00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saveStatus === "saving" ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BatchReviewPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading...</div>}>
            <BatchReviewContent />
        </React.Suspense>
    )
}

function BatchReviewContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const recipeIds = useMemo(() => {
        const ids = searchParams.get("recipes")
        return ids ? ids.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : []
    }, [searchParams])

    const savedServings = useMemo(() => {
        const s = searchParams.get("servings")
        return s ? s.split(",").map(v => parseInt(v, 10)) : []
    }, [searchParams])

    const { cocktails, loading } = useCocktails({ enabled: true })
    const [batches, setBatches] = useState<BatchState[]>([])
    const [measureSystem, setMeasureSystem] = useState<'us' | 'metric'>('us')
    const [liquorPrices, setLiquorPrices] = useState<LiquorPriceMap | undefined>()

    // UI State
    const [viewingBatch, setViewingBatch] = useState<BatchState | null>(null)
    const [viewingRecipe, setViewingRecipe] = useState<BatchState | null>(null)
    const [editingRecipe, setEditingRecipe] = useState<BatchState | null>(null)
    const [eventName, setEventName] = useState("Untitled Event")
    const [bulkServings, setBulkServings] = useState<string>("")
    const [removedIds, setRemovedIds] = useState<number[]>([])

    // Save modal state
    const [saveModalOpen, setSaveModalOpen] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
    const [savedToast, setSavedToast] = useState(false)
    const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Export dropdown state
    const [exportOpen, setExportOpen] = useState(false)
    const exportRef = useRef<HTMLDivElement>(null)

    // Fetch liquor prices
    useEffect(() => {
        fetch('/api/liquor-prices')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setLiquorPrices(data) })
            .catch(err => console.error('Failed to fetch liquor prices:', err))
    }, [])

    // Initialize batches from URL params
    useEffect(() => {
        if (loading || cocktails.length === 0) return
        if (batches.length > 0) return

        const selectedCocktails = cocktails.filter(c => c.id !== undefined && recipeIds.includes(c.id))
        if (selectedCocktails.length === 0) return

        const newBatches: BatchState[] = selectedCocktails.map((cocktail, index) => ({
            id: index + 1,
            selectedCocktail: cocktail,
            editableRecipe: JSON.parse(JSON.stringify(cocktail)),
            servings: (savedServings[index] ?? 0) > 0 ? (savedServings[index] ?? 0) : 100,
            targetLiters: FIXED_BATCH_LITERS
        }))

        setBatches(newBatches)
    }, [cocktails, loading, recipeIds, savedServings, batches.length])

    const handleServingsChange = useCallback((id: number, value: string) => {
        setBatches(prev => prev.map(batch => {
            if (batch.id !== id) return batch
            if (value === "") return { ...batch, servings: "" }
            const num = parseInt(value, 10)
            return { ...batch, servings: isNaN(num) || num < 0 ? "" : num }
        }))
    }, [])

    const activeBatches = useMemo(() => batches.filter(b => !removedIds.includes(b.id)), [batches, removedIds])

    const handleRemoveDrink = useCallback((id: number) => {
        setRemovedIds(prev => {
            if (prev.includes(id)) return prev
            const newRemoved = [...prev, id]

            setBatches(currentBatches => {
                const updatedActive = currentBatches.filter(b => !newRemoved.includes(b.id))
                const newRecipeIds = updatedActive.map(b => b.selectedCocktail?.id).filter(Boolean)
                setTimeout(() => {
                    router.replace(`/batch-calculator/review?recipes=${newRecipeIds.join(",")}`, { scroll: false })
                }, 0)
                return currentBatches
            })

            return newRemoved
        })
    }, [router])

    const handleRestoreDrink = useCallback((id: number) => {
        setRemovedIds(prev => {
            if (!prev.includes(id)) return prev
            const newRemoved = prev.filter(r => r !== id)

            setBatches(currentBatches => {
                const updatedActive = currentBatches.filter(b => !newRemoved.includes(b.id))
                const newRecipeIds = updatedActive.map(b => b.selectedCocktail?.id).filter(Boolean)
                setTimeout(() => {
                    router.replace(`/batch-calculator/review?recipes=${newRecipeIds.join(",")}`, { scroll: false })
                }, 0)
                return currentBatches
            })

            return newRemoved
        })
    }, [router])

    const handleApplyBulkServings = () => {
        const num = parseInt(bulkServings, 10)
        if (!isNaN(num) && num >= 0) {
            setBatches(prev => prev.map(b => removedIds.includes(b.id) ? b : { ...b, servings: num }))
        }
    }


    const handleUpdateBatch = useCallback((updatedBatch: BatchState) => {
        setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b))
        setViewingBatch(prev => prev && prev.id === updatedBatch.id ? updatedBatch : prev)
    }, [])

    const handleSaveEvent = async (eventDate: string, name: string) => {
        setSaveStatus("saving")
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || eventName || "Untitled Event",
                    eventDate,
                    recipes: activeBatches
                        .filter(b => b.selectedCocktail != null)
                        .map(b => ({
                            cocktailId: b.selectedCocktail!.id,
                            cocktailName: b.selectedCocktail!.name,
                            servings: b.servings === "" ? 0 : b.servings,
                        })),
                }),
            })

            if (!res.ok) throw new Error('Save failed')

            setEventName(name || eventName || "Untitled Event")
            setSaveStatus("idle")
            setSaveModalOpen(false)
            setSavedToast(true)
            if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current)
            savedToastTimerRef.current = setTimeout(() => setSavedToast(false), 5000)
        } catch {
            setSaveStatus("error")
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading recipes...</div>
    }

    if (batches.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">No recipes selected</h2>
                <p className="text-gray-500 mb-8">Please select some recipes from the gallery to review.</p>
                <Link href="/batch-calculator" className="px-6 py-3 bg-[#f54900] text-white font-bold rounded-xl hover:bg-[#d13e00] transition-colors">
                    Return to Gallery
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans pb-24 transition-colors duration-200">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-5">
                            <Link
                                href={`/batch-calculator?recipes=${recipeIds.join(",")}`}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Link>

                            <div className="w-px h-6 bg-gray-200" />

                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-bold leading-tight text-gray-900">
                                    {eventName || <span className="text-gray-300 font-normal">New event…</span>}
                                </p>
                                <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-gray-200 self-start">Draft</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative" ref={exportRef}>
                                <div className="flex items-stretch border border-gray-300 rounded-lg shadow-sm overflow-hidden bg-white">
                                    <button
                                        onClick={() => generatePdfReport(activeBatches, liquorPrices)}
                                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Export PDF
                                    </button>
                                    <div className="w-px bg-gray-300" />
                                    <button
                                        onClick={() => setExportOpen(o => !o)}
                                        onBlur={(e) => { if (!exportRef.current?.contains(e.relatedTarget as Node)) setExportOpen(false) }}
                                        className="flex items-center px-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                                        aria-label="More export options"
                                    >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                {exportOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Export individual</p>
                                        <button
                                            onMouseDown={() => { generateBatchCalculationsPdf(activeBatches); setExportOpen(false) }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <FileDown className="w-3.5 h-3.5 text-gray-400" />
                                            Batch Sheets
                                        </button>
                                        <button
                                            onMouseDown={() => { generateShoppingListPdf(activeBatches, liquorPrices); setExportOpen(false) }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <FileDown className="w-3.5 h-3.5 text-gray-400" />
                                            Shopping List
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setSaveStatus("idle"); setSaveModalOpen(true) }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#f54900] text-white rounded-lg text-sm font-semibold hover:bg-[#d13e00] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                <Save className="w-4 h-4" />
                                Save Event
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Drink Selection */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-gray-900">Drink Selection</h2>
                            <span className="text-sm font-medium text-gray-500">{activeBatches.length} items selected</span>
                        </div>

                        {/* Bulk Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <label htmlFor="bulk-servings" className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                        Set Target Servings for all
                                    </label>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative rounded-md shadow-sm w-full sm:w-32">
                                        <input
                                            id="bulk-servings"
                                            className="focus:ring-[#f54900] focus:border-[#f54900] block w-full sm:text-sm border-gray-200 rounded-lg pl-3 pr-10 py-2 font-semibold bg-white text-gray-900 placeholder:text-gray-400"
                                            placeholder="100"
                                            type="number"
                                            value={bulkServings}
                                            onChange={(e) => setBulkServings(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-xs">qty</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleApplyBulkServings}
                                        className="flex items-center justify-center px-4 py-2 bg-[#f54900] text-white rounded-lg text-sm font-medium hover:bg-[#d13e00] transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-gray-100 justify-end sm:justify-start">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-1">Quick Presets:</span>
                                {[50, 100, 150, 200, 250, 300].map(qty => {
                                    const isActive = bulkServings === qty.toString();
                                    return (
                                        <button
                                            key={qty}
                                            onClick={() => {
                                                setBulkServings(qty.toString());
                                            }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm border ${isActive
                                                ? 'bg-[#f54900] text-white border-[#f54900]'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-[#f54900] hover:text-white hover:border-[#f54900]'
                                                }`}
                                        >
                                            {qty}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Batch List */}
                        <div className="space-y-4">
                            {batches.map(batch => (
                                <ReviewDrinkSelection
                                    key={batch.id}
                                    batch={batch}
                                    onServingsChange={handleServingsChange}
                                    onRemove={handleRemoveDrink}
                                    measureSystem="metric"
                                    onViewBatching={setViewingBatch}
                                    onViewRecipe={setViewingRecipe}
                                    onEditRecipe={setEditingRecipe}
                                    isRemoved={removedIds.includes(batch.id)}
                                    onRestore={handleRestoreDrink}
                                />
                            ))}
                        </div>

                        {/* Add Drink Button */}
                        <Link
                            href={`/batch-calculator?recipes=${recipeIds.join(",")}`}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#f54900] hover:border-[#f54900]/50 hover:bg-white transition-all"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            <span className="font-medium">Add Drink to Event</span>
                        </Link>
                    </div>

                    {/* Right Column: Batching Sheet Summary */}
                    <div className="lg:col-span-5 sticky top-24">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
                            <ReviewBatchSheet
                                batches={activeBatches}
                                measureSystem="metric"
                                liquorPrices={liquorPrices}
                                eventName={eventName}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Saved Toast */}
            {savedToast && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50">
                    <span className="text-sm font-medium">Event saved!</span>
                    <Link
                        href="/saved-events"
                        className="text-[#f54900] font-bold text-sm hover:text-[#ff7a45] transition-colors"
                    >
                        View →
                    </Link>
                </div>
            )}

            {/* Save Event Modal */}
            {saveModalOpen && (
                <SaveEventModal
                    eventName={eventName}
                    onClose={() => setSaveModalOpen(false)}
                    onSave={handleSaveEvent}
                    saveStatus={saveStatus}
                />
            )}

            {/* Recipe Modal */}
            {viewingRecipe && (
                <RecipeModal
                    batch={viewingRecipe}
                    onClose={() => setViewingRecipe(null)}
                />
            )}

            {/* Batching Modal */}
            {viewingBatch && (
                <BatchingInstructionsModal
                    batch={viewingBatch}
                    onClose={() => setViewingBatch(null)}
                    onUpdate={handleUpdateBatch}
                />
            )}

            {/* Edit Recipe Modal */}
            {editingRecipe && (
                <EditRecipeModal
                    isOpen={true}
                    mode="edit"
                    onClose={() => setEditingRecipe(null)}
                    recipe={editingRecipe.selectedCocktail}
                    cocktailId={undefined}
                    onSave={(updatedRecipe) => {
                        handleUpdateBatch({
                            ...editingRecipe,
                            selectedCocktail: updatedRecipe
                        })
                        setEditingRecipe(null)
                    }}
                />
            )}
        </div>
    )
}
