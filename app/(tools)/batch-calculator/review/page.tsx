"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Save,
    Settings2,
    Plus
} from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport } from "@/features/batch-calculator/lib/pdf-generator"
import type { LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"

// Hooks
import { useCocktails } from "@/features/batch-calculator/hooks"

// Components
// Components
import { ReviewDrinkSelection } from "@/features/batch-calculator/components/ReviewDrinkSelection"
import { ReviewBatchSheet } from "@/features/batch-calculator/components/ReviewBatchSheet"
import { BatchingInstructionsModal } from "@/features/batch-calculator/components/BatchingInstructionsModal"
import { RecipeModal } from "@/features/batch-calculator/components/RecipeModal"

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

    const { cocktails, loading } = useCocktails({ enabled: true })
    const [batches, setBatches] = useState<BatchState[]>([])
    const [measureSystem, setMeasureSystem] = useState<'us' | 'metric'>('us')
    const [liquorPrices, setLiquorPrices] = useState<LiquorPriceMap | undefined>()

    // UI State
    const [viewingBatch, setViewingBatch] = useState<BatchState | null>(null)
    const [viewingRecipe, setViewingRecipe] = useState<BatchState | null>(null)
    const [eventName, setEventName] = useState("Untitled Event")
    const [bulkServings, setBulkServings] = useState<string>("")
    const [undoData, setUndoData] = useState<{ batch: BatchState, index: number } | null>(null)
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Fetch liquor prices
    useEffect(() => {
        fetch('/api/liquor-prices')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setLiquorPrices(data) })
            .catch(err => console.error('Failed to fetch liquor prices:', err))
    }, [])

    // ... [Rest of initialization logic is same, will be preserved by replacement] ...

    // Initialize batches from URL params
    useEffect(() => {
        if (loading || cocktails.length === 0) return
        if (batches.length > 0) return // Prevent overwriting user edits

        const selectedCocktails = cocktails.filter(c => c.id !== undefined && recipeIds.includes(c.id))

        if (selectedCocktails.length === 0) return

        // Create initial batch state
        const newBatches: BatchState[] = selectedCocktails.map((cocktail, index) => ({
            id: index + 1, // Simple local ID for this session
            selectedCocktail: cocktail,
            editableRecipe: JSON.parse(JSON.stringify(cocktail)),
            servings: "" as const, // Default to empty/0
            targetLiters: FIXED_BATCH_LITERS
        }))

        setBatches(newBatches)
    }, [cocktails, loading, recipeIds, batches.length])

    const handleServingsChange = useCallback((id: number, value: string) => {
        setBatches(prev => prev.map(batch => {
            if (batch.id !== id) return batch

            if (value === "") {
                return { ...batch, servings: "" }
            }

            const num = parseInt(value, 10)
            return { ...batch, servings: isNaN(num) || num < 0 ? "" : num }
        }))
    }, [])

    const handleRemoveDrink = useCallback((id: number) => {
        let removed: { batch: BatchState; index: number } | null = null

        setBatches(prev => {
            const index = prev.findIndex(b => b.id === id)
            if (index === -1) return prev
            removed = { batch: prev[index], index }
            const newBatches = prev.filter(b => b.id !== id)
            const newRecipeIds = newBatches.map(b => b.selectedCocktail?.id).filter(Boolean)
            router.replace(`/batch-calculator/review?recipes=${newRecipeIds.join(",")}`, { scroll: false })
            return newBatches
        })

        if (removed) {
            setUndoData(removed)
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
            undoTimerRef.current = setTimeout(() => setUndoData(null), 5000)
        }
    }, [router])

    const handleUndo = useCallback(() => {
        if (!undoData) return

        setBatches(prev => {
            const newBatches = [...prev]
            // Re-insert at original index
            if (undoData.index >= 0 && undoData.index <= newBatches.length) {
                newBatches.splice(undoData.index, 0, undoData.batch)
            } else {
                newBatches.push(undoData.batch)
            }

            // Sync with URL
            const newRecipeIds = newBatches.map(b => b.selectedCocktail?.id).filter(Boolean)
            const newUrl = `/batch-calculator/review?recipes=${newRecipeIds.join(",")}`
            router.replace(newUrl, { scroll: false })

            return newBatches
        })
        setUndoData(null)
    }, [undoData, router])

    const handleApplyBulkServings = () => {
        const num = parseInt(bulkServings, 10)
        if (!isNaN(num) && num >= 0) {
            setBatches(prev => prev.map(b => ({ ...b, servings: num })))
        }
    }

    const handlePrint = () => {
        generatePdfReport(batches, liquorPrices)
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
                        <div className="flex items-center gap-4">
                            <Link href={`/batch-calculator?recipes=${recipeIds.join(",")}`}>
                                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 text-gray-500 border border-dashed border-gray-300 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </div>
                            </Link>

                            <div className="flex flex-col">
                                <input
                                    className="block w-full text-lg font-bold leading-tight bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-[#f54900] focus:ring-0 p-0 placeholder-gray-400 transition-colors text-gray-900"
                                    placeholder="Untitled Event"
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                />
                                <p className="text-xs flex items-center gap-1 mt-0.5">
                                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border border-gray-200">Draft</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
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
                            <span className="text-sm font-medium text-gray-500">{batches.length} items selected</span>
                        </div>

                        {/* Bulk Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                />
                            ))}
                        </div>

                        {/* Add Drink Button */}
                        <Link
                            href={`/batch-calculator?recipes=${recipeIds.join(",")}`} // Preserve current selection? Or just back to gallery
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
                                batches={batches}
                                measureSystem="metric"
                                liquorPrices={liquorPrices}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Undo Toast */}
            {undoData && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50">
                    <span className="text-sm font-medium">Drink removed</span>
                    <button
                        onClick={handleUndo}
                        className="text-[#f54900] font-bold text-sm hover:text-[#ff7a45] transition-colors uppercase tracking-wide"
                    >
                        Undo
                    </button>
                </div>
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
                />
            )}
        </div>
    )
}
