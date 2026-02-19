import React from 'react'
import { X, Wine, ClipboardList } from 'lucide-react'
import type { BatchState } from '../types'

interface RecipeModalProps {
    batch: BatchState | null
    onClose: () => void
}

export function RecipeModal({ batch, onClose }: RecipeModalProps) {
    if (!batch || !batch.selectedCocktail) return null

    const { selectedCocktail } = batch

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#f54900]/10 rounded-lg text-[#f54900]">
                            <Wine className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedCocktail.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Single Serving Recipe</p>
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
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Method</span>
                            <span className="text-lg font-medium text-gray-900">{selectedCocktail.method || 'Build'}</span>
                        </div>
                        {selectedCocktail.glassType && (
                            <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[140px]">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Glassware</span>
                                <span className="text-lg font-medium text-gray-900">{selectedCocktail.glassType}</span>
                            </div>
                        )}
                        {selectedCocktail.abv != null && selectedCocktail.abv > 0 && (
                            <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[100px]">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">ABV</span>
                                <span className="text-lg font-medium text-gray-900">{selectedCocktail.abv}%</span>
                            </div>
                        )}
                        {selectedCocktail.menuPrice != null && selectedCocktail.menuPrice > 0 && (
                            <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[100px]">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Menu Price</span>
                                <span className="text-lg font-medium text-[#f54900]">${selectedCocktail.menuPrice}</span>
                            </div>
                        )}
                    </div>

                    {/* Ingredients Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Ingredient</th>
                                    <th className="px-5 py-3 text-right font-bold w-40 border-l border-gray-200">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {selectedCocktail.ingredients.map((ing, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 font-semibold text-gray-900">{ing.name}</td>
                                        <td className="px-5 py-3 text-right text-gray-700 font-medium border-l border-gray-100">
                                            {ing.amount} <span className="text-xs text-gray-400">{ing.unit}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Instructions */}
                    {selectedCocktail.instructions && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Instructions
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-5 text-gray-700 leading-relaxed border border-gray-200 text-sm whitespace-pre-line shadow-inner">
                                {selectedCocktail.instructions}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
