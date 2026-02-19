import React, { useMemo } from "react"
import { Trash2, RotateCcw, Users, ArrowRight } from "lucide-react"

// Types
import type { BatchState } from "@/features/batch-calculator/types"
import { calculateSingleServingLiquidVolumeML, formatNumber, LITER_TO_ML, GALLON_TO_ML } from "@/features/batch-calculator/lib/calculations"

// Props
interface ReviewDrinkSelectionProps {
    batch: BatchState
    onServingsChange: (id: number, value: string) => void
    onRemove?: (id: number) => void
    measureSystem?: 'us' | 'metric'
    onViewBatching?: (batch: BatchState) => void
    onViewRecipe?: (batch: BatchState) => void
}

export const ReviewDrinkSelection = React.memo(function ReviewDrinkSelection({ batch, onServingsChange, onRemove, measureSystem = 'metric', onViewBatching, onViewRecipe }: ReviewDrinkSelectionProps) {
    const { id, selectedCocktail, servings } = batch

    // Derived values
    const singleServingML = useMemo(() =>
        calculateSingleServingLiquidVolumeML(selectedCocktail),
        [selectedCocktail]
    )

    const singleServingOz = singleServingML / 29.5735

    const totalLiquidVolume = useMemo(() => {
        const numServings = typeof servings === 'number' ? servings : 0

        const unit = measureSystem === 'metric' ? 'L' : 'Gal'
        const unitDivisor = measureSystem === 'metric' ? LITER_TO_ML : GALLON_TO_ML

        if (numServings <= 0) {
            return { value: 0, unit }
        }

        const totalML = singleServingML * numServings
        return {
            value: totalML / unitDivisor,
            unit
        }
    }, [servings, singleServingML, measureSystem])

    if (!selectedCocktail) return null

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:border-[#f54900]/30 transition-all">
            <div className="p-5 flex flex-col sm:flex-row gap-6">
                {/* Image */}
                <div className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {selectedCocktail.image ? (
                        <img
                            alt={selectedCocktail.name}
                            className="w-full h-full object-cover"
                            src={selectedCocktail.image}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <span className="text-xs">No Image</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {selectedCocktail.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    {selectedCocktail.ingredients.map(i => i.name).join(", ")}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    {onRemove && (
                                        <button
                                            onClick={() => onRemove(id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Remove Drink"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* Undo button hidden as per design usually, but can be added if needed */}
                                    <button className="text-gray-400 hover:text-[#f54900] transition-colors p-1 hidden">
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                Target Servings
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Users className="text-gray-400 w-5 h-5" />
                                </div>
                                <input
                                    className="focus:ring-[#f54900] focus:border-[#f54900] block w-full pl-10 pr-12 sm:text-lg border-gray-200 rounded-lg py-2.5 font-bold bg-white text-gray-900 placeholder:text-gray-400"
                                    placeholder="0"
                                    type="number"
                                    value={servings}
                                    onChange={(e) => onServingsChange(id, e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">qty</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-xs text-gray-500 mb-1">Total Volume</p>
                            <p className="text-lg font-bold text-[#f54900]">
                                {formatNumber(totalLiquidVolume.value || 0, 1)} {totalLiquidVolume.unit}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-500">
                    Includes <span className="font-medium text-gray-900">{formatNumber(singleServingOz, 1)} oz</span> per serving
                </span>
                <div className="flex items-center gap-4">
                    {/* Placeholder links as per design */}
                    <button
                        onClick={() => onViewRecipe?.(batch)}
                        className="text-[#f54900] hover:text-[#d13e00] font-medium text-xs uppercase tracking-wide flex items-center"
                    >
                        View Recipe
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => onViewBatching?.(batch)}
                        className="text-[#f54900] hover:text-[#d13e00] font-medium text-xs uppercase tracking-wide flex items-center"
                    >
                        View Batching
                    </button>
                </div>
            </div>
        </div>
    )
})
ReviewDrinkSelection.displayName = "ReviewDrinkSelection"
