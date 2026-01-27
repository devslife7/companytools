"use client"
import React, { useState, useEffect } from "react"
import { X, PlusCircle, Trash2, Save, Loader2, AlertCircle } from "lucide-react"
import type { CocktailRecipe, Ingredient } from "../types"
import { useUpdateCocktail, useDeleteCocktail } from "../hooks"

interface EditRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: CocktailRecipe | null
  cocktailId?: number  // Database ID if editing existing recipe
  onSave: (updatedRecipe: CocktailRecipe) => void
  onDelete?: () => void  // Callback after successful deletion
  onSaveSuccess?: () => void  // Callback after successful save
  mode?: 'edit' | 'create'  // Mode: edit existing or create new
}

export const EditRecipeModal: React.FC<EditRecipeModalProps> = ({
  isOpen,
  onClose,
  recipe,
  cocktailId,
  onSave,
  onDelete,
  onSaveSuccess,
  mode = 'edit',
}) => {
  const [editedRecipe, setEditedRecipe] = useState<CocktailRecipe | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null)
  
  const DELETE_PASSWORD = "designcuisine"  // Password required to delete recipes
  
  const { updateCocktail, loading: updateLoading, error: updateError } = useUpdateCocktail()
  const { deleteCocktail, loading: deleteLoading, error: deleteError } = useDeleteCocktail()

  // Initialize edited recipe when modal opens or recipe changes
  useEffect(() => {
    if (recipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(recipe))) // Deep copy
    } else if (mode === 'create') {
      // Initialize empty recipe for create mode
      setEditedRecipe({
        name: '',
        garnish: '',
        method: '',
        ingredients: [{ name: '', amount: '', preferredUnit: '' }],
      })
    }
    setValidationError(null)
  }, [recipe, isOpen, mode])

  if (!isOpen || !editedRecipe) return null

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
      ingredients: [...editedRecipe.ingredients, { name: "", amount: "", preferredUnit: "" }],
    })
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index)
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients })
  }

  const handleSave = async () => {
    // Validation
    if (!editedRecipe.name.trim()) {
      setValidationError("Cocktail name is required")
      return
    }

    if (!editedRecipe.garnish.trim()) {
      setValidationError("Garnish is required")
      return
    }

    if (!editedRecipe.method.trim()) {
      setValidationError("Method is required")
      return
    }

    const validIngredients = editedRecipe.ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        name: ing.name.trim(),
        amount: ing.amount.trim(),
        ...(ing.preferredUnit?.trim() && { preferredUnit: ing.preferredUnit.trim() }),
      }))
    if (validIngredients.length === 0) {
      setValidationError("At least one ingredient is required")
      return
    }

    const hasEmptyIngredients = editedRecipe.ingredients.some(ing => !ing.name.trim() && ing.amount.trim())
    if (hasEmptyIngredients) {
      setValidationError("Please fill in all ingredient names or remove empty ingredients")
      return
    }

    setValidationError(null)

    // If editing existing recipe with database ID, save to database
    if (mode === 'edit' && cocktailId) {
      const updatedRecipe = await updateCocktail(cocktailId, {
        name: editedRecipe.name.trim(),
        garnish: editedRecipe.garnish.trim(),
        method: editedRecipe.method.trim(),
        ingredients: validIngredients,
      })

      if (updatedRecipe) {
        onSave(updatedRecipe)
        onSaveSuccess?.()
        onClose()
      }
      // Error is handled by updateError state
    } else {
      // For create mode or recipes without DB ID, just call onSave callback
      // The parent component will handle database save
      onSave({
        ...editedRecipe,
        name: editedRecipe.name.trim(),
        garnish: editedRecipe.garnish.trim(),
        method: editedRecipe.method.trim(),
        ingredients: validIngredients,
      })
      onClose()
    }
  }

  const handleDelete = async () => {
    if (!cocktailId) return

    // Validate password
    if (deletePassword.trim() !== DELETE_PASSWORD) {
      setDeletePasswordError("Incorrect password. Please try again.")
      return
    }

    setDeletePasswordError(null)
    const success = await deleteCocktail(cocktailId)
    if (success) {
      onDelete?.()
      onClose()
    }
  }

  const handleOpenDeleteConfirm = () => {
    setDeletePassword("")
    setDeletePasswordError(null)
    setShowDeleteConfirm(true)
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
            <h3 className="text-2xl font-extrabold text-gray-900">
              {mode === 'create' ? 'Create New Recipe' : 'Edit Recipe'}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={updateLoading || deleteLoading}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Messages */}
          {(validationError || updateError || deleteError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm">
                  {validationError || updateError || deleteError}
                </p>
              </div>
            </div>
          )}
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
                  <div className="w-36">
                    <select
                      value={ingredient.preferredUnit || ""}
                      onChange={e => handleIngredientChange(index, "preferredUnit", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-sm bg-white"
                    >
                      <option value="">Preferred Unit</option>
                      <option value="liters">Liters</option>
                      <option value="quarts">Quarts</option>
                      <option value="gallons">Gallons</option>
                      <option value="each">Each</option>
                      <option value="12oz cans">12oz Cans</option>
                      <option value="4oz bottle">4oz Bottle</option>
                    </select>
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
        <div className="flex justify-between items-center p-4 border-t border-gray-300 bg-gray-50 rounded-b-xl">
          {/* Delete Button (only in edit mode with DB ID) */}
          <div>
            {mode === 'edit' && cocktailId && (
              <button
                onClick={handleOpenDeleteConfirm}
                disabled={updateLoading || deleteLoading}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={updateLoading || deleteLoading}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateLoading || deleteLoading}
              className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === 'create' ? 'Create Recipe' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Recipe?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{editedRecipe.name}"? This action cannot be undone.
              </p>
              
              {/* Password Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter password to confirm deletion:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeletePasswordError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword.trim() === DELETE_PASSWORD) {
                      handleDelete()
                    }
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                  autoFocus
                />
                {deletePasswordError && (
                  <p className="mt-2 text-sm text-red-600">{deletePasswordError}</p>
                )}
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {deleteError}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword("")
                    setDeletePasswordError(null)
                  }}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading || deletePassword.trim() !== DELETE_PASSWORD}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
