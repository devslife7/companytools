import React, { useMemo } from "react"
import { Trash2, Users, MoreVertical, Pencil, RotateCcw } from "lucide-react"

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
    onEditRecipe?: (batch: BatchState) => void
    isRemoved?: boolean
    onRestore?: (id: number) => void
}

export const ReviewDrinkSelection = React.memo(function ReviewDrinkSelection({ batch, onServingsChange, onRemove, measureSystem = 'metric', onViewBatching, onViewRecipe, onEditRecipe, isRemoved, onRestore }: ReviewDrinkSelectionProps) {
    const { id, selectedCocktail, servings } = batch
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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

    if (isRemoved) {
        return (
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row items-center justify-between opacity-75 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        {selectedCocktail.image ? (
                            <img
                                alt={selectedCocktail.name}
                                className="w-full h-full object-cover grayscale opacity-50"
                                src={selectedCocktail.image}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                <span className="text-[10px]">No Image</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-500 line-through">
                            {selectedCocktail.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Removed from event
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onRestore?.(id)}
                    className="flex-shrink-0 flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-[#f54900] hover:bg-gray-50 hover:border-[#f54900]/30 transition-all shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Undo Remove
                </button>
            </div>
        )
    }

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
                                <div className="flex items-center relative" ref={menuRef}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsMenuOpen(!isMenuOpen)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10 animate-fade-in-up origin-top-right">
                                            {onEditRecipe && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsMenuOpen(false)
                                                        onEditRecipe(batch)
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium border-b border-gray-100/50"
                                                >
                                                    <Pencil className="w-4 h-4 text-gray-400" />
                                                    Edit Recipe
                                                </button>
                                            )}
                                            {onRemove && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsMenuOpen(false)
                                                        onRemove(id)
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                        <div className="flex items-end gap-4">
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

                        <div className="flex w-full gap-1.5">
                            {[50, 100, 150, 200, 250, 300].map(qty => {
                                const isActive = servings === qty || servings === qty.toString();
                                return (
                                    <button
                                        key={qty}
                                        type="button"
                                        onClick={() => onServingsChange(id, qty.toString())}
                                        className={`flex-1 px-1 py-1.5 text-xs font-semibold rounded-md transition-all shadow-sm border ${isActive
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
                </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-500">
                    Includes <span className="font-medium text-gray-900">{formatNumber(singleServingOz, 1)} oz</span> per serving
                </span>
                <div className="flex items-center gap-4">
                    {/* Action links */}
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
