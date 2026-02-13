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
      <div className="p-3 sm:p-4 bg-white border border-gray-300 rounded-xl mb-4 transition-all duration-500 hover:border-orange-300">
        <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
              <FlaskConical className="w-6 h-6 mr-2 text-orange-600" />
              {selectedCocktail ? selectedCocktail.name : `Cocktail Slot #${id}`}
            </h2>
            {editableRecipe && (
              <button
                onClick={() => {
                  // If onEditRecipe callback is provided, use it (for database save)
                  // Otherwise, use local modal
                  if (onEditRecipe) {
                    onEditRecipe(editableRecipe, editableRecipe.id)
                  } else {
                    setShowEditModal(true)
                  }
                }}
                className="p-2 rounded-full transition duration-200 shadow-sm border bg-white border-gray-300 hover:bg-gray-200"
                title="Edit Recipe"
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {servingsNum > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 tabular-nums tracking-wide">
                {servingsNum}pp
              </span>
            )}
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Servings Input (The primary user input) */}
          <div className="md:col-span-3 md:max-w-40">
            <ServingsInput
              value={servings}
              onChange={value => onServingsChange(id, value)}
              disabled={!editableRecipe}
              id={`servings-${id}`}
              label="Target Servings (Cups)"
              icon={Calculator}
              hasError={hasError}
            />
          </div>
        </div>
        {/* Display for both Servings Batch and Fixed 20L Batch */}
        <SingleBatchDisplay 
          batch={batch} 
          onIngredientChange={onIngredientChange} 
          onNameChange={onNameChange}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />

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
