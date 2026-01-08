"use client"
import React, { useState, useEffect } from "react"
import { X, PlusCircle, Trash2, Save } from "lucide-react"
import type { CocktailRecipe, Ingredient } from "../types"

interface EditRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: CocktailRecipe | null
  onSave: (updatedRecipe: CocktailRecipe) => void
}

export const EditRecipeModal: React.FC<EditRecipeModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onSave,
}) => {
  const [editedRecipe, setEditedRecipe] = useState<CocktailRecipe | null>(null)

  // Initialize edited recipe when modal opens or recipe changes
  useEffect(() => {
    if (recipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(recipe))) // Deep copy
    }
  }, [recipe, isOpen])

  if (!isOpen || !recipe || !editedRecipe) return null

  const handleNameChange = (value: string) => {
    setEditedRecipe({ ...editedRecipe, name: value })
  }

  const handleGarnishChange = (value: string) => {
    setEditedRecipe({ ...editedRecipe, garnish: value })
  }

  const handleMethodChange = (value: string) => {
    setEditedRecipe({ ...editedRecipe, method: value })
  }

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...editedRecipe.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients })
  }

  const handleAddIngredient = () => {
    setEditedRecipe({
      ...editedRecipe,
      ingredients: [...editedRecipe.ingredients, { name: "", amount: "" }],
    })
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index)
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients })
  }

  const handleSave = () => {
    // Validate that all ingredients have names
    const hasEmptyIngredients = editedRecipe.ingredients.some(ing => !ing.name.trim())
    if (hasEmptyIngredients) {
      alert("Please fill in all ingredient names before saving.")
      return
    }

    onSave(editedRecipe)
    onClose()
  }

  const handleCancel = () => {
    // Reset to original recipe
    if (recipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(recipe)))
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 pointer-events-auto animate-fade-in"
        onClick={handleCancel}
      />

      {/* Modal content */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-300 pointer-events-auto animate-modal-enter relative z-10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-orange-50 to-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold text-gray-900">Edit Recipe</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cocktail Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cocktail Name</label>
            <input
              type="text"
              value={editedRecipe.name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="Enter cocktail name"
            />
          </div>

          {/* Garnish */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Garnish</label>
            <input
              type="text"
              value={editedRecipe.garnish}
              onChange={e => handleGarnishChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="Enter garnish description"
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Method</label>
            <textarea
              value={editedRecipe.method}
              onChange={e => handleMethodChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 resize-none"
              placeholder="Enter preparation method"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Ingredients</label>
            <div className="space-y-3">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={e => handleIngredientChange(index, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-sm"
                      placeholder="Ingredient name"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      value={ingredient.amount}
                      onChange={e => handleIngredientChange(index, "amount", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-sm text-right"
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                    title="Remove ingredient"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddIngredient}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-dashed border-orange-300 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Add Ingredient
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-300 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200 shadow-md flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
