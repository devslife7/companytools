import React from 'react'
import { X, FlaskConical, ClipboardList } from 'lucide-react'
import type { BatchState } from '../types'
import { calculateBatch, formatNumber, LITER_TO_ML } from '../lib/calculations'
import { isLiquorItem } from '../lib/ingredient-helpers'

interface BatchingInstructionsModalProps {
    batch: BatchState | null
    onClose: () => void
    onUpdate?: (batch: BatchState) => void
}

export function BatchingInstructionsModal({ batch, onClose }: BatchingInstructionsModalProps) {
    if (!batch || !batch.selectedCocktail) return null

    const activeRecipe = batch.editableRecipe || batch.selectedCocktail
    const servings = batch.servings
    const numServings = typeof servings === 'number' ? servings : 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#f54900]/10 rounded-lg text-[#f54900]">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{activeRecipe.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Batching Instructions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[140px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Target Batch</span>
                            <span className="text-2xl font-bold text-[#f54900] tracking-tight">{numServings} <span className="text-sm font-medium text-gray-400">servings</span></span>
                        </div>

                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[140px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Glassware</span>
                            <span className="text-lg font-medium text-gray-900">{activeRecipe.glassType || 'N/A'}</span>
                        </div>

                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-[2] min-w-[200px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Method</span>
                            <span className="text-lg font-medium text-gray-900">{activeRecipe.method || 'Build in tin'}</span>
                        </div>
                    </div>

                    {/* Ingredients Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Ingredient</th>
                                    <th className="px-5 py-3 text-right font-bold w-32 border-l border-gray-200">Single</th>
                                    <th className="px-5 py-3 text-right font-bold text-[#f54900] w-40 border-l border-gray-200 bg-[#f54900]/5">Batch Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {activeRecipe.ingredients.map((ing, idx) => {
                                    const calculated = calculateBatch(numServings, ing.amount, ing.unit)
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-gray-900">{ing.name}</td>
                                            <td className="px-5 py-3 text-right text-gray-500 font-medium border-l border-gray-100">
                                                {ing.amount} <span className="text-xs text-gray-400">{ing.unit}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 border-l border-gray-100 bg-[#f54900]/[0.02]">
                                                {calculated.unitType === 'liquid' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatNumber(calculated.ml / LITER_TO_ML, 2)} L</span>
                                                        {isLiquorItem(ing.name) && (
                                                            <span className="text-[10px] text-gray-500 font-normal mt-0.5">
                                                                {formatNumber(calculated.bottles, 1)} btls (750ml)
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 font-normal">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Batching Implementation
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-5 text-gray-700 leading-relaxed border border-gray-200 text-sm whitespace-pre-line shadow-inner">
                            {activeRecipe.instructions || "No specific instructions provided for this recipe."}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    )
}
