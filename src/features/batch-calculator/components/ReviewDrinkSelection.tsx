import React, { useMemo } from "react"
import Image from "next/image"
import { ArrowRight, GlassWater, MoreHorizontal, ChefHat } from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { calculateSingleServingLiquidVolumeML, formatNumber, LITER_TO_ML, GALLON_TO_ML } from "@/features/batch-calculator/lib/calculations"

// Props
interface ReviewDrinkSelectionProps {
    batch: BatchState
    onServingsChange: (id: number, value: string) => void
}

export function ReviewDrinkSelection({ batch, onServingsChange }: ReviewDrinkSelectionProps) {
    const { id, selectedCocktail, servings } = batch

    // Derived values
    const singleServingML = useMemo(() =>
        calculateSingleServingLiquidVolumeML(selectedCocktail),
        [selectedCocktail]
    )

    const singleServingOz = singleServingML / 29.5735

    const totalVolumeGallons = useMemo(() => {
        const numServings = typeof servings === 'number' ? servings : 0
        if (numServings <= 0) return 0

        const totalML = singleServingML * numServings
        return totalML / GALLON_TO_ML
    }, [servings, singleServingML])

    const totalLiquorAndJuice = useMemo(() => {
        if (!selectedCocktail) return ""
        return selectedCocktail.ingredients
            .slice(0, 4) // Show first 4 ingredients as a summary
            .map(i => i.name)
            .join(", ")
    }, [selectedCocktail])

    if (!selectedCocktail) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 flex flex-col sm:flex-row gap-6">
                {/* Image */}
                <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-inner">
                    {selectedCocktail.image ? (
                        <Image
                            src={selectedCocktail.image}
                            alt={selectedCocktail.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <GlassWater className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                                {selectedCocktail.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium line-clamp-2">
                                {totalLiquorAndJuice}
                            </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 -mr-2">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-end gap-3 sm:gap-6 mt-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Target Servings
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <ChefHat className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary" />
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={servings}
                                    onChange={(e) => onServingsChange(id, e.target.value)}
                                    className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-lg shadow-sm"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Qty</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right pb-1">
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
                                Total Volume
                            </span>
                            <div className="text-2xl font-extrabold text-brand-primary leading-none">
                                {formatNumber(totalVolumeGallons, 1)} <span className="text-sm font-bold text-brand-primary/70">Gal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">
                    Includes <span className="text-gray-900 font-bold">{formatNumber(singleServingOz, 1)} oz</span> per serving
                </div>

                <button className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 transition-colors uppercase tracking-wide">
                    View Recipe
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
