import React from "react"
import { Calculator, X, ShoppingCart, FileText } from "lucide-react"
import { BatchItem } from "./BatchItem"
import type { BatchState, CocktailRecipe, CocktailMethod, Ingredient } from "../types"

interface BatchCalculatorModalProps {
    isOpen: boolean
    onClose: () => void
    batches: BatchState[]
    onServingsChange: (id: number, value: string) => void
    onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
    onNameChange: (id: number, newName: string) => void
    onMethodChange: (id: number, newMethod: CocktailMethod) => void
    onRemove: (id: number) => void
    onEditRecipe: (recipe: CocktailRecipe, id?: number) => void
    batchesWithMissingServings: Set<number>
    onGenerateShoppingList: () => void
    onGenerateBatchCalculations: () => void
    onGeneratePdfReport: () => void
    canExport: boolean
}

export function BatchCalculatorModal({
    isOpen,
    onClose,
    batches,
    onServingsChange,
    onIngredientChange,
    onNameChange,
    onMethodChange,
    onRemove,
    onEditRecipe,
    batchesWithMissingServings,
    onGenerateShoppingList,
    onGenerateBatchCalculations,
    onGeneratePdfReport,
    canExport,
}: BatchCalculatorModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Batch Worksheet</h2>
                        <p className="text-sm sm:text-base text-gray-500 mt-1 hidden sm:block">Configure your servings and generate reports.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                        <X className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">

                    {/* Batch Items List */}
                    <div className="space-y-8">
                        {batches.map((batch) => (
                            <BatchItem
                                key={batch.id}
                                batch={batch}
                                onServingsChange={onServingsChange}
                                onIngredientChange={onIngredientChange}
                                onNameChange={onNameChange}
                                onMethodChange={onMethodChange}
                                onRemove={onRemove}
                                onEditRecipe={onEditRecipe}
                                isOnlyItem={batches.length === 1}
                                hasError={batchesWithMissingServings.has(batch.id)}
                            />
                        ))}

                        {batches.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calculator className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No cocktails selected</h3>
                                <p className="text-gray-500">Close this modal and select some recipes to begin batching.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-8 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <button
                        onClick={onGenerateShoppingList}
                        disabled={batches.length === 0}
                        className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm sm:text-base"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Shopping List</span>
                    </button>

                    <button
                        onClick={onGenerateBatchCalculations}
                        disabled={!canExport || batches.length === 0}
                        className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm sm:text-base"
                    >
                        <Calculator className="w-5 h-5" />
                        <span>Batch Sheets</span>
                    </button>

                    <button
                        onClick={onGeneratePdfReport}
                        disabled={!canExport || batches.length === 0}
                        className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] text-sm sm:text-base"
                    >
                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Full Report</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
