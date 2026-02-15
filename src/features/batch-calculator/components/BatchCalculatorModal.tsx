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
    servingsProgress: { completed: number; total: number }
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
    servingsProgress,
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
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Batch Worksheet</h2>
                        <p className="text-sm text-gray-500 mt-1">Configure your servings and generate reports.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                    {/* Progress Bar */}
                    {servingsProgress.total > 0 && (
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                Progress: {servingsProgress.completed}/{servingsProgress.total}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-500 ease-out"
                                    style={{ width: `${(servingsProgress.completed / servingsProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Batch Items List */}
                    <div className="space-y-6">
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
                            <div className="text-center py-12 text-gray-500">
                                <p>No cocktails selected. Close this modal and select some recipes!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onGenerateShoppingList}
                        disabled={batches.length === 0}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Shopping List</span>
                    </button>

                    <button
                        onClick={onGenerateBatchCalculations}
                        disabled={!canExport || batches.length === 0}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Calculator className="w-5 h-5" />
                        <span>Batch Sheets</span>
                    </button>

                    <button
                        onClick={onGeneratePdfReport}
                        disabled={!canExport || batches.length === 0}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white border border-gray-900 rounded-xl hover:bg-gray-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Full Report</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
