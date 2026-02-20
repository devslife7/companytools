import { useMemo, useCallback, useState } from "react"
import { FileText, DollarSign, ShoppingCart, Info } from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import type { LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"
import { formatNumber, CONVERSION_FACTORS, calculateSingleServingLiquidVolumeML, combineAmountAndUnit, parseAmount } from "@/features/batch-calculator/lib/calculations"
import { generateOrderListPdf, generateClientInvoicePdf } from "@/features/batch-calculator/lib/pdf-generator"

interface ReviewBatchSheetProps {
    batches: BatchState[]
    measureSystem: 'us' | 'metric'
    liquorPrices?: LiquorPriceMap
    eventName?: string
}

export function ReviewBatchSheet({ batches, measureSystem, liquorPrices, eventName }: ReviewBatchSheetProps) {
    // Misc cost % (default 15%, persisted in localStorage)
    const [miscCostPercent, setMiscCostPercent] = useState<number>(() => {
        const saved = localStorage.getItem("batchMiscCostPercent")
        return saved ? Number(saved) : 15
    })

    const handleMiscCostChange = (val: number) => {
        const clamped = Math.max(0, Math.min(200, val))
        setMiscCostPercent(clamped)
        localStorage.setItem("batchMiscCostPercent", String(clamped))
    }

    // Helper: look up bottle price for an ingredient
    const lookupPrice = useCallback((name: string): { price: number; bottleSizeMl: number } | null => {
        if (!liquorPrices) return null
        const lower = name.toLowerCase().trim()
        if (liquorPrices[lower]) return liquorPrices[lower]
        for (const [priceName, entry] of Object.entries(liquorPrices)) {
            if (lower.includes(priceName) || priceName.includes(lower)) return entry
        }
        return null
    }, [liquorPrices])

    // Calculate per-serving liquor cost for a cocktail
    const calculatePerServingCost = useCallback((ingredients: { name: string; amount: string; unit?: string | null }[]): number => {
        let cost = 0
        for (const ing of ingredients) {
            const priceEntry = lookupPrice(ing.name)
            if (!priceEntry) continue

            const amountStr = ing.unit ? combineAmountAndUnit(ing.amount, ing.unit) : ing.amount
            const { baseAmount, unit, type } = parseAmount(amountStr)

            if (type !== 'liquid') continue

            const mlPerUnit = CONVERSION_FACTORS[unit] || 0
            const mlPerServing = baseAmount * mlPerUnit
            const pricePerMl = priceEntry.price / priceEntry.bottleSizeMl

            cost += mlPerServing * pricePerMl
        }
        return cost
    }, [lookupPrice])

    // Calculate financials
    const financials = useMemo(() => {
        let totalRevenue = 0
        let totalAdjustedCost = 0
        let totalBatches = 0

        const batchFinancials = batches.map(batch => {
            const servings = typeof batch.servings === 'number' ? batch.servings : 0
            if (!batch.selectedCocktail || servings <= 0) return null

            const menuPrice = batch.selectedCocktail.menuPrice || 0
            const revenue = menuPrice * servings

            const unitLiquorCost = calculatePerServingCost(batch.selectedCocktail.ingredients)
            const adjustedUnitCost = unitLiquorCost * (1 + miscCostPercent / 100)
            const cost = adjustedUnitCost * servings

            const singleML = calculateSingleServingLiquidVolumeML(batch.selectedCocktail)
            // Round up to 1 decimal: ceil to nearest 0.1 batch
            const batchCount = singleML > 0 ? Math.ceil((servings * singleML) / 2000) / 10 : 0

            const margin = menuPrice > 0 ? ((menuPrice - adjustedUnitCost) / menuPrice) * 100 : 0

            totalRevenue += revenue
            totalAdjustedCost += cost
            totalBatches += batchCount

            return {
                id: batch.id,
                name: batch.selectedCocktail.name,
                servings,
                revenue,
                cost,
                unitCost: adjustedUnitCost,
                menuPrice,
                margin,
                batchCount,
            }
        }).filter(Boolean) as {
            id: number; name: string; servings: number; revenue: number; cost: number;
            unitCost: number; menuPrice: number; margin: number; batchCount: number
        }[]

        const profit = totalRevenue - totalAdjustedCost
        const overallMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

        return {
            batches: batchFinancials,
            totalRevenue,
            totalCost: totalAdjustedCost,
            totalBatches,
            profit,
            overallMargin,
        }
    }, [batches, calculatePerServingCost, miscCostPercent])

    const getMarginBadgeClass = (margin: number) =>
        margin >= 40 ? "text-green-600 bg-green-50"
            : margin >= 20 ? "text-yellow-600 bg-yellow-50"
                : "text-red-600 bg-red-50"

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <DollarSign className="w-5 h-5 text-[#f54900]" />
                        Financial Summary
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Event cost and revenue breakdown</p>
                </div>

                {/* Misc Costs Adjuster */}
                <div>
                    <div className="flex items-center gap-1 justify-end mb-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Misc. Costs</span>
                        <div className="relative group">
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-5 w-52 bg-gray-800 text-white text-[10px] rounded p-2 hidden group-hover:block z-10 leading-tight shadow-lg">
                                Accounts for non-liquor ingredients (juices, syrups, garnishes)
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleMiscCostChange(miscCostPercent - 5)}
                            className="w-7 h-7 sm:w-5 sm:h-5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center leading-none"
                        >−</button>
                        <span className="font-mono font-bold text-sm text-gray-900 w-10 text-center">{miscCostPercent}%</span>
                        <button
                            onClick={() => handleMiscCostChange(miscCostPercent + 5)}
                            className="w-7 h-7 sm:w-5 sm:h-5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center leading-none"
                        >+</button>
                    </div>
                </div>
            </div>

            {/* Recipe Pricing Breakdown */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50/50 overflow-y-auto flex-1">
                <div className="space-y-4">
                    {financials.batches.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic text-xs">
                            Add servings to drinks to see financial breakdown
                        </div>
                    ) : (
                        financials.batches.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`${idx > 0 ? 'border-t border-gray-200 pt-4' : ''} ${item.margin < 20 && item.menuPrice > 0 ? 'bg-red-50 rounded-lg p-2 -mx-2' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                                    <span className="text-[10px] text-gray-400 font-medium">{item.servings} servings</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Price (Ea)</span>
                                        <span className="font-mono font-bold text-gray-900 text-xs">
                                            ${formatNumber(item.menuPrice, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Cost (Ea)</span>
                                        <span className="font-mono font-bold text-gray-900 text-xs">
                                            {item.unitCost > 0 ? `$${formatNumber(item.unitCost, 2)}` : <span className="text-gray-400">--</span>}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Revenue</span>
                                        <span className="font-mono font-bold text-green-600 text-xs">
                                            ${formatNumber(item.revenue, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Margin</span>
                                        {item.menuPrice > 0 ? (
                                            <span className={`font-mono font-bold text-xs px-1 rounded ${getMarginBadgeClass(item.margin)}`}>
                                                {formatNumber(item.margin, 1)}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">--</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Event Financial Summary */}
            <div className="bg-[#f54900]/[0.03] p-6 border-t border-gray-200 rounded-b-xl">
                <div className="mb-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Event Ingredient Cost</span>
                            <span className="text-base font-mono font-medium text-gray-900">${formatNumber(financials.totalCost, 2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Event Revenue (Charge)</span>
                            <span className="text-base font-mono font-medium text-gray-900">${formatNumber(financials.totalRevenue, 2)}</span>
                        </div>
                    </div>

                    <div className="w-full h-px bg-[#f54900]/20 mt-4 mb-4"></div>

                    <div className="flex justify-between items-start">
                        <span className="text-2xl font-bold text-gray-900">Projected Profit</span>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">${formatNumber(financials.profit, 2)}</div>
                            <div className="text-[10px] font-bold text-green-600 uppercase mt-1">
                                {financials.totalRevenue > 0
                                    ? `${formatNumber(financials.overallMargin, 1)}% Margin`
                                    : '0% Margin'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-[#f54900]/10 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => generateClientInvoicePdf(batches, {
                            id: Date.now(),
                            name: eventName || "Untitled Event",
                            eventDate: new Date().toISOString(),
                        })}
                        className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 transition-colors text-gray-900"
                    >
                        <FileText className="text-sm mr-1 w-4 h-4" /> Invoice
                    </button>
                    <button
                        onClick={() => generateOrderListPdf(batches, liquorPrices, eventName)}
                        className="flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-xs font-medium text-white bg-[#f54900] hover:bg-[#d13e00] transition-colors shadow-sm"
                    >
                        <ShoppingCart className="text-sm mr-1 w-4 h-4" /> Order List
                    </button>
                </div>
            </div>
        </div>
    )
}
