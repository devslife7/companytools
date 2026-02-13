"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"

// Import types
import type { Ingredient, CocktailRecipe, BatchState, CocktailMethod } from "@/features/batch-calculator/types"

// Import utilities
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport, generateShoppingListPdf, generateBatchCalculationsPdf } from "@/features/batch-calculator/lib/pdf-generator"
import { COCKTAIL_DATA } from "@/features/batch-calculator/data/cocktails"

// Import hooks
import { useCocktails, useCreateCocktail } from "@/features/batch-calculator/hooks"
import { useToast, ToastContainer } from "@/components/ui"

// Import components
import { BatchItem } from "@/features/batch-calculator/components"
import { EditRecipeModal } from "@/features/batch-calculator/components/EditRecipeModal"
import { MultiSelectCocktailSearch, Modal } from "@/components/ui"
import { Plus, ShoppingCart, Calculator, FileText, X } from "lucide-react"

// --- MAIN APP COMPONENT ---
export default function BatchCalculatorPage() {
  const [batches, setBatches] = useState<BatchState[]>([])
  const nextIdRef = React.useRef<number>(1)
  const [selectedCocktails, setSelectedCocktails] = useState<CocktailRecipe[]>([])
  const [showServingsModal, setShowServingsModal] = useState(false)
  const [missingServingsMessage, setMissingServingsMessage] = useState("")
  const [batchesWithMissingServings, setBatchesWithMissingServings] = useState<Set<number>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCocktail, setEditingCocktail] = useState<CocktailRecipe | null>(null)
  const [editingCocktailId, setEditingCocktailId] = useState<number | undefined>()
  const [filter, setFilter] = useState<'featured' | 'all'>('featured')
  const [selectedLiquor, setSelectedLiquor] = useState<string>('')
  const [availableLiquors, setAvailableLiquors] = useState<string[]>([])

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast()

  // Fetch cocktails from database (primary source) - for search/selection
  const { cocktails: apiCocktails, loading: cocktailsLoading, error: cocktailsError, refetch: refetchCocktails } = useCocktails({
    enabled: true, // Always try to use database
  })

  // Fetch unique liquors
  useEffect(() => {
    const fetchLiquors = async () => {
      try {
        const response = await fetch('/api/cocktails?liquors=true')
        if (response.ok) {
          const data = await response.json()
          setAvailableLiquors(data.liquors || [])
        }
      } catch (err) {
        console.error('Failed to fetch liquors:', err)
      }
    }
    fetchLiquors()
  }, [])

  // Fetch cocktails for display list with filter

  const { cocktails: filteredCocktailsFromDb, loading: filteredLoading, error: filteredError, refetch: refetchFilteredCocktails } = useCocktails({
    enabled: true,
    featured: filter === 'featured' ? true : undefined,
    active: true,
    liquor: selectedLiquor || undefined,
  })

  // Create cocktail mutation
  const { createCocktail, loading: createLoading } = useCreateCocktail()

  // Use database cocktails if available, fallback to static data only if database fails
  const availableCocktails = useMemo(() => {
    // If we have cocktails from database, use them
    if (!cocktailsLoading && apiCocktails.length > 0) {
      return apiCocktails
    }
    // If database failed or returned empty, fallback to static data
    if (cocktailsError || (!cocktailsLoading && apiCocktails.length === 0)) {
      return COCKTAIL_DATA
    }
    // While loading, show static data so UI doesn't break
    return COCKTAIL_DATA
  }, [apiCocktails, cocktailsLoading, cocktailsError])

  // Apply filters to static data and merge with database cocktails
  const filteredCocktails = useMemo(() => {
    // Helper function to apply filters to static data
    const applyFiltersToStatic = (data: typeof COCKTAIL_DATA) => {
      let filtered = data

      // Apply featured filter
      if (filter === 'featured') {
        filtered = filtered.filter(c => c.featured === true)
      }

      // Apply liquor filter
      if (selectedLiquor) {
        filtered = filtered.filter(c =>
          c.ingredients.some(ing =>
            ing.name.toLowerCase().includes(selectedLiquor.toLowerCase())
          )
        )
      }

      return filtered
    }

    // If database is loaded and has cocktails, use them
    if (!filteredLoading && filteredCocktailsFromDb.length > 0) {
      return filteredCocktailsFromDb
    }

    // If database error or empty, fallback to filtered static data
    if (filteredError || (!filteredLoading && filteredCocktailsFromDb.length === 0)) {
      return applyFiltersToStatic(COCKTAIL_DATA)
    }

    // While loading, show filtered static data so UI doesn't break
    return applyFiltersToStatic(COCKTAIL_DATA)
  }, [filteredCocktailsFromDb, filteredLoading, filteredError, filter, selectedLiquor])

  // Sync batches with selected cocktails
  useEffect(() => {
    setBatches(prevBatches => {
      // Create a map of existing batches by cocktail name
      const existingBatchesMap = new Map<string, BatchState>()
      prevBatches.forEach(batch => {
        if (batch.selectedCocktail) {
          existingBatchesMap.set(batch.selectedCocktail.name, batch)
        }
      })

      // Create new batches for selected cocktails that don't have a batch yet
      const newBatches: BatchState[] = []

      selectedCocktails.forEach(cocktail => {
        if (!existingBatchesMap.has(cocktail.name)) {
          // Deep copy of the recipe for editing
          const editableRecipe = JSON.parse(JSON.stringify(cocktail)) as CocktailRecipe
          newBatches.push({
            id: nextIdRef.current++,
            selectedCocktail: cocktail,
            editableRecipe: editableRecipe,
            servings: "",
            targetLiters: FIXED_BATCH_LITERS,
          })
        }
      })

      // Remove batches for cocktails that are no longer selected
      const selectedCocktailNames = new Set(selectedCocktails.map(c => c.name))
      const filteredBatches = prevBatches.filter(
        batch => !batch.selectedCocktail || selectedCocktailNames.has(batch.selectedCocktail.name)
      )

      return [...filteredBatches, ...newBatches]
    })
  }, [selectedCocktails])

  // --- CRUD Handlers for Batches Array (Memoized using useCallback) ---

  const handleUpdateBatch = useCallback((id: number, updates: Partial<BatchState>) => {
    setBatches(prev => prev.map(batch => (batch.id === id ? { ...batch, ...updates } : batch)))
  }, [])

  const handleRemoveBatch = useCallback(
    (idToRemove: number) => {
      const batchToRemove = batches.find(b => b.id === idToRemove)
      if (batchToRemove?.selectedCocktail) {
        // Remove from selected cocktails
        setSelectedCocktails(prev => prev.filter(c => c.id !== batchToRemove.selectedCocktail!.id))
      }
      setBatches(prev => prev.filter(batch => batch.id !== idToRemove))
    },
    [batches]
  )

  // Handler for when cocktails are selected/deselected from the search bar
  const handleCocktailSelectionChange = useCallback((selected: CocktailRecipe[]) => {
    setSelectedCocktails(selected)
  }, [])

  // --- Specific Data Handlers (Memoized using useCallback) ---

  const handleServingsChange = useCallback(
    (id: number, value: string) => {
      // Clear error state when user starts typing
      if (batchesWithMissingServings.has(id)) {
        setBatchesWithMissingServings(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }

      // Allow empty string to clear the input
      if (value === "") {
        handleUpdateBatch(id, { servings: "" })
        return
      }

      const num = parseInt(value, 10)
      // Only update if it's a valid non-negative number
      if (!isNaN(num) && num >= 0) {
        handleUpdateBatch(id, { servings: num })
      }
    },
    [handleUpdateBatch, batchesWithMissingServings]
  )

  const handleIngredientChange = useCallback((id: number, newIngredients: Ingredient[]) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, ingredients: newIngredients },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const handleNameChange = useCallback((id: number, newName: string) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, name: newName },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const handleMethodChange = useCallback((id: number, newMethod: CocktailMethod) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, method: newMethod },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const canExport = batches.some(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )

  // Calculate progress for servings
  const servingsProgress = useMemo(() => {
    const totalBatches = batches.filter(b => b.editableRecipe).length
    const batchesWithServings = batches.filter(
      b => b.editableRecipe && typeof b.servings === "number" && b.servings > 0
    ).length
    return { completed: batchesWithServings, total: totalBatches }
  }, [batches])

  const handleGenerateShoppingList = () => {
    generateShoppingListPdf(batches)
  }

  const handleGenerateBatchCalculations = () => {
    // Check if any batch is missing servings
    const batchesWithoutServings = batches.filter(
      b => b.editableRecipe && (b.servings === "" || b.servings === 0 || (typeof b.servings === "number" && b.servings <= 0))
    )

    if (batchesWithoutServings.length > 0) {
      const cocktailNames = batchesWithoutServings
        .map(b => b.selectedCocktail?.name || `Batch #${b.id}`)
        .join(", ")

      const missingIds = new Set(batchesWithoutServings.map(b => b.id))
      setBatchesWithMissingServings(missingIds)

      setMissingServingsMessage(
        `Please enter servings for all cocktails before generating batch calculations.\n\nMissing servings for: ${cocktailNames}\n\nServings are required to generate accurate batch calculations.`
      )
      setShowServingsModal(true)
      return
    }

    setBatchesWithMissingServings(new Set())
    generateBatchCalculationsPdf(batches)
  }

  const handleGeneratePdfReport = () => {
    // Check if any batch is missing servings
    const batchesWithoutServings = batches.filter(
      b => b.editableRecipe && (b.servings === "" || b.servings === 0 || (typeof b.servings === "number" && b.servings <= 0))
    )

    if (batchesWithoutServings.length > 0) {
      const cocktailNames = batchesWithoutServings
        .map(b => b.selectedCocktail?.name || `Batch #${b.id}`)
        .join(", ")

      // Highlight batches with missing servings
      const missingIds = new Set(batchesWithoutServings.map(b => b.id))
      setBatchesWithMissingServings(missingIds)

      setMissingServingsMessage(
        `Please enter servings for all cocktails before downloading.\n\nMissing servings for: ${cocktailNames}\n\nServings are required to generate accurate batch calculations.`
      )
      setShowServingsModal(true)
      return
    }

    // Clear error state if all servings are entered
    setBatchesWithMissingServings(new Set())

    if (!canExport) return
    generatePdfReport(batches)
  }

  // Favorite cocktails to show when no cocktails are selected
  // Handle create new recipe
  const handleCreateCocktail = useCallback(async (recipe: CocktailRecipe) => {
    const newRecipe = await createCocktail({
      name: recipe.name,
      method: recipe.method,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
    })

    if (newRecipe) {
      success(`Recipe "${newRecipe.name}" created successfully!`)
      await refetchCocktails()
      // Optionally add to selected cocktails
      setSelectedCocktails(prev => [...prev, newRecipe])
      setShowAddModal(false)
    } else {
      showError("Failed to create recipe. Please try again.")
    }
  }, [createCocktail, refetchCocktails, success, showError])

  // Handle update recipe
  const handleUpdateCocktail = useCallback(async (updatedRecipe: CocktailRecipe) => {
    // Update local batches if this recipe is in use
    setBatches(prev =>
      prev.map(batch => {
        if (batch.selectedCocktail?.id === updatedRecipe.id || batch.editableRecipe?.id === updatedRecipe.id) {
          return {
            ...batch,
            selectedCocktail: updatedRecipe,
            editableRecipe: updatedRecipe,
          }
        }
        return batch
      })
    )

    // Update selected cocktails list
    setSelectedCocktails(prev =>
      prev.map(cocktail => (cocktail.id === updatedRecipe.id ? updatedRecipe : cocktail))
    )

    // Refresh cocktails list from database
    await Promise.all([refetchCocktails(), refetchFilteredCocktails()])
    success(`Recipe "${updatedRecipe.name}" updated successfully!`)
    setShowEditModal(false)
  }, [refetchCocktails, refetchFilteredCocktails, success])

  // Handle delete recipe
  const handleDeleteCocktail = useCallback(async () => {
    if (!editingCocktail) return

    // Remove from selected cocktails if it's selected
    setSelectedCocktails(prev => prev.filter(c => c.id !== editingCocktail.id))

    // Remove batches using this recipe
    setBatches(prev => prev.filter(batch => batch.selectedCocktail?.id !== editingCocktail.id))

    // Refresh cocktails list
    await Promise.all([refetchCocktails(), refetchFilteredCocktails()])
    success(`Recipe "${editingCocktail.name}" deleted successfully!`)
    setShowEditModal(false)
  }, [editingCocktail, refetchCocktails, refetchFilteredCocktails, success])

  // Open edit modal
  const handleOpenEditModal = useCallback((cocktail: CocktailRecipe, cocktailId?: number) => {
    setEditingCocktail(cocktail)
    setEditingCocktailId(cocktailId)
    setShowEditModal(true)
  }, [])

  const hasSelectedCocktails = selectedCocktails.length > 0

  return (
    <div className="min-h-screen text-gray-900 font-sans py-6 sm:py-8">
      <div className="w-full">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Header with Add Recipe Button */}
        <div className="mb-6 px-0 flex justify-between items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Batch Calculator</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200 shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Recipe
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Cocktail Selection */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Select Cocktails</h2>
                <p className="text-sm text-gray-500">Search or filter to add to your batch.</p>
              </div>

              {/* Database Status
              {cocktailsLoading ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm mb-4">
                  Loading cocktails from database...
                </div>
              ) : cocktailsError ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-600 text-sm mb-4">
                  ⚠️ Database unavailable, using static data fallback. Error: {cocktailsError}
                </div>
              ) : apiCocktails.length > 0 ? (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs mb-4">
                  ✓ Loaded {apiCocktails.length} cocktails from database
                </div>
              ) : null} */}

              {/* Search Bar + Filter Dropdowns */}
              <div className="mb-4 flex flex-col gap-3">
                <div className="w-full relative">
                  <MultiSelectCocktailSearch
                    cocktails={availableCocktails}
                    selectedCocktails={selectedCocktails}
                    onSelectionChange={handleCocktailSelectionChange}
                    label="Search by name..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Featured/All Filter Dropdown */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'featured' | 'all')}
                    className="w-full px-3 py-2 rounded-lg font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="featured">Featured</option>
                    <option value="all">All</option>
                  </select>

                  {/* Liquor Filter Dropdown */}
                  <select
                    value={selectedLiquor}
                    onChange={(e) => setSelectedLiquor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="">All Liquors</option>
                    {availableLiquors.map((liquor) => (
                      <option key={liquor} value={liquor}>
                        {liquor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Cocktails Chips */}
              {selectedCocktails.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {selectedCocktails.map(cocktail => (
                    <div
                      key={cocktail.name}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full text-sm font-semibold text-gray-900"
                    >
                      <span>{cocktail.name}</span>
                      <button
                        onClick={() => handleCocktailSelectionChange(selectedCocktails.filter(c => c.id !== cocktail.id))}
                        className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        title="Remove cocktail"
                      >
                        <X className="w-3 h-3 text-orange-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cocktails List */}
            <div className="mb-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredLoading ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  Loading cocktails...
                </div>
              ) : filteredCocktails.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  {filter === 'featured' ? 'No featured cocktails found.' : 'No cocktails found.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCocktails.map(cocktail => {
                    const isSelected = selectedCocktails.some(c => c.id === cocktail.id)
                    return (
                      <button
                        key={cocktail.id || cocktail.name}
                        onClick={() => {
                          if (isSelected) {
                            handleCocktailSelectionChange(selectedCocktails.filter(c => c.id !== cocktail.id))
                          } else {
                            handleCocktailSelectionChange([...selectedCocktails, cocktail])
                          }
                        }}
                        className={`p-4 rounded-lg border text-left transition-all duration-200 ${isSelected
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1 text-base">{cocktail.name}</h3>
                            {cocktail.featured && (
                              <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] uppercase font-bold tracking-wider rounded mb-1">
                                Featured
                              </span>
                            )}

                            <p className="text-xs text-gray-500 line-clamp-2">
                              {cocktail.ingredients.map(ing => ing.name).join(', ')}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="ml-2 text-orange-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>


          {/* RIGHT COLUMN: Batch Calculator Workspace */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {!hasSelectedCocktails ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Calculator className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cocktails Selected</h3>
                <p className="text-gray-500 max-w-sm">
                  Select cocktails from the list on the left to start calculating your batches.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="mb-6 pb-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Batch Worksheet</h2>
                        <p className="text-sm text-gray-500 mt-1">Set servings and adjust recipes.</p>
                      </div>
                      {servingsProgress.total > 0 && (
                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-600">
                            Progress: {servingsProgress.completed}/{servingsProgress.total}
                          </span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 transition-all duration-300"
                              style={{ width: `${(servingsProgress.completed / servingsProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Render all independent cocktail batch slots */}
                    {batches.map(batch => (
                      <BatchItem
                        key={batch.id}
                        batch={batch}
                        onServingsChange={handleServingsChange}
                        onIngredientChange={handleIngredientChange}
                        onNameChange={handleNameChange}
                        onMethodChange={handleMethodChange}
                        onRemove={handleRemoveBatch}
                        onEditRecipe={handleOpenEditModal}
                        isOnlyItem={batches.length === 1}
                        hasError={batchesWithMissingServings.has(batch.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Print/Export Options moved here inside the right column */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Shopping List Button */}
                  <button
                    onClick={handleGenerateShoppingList}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <ShoppingCart className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-gray-900">Shopping List</span>
                    <span className="text-xs text-gray-500 mt-1">Total ingredients</span>
                  </button>

                  {/* Batch Calculations Button */}
                  <button
                    onClick={handleGenerateBatchCalculations}
                    disabled={!canExport}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 group ${canExport
                      ? "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md"
                      : "bg-gray-50 border-gray-100 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <Calculator className={`w-6 h-6 mb-2 transition-transform ${canExport ? "text-orange-600 group-hover:scale-110" : "text-gray-400"}`} />
                    <span className={`font-semibold ${canExport ? "text-gray-900" : "text-gray-400"}`}>
                      Batch Sheets
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Individual guides</span>
                  </button>

                  {/* Full Report Button */}
                  <button
                    onClick={handleGeneratePdfReport}
                    disabled={!canExport}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 group ${canExport
                      ? "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md"
                      : "bg-gray-50 border-gray-100 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <FileText className={`w-6 h-6 mb-2 transition-transform ${canExport ? "text-orange-600 group-hover:scale-110" : "text-gray-400"}`} />
                    <span className={`font-semibold ${canExport ? "text-gray-900" : "text-gray-400"}`}>
                      Full Report
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Everything combined</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>




        {/* Servings Required Modal */}
        <Modal
          isOpen={showServingsModal}
          onClose={() => setShowServingsModal(false)}
          title="Servings Required"
          message={missingServingsMessage}
        />

        {/* Add Recipe Modal */}
        <EditRecipeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          recipe={null}
          mode="create"
          onSave={handleCreateCocktail}
          onSaveSuccess={() => {
            setShowAddModal(false)
          }}
        />

        {/* Edit Recipe Modal */}
        {editingCocktail && (
          <EditRecipeModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingCocktail(null)
              setEditingCocktailId(undefined)
            }}
            recipe={editingCocktail}
            cocktailId={editingCocktailId}
            mode="edit"
            onSave={handleUpdateCocktail}
            onDelete={handleDeleteCocktail}
            onSaveSuccess={() => {
              setShowEditModal(false)
              setEditingCocktail(null)
              setEditingCocktailId(undefined)
            }}
          />
        )}
      </div>
    </div>
  )
}

