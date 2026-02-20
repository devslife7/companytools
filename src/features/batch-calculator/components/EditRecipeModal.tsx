"use client"
import React, { useState, useEffect, useRef } from "react"
import { X, PlusCircle, Trash2, Save, Loader2, AlertCircle } from "lucide-react"
import type { CocktailRecipe, Ingredient, CocktailMethod, GlassType } from "../types"
import { COCKTAIL_SEASONS } from "../types"
import { useUpdateCocktail, useDeleteCocktail, useIngredientNames, type IngredientSuggestion } from "../hooks"
import { parseAmount } from "../lib/calculations"
import { calculateCocktailABV } from "../lib/abv"
import { CoupeIcon, FluteIcon, HighballIcon, MartiniIcon, RocksIcon, ServedUpIcon } from "./GlassIcons"

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

const GLASS_OPTIONS = [
  { value: "Coupe", label: "Coupe", Icon: CoupeIcon },
  { value: "Flute", label: "Flute", Icon: FluteIcon },
  { value: "Highball", label: "Highball", Icon: HighballIcon },
  { value: "Martini", label: "Martini", Icon: MartiniIcon },
  { value: "Rocks", label: "Rocks", Icon: RocksIcon },
  { value: "Served Up", label: "Served Up", Icon: ServedUpIcon },
]

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
  const [initialRecipeState, setInitialRecipeState] = useState<CocktailRecipe | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null)
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState<number | null>(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState<number>(-1)

  // Refs for auto-focusing new ingredients
  const desktopIngredientRefs = useRef<(HTMLInputElement | null)[]>([])
  const mobileIngredientRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusNewIngredientIndex, setFocusNewIngredientIndex] = useState<number | null>(null)

  const { updateCocktail, loading: updateLoading, error: updateError } = useUpdateCocktail()
  const { deleteCocktail, loading: deleteLoading, error: deleteError } = useDeleteCocktail()
  const ingredientNames = useIngredientNames()

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
      setInitialRecipeState(parsedRecipe)
    } else if (mode === 'create') {
      // Initialize empty recipe for create mode
      const newRecipe: CocktailRecipe = {
        name: '',
        method: 'Build',
        glassType: 'Highball',
        season: 'Spring 2026',
        ingredients: [{ name: '', amount: '', unit: 'oz', orderUnit: '' }],
      }
      setEditedRecipe(newRecipe)
      setInitialRecipeState(newRecipe)
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

  // Handle focusing new ingredient inputs
  useEffect(() => {
    if (focusNewIngredientIndex !== null && editedRecipe) {
      // Small timeout to ensure DOM update
      const timeoutId = setTimeout(() => {
        const desktopInput = desktopIngredientRefs.current[focusNewIngredientIndex]
        const mobileInput = mobileIngredientRefs.current[focusNewIngredientIndex]

        // Try to focus visible input
        if (desktopInput && desktopInput.offsetParent !== null) {
          desktopInput.focus()
        } else if (mobileInput && mobileInput.offsetParent !== null) {
          mobileInput.focus()
        }

        setFocusNewIngredientIndex(null)
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [focusNewIngredientIndex, editedRecipe])

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

  const handleSeasonChange = (value: string) => {
    setEditedRecipe(prev => ({ ...prev!, season: value as CocktailRecipe['season'] || undefined }))
  }

  const handleInstructionsChange = (value: string) => {
    setEditedRecipe(prev => ({ ...prev!, instructions: value }))
  }

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    if (!editedRecipe) return
    const newIngredients = [...editedRecipe.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }

    setEditedRecipe({
      ...editedRecipe,
      ingredients: newIngredients,
    })
  }

  const handleIngredientSelect = (index: number, suggestion: IngredientSuggestion) => {
    if (!editedRecipe) return
    const newIngredients = [...editedRecipe.ingredients]
    const current = newIngredients[index]
    newIngredients[index] = {
      ...current,
      name: suggestion.name,
      ...(!current.orderUnit && suggestion.orderUnit ? { orderUnit: suggestion.orderUnit } : {}),
    }
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients })
  }

  const handleAddIngredient = () => {
    if (!editedRecipe) return
    const newIngredients = [...editedRecipe.ingredients, { name: "", amount: "", unit: "oz", orderUnit: "" }]

    setEditedRecipe({
      ...editedRecipe,
      ingredients: newIngredients,
    })
    setFocusNewIngredientIndex(newIngredients.length - 1)
  }

  const handleRemoveIngredient = (index: number) => {
    if (!editedRecipe) return
    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index)

    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients })
  }

  const handleSave = async () => {
    // Check if changes were made
    if (initialRecipeState && JSON.stringify(editedRecipe) === JSON.stringify(initialRecipeState)) {
      onClose()
      return
    }

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
        ...(ing.orderUnit?.trim() && { orderUnit: ing.orderUnit.trim() }),
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

    // Calculate ABV from ingredients
    const finalABV = calculateCocktailABV(validIngredients)

    // If editing existing recipe with database ID, save to database
    if (mode === 'edit' && cocktailId) {
      const updatedRecipe = await updateCocktail(cocktailId, {
        name: editedRecipe.name.trim(),
        method: editedRecipe.method,
        glassType: editedRecipe.glassType,
        instructions: editedRecipe.instructions?.trim() || undefined,
        abv: finalABV,
        season: editedRecipe.season,
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

  const displayedABV = calculateCocktailABV(editedRecipe.ingredients)
  const isMocktail = displayedABV === 0

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
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-white/50">
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
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              Cocktail Name
              {mode === 'create' && (
                <span className="text-[10px] font-medium text-gray-400">required</span>
              )}
            </label>
            <input
              type="text"
              value={editedRecipe.name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base"
              placeholder="Enter cocktail name"
              inputMode="text"
            />
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
            <select
              value={editedRecipe.season || ""}
              onChange={e => handleSeasonChange(e.target.value)}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-base md:text-base bg-white"
            >
              <option value="">No season</option>
              {COCKTAIL_SEASONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Glass Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Glass Type</label>
            <div className="flex overflow-x-auto py-1 gap-3 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {GLASS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleGlassTypeChange(option.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 min-w-[90px] gap-2 rounded-xl border transition-all duration-200 snap-center shrink-0 group
                    ${editedRecipe.glassType === option.value
                      ? 'bg-white border-orange-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                  `}
                  type="button"
                >
                  <option.Icon className={`w-7 h-7 transition-colors duration-200 ${editedRecipe.glassType === option.value ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  <span className={`text-xs font-medium transition-colors duration-200 ${editedRecipe.glassType === option.value ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Method</label>
            <div>
              <div className="flex gap-3">
                <label className={`flex flex-col items-center justify-center p-3 min-w-[90px] gap-2 rounded-xl border transition-all duration-200 cursor-pointer group ${editedRecipe.method === 'Build'
                  ? 'bg-white border-orange-600'
                  : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="method"
                    value="Build"
                    checked={editedRecipe.method === 'Build'}
                    onChange={e => handleMethodChange(e.target.value as CocktailMethod)}
                    className="sr-only"
                  />
                  <div className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 ${editedRecipe.method === 'Build' ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                    {/* Build Icon (Layered/Building) */}
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${editedRecipe.method === 'Build' ? 'text-orange-600' : 'text-gray-600'
                    }`}>Build</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-3 min-w-[90px] gap-2 rounded-xl border transition-all duration-200 cursor-pointer group ${editedRecipe.method === 'Shake'
                  ? 'bg-white border-orange-600'
                  : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="method"
                    value="Shake"
                    checked={editedRecipe.method === 'Shake'}
                    onChange={e => handleMethodChange(e.target.value as CocktailMethod)}
                    className="sr-only"
                  />
                  <div className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 ${editedRecipe.method === 'Shake' ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                    {/* Shake Icon (Shaker) */}
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 6h14" />
                      <path d="M19 6L17 20a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
                      <path d="M8.5 2h7" />
                      <path d="M9 2v4" />
                      <path d="M15 2v4" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${editedRecipe.method === 'Shake' ? 'text-orange-600' : 'text-gray-600'
                    }`}>Shake</span>
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
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
                  1. Combine ingredients{'\n'}2. Shake or Build{'\n'}3. Garnish
                </div>
              )}
            </div>
          </div>



          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">Ingredients</label>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ABV</span>
                <span className={`text-sm font-bold ${isMocktail ? 'text-green-600' : 'text-orange-600'}`}>
                  {displayedABV}%
                </span>
              </div>
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block rounded-xl border border-gray-200">
              {/* Column headers */}
              <div
                className="grid border-b border-gray-200 bg-gray-50/80 rounded-t-xl"
                style={{ gridTemplateColumns: '1fr 76px 88px 114px 36px' }}
              >
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredient</div>
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Qty</div>
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit</div>
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order As</div>
                <div />
              </div>

              {/* Ingredient rows */}
              <div className="bg-white divide-y divide-gray-100">
                {editedRecipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="group grid items-stretch hover:bg-orange-50/20 transition-colors duration-100"
                    style={{ gridTemplateColumns: '1fr 76px 88px 114px 36px' }}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-xs font-bold text-gray-200 w-4 shrink-0 tabular-nums select-none">{index + 1}</span>
                      <div className="flex-1 relative">
                        <input
                          ref={el => { desktopIngredientRefs.current[index] = el }}
                          type="text"
                          value={ingredient.name}
                          onChange={e => {
                            handleIngredientChange(index, "name", e.target.value)
                            setActiveAutocompleteIndex(index)
                            setHighlightedSuggestion(-1)
                          }}
                          onFocus={() => {
                            setActiveAutocompleteIndex(index)
                            setHighlightedSuggestion(-1)
                          }}
                          onBlur={() => setTimeout(() => setActiveAutocompleteIndex(null), 150)}
                          onKeyDown={e => {
                            const isActive = activeAutocompleteIndex === index
                            const currentSuggestions = isActive && ingredient.name.trim().length >= 1
                              ? ingredientNames
                                .filter(s => s.name.toLowerCase().includes(ingredient.name.toLowerCase().trim()))
                                .slice(0, 8)
                              : []
                            if (!isActive || currentSuggestions.length === 0) return
                            if (e.key === "ArrowDown") {
                              e.preventDefault()
                              setHighlightedSuggestion(h => Math.min(h + 1, currentSuggestions.length - 1))
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault()
                              setHighlightedSuggestion(h => Math.max(h - 1, 0))
                            } else if (e.key === "Enter" && highlightedSuggestion >= 0) {
                              e.preventDefault()
                              handleIngredientSelect(index, currentSuggestions[highlightedSuggestion])
                              setActiveAutocompleteIndex(null)
                              setHighlightedSuggestion(-1)
                            } else if (e.key === "Escape") {
                              setActiveAutocompleteIndex(null)
                              setHighlightedSuggestion(-1)
                            }
                          }}
                          className="w-full px-1 py-1.5 bg-transparent border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none text-gray-900 text-sm placeholder:text-gray-300 transition-colors"
                          placeholder="e.g. Gin, Lime juice…"
                          inputMode="text"
                          autoComplete="off"
                        />
                        {(() => {
                          const isActive = activeAutocompleteIndex === index
                          const currentSuggestions = isActive && ingredient.name.trim().length >= 1
                            ? ingredientNames
                              .filter(s => s.name.toLowerCase().includes(ingredient.name.toLowerCase().trim()))
                              .slice(0, 8)
                            : []
                          if (!isActive || currentSuggestions.length === 0) return null
                          return (
                            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {currentSuggestions.map((suggestion, si) => (
                                <li
                                  key={suggestion.name}
                                  onMouseDown={() => {
                                    handleIngredientSelect(index, suggestion)
                                    setActiveAutocompleteIndex(null)
                                    setHighlightedSuggestion(-1)
                                  }}
                                  onMouseEnter={() => setHighlightedSuggestion(si)}
                                  className={`px-4 py-2 cursor-pointer text-sm ${highlightedSuggestion === si
                                    ? "bg-orange-50 text-orange-700"
                                    : "text-gray-900 hover:bg-gray-50"
                                    }`}
                                >
                                  {suggestion.name}
                                </li>
                              ))}
                            </ul>
                          )
                        })()}
                      </div>
                    </div>
                    {/* Qty */}
                    <div className="border-l border-gray-100 flex items-center px-2 py-1.5">
                      <input
                        type="text"
                        value={ingredient.amount}
                        onChange={e => handleIngredientChange(index, "amount", e.target.value)}
                        className="w-full px-1 py-1.5 bg-transparent border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none text-gray-900 text-sm text-right placeholder:text-gray-300 transition-colors"
                        placeholder="1.5"
                        inputMode="decimal"
                      />
                    </div>
                    {/* Unit */}
                    <div className="border-l border-gray-100 flex items-center px-2 py-1.5">
                      <select
                        value={ingredient.unit || "oz"}
                        onChange={e => handleIngredientChange(index, "unit", e.target.value)}
                        className="w-full px-1 py-1.5 bg-transparent border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none text-gray-700 text-sm transition-colors cursor-pointer"
                      >
                        <option value="oz">oz</option>
                        <option value="dash">dash</option>
                        <option value="tsp">tsp</option>
                        <option value="each">each</option>
                      </select>
                    </div>
                    {/* Order As */}
                    <div className="border-l border-gray-100 flex items-center px-2 py-1.5">
                      <select
                        value={ingredient.orderUnit || ""}
                        onChange={e => handleIngredientChange(index, "orderUnit", e.target.value)}
                        className="w-full px-1 py-1.5 bg-transparent border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none text-gray-500 text-sm transition-colors cursor-pointer"
                      >
                        <option value="">—</option>
                        <option value="liters">Liters</option>
                        <option value="quarts">Quarts</option>
                        <option value="gallons">Gallons</option>
                        <option value="each">Each</option>
                        <option value="12oz can">12oz Can</option>
                        <option value="4oz bottle">4oz Bottle</option>
                      </select>
                    </div>
                    {/* Remove */}
                    <div className="border-l border-gray-100 flex items-center justify-center">
                      {editedRecipe.ingredients.length > 1 && (
                        <button
                          onClick={() => handleRemoveIngredient(index)}
                          className="p-1.5 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50"
                          title="Remove ingredient"
                          aria-label="Remove ingredient"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add ingredient */}
              <button
                onClick={handleAddIngredient}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-400 hover:text-orange-600 hover:bg-orange-50/30 transition-colors border-t border-dashed border-gray-200 rounded-b-xl"
              >
                <PlusCircle className="w-4 h-4" />
                Add ingredient
              </button>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden space-y-2">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Name row */}
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0 tabular-nums select-none">{index + 1}</span>
                    <div className="flex-1 relative">
                      <input
                        ref={el => { mobileIngredientRefs.current[index] = el }}
                        type="text"
                        value={ingredient.name}
                        onChange={e => {
                          handleIngredientChange(index, "name", e.target.value)
                          setActiveAutocompleteIndex(index)
                          setHighlightedSuggestion(-1)
                        }}
                        onFocus={() => {
                          setActiveAutocompleteIndex(index)
                          setHighlightedSuggestion(-1)
                        }}
                        onBlur={() => setTimeout(() => setActiveAutocompleteIndex(null), 150)}
                        onKeyDown={e => {
                          const isActive = activeAutocompleteIndex === index
                          const currentSuggestions = isActive && ingredient.name.trim().length >= 1
                            ? ingredientNames
                              .filter(s => s.name.toLowerCase().includes(ingredient.name.toLowerCase().trim()))
                              .slice(0, 8)
                            : []
                          if (!isActive || currentSuggestions.length === 0) return
                          if (e.key === "ArrowDown") {
                            e.preventDefault()
                            setHighlightedSuggestion(h => Math.min(h + 1, currentSuggestions.length - 1))
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault()
                            setHighlightedSuggestion(h => Math.max(h - 1, 0))
                          } else if (e.key === "Enter" && highlightedSuggestion >= 0) {
                            e.preventDefault()
                            handleIngredientSelect(index, currentSuggestions[highlightedSuggestion])
                            setActiveAutocompleteIndex(null)
                            setHighlightedSuggestion(-1)
                          } else if (e.key === "Escape") {
                            setActiveAutocompleteIndex(null)
                            setHighlightedSuggestion(-1)
                          }
                        }}
                        className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 focus:outline-none placeholder:text-gray-300 py-1 min-h-[36px]"
                        placeholder="Ingredient name…"
                        inputMode="text"
                        autoComplete="off"
                      />
                      {(() => {
                        const isActive = activeAutocompleteIndex === index
                        const currentSuggestions = isActive && ingredient.name.trim().length >= 1
                          ? ingredientNames
                            .filter(s => s.name.toLowerCase().includes(ingredient.name.toLowerCase().trim()))
                            .slice(0, 8)
                          : []
                        if (!isActive || currentSuggestions.length === 0) return null
                        return (
                          <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {currentSuggestions.map((suggestion, si) => (
                              <li
                                key={suggestion.name}
                                onMouseDown={() => {
                                  handleIngredientSelect(index, suggestion)
                                  setActiveAutocompleteIndex(null)
                                  setHighlightedSuggestion(-1)
                                }}
                                onMouseEnter={() => setHighlightedSuggestion(si)}
                                className={`px-4 py-2 cursor-pointer text-sm ${highlightedSuggestion === si
                                  ? "bg-orange-50 text-orange-700"
                                  : "text-gray-900 hover:bg-gray-50"
                                  }`}
                              >
                                {suggestion.name}
                              </li>
                            ))}
                          </ul>
                        )
                      })()}
                    </div>
                    {editedRecipe.ingredients.length > 1 && (
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors shrink-0 hover:bg-red-50 rounded-lg"
                        aria-label="Remove ingredient"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Qty / Unit / Order */}
                  <div className="flex divide-x divide-gray-100">
                    <div className="flex-1 px-3 py-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Qty</div>
                      <input
                        type="text"
                        value={ingredient.amount}
                        onChange={e => handleIngredientChange(index, "amount", e.target.value)}
                        className="w-full text-sm text-gray-900 bg-transparent border-0 focus:outline-none placeholder:text-gray-300 p-0 min-h-[32px]"
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex-1 px-3 py-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Unit</div>
                      <select
                        value={ingredient.unit || "oz"}
                        onChange={e => handleIngredientChange(index, "unit", e.target.value)}
                        className="w-full text-sm text-gray-700 bg-transparent border-0 focus:outline-none p-0 min-h-[32px] cursor-pointer"
                      >
                        <option value="oz">oz</option>
                        <option value="dash">dash</option>
                        <option value="tsp">tsp</option>
                        <option value="each">each</option>
                      </select>
                    </div>
                    <div className="flex-1 px-3 py-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order As</div>
                      <select
                        value={ingredient.orderUnit || ""}
                        onChange={e => handleIngredientChange(index, "orderUnit", e.target.value)}
                        className="w-full text-sm text-gray-500 bg-transparent border-0 focus:outline-none p-0 min-h-[32px] cursor-pointer"
                      >
                        <option value="">—</option>
                        <option value="liters">Liters</option>
                        <option value="quarts">Quarts</option>
                        <option value="gallons">Gallons</option>
                        <option value="each">Each</option>
                        <option value="12oz can">12oz Can</option>
                        <option value="4oz bottle">4oz Bottle</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddIngredient}
                className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-dashed border-orange-300 transition-colors min-h-[48px]"
              >
                <PlusCircle className="w-4 h-4" />
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
                  className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-gray-900 text-base md:text-base min-h-[44px] md:min-h-0 transition-colors"
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
