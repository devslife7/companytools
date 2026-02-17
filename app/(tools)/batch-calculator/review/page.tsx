"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Printer, Download, ShoppingCart } from "lucide-react"
import Link from "next/link"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport, generateShoppingListPdf } from "@/features/batch-calculator/lib/pdf-generator"
import type { LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"

// Hooks
import { useCocktails } from "@/features/batch-calculator/hooks"

// Components
import { ReviewDrinkSelection } from "@/features/batch-calculator/components/ReviewDrinkSelection"
import { ReviewBatchSheet } from "@/features/batch-calculator/components/ReviewBatchSheet"

export default function BatchReviewPage() {
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
                <Link href="/batch-calculator" className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors">
                    Return to Gallery
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/batch-calculator"
                            className="p-2.5 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Summer Gala 2024</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                                    📅 Oct 12, 2024
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Sheet
                        </button>
                        <button className="px-4 py-2.5 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Config
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Drink Selection */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold text-gray-900">Drink Selection</h2>
                            <span className="text-sm font-medium text-gray-500">{batches.length} items selected</span>
                        </div>

                        <div className="space-y-4">
                            {batches.map(batch => (
                                <ReviewDrinkSelection
                                    key={batch.id}
                                    batch={batch}
                                    onServingsChange={handleServingsChange}
                                />
                            ))}
                        </div>

                        <div className="mt-8 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group h-32">
                            <div className="flex items-center gap-3 text-gray-400 group-hover:text-brand-primary transition-colors">
                                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                    <span className="text-xl font-light leading-none mb-0.5">+</span>
                                </div>
                                <span className="font-bold text-lg">Add Drink to Event</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Batching Sheet Summary */}
                    <div className="lg:col-span-5 sticky top-28">
                        <div className="bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <div className="w-5 h-5 text-orange-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M15 22a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4" /><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2Z" /><path d="M4 11h2" /><path d="M4 17h2" /><path d="M8 11h.01" /><path d="M8 17h.01" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 leading-tight">Batching Sheet</h2>
                                        <p className="text-xs text-gray-500 font-medium">Real-time ingredient totals</p>
                                    </div>
                                </div>

                                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setMeasureSystem('us')}
                                        className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${measureSystem === 'us' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        US
                                    </button>
                                    <button
                                        onClick={() => setMeasureSystem('metric')}
                                        className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${measureSystem === 'metric' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        Metric
                                    </button>
                                </div>
                            </div>

                            <ReviewBatchSheet batches={batches} measureSystem={measureSystem} />

                            <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex gap-3 flex-shrink-0">
                                <button className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => generateShoppingListPdf(batches, liquorPrices)}
                                    className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Order List
                                </button>
                            </div>

                            <div className="px-5 py-4 bg-blue-50/50 border-t border-blue-100 flex-shrink-0">
                                <div className="flex gap-3">
                                    <div className="mt-0.5 min-w-[20px]">
                                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">i</div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-blue-900 mb-0.5">Dilution Factor</h4>
                                        <p className="text-[10px] sm:text-xs text-blue-700/80 leading-relaxed font-medium">
                                            Remember to account for ice melt! Pre-batched cocktails should include 20-25% water if serving without shaking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
