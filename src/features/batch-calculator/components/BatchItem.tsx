"use client"
import React from "react"
import { FlaskConical, Calculator, Trash2 } from "lucide-react"
import type { BatchState, CocktailRecipe, Ingredient } from "../types"
import { COCKTAIL_DATA } from "../data/cocktails"
import { BatchInput, CocktailSelector } from "@/components/ui"
import { SingleBatchDisplay } from "./SingleBatchDisplay"

interface BatchItemProps {
  batch: BatchState
  onSelect: (id: number, cocktail: CocktailRecipe) => void
  onServingsChange: (id: number, value: string) => void
  onSearchTermChange: (id: number, term: string) => void
  onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
  onNameChange: (id: number, newName: string) => void
  onRemove: (id: number) => void
  isOnlyItem: boolean
}

// New memoized component for each slot (Crucial for performance fix)
export const BatchItem: React.FC<BatchItemProps> = React.memo(
  ({ batch, onSelect, onServingsChange, onSearchTermChange, onIngredientChange, onNameChange, onRemove, isOnlyItem }) => {
    const { servings, searchTerm, editableRecipe, id } = batch

    return (
      <div className="p-3 sm:p-4 bg-white border border-gray-300 rounded-xl shadow-xl mb-4 transition-all duration-500 hover:border-orange-500">
        <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
            <FlaskConical className="w-6 h-6 mr-2 text-orange-600" />
            Cocktail Slot #{id}
          </h2>
          {!isOnlyItem && (
            <button
              onClick={() => onRemove(id)}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition duration-200 shadow-lg text-white"
              title="Remove this batch"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <CocktailSelector
              selected={batch.selectedCocktail}
              onSelect={cocktail => onSelect(id, cocktail)}
              searchTerm={searchTerm}
              onSearch={term => onSearchTermChange(id, term)}
              cocktails={COCKTAIL_DATA}
              label={`Search Cocktail Recipe for Slot #${id}`}
            />
          </div>
          {/* Servings Input (The primary user input) */}
          <BatchInput
            value={servings}
            onChange={value => onServingsChange(id, value)}
            disabled={!editableRecipe}
            id={`servings-${id}`}
            label="Target Servings (Cups)"
            icon={Calculator}
          />
        </div>
        {/* Display for both Servings Batch and Fixed 20L Batch */}
        <SingleBatchDisplay batch={batch} onIngredientChange={onIngredientChange} onNameChange={onNameChange} />
      </div>
    )
  }
)

BatchItem.displayName = "BatchItem"
