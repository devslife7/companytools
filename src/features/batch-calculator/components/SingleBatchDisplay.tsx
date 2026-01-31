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
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl mt-4 text-center text-gray-500">
          <FlaskConical className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <p>Select a cocktail above to see its recipe and batch calculations.</p>
        </div>
      )

    return (
      <div className="mt-4">
        {/* Name editing input when in edit mode */}
        {isEditing && (
          <div className="mb-4 pb-4 border-b border-gray-300">
            <input
              type="text"
              value={recipe.name}
              onChange={e => onNameChange(id, e.target.value)}
              className="text-xl font-extrabold text-gray-900 bg-white border border-gray-300 rounded px-4 md:px-2 py-3 md:py-1 w-full max-w-md focus:ring-2 focus:ring-orange-500 text-base md:text-xl min-h-[44px] md:min-h-0"
              placeholder="Cocktail Name"
              inputMode="text"
            />
          </div>
        )}

        <div className="p-3 sm:p-4">
          <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-1">
            **Method:** {recipe.method || "N/A"}
          </p>

          <h4 className="text-lg font-semibold text-orange-600 mb-2">Ingredients (1 Serving)</h4>
          <div className="space-y-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            {recipe.ingredients.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-gray-200 pb-1 last:border-b-0"
              >
                {isEditing ? (
                  <div className="flex flex-col md:flex-row items-stretch md:items-center w-full gap-2 md:gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleIngredientUpdate(index, "name", e.target.value)}
                      className="flex-1 py-3 md:py-1 px-3 md:px-2 bg-white text-gray-700 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base md:text-sm min-h-[44px] md:min-h-0"
                      placeholder="Ingredient Name"
                      inputMode="text"
                    />
                    <div className="flex gap-2 md:gap-1">
                      <input
                        type="text"
                        value={item.amount}
                        onChange={e => handleIngredientUpdate(index, "amount", e.target.value)}
                        className="w-24 md:w-16 py-3 md:py-1 px-3 md:px-2 text-right bg-white text-orange-600 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base md:text-sm min-h-[44px] md:min-h-0"
                        placeholder="Amount"
                        inputMode="decimal"
                      />
                      <select
                        value={item.unit || "oz"}
                        onChange={e => handleIngredientUpdate(index, "unit", e.target.value)}
                        className="w-28 md:w-16 py-3 md:py-1 px-2 md:px-1 text-base md:text-sm bg-white text-orange-600 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[44px] md:min-h-0"
                      >
                        <option value="oz">oz</option>
                        <option value="dash">dash</option>
                        <option value="tsp">tsp</option>
                        <option value="each">each</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="px-4 md:p-1 py-3 md:py-1 text-red-500 hover:bg-red-100 rounded flex items-center justify-center gap-2 md:gap-0 min-h-[44px] md:min-h-0"
                      aria-label="Remove ingredient"
                    >
                      <X className="w-5 h-5 md:w-4 md:h-4" />
                      <span className="md:hidden text-sm font-medium">Remove</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-mono text-orange-600">
                      {item.amount}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={handleAddIngredient}
                className="w-full mt-2 py-3 md:py-2 flex items-center justify-center text-base md:text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded border border-dashed border-orange-300 transition-colors min-h-[44px] md:min-h-0"
              >
                <PlusCircle className="w-5 h-5 md:w-4 md:h-4 mr-1" /> Add Ingredient
              </button>
            )}
          </div>

          {/* Batch Totals Toggle Button */}
          {(servingsNum > 0 || singleServingVolumeML > 0) && (
            <div className="mt-6">
              <button
                onClick={() => setShowBatchTotals(!showBatchTotals)}
                className="w-full flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition duration-200 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Ruler className="w-6 h-6 text-orange-600" />
                  <h4 className="text-xl font-bold text-gray-900">Batch Totals</h4>
                </div>
                {showBatchTotals ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          )}

          {/* Batch Totals Table */}
          {showBatchTotals && (servingsNum > 0 || singleServingVolumeML > 0) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-inner">
              <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-2">
                1 Serving Liquid Volume: {formatNumber(singleServingVolumeML / 29.5735)} oz (
                {formatNumber(singleServingVolumeML)} ml)
                {singleServingVolumeML === 0 && (
                  <span className="text-red-600 ml-2"> (Cannot perform proportional batching.)</span>
                )}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  {/* Servings Based Calculation (Calculation 1) */}
                  <thead className="text-gray-900 bg-gray-200/80">
                    <tr>
                      <th className="py-1 px-1 text-left w-1/3 border-b-2 border-orange-600" rowSpan={2}>
                        INGREDIENT
                      </th>
                      <th className="py-1 px-1 text-center" colSpan={3}>
                        Calculation 1: {servingsNum} Servings (Total {formatNumber(totalServingsLiquidML / LITER_TO_ML)}{" "}
                        L)
                      </th>
                    </tr>
                    <tr className="bg-gray-200/80">
                      <th className="py-1 px-1 text-right">ML</th>
                      <th className="py-1 px-1 text-right">QUARTS (Q)</th>
                      <th className="py-1 px-1 text-right">@750 BOTTLES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedIngredients.map((ing, ingIndex) => (
                      <tr
                        key={`${ing.name}-servings`}
                        className="border-t border-gray-200 hover:bg-gray-100 transition duration-150"
                      >
                        <td className="py-1 px-1 text-gray-700 font-medium border-r border-gray-200">{ing.name}</td>
                        {ing.isLiquid ? (
                          <>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatMLValue(ing.servings.ml)}
                            </td>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.quart)}
                            </td>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.bottles)}
                            </td>
                          </>
                        ) : (
                          <td colSpan={3} className="py-1 px-1 text-center font-mono text-gray-400">
                            {ing.isCount
                              ? `${formatNumber(ing.servings.ml, 0)} ${ing.servings.originalUnit} (Count Item)`
                              : `${ing.servings.originalUnit} (To Taste/Top)`}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Fixed 20L Target Based Calculation (Calculation 2) */}
                {shouldShowFixedBatch ? (
                  <table className="min-w-full text-sm mt-6">
                    <thead className="text-gray-900 bg-gray-200/80">
                      <tr>
                        <th className="py-1 px-1 text-left w-1/3 border-b-2 border-orange-600" rowSpan={2}>
                          INGREDIENT
                        </th>
                        <th className="py-1 px-1 text-center" colSpan={3}>
                          Calculation 2: Fixed Proportional Batch for {targetLiters} Liters
                        </th>
                      </tr>
                      <tr className="bg-gray-200/80">
                        <th className="py-1 px-1 text-right">ML</th>
                        <th className="py-1 px-1 text-right">QUARTS (Q)</th>
                        <th className="py-1 px-1 text-right">@750 BOTTLES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedIngredients.map((ing, ingIndex) => (
                        <tr
                          key={`${ing.name}-target`}
                          className="border-t border-gray-200 hover:bg-gray-100 transition duration-150"
                        >
                          <td className="py-1 px-1 text-gray-700 font-medium border-r border-gray-200">{ing.name}</td>
                          {ing.isLiquid ? (
                            <>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatMLValue(ing.target.ml)}
                              </td>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatNumber(ing.target.quart)}
                              </td>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatNumber(ing.target.bottles)}
                              </td>
                            </>
                          ) : (
                            <td colSpan={3} className="py-1 px-1 text-center font-mono text-gray-400">
                              Count items cannot be proportionally batched by volume.
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  singleServingVolumeML > 0 && (
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-gray-700 text-center">
                      The Proportional {targetLiters}L Batch calculation is hidden because your current {servingsNum}{" "}
                      Servings Batch total ({formatNumber(totalServingsLiquidML / LITER_TO_ML)} L) is less than the{" "}
                      {targetLiters} L threshold.
                    </div>
                  )
                )}
              </div>
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
      JSON.stringify(prevProps.batch.editableRecipe?.ingredients) ===
        JSON.stringify(nextProps.batch.editableRecipe?.ingredients)
    )
  }
)

SingleBatchDisplay.displayName = "SingleBatchDisplay"
