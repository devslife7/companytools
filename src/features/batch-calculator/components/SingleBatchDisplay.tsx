"use client"
import React, { useState, useMemo } from "react"
import { FlaskConical, Ruler, Edit2, Check, PlusCircle, X, ChevronDown, ChevronUp } from "lucide-react"
import type { Ingredient, BatchState, BatchResult, CombinedIngredient } from "../types"
import {
  LITER_TO_ML,
  FIXED_BATCH_LITERS,
  CONVERSION_FACTORS,
  QUART_TO_ML,
  BOTTLE_SIZE_ML,
  parseAmount,
  calculateBatch,
  calculateSingleServingLiquidVolumeML,
  formatNumber,
  formatMLValue,
  combineAmountAndUnit,
} from "../lib/calculations"

interface SingleBatchDisplayProps {
  batch: BatchState
  onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
  onNameChange: (id: number, newName: string) => void
  isEditing?: boolean
  onEditToggle?: () => void
}

export const SingleBatchDisplay: React.FC<SingleBatchDisplayProps> = React.memo(
  ({ batch, onIngredientChange, onNameChange, isEditing: externalIsEditing, onEditToggle }) => {
    const { editableRecipe: recipe, servings, id } = batch
    const [internalIsEditing, setInternalIsEditing] = useState(false)
    const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing
    const setIsEditing = onEditToggle || setInternalIsEditing
    const [showBatchTotals, setShowBatchTotals] = useState(false)

    // Ensure servings is treated as a number for calculation
    const servingsNum = typeof servings === "number" ? servings : servings === "" ? 0 : parseInt(servings, 10) || 0

    // The target liters is now fixed
    const targetLiters = FIXED_BATCH_LITERS
    const twentyLiterML = FIXED_BATCH_LITERS * LITER_TO_ML // 20000 ML

    // 1. Calculate the total liquid volume of a single cocktail serving
    const singleServingVolumeML = useMemo(() => {
      return calculateSingleServingLiquidVolumeML(recipe)
    }, [recipe])

    // 2. Calculate ingredients for the Servings Batch (user input)
    const servingsBatchIngredients: BatchResult[] = useMemo(() => {
      if (!recipe || servingsNum <= 0) return []

      return recipe.ingredients.map(item => {
        const batchResult = calculateBatch(servingsNum, item.amount, item.unit)
        return { ...batchResult, singleAmount: item.amount, name: item.name }
      })
    }, [recipe, servingsNum])

    // Calculate total liquid volume for the servings batch
    const totalServingsLiquidML = servingsBatchIngredients.reduce((sum, ing) => sum + ing.ml, 0)

    // CONDITION CHECK: Should the fixed batch table be displayed?
    const shouldShowFixedBatch = totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0

    // 3. Calculate ingredients for the Fixed Target Liter Batch (proportional batching for 20L)
    const targetBatchIngredients: BatchResult[] = useMemo(() => {
      if (!recipe || targetLiters <= 0 || singleServingVolumeML === 0) return []

      const targetML = twentyLiterML

      return recipe.ingredients.map(item => {
        const amountString = combineAmountAndUnit(item.amount, item.unit)
        const { baseAmount, unit, type } = parseAmount(amountString)

        if (type !== "liquid") {
          // Count and special items do not scale with liquid volume target.
          return {
            ml: 0,
            quart: 0,
            bottles: 0,
            unitType: type,
            originalUnit: unit,
            singleAmount: item.amount,
            name: item.name,
          }
        }

        const ingredientML = baseAmount * (CONVERSION_FACTORS[unit] || 0)
        // Proportion of this ingredient in one serving's total liquid volume
        const proportion = ingredientML / singleServingVolumeML

        const finalML = targetML * proportion

        return {
          ml: finalML,
          quart: finalML / QUART_TO_ML,
          bottles: finalML / BOTTLE_SIZE_ML,
          unitType: "liquid",
          originalUnit: unit,
          singleAmount: item.amount,
          name: item.name,
        }
      })
    }, [recipe, twentyLiterML, singleServingVolumeML, targetLiters])

    // Combined list of ingredients for table display
    const combinedIngredients: CombinedIngredient[] = useMemo(() => {
      if (!recipe) return []

      return recipe.ingredients.map((item, index) => {
        const amountString = combineAmountAndUnit(item.amount, item.unit)
        const parsed = parseAmount(amountString)
        const servingsCalc = servingsBatchIngredients[index] || ({} as BatchResult)
        const targetCalc = targetBatchIngredients[index] || ({} as BatchResult)

        return {
          name: item.name,
          amount: item.amount, // This is the singleAmount
          singleAmount: item.amount,
          isLiquid: parsed.type === "liquid",
          isCount: parsed.type === "count",
          isSpecial: parsed.type === "special",
          servings: servingsCalc,
          target: targetCalc,
        }
      })
    }, [recipe, servingsBatchIngredients, targetBatchIngredients])

    const handleIngredientUpdate = (index: number, field: keyof Ingredient, value: string) => {
      if (!recipe) return
      const newIngredients = [...recipe.ingredients]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      onIngredientChange(id, newIngredients)
    }

    const handleAddIngredient = () => {
      if (!recipe) return
      const newIngredients: Ingredient[] = [...recipe.ingredients, { name: "", amount: "", unit: "oz" }]
      onIngredientChange(id, newIngredients)
    }

    const handleRemoveIngredient = (index: number) => {
      if (!recipe) return
      const newIngredients = recipe.ingredients.filter((_, i) => i !== index)
      onIngredientChange(id, newIngredients)
    }

    if (!recipe)
      return (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-2xl mt-6 text-center text-gray-500 shadow-inner">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 text-orange-200" />
          <p className="font-medium">Select a cocktail above to see its recipe and batch calculations.</p>
        </div>
      )

    return (
      <div className="space-y-8">
        {/* Name editing input when in edit mode */}
        {isEditing && (
          <div className="pb-6 border-b border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Cocktail Name</label>
            <input
              type="text"
              value={recipe.name}
              onChange={e => onNameChange(id, e.target.value)}
              className="text-xl font-extrabold text-gray-900 bg-white border border-gray-200 rounded-xl px-4 py-3 w-full max-w-md focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              placeholder="Cocktail Name"
              inputMode="text"
            />
          </div>
        )}

        <div className="space-y-6">
          {recipe.instructions && (
            <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider">Method: {recipe.method || "N/A"}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {recipe.instructions}
              </div>
            </div>
          )}

          {!recipe.instructions && (
            <div className="inline-block text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider mb-2">
              Method: {recipe.method || "N/A"}
            </div>
          )}

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
              Ingredients (1 Serving)
            </h4>
            <div className="space-y-3 p-4 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              {recipe.ingredients.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-b-0 last:pb-0"
                >
                  {isEditing ? (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center w-full gap-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => handleIngredientUpdate(index, "name", e.target.value)}
                        className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 rounded-xl border border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-base"
                        placeholder="Ingredient Name"
                        inputMode="text"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.amount}
                          onChange={e => handleIngredientUpdate(index, "amount", e.target.value)}
                          className="w-24 py-3 px-4 text-right bg-gray-50 text-orange-600 rounded-xl border border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-base font-bold"
                          placeholder="0"
                          inputMode="decimal"
                        />
                        <select
                          value={item.unit || "oz"}
                          onChange={e => handleIngredientUpdate(index, "unit", e.target.value)}
                          className="w-28 py-3 px-2 text-base bg-gray-50 text-orange-600 rounded-xl border border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold cursor-pointer"
                        >
                          <option value="oz">oz</option>
                          <option value="dash">dash</option>
                          <option value="tsp">tsp</option>
                          <option value="each">each</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="px-4 py-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
                        aria-label="Remove ingredient"
                      >
                        <X className="w-5 h-5" />
                        <span className="md:hidden text-sm font-bold">Remove</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-700 font-medium">{item.name}</span>
                      <span className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                        {item.amount}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                    </>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={handleAddIngredient}
                  className="w-full mt-4 py-4 flex items-center justify-center text-sm font-extrabold text-[#BA6634] bg-[#BA6634]/5 hover:bg-[#BA6634]/10 rounded-xl border-2 border-dashed border-[#BA6634]/20 transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-5 h-5 mr-2" /> Add Ingredient
                </button>
              )}
            </div>
          </div>

          {/* Batch Totals Toggle Button */}
          {(servingsNum > 0 || singleServingVolumeML > 0) && (
            <div className="pt-4">
              <button
                onClick={() => setShowBatchTotals(!showBatchTotals)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  showBatchTotals 
                    ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                    : "bg-white text-gray-900 border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ruler className={`w-6 h-6 ${showBatchTotals ? "text-orange-400" : "text-orange-600"}`} />
                  <h4 className="text-xl font-bold">Batch Totals</h4>
                </div>
                {showBatchTotals ? (
                  <ChevronUp className="w-5 h-5 opacity-50" />
                ) : (
                  <ChevronDown className="w-5 h-5 opacity-50" />
                )}
              </button>
            </div>
          )}

          {/* Batch Totals Table */}
          {showBatchTotals && (servingsNum > 0 || singleServingVolumeML > 0) && (
            <div className="space-y-6 p-4 sm:p-6 bg-white border border-gray-200 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-xl text-sm font-medium border border-blue-100">
                <FlaskConical className="w-4 h-4" />
                <span>
                  1 Serving Liquid Volume: {formatNumber(singleServingVolumeML / 29.5735)} oz (
                  {formatNumber(singleServingVolumeML)} ml)
                </span>
                {singleServingVolumeML === 0 && (
                  <span className="text-red-600 ml-2 font-bold"> (Invalid Volume)</span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-sm">
                  {/* Servings Based Calculation (Calculation 1) */}
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest text-[10px] font-bold bg-gray-50">
                      <th className="py-4 px-4 text-left border-b border-gray-100">Ingredient</th>
                      <th className="py-4 px-4 text-right border-b border-gray-100" colSpan={3}>
                        Calculation 1: {servingsNum} Servings ({formatNumber(totalServingsLiquidML / LITER_TO_ML)} L)
                      </th>
                    </tr>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400">
                      <th className="py-2 px-4 border-b border-gray-100"></th>
                      <th className="py-2 px-4 text-right border-b border-gray-100">ML</th>
                      <th className="py-2 px-4 text-right border-b border-gray-100">Quarts</th>
                      <th className="py-2 px-4 text-right border-b border-gray-100">750ml Bottles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {combinedIngredients.map((ing, ingIndex) => (
                      <tr
                        key={`${ing.name}-servings`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900 font-bold">{ing.name}</td>
                        {ing.isLiquid ? (
                          <>
                            <td className="py-3 px-4 text-right font-mono text-gray-900">
                              {formatMLValue(ing.servings.ml)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.quart)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.bottles)}
                            </td>
                          </>
                        ) : (
                          <td colSpan={3} className="py-3 px-4 text-center font-bold text-gray-400 italic">
                            {ing.isCount
                              ? `${formatNumber(ing.servings.ml, 0)} ${ing.servings.originalUnit}`
                              : `To Taste`}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                {/* Fixed 20L Target Based Calculation (Calculation 2) */}
                {shouldShowFixedBatch ? (
                  <div className="overflow-x-auto rounded-xl border border-orange-100 bg-orange-50/20">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-[#BA6634] uppercase tracking-widest text-[10px] font-bold bg-orange-50/50">
                          <th className="py-4 px-4 text-left border-b-2 border-orange-100">Ingredient</th>
                          <th className="py-4 px-4 text-right border-b-2 border-orange-100" colSpan={3}>
                            Calculation 2: Fixed Proportional {targetLiters}L Batch
                          </th>
                        </tr>
                        <tr className="bg-orange-50/30 text-[11px] font-bold text-[#BA6634]/60">
                          <th className="py-2 px-4 border-b border-orange-100"></th>
                          <th className="py-2 px-4 text-right border-b border-orange-100">ML</th>
                          <th className="py-2 px-4 text-right border-b border-orange-100">Quarts</th>
                          <th className="py-2 px-4 text-right border-b border-orange-100">750ml Bottles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100/50">
                        {combinedIngredients.map((ing, ingIndex) => (
                          <tr
                            key={`${ing.name}-target`}
                            className="hover:bg-orange-50 transition-colors"
                          >
                            <td className="py-3 px-4 text-gray-900 font-bold">{ing.name}</td>
                            {ing.isLiquid ? (
                              <>
                                <td className="py-3 px-4 text-right font-mono text-[#BA6634] font-bold">
                                  {formatMLValue(ing.target.ml)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#BA6634] font-bold">
                                  {formatNumber(ing.target.quart)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#BA6634] font-bold">
                                  {formatNumber(ing.target.bottles)}
                                </td>
                              </>
                            ) : (
                              <td colSpan={3} className="py-3 px-4 text-center font-bold text-[#BA6634]/40 italic">
                                Scaled by Volume
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  singleServingVolumeML > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium text-center">
                      The Proportional {targetLiters}L Batch calculation is hidden because your current {servingsNum}{" "}
                      Servings Batch total ({formatNumber(totalServingsLiquidML / LITER_TO_ML)} L) is less than the{" "}
                      {targetLiters} L threshold.
                    </div>
                  )
                )}
            </div>
          )}
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison for memoization
    return (
      prevProps.batch.id === nextProps.batch.id &&
      prevProps.batch.servings === nextProps.batch.servings &&
      prevProps.batch.editableRecipe?.name === nextProps.batch.editableRecipe?.name &&
      prevProps.batch.editableRecipe?.instructions === nextProps.batch.editableRecipe?.instructions &&
      prevProps.batch.editableRecipe?.method === nextProps.batch.editableRecipe?.method &&
      JSON.stringify(prevProps.batch.editableRecipe?.ingredients) ===
        JSON.stringify(nextProps.batch.editableRecipe?.ingredients)
    )
  }
)

SingleBatchDisplay.displayName = "SingleBatchDisplay"
