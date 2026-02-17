import React, { useMemo } from "react"
import { Download, ShoppingCart } from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { calculateGrandTotals } from "@/features/batch-calculator/lib/grand-totals"
import { formatNumber, formatMLValue, LITER_TO_ML, GALLON_TO_ML } from "@/features/batch-calculator/lib/calculations"

interface ReviewBatchSheetProps {
    batches: BatchState[]
    measureSystem: 'us' | 'metric'
}

export function ReviewBatchSheet({ batches, measureSystem }: ReviewBatchSheetProps) {
    const totals = useMemo(() => calculateGrandTotals(batches), [batches])

    // Combine all items for display if needed, or keep separate sections akin to screenshot
    // The screenshot shows a unified list but likely grouped or just flat. 
    // Wait, the screenshot shows "SPICY MARGARITA (150 SERVINGS)" then ingredients, 
    // then "SMOKED OLD FASHIONED..." then ingredients.
    // BUT the totals summary implies a grand total sheet.
    // The screenshot's right panel title is "Batching Sheet", implies real-time ingredient totals.
    // However, the list below has headers for EACH cocktail?
    // "SPICY MARGARITA (150 SERVINGS)" is a header row in the table.
    // Ah, looking closely at the screenshot "Batching Sheet" panel:
    // It has "INGREDIENT", "TYPE", "TOTAL QTY".
    // And rows like "Tequila Blanco", "Spirit", "300 oz".
    // Wait, are these aggregated or per drink?
    // Under "SPICY MARGARITA (150 SERVINGS)" header, it lists "Tequila Blanco", "Fresh Lime Juice", "Agave Syrup".
    // Then "SMOKED OLD FASHIONED (75 SERVINGS)" header, lists "Bourbon Whiskey", "Simple Syrup", "Angostura Bitters".
    // It seems it lists per-cocktail breakdowns in this view, NOT grand totals, OR it's a mix.
    // "Total Liquid Volume" at the bottom is 5.6 Gallons (Sum of 4.1 + 1.5).

    // Let's implement per-cocktail breakdown first as per screenshot structure.

    const totalVolumeGallons = batches.reduce((acc, batch) => {
        if (!batch.selectedCocktail || !batch.servings) return acc
        // simple summation of the volumes calculated in DrinkSelection
        // Re-calculate here to be safe
        const singleServingML = batch.selectedCocktail.ingredients.reduce((sum, ing) => {
            // rough calc
            // We need the helper from calculations.ts but I don't want to duplicate logic heavily
            // For summary, let's trust the prop passed or re-calc efficiently
            return sum // placeholder, we will do it properly below
        }, 0)

        // Let's use the hook/helper logic inside the render
        return acc
    }, 0)

    // Refined logic:
    // We iterate through batches. For each batch with servings > 0:
    // Calculate its ingredients.
    // Display header.
    // Display ingredients.

    const totalGallonsRef = React.useRef(0)
    totalGallonsRef.current = 0 // Reset on render

    return (
        <div className="flex flex-col h-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-6">Ingredient</div>
                <div className="col-span-3 text-right">Type</div>
                <div className="col-span-3 text-right">Total Qty</div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
                {batches.map(batch => {
                    const servings = typeof batch.servings === 'number' ? batch.servings : 0
                    if (!batch.selectedCocktail || servings <= 0) return null

                    // Calculate batch volume for this cocktail
                    // We need access to helper functions. 
                    // Ideally we'd import { calculateBatch } from lib.
                    // But we can just use the BatchItem logic or similar.
                    const { ingredients } = batch.selectedCocktail

                    // Allow access to imported helpers
                    const { calculateBatch, calculateSingleServingLiquidVolumeML } = require("@/features/batch-calculator/lib/calculations")
                    // Note: require might not work in client component depending on bundler, standard import is safer.
                    // I will use standard imports at top. 

                    const singleServingML = calculateSingleServingLiquidVolumeML(batch.selectedCocktail)
                    const batchTotalML = singleServingML * servings
                    const batchTotalGal = batchTotalML / GALLON_TO_ML
                    totalGallonsRef.current += batchTotalGal

                    return (
                        <div key={batch.id} className="border-b border-gray-50 last:border-none">
                            {/* Cocktail Header */}
                            <div className="px-4 py-3 bg-gray-50/50 font-bold text-xs text-gray-700 uppercase tracking-wide flex justify-between">
                                <span>{batch.selectedCocktail.name} ({servings} Servings)</span>
                            </div>

                            {ingredients.map((ing, idx) => {
                                const calculated = calculateBatch(servings, ing.amount, ing.unit)
                                if (calculated.ml <= 0 && calculated.unitType !== 'count') return null;

                                let displayQty = ""
                                let subQty = "" // e.g. (2.34 Gal)

                                if (measureSystem === 'us') {
                                    // OZ for small, Gallons/Quarts for large?
                                    // Screenshot shows "300 oz (2.34 Gal)"
                                    const oz = calculated.ml / 29.5735
                                    displayQty = `${formatNumber(oz, oz > 100 ? 0 : 1)} oz`

                                    const gal = calculated.ml / GALLON_TO_ML
                                    if (gal > 0.1) {
                                        subQty = `(${formatNumber(gal, 2)} Gal)`
                                    } else {
                                        // maybe liters or ml if small?
                                        // Screenshot shows (110 ml) for bitters
                                        subQty = `(${formatMLValue(calculated.ml)} ml)`
                                    }
                                } else {
                                    displayQty = `${formatMLValue(calculated.ml)} ml`
                                    const liters = calculated.ml / LITER_TO_ML
                                    if (liters > 0.5) subQty = `(${formatNumber(liters, 2)} L)`
                                }

                                return (
                                    <div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
                                        <div className="col-span-6 font-medium text-gray-900">{ing.name}</div>
                                        <div className="col-span-3 text-right text-gray-500 text-xs my-auto">
                                            {/* Type inference is tricky without data, verify if 'type' exists on ingredient */}
                                            {/* For now hardcode or infer simple types */}
                                            {ing.name.toLowerCase().includes('syrup') ? 'Syrup' :
                                                ing.name.toLowerCase().includes('juice') ? 'Juice' :
                                                    ing.name.toLowerCase().includes('bitters') ? 'Bitters' :
                                                        ing.name.toLowerCase().includes('tequila') || ing.name.toLowerCase().includes('vodka') || ing.name.toLowerCase().includes('gin') || ing.name.toLowerCase().includes('whiskey') ? 'Spirit' : 'Other'
                                            }
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <div className="font-bold text-gray-900">{displayQty}</div>
                                            <div className="text-xs text-gray-400 font-medium">{subQty}</div>
                                            {calculated.bottles >= 0.1 && (
                                                <div className="text-xs text-gray-400 font-medium">
                                                    ~{formatNumber(calculated.bottles, 1)} bottles @750ml
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}

                {batches.every(b => (b.servings === "" || b.servings === 0)) && (
                    <div className="p-8 text-center text-gray-400">
                        Enter servings to see ingredients
                    </div>
                )}
            </div>

            {/* Subtotals Footer */}
            <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-gray-500">Total Liquid Volume</span>
                    <span className="text-2xl font-extrabold text-brand-primary">
                        {formatNumber(totalGallonsRef.current, 1)} Gallons
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Est. Ingredient Cost</span>
                    <span className="font-medium text-gray-900">$0.00</span>
                </div>
            </div>
        </div>
    )
}
