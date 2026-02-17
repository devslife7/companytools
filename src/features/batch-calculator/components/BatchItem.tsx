"use client"
import React, { useState } from "react"
import { FlaskConical, Calculator, Trash2, Edit2 } from "lucide-react"
import type { BatchState, Ingredient, CocktailRecipe, CocktailMethod } from "../types"
import { ServingsInput } from "@/components/ui"
import { SingleBatchDisplay } from "./SingleBatchDisplay"
import { EditRecipeModal } from "./EditRecipeModal"

interface BatchItemProps {
  batch: BatchState
  onServingsChange: (id: number, value: string) => void
  onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
  onNameChange: (id: number, newName: string) => void
  onMethodChange: (id: number, newMethod: CocktailMethod) => void
  onRemove: (id: number) => void
  onEditRecipe?: (cocktail: CocktailRecipe, cocktailId?: number) => void  // Optional callback for database edit
  isOnlyItem: boolean
  hasError?: boolean
}

// New memoized component for each slot (Crucial for performance fix)
export const BatchItem: React.FC<BatchItemProps> = React.memo(
  ({ batch, onServingsChange, onIngredientChange, onNameChange, onMethodChange, onRemove, onEditRecipe, isOnlyItem, hasError = false }) => {
    const { servings, editableRecipe, id, selectedCocktail } = batch
    const [isEditing, setIsEditing] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const servingsNum = typeof servings === 'number' ? servings : parseInt(String(servings), 10) || 0

    return (
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:border-orange-300 shadow-sm hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <FlaskConical className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
            <h2 className="text-lg sm:text-3xl font-extrabold text-gray-900 truncate">
              {selectedCocktail ? selectedCocktail.name : `Cocktail Slot #${id}`}
            </h2>
            {editableRecipe && (
              <button
                onClick={() => {
                  if (onEditRecipe) {
                    onEditRecipe(editableRecipe, editableRecipe.id)
                  } else {
                    setShowEditModal(true)
                  }
                }}
                className="p-2 rounded-xl transition duration-200 shadow-sm border bg-white border-gray-200 hover:bg-gray-50 hover:border-orange-200 group flex-shrink-0"
                title="Edit Recipe"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {servingsNum > 0 && (
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 tabular-nums tracking-wider uppercase">
                {servingsNum} SERVINGS
              </span>
            )}
            {!isOnlyItem && (
              <button
                onClick={() => onRemove(id)}
                className="p-2 sm:p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm"
                title="Remove this batch"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Servings Input (The primary user input) */}
          <div className="md:col-span-3 md:max-w-xs">
            <ServingsInput
              value={servings}
              onChange={value => onServingsChange(id, value)}
              disabled={!editableRecipe}
              id={`servings-${id}`}
              label="Target Servings"
              icon={Calculator}
              hasError={hasError}
            />
          </div>
        </div>
        {/* Display for both Servings Batch and Fixed 20L Batch */}
        <div className="bg-gray-50/50 rounded-xl p-4 sm:p-6 border border-gray-100">
          <SingleBatchDisplay 
            batch={batch} 
            onIngredientChange={onIngredientChange} 
            onNameChange={onNameChange}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />
        </div>

        {/* Edit Recipe Modal */}
        {editableRecipe && (
          <EditRecipeModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            recipe={editableRecipe}
            onSave={(updatedRecipe: CocktailRecipe) => {
              // Update all recipe fields
              onNameChange(id, updatedRecipe.name)
              onMethodChange(id, updatedRecipe.method)
              onIngredientChange(id, updatedRecipe.ingredients)
              setShowEditModal(false)
            }}
          />
        )}
      </div>
    )
  }
)

BatchItem.displayName = "BatchItem"
