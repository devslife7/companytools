import React, { useState, useCallback } from 'react'
import { X, FlaskConical, ClipboardList, Edit2, Save, Plus, Trash2, Check } from 'lucide-react'
import type { BatchState, CocktailRecipe, Ingredient } from '../types'
import { calculateBatch, formatNumber, LITER_TO_ML } from '../lib/calculations'
import { isLiquorItem } from '../lib/ingredient-helpers'

interface BatchingInstructionsModalProps {
    batch: BatchState | null
    onClose: () => void
    onUpdate?: (batch: BatchState) => void
}

export function BatchingInstructionsModal({ batch, onClose, onUpdate }: BatchingInstructionsModalProps) {
    const [isEditing, setIsEditing] = useState(false)

    if (!batch || !batch.selectedCocktail) return null

    // Use editableRecipe if available, otherwise fallback to selectedCocktail
    // (In correct usage, editableRecipe should always be populated by ReviewBatchPage)
    const activeRecipe = batch.editableRecipe || batch.selectedCocktail

    const servings = batch.servings
    const numServings = typeof servings === 'number' ? servings : 0

    // Helper to update the recipe in the batch
    const updateRecipe = useCallback((updates: Partial<CocktailRecipe>) => {
        if (!onUpdate) return

        const updatedRecipe = { ...activeRecipe, ...updates }
        onUpdate({
            ...batch,
            editableRecipe: updatedRecipe
        })
    }, [activeRecipe, batch, onUpdate])

    // Specific handlers
    const handleMetaChange = (field: keyof CocktailRecipe, value: string) => {
        updateRecipe({ [field]: value })
    }

    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...activeRecipe.ingredients]
        newIngredients[index] = { ...newIngredients[index], [field]: value }
        updateRecipe({ ingredients: newIngredients })
    }

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = activeRecipe.ingredients.filter((_, i) => i !== index)
        updateRecipe({ ingredients: newIngredients })
    }

    const handleAddIngredient = () => {
        const newIngredients = [...activeRecipe.ingredients, { name: "", amount: "1", unit: "oz" }]
        updateRecipe({ ingredients: newIngredients })
    }

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
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEditing ? "Edit Recipe" : activeRecipe.name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {isEditing ? "Modifying batch parameters" : "Batching Instructions"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onUpdate && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold px-3 ${isEditing
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {isEditing ? (
                                    <><Check className="w-4 h-4" /> Done</>
                                ) : (
                                    <><Edit2 className="w-4 h-4" /> Edit</>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[140px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Target Batch</span>
                            <span className="text-2xl font-bold text-[#f54900] tracking-tight">{numServings} <span className="text-sm font-medium text-gray-400">servings</span></span>
                        </div>

                        {/* Glassware Field */}
                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-1 min-w-[140px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Glassware</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={activeRecipe.glassType || ""}
                                    onChange={(e) => handleMetaChange("glassType", e.target.value)}
                                    className="w-full text-sm font-medium border-b border-gray-300 focus:border-[#f54900] outline-none py-1"
                                    placeholder="e.g. Coupe"
                                />
                            ) : (
                                <span className="text-lg font-medium text-gray-900">{activeRecipe.glassType || 'N/A'}</span>
                            )}
                        </div>

                        {/* Method Field */}
                        <div className="bg-white rounded-lg p-3 px-4 border border-gray-200 shadow-sm flex-[2] min-w-[200px]">
                            <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Method</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={activeRecipe.method || ""}
                                    onChange={(e) => handleMetaChange("method", e.target.value)}
                                    className="w-full text-sm font-medium border-b border-gray-300 focus:border-[#f54900] outline-none py-1"
                                    placeholder="e.g. Shake, Strain"
                                />
                            ) : (
                                <span className="text-lg font-medium text-gray-900">{activeRecipe.method || 'Build in tin'}</span>
                            )}
                        </div>
                    </div>

                    {/* Ingredients Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Ingredient</th>
                                    <th className="px-5 py-3 text-right font-bold w-32 border-l border-gray-200">Single</th>
                                    {!isEditing && (
                                        <th className="px-5 py-3 text-right font-bold text-[#f54900] w-40 border-l border-gray-200 bg-[#f54900]/5">Batch Total</th>
                                    )}
                                    {isEditing && (
                                        <th className="px-5 py-3 w-10 border-l border-gray-200"></th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {activeRecipe.ingredients.map((ing, idx) => {
                                    const calculated = calculateBatch(numServings, ing.amount, ing.unit)

                                    if (isEditing) {
                                        return (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-3 py-2">
                                                    <input
                                                        value={ing.name}
                                                        onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                                                        className="w-full font-semibold text-gray-900 border-b border-gray-200 focus:border-[#f54900] outline-none py-1"
                                                        placeholder="Ingredient Name"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 border-l border-gray-100">
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={ing.amount}
                                                            onChange={(e) => handleIngredientChange(idx, "amount", e.target.value)}
                                                            className="w-16 text-right font-medium text-gray-700 border-b border-gray-200 focus:border-[#f54900] outline-none py-1"
                                                            placeholder="Amt"
                                                        />
                                                        <input
                                                            value={ing.unit || ""}
                                                            onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                                                            className="w-16 text-xs text-gray-400 border-b border-gray-200 focus:border-[#f54900] outline-none py-1"
                                                            placeholder="Unit"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center border-l border-gray-100">
                                                    <button
                                                        onClick={() => handleRemoveIngredient(idx)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    }

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

                                {isEditing && (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-3">
                                            <button
                                                onClick={handleAddIngredient}
                                                className="flex items-center gap-2 text-xs font-bold text-[#f54900] uppercase tracking-wide hover:text-[#d13e00] transition-colors"
                                            >
                                                <Plus className="w-4 h-4" /> Add Ingredient
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Batching Implementation
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={activeRecipe.instructions || ""}
                                onChange={(e) => handleMetaChange("instructions", e.target.value)}
                                className="w-full h-32 bg-gray-50 rounded-xl p-4 text-gray-700 border border-gray-200 text-sm focus:border-[#f54900] outline-none resize-none shadow-sm"
                                placeholder="Enter batching instructions..."
                            />
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-5 text-gray-700 leading-relaxed border border-gray-200 text-sm whitespace-pre-line shadow-inner">
                                {activeRecipe.instructions || "No specific instructions provided for this recipe."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end rounded-b-xl gap-3">
                    {isEditing ? (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2.5 bg-[#f54900] text-white font-semibold rounded-lg hover:bg-[#d13e00] transition-all shadow-md active:scale-95"
                        >
                            Done Editing
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                        >
                            Close Window
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
