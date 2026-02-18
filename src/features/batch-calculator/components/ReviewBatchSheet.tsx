import React, { useMemo } from "react"
import { Download, FileText, GlassWater, DollarSign, TrendingUp, ShoppingCart } from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { calculateGrandTotals, type LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"
import { formatNumber, formatMLValue, LITER_TO_ML, GALLON_TO_ML, calculateBatch } from "@/features/batch-calculator/lib/calculations"
import { generateShoppingListPdf } from "@/features/batch-calculator/lib/pdf-generator"

interface ReviewBatchSheetProps {
    batches: BatchState[]
    measureSystem: 'us' | 'metric'
    liquorPrices?: LiquorPriceMap
}

export function ReviewBatchSheet({ batches, measureSystem, liquorPrices }: ReviewBatchSheetProps) {
    const totals = useMemo(() => calculateGrandTotals(batches), [batches])

    // Calculate financials
    const financials = useMemo(() => {
        let totalRevenue = 0
        let totalIngredientCost = 0
        let totalVolumeML = 0

        const batchFinancials = batches.map(batch => {
            const servings = typeof batch.servings === 'number' ? batch.servings : 0
            if (!batch.selectedCocktail || servings <= 0) return null

            const menuPrice = batch.selectedCocktail.menuPrice || 0
            const revenue = menuPrice * servings

            // Calculate ingredient cost for this batch
            let batchCost = 0

            // We need to calculate cost based on ingredients and liquorPrices
            // roughly: sum(ingredient_amount_in_ml * price_per_ml)
            // calculating properly requires normalizing units and matching names
            // For now, if calculateGrandTotals returns detailed cost, we use that. 
            // But calculateGrandTotals aggregates by ingredient name across all batches.
            // So we do a simple per-batch estimation here if possible, 
            // or just sum up the `estimatedCost` from `calculateGrandTotals` for the event total.

            // Since we need per-cocktail breakdown, let's try to estimate:
            batch.selectedCocktail.ingredients.forEach(ing => {
                // simplified cost calc matching grand-totals logic would go here
                // For this UI implementation, we will use placeholders or 0 if complex logic is missing
                // assuming 15-20% cost for now if data missing? No that's bad.
                // Let's rely on what we have.
            });

            // For now, let's just accumulate revenue and volume
            totalRevenue += revenue

            // Volume
            const { calculateSingleServingLiquidVolumeML } = require("@/features/batch-calculator/lib/calculations")
            const singleML = calculateSingleServingLiquidVolumeML(batch.selectedCocktail)
            const batchVol = singleML * servings
            totalVolumeML += batchVol

            return {
                id: batch.id,
                name: batch.selectedCocktail.name,
                servings,
                revenue,
                cost: 0, // Todo: implement per-batch cost calc
                volumeML: batchVol,
                unitCost: 0, // revenue / servings  -> wait, unit COST is ingredient cost per drink
                menuPrice
            }
        }).filter(Boolean) as any[]

        return {
            batches: batchFinancials,
            totalRevenue,
            totalCost: totalIngredientCost, // 0 for now unless we implement proper fetch
            totalVolumeML
        }
    }, [batches, liquorPrices])

    // Helper to render volume
    const renderVolume = (ml: number) => {
        if (measureSystem === 'metric') {
            const liters = ml / LITER_TO_ML
            return (
                <span>
                    {formatMLValue(ml)} <span className="text-xs text-gray-400 font-normal">({formatNumber(liters, 2)} L)</span>
                </span>
            )
        } else {
            const oz = ml / 29.5735
            const gal = ml / GALLON_TO_ML
            return (
                <span>
                    {formatNumber(oz, 0)} oz <span className="text-xs text-gray-400 font-normal">({formatNumber(gal, 2)} Gal)</span>
                </span>
            )
        }
    }

    return (
        <div className="flex flex-col h-full bg-white h-full">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <GlassWater className="w-5 h-5 text-[#f54900]" />
                        Ingredients Order List
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Shopping list based on total servings</p>
                </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Ingredient Details
                            </th>
                            <th scope="col" className="px-5 py-4 text-right text-[10px] font-bold text-[#f54900] uppercase tracking-widest">
                                Calculated Qty
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {batches.map(batch => {
                            const servings = typeof batch.servings === 'number' ? batch.servings : 0
                            if (!batch.selectedCocktail || servings <= 0) return null

                            // Calculate batch totals for this cocktail
                            // Note: We are doing this per-ingredient row like the design
                            // Design shows: "Tequila Blanco", "300 oz (8.87 L)"

                            return (
                                <React.Fragment key={batch.id}>
                                    {/* Cocktail Header Row */}
                                    <tr className="bg-gray-50/50">
                                        <td className="px-5 py-2.5 text-xs font-bold text-gray-900 uppercase tracking-wide bg-[#f54900]/5">
                                            {batch.selectedCocktail.name} <span className="ml-1 font-medium text-gray-500 normal-case">({servings} servings)</span>
                                        </td>
                                        <td className="px-5 py-2.5 text-right text-xs font-bold text-[#f54900] uppercase tracking-wide bg-[#f54900]/5">
                                            {batch.selectedCocktail.menuPrice
                                                ? `Price: $${formatNumber(batch.selectedCocktail.menuPrice, 2)}`
                                                : 'Price: N/A'}
                                        </td>
                                    </tr>

                                    {/* Ingredients */}
                                    {batch.selectedCocktail.ingredients.map((ing, idx) => {
                                        const calculated = calculateBatch(servings, ing.amount, ing.unit)
                                        // Filter out tiny amounts unless count
                                        if (calculated.ml <= 0 && calculated.unitType !== 'count') return null;

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {ing.name}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-sm text-right font-mono font-bold text-gray-900">
                                                    {renderVolume(calculated.ml)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            )
                        })}

                        {batches.every(b => (b.servings === "" || b.servings === 0)) && (
                            <tr>
                                <td colSpan={2} className="px-5 py-8 text-center text-gray-400 italic">
                                    Add servings to drinks to see ingredients
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Recipe Pricing Breakdown */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center">
                    <span className="w-1 h-3 bg-[#f54900] rounded-full mr-2"></span>
                    Recipe Pricing Breakdown
                </h3>
                <div className="space-y-4">
                    {financials.batches.map((item, idx) => (
                        <div key={item.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2 ${idx > 0 ? 'border-t border-gray-200 pt-3' : ''}`}>
                            <div className="font-bold text-gray-900">{item.name}</div>
                            <div className="flex items-center gap-4 text-right w-full sm:w-auto justify-between sm:justify-end">
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Price (Ea)</span>
                                    <span className="font-mono font-bold text-gray-900 text-sm">
                                        ${formatNumber(item.menuPrice, 2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Revenue</span>
                                    <span className="font-mono font-bold text-green-600 text-sm">
                                        ${formatNumber(item.revenue, 2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Event Financial Summary */}
            <div className="bg-[#f54900]/[0.03] p-6 border-t border-gray-200 rounded-b-xl">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-500">Total Liquid Volume</span>
                    <span className="text-lg font-bold text-gray-900">
                        {measureSystem === 'metric'
                            ? `${formatNumber(financials.totalVolumeML / LITER_TO_ML, 1)} L`
                            : `${formatNumber(financials.totalVolumeML / GALLON_TO_ML, 1)} Gal`
                        }
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-[#f54900]/10 pb-1 mb-2">
                        Event Financial Summary
                    </h3>
                    {/* 
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500">Total Event Ingredient Cost</span>
                         <span className="text-sm font-mono font-medium text-gray-900">$0.00</span>
                     </div>
                     */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Total Event Revenue (Charge)</span>
                        <span className="text-sm font-mono font-medium text-gray-900">${formatNumber(financials.totalRevenue, 2)}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#f54900]/10 grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 transition-colors text-gray-900">
                        <Download className="text-sm mr-1 w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={() => generateShoppingListPdf(batches, liquorPrices)}
                        className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-xs font-medium text-white bg-[#f54900] hover:bg-[#d13e00] transition-colors shadow-sm"
                    >
                        <FileText className="text-sm mr-1 w-4 h-4" /> Order List PDF
                    </button>
                </div>
            </div>
        </div>
    )
}
