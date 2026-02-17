"use client"
import React, { useState, useEffect } from "react"
import { X, PlusCircle, Trash2, Save, Loader2, AlertCircle } from "lucide-react"
import type { CocktailRecipe, Ingredient, CocktailMethod, GlassType } from "../types"
import { useUpdateCocktail, useDeleteCocktail } from "../hooks"
import { parseAmount } from "../lib/calculations"
import { calculateCocktailABV } from "../lib/abv"

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

  const { updateCocktail, loading: updateLoading, error: updateError } = useUpdateCocktail()
  const { deleteCocktail, loading: deleteLoading, error: deleteError } = useDeleteCocktail()

  // Helper function to parse existing amount strings for backward compatibility
  const parseIngredientAmount = (ingredient: Ingredient): { amount: string; unit: string } => {
    // If unit already exists, use it directly
    if (ingredient.unit) {
      return { amount: ingredient.amount, unit: ingredient.unit }
    }

    // Otherwise, parse the amount string to extract unit
    if (!ingredient.amount) {
      return { amount: '', unit: 'oz' } // Default to oz
    }

    const parsed = parseAmount(ingredient.amount)

    // Extract numeric value from amount string
    const lowerAmount = ingredient.amount.toLowerCase().trim()

    // Handle special cases
    if (lowerAmount.includes("top") || lowerAmount.includes("n/a")) {
      return { amount: '0', unit: 'oz' }
    }

    // Try to match number pattern (including fractions, decimals, ranges)
    const match = lowerAmount.match(/([\d\.\/\,\-\s]+)/)

    if (match) {
      const numberStr = match[1].trim()
      // Extract unit from parsed result, or default to 'oz'
      let extractedUnit = 'oz'
      if (parsed.unit && parsed.unit !== 'N/A' && parsed.unit !== 'count' && parsed.unit !== 'Top') {
        // Normalize unit names
        if (parsed.unit.toLowerCase().startsWith('oz')) {
          extractedUnit = 'oz'
        } else if (parsed.unit.toLowerCase().startsWith('dash')) {
          extractedUnit = 'dash'
        } else if (parsed.unit.toLowerCase().startsWith('tsp')) {
          extractedUnit = 'tsp'
        } else if (parsed.unit.toLowerCase().includes('each')) {
          extractedUnit = 'each'
        } else {
          // For count items, use 'each'
          extractedUnit = parsed.type === 'count' ? 'each' : 'oz'
        }
      }
      return { amount: numberStr, unit: extractedUnit }
    }

    // Fallback: if no number found, treat as count item with unit 'each'
    return { amount: ingredient.amount, unit: 'each' }
  }

  // Initialize edited recipe when modal opens or recipe changes
  useEffect(() => {
    if (recipe) {
      // Deep copy and parse amounts for backward compatibility
      const parsedRecipe = JSON.parse(JSON.stringify(recipe)) as CocktailRecipe
      parsedRecipe.ingredients = parsedRecipe.ingredients.map(ing => {
        const parsed = parseIngredientAmount(ing)
        return {
          ...ing,
          amount: parsed.amount,
          unit: parsed.unit,
        }
      })
      setEditedRecipe(parsedRecipe)
    } else if (mode === 'create') {
      // Initialize empty recipe for create mode
      setEditedRecipe({
        name: '',
        method: 'Build',
        ingredients: [{ name: '', amount: '', unit: 'oz', preferredUnit: '' }],
      })
    }
    setValidationError(null)
  }, [recipe, isOpen, mode])

  // Watch for deleteError changes and update deletePasswordError if it's a password error
  useEffect(() => {
    if (deleteError) {
      // Check if it's a password-related error
      if (deleteError.toLowerCase().includes('password') || deleteError.toLowerCase().includes('incorrect')) {
        setDeletePasswordError(deleteError)
      } else {
        // For other errors, clear password error state
        setDeletePasswordError(null)
      }
    } else {
      setDeletePasswordError(null)
    }
  }, [deleteError])

  if (!isOpen || !editedRecipe) return null

  const handleNameChange = (value: string) => {
    setEditedRecipe({ ...editedRecipe, name: value })
  }

  const handleMethodChange = (value: CocktailMethod) => {
    setEditedRecipe({ ...editedRecipe, method: value })
  }

  const handleGlassTypeChange = (value: string) => {
    setEditedRecipe(prev => ({ ...prev!, glassType: value as GlassType || undefined }))
  }

  const handleInstructionsChange = (value: string) => {
    setEditedRecipe(prev => ({ ...prev!, instructions: value }))
  }

  const recalculateABV = (ingredients: Ingredient[]) => {
    // Only calculate if ingredients exist
    const abv = calculateCocktailABV(ingredients)
    return abv
  }

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    if (!editedRecipe) return
    const newIngredients = [...editedRecipe.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }

    // Auto-calculate ABV on ingredient change
    const newABV = recalculateABV(newIngredients)

    setEditedRecipe({
      ...editedRecipe,
      ingredients: newIngredients,
      abv: newABV
    })
  }

  const handleAddIngredient = () => {
    if (!editedRecipe) return
    const newIngredients = [...editedRecipe.ingredients, { name: "", amount: "", unit: "oz", preferredUnit: "" }]

    setEditedRecipe({
      ...editedRecipe,
      ingredients: newIngredients,
      // No change to ABV usually when adding empty ingredient, but let's keep consistent
    })
  }

  const handleRemoveIngredient = (index: number) => {
    if (!editedRecipe) return
    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index)
    const newABV = recalculateABV(newIngredients)

    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients, abv: newABV })
  }

  const handleSave = async () => {
    // Validation
    if (!editedRecipe.name.trim()) {
      setValidationError("Cocktail name is required")
      return
    }

    if (!editedRecipe.method || (editedRecipe.method !== 'Shake' && editedRecipe.method !== 'Build')) {
      setValidationError("Method must be either Shake or Build")
      return
    }

    const validIngredients = editedRecipe.ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        name: ing.name.trim(),
        amount: ing.amount.trim(),
        ...(ing.unit?.trim() && { unit: ing.unit.trim() }),
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

    // Calculate ABV if not explicitly set by user
    const finalABV = editedRecipe.abv !== undefined ? editedRecipe.abv : recalculateABV(validIngredients)

    // If editing existing recipe with database ID, save to database
    if (mode === 'edit' && cocktailId) {
      const updatedRecipe = await updateCocktail(cocktailId, {
        name: editedRecipe.name.trim(),
        method: editedRecipe.method,
        glassType: editedRecipe.glassType,
        instructions: editedRecipe.instructions?.trim() || undefined,
        abv: finalABV,
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
        method: editedRecipe.method as CocktailMethod,
        instructions: editedRecipe.instructions?.trim() || undefined,
        abv: finalABV,
        ingredients: validIngredients,
      })
      onClose()
    }
  }

  const handleDelete = async () => {
    if (!cocktailId) return

    // Validate password is provided
    if (!deletePassword.trim()) {
      setDeletePasswordError("Password is required.")
      return
    }

    setDeletePasswordError(null)
    const success = await deleteCocktail(cocktailId, deletePassword.trim())
    if (success) {
      onDelete?.()
      onClose()
    }
    // Error handling is done via useEffect watching deleteError
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
        className="fixed inset-0 backdrop-blur-md bg-gradient-to-br from-gray-900/50 via-gray-800/40 to-gray-900/50 pointer-events-auto animate-fade-in"
        onClick={handleCancel}
      />

      {/* Modal content */}
      <div
        className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-gray-200/80 pointer-events-auto animate-modal-enter relative z-10 flex flex-col backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 rounded-t-xl backdrop-blur-sm">
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-white/50">
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
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base"
              placeholder="Enter cocktail name"
              inputMode="text"
            />
          </div>

          {/* Glass Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Glass Type</label>
            <select
              value={editedRecipe.glassType || ""}
              onChange={e => handleGlassTypeChange(e.target.value)}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base bg-white"
            >
              <option value="">Select glass type...</option>
              <option value="Rocks">Rocks</option>
              <option value="Coupe">Coupe</option>
              <option value="Martini">Martini</option>
              <option value="Highball">Highball</option>
              <option value="Flute">Flute</option>
              <option value="Served Up">Served Up</option>
            </select>
          </div>

          {/* ABV */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ABV (%)</label>
            <input
              type="number"
              value={editedRecipe.abv ?? ''}
              onChange={e => {
                const val = e.target.value;
                setEditedRecipe({
                  ...editedRecipe,
                  abv: val === '' ? undefined : parseFloat(val)
                })
              }}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base"
              placeholder="e.g. 15.5 (Leave empty for auto-detection)"
              step="0.1"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">Set to 0 for explicit Mocktail label, or leave empty to infer from ingredients.</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>

            {/* Method */}
            <div className="mb-4">
              <div className="flex gap-2">
                <label className={`flex items-center justify-center flex-1 px-5 py-3 md:py-2 rounded-lg border text-base md:text-sm font-medium cursor-pointer transition-all duration-200 min-h-[44px] md:min-h-0 ${editedRecipe.method === 'Build'
                  ? 'bg-white text-orange-600 border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="method"
                    value="Build"
                    checked={editedRecipe.method === 'Build'}
                    onChange={e => handleMethodChange(e.target.value as CocktailMethod)}
                    className="sr-only"
                  />
                  <span>Build</span>
                </label>
                <label className={`flex items-center justify-center flex-1 px-5 py-3 md:py-2 rounded-lg border text-base md:text-sm font-medium cursor-pointer transition-all duration-200 min-h-[44px] md:min-h-0 ${editedRecipe.method === 'Shake'
                  ? 'bg-white text-orange-600 border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="method"
                    value="Shake"
                    checked={editedRecipe.method === 'Shake'}
                    onChange={e => handleMethodChange(e.target.value as CocktailMethod)}
                    className="sr-only"
                  />
                  <span>Shake</span>
                </label>
              </div>
            </div>

            {/* Textarea with custom placeholder */}
            <div className="relative">
              <textarea
                value={editedRecipe.instructions || ''}
                onChange={e => handleInstructionsChange(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base resize-none relative z-10"
                placeholder=""
              />
              {!editedRecipe.instructions && (
                <div className="absolute top-3 md:top-2 left-4 text-gray-400 pointer-events-none z-20 whitespace-pre-line text-base leading-relaxed">
                  Add step by step instructions:{'\n'}1. Combine ingredients{'\n'}2. Shake or Build
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Ingredients</label>
            <div className="space-y-3">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  {/* Ingredient Name - Full width on mobile, flex-1 on desktop */}
                  <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Ingredient Name</label>
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={e => handleIngredientChange(index, "name", e.target.value)}
                      className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-sm"
                      placeholder="Ingredient name"
                      inputMode="text"
                    />
                  </div>

                  {/* Amount and Unit - Side by side on mobile, separate on desktop */}
                  <div className="flex gap-2 md:gap-3 md:items-center">
                    <div className="flex-1 md:w-24">
                      <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Amount</label>
                      <input
                        type="text"
                        value={ingredient.amount}
                        onChange={e => handleIngredientChange(index, "amount", e.target.value)}
                        className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-sm text-right md:text-right"
                        placeholder="Amount"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex-1 md:w-28">
                      <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Unit</label>
                      <select
                        value={ingredient.unit || "oz"}
                        onChange={e => handleIngredientChange(index, "unit", e.target.value)}
                        className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-sm bg-white"
                      >
                        <option value="oz">oz</option>
                        <option value="dash">dash</option>
                        <option value="tsp">tsp</option>
                        <option value="each">each</option>
                      </select>
                    </div>
                  </div>

                  {/* Preferred Unit - Full width on mobile, fixed width on desktop */}
                  <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Preferred Unit</label>
                    <select
                      value={ingredient.preferredUnit || ""}
                      onChange={e => handleIngredientChange(index, "preferredUnit", e.target.value)}
                      className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-sm bg-white"
                    >
                      <option value="">Preferred Unit</option>
                      <option value="liters">Liters</option>
                      <option value="quarts">Quarts</option>
                      <option value="gallons">Gallons</option>
                      <option value="each">Each</option>
                      <option value="12oz can">12oz Can</option>
                      <option value="4oz bottle">4oz Bottle</option>
                    </select>
                  </div>

                  {/* Delete Button - Full width on mobile, auto on desktop */}
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="w-full md:w-auto px-4 py-3 md:p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-2 md:gap-0 min-h-[44px] md:min-h-0"
                    title="Remove ingredient"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="md:hidden text-sm font-medium">Remove</span>
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddIngredient}
                className="w-full py-4 md:py-3 flex items-center justify-center gap-2 text-base md:text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-dashed border-orange-300 transition-colors min-h-[44px] md:min-h-0"
              >
                <PlusCircle className="w-5 h-5" />
                Add Ingredient
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 p-4 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 rounded-b-xl backdrop-blur-sm">
          {/* Action Buttons - Top on mobile, right on desktop */}
          <div className="flex gap-3 order-1 md:order-2">
            <button
              onClick={handleCancel}
              disabled={updateLoading || deleteLoading}
              className="flex-1 md:flex-none px-6 py-3 md:py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateLoading || deleteLoading}
              className="flex-1 md:flex-none px-6 py-3 md:py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
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

          {/* Delete Button (only in edit mode with DB ID) - Below on mobile, left on desktop */}
          <div className="w-full md:w-auto order-2 md:order-1">
            {mode === 'edit' && cocktailId && (
              <button
                onClick={handleOpenDeleteConfirm}
                disabled={updateLoading || deleteLoading}
                className="w-full md:w-auto px-4 py-3 md:py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white via-gray-50/90 to-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-200/80">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Recipe?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{editedRecipe.name}&quot;? This action cannot be undone.
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
                    if (e.key === 'Enter' && deletePassword.trim()) {
                      handleDelete()
                    }
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 text-base md:text-base min-h-[44px] md:min-h-0"
                  autoFocus
                  inputMode="text"
                />
                {deletePasswordError && (
                  <p className="mt-2 text-sm text-red-600">{deletePasswordError}</p>
                )}
              </div>

              {deleteError && !deletePasswordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword("")
                    setDeletePasswordError(null)
                  }}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto px-4 py-3 md:py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 min-h-[44px] md:min-h-0"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading || !deletePassword.trim()}
                  className="w-full sm:w-auto px-4 py-3 md:py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
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
