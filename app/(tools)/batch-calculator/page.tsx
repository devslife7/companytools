"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"

// Import types
import type { Ingredient, CocktailRecipe, BatchState } from "@/features/batch-calculator/types"

// Import utilities
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport } from "@/features/batch-calculator/lib/pdf-generator"
import { COCKTAIL_DATA } from "@/features/batch-calculator/data/cocktails"

// Import hooks
import { useCocktails, useCreateCocktail } from "@/features/batch-calculator/hooks"
import { useToast, ToastContainer } from "@/components/ui"

// Import components
import { BatchItem } from "@/features/batch-calculator/components/BatchItem"
import { EditRecipeModal } from "@/features/batch-calculator/components/EditRecipeModal"
import { MultiSelectCocktailSearch, Modal } from "@/components/ui"
import { Plus } from "lucide-react"

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

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast()

  // Fetch cocktails from database (primary source)
  const { cocktails: apiCocktails, loading: cocktailsLoading, error: cocktailsError, refetch: refetchCocktails } = useCocktails({
    enabled: true, // Always try to use database
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
        setSelectedCocktails(prev => prev.filter(c => c.name !== batchToRemove.selectedCocktail!.name))
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

  const handleGarnishChange = useCallback((id: number, newGarnish: string) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, garnish: newGarnish },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const handleMethodChange = useCallback((id: number, newMethod: string) => {
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
      garnish: recipe.garnish,
      method: recipe.method,
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
        if (batch.selectedCocktail?.name === updatedRecipe.name || batch.editableRecipe?.name === updatedRecipe.name) {
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
      prev.map(cocktail => (cocktail.name === updatedRecipe.name ? updatedRecipe : cocktail))
    )

    // Refresh cocktails list from database
    await refetchCocktails()
    success(`Recipe "${updatedRecipe.name}" updated successfully!`)
    setShowEditModal(false)
  }, [refetchCocktails, success])

  // Handle delete recipe
  const handleDeleteCocktail = useCallback(async () => {
    if (!editingCocktail) return

    // Remove from selected cocktails if it's selected
    setSelectedCocktails(prev => prev.filter(c => c.name !== editingCocktail.name))

    // Remove batches using this recipe
    setBatches(prev => prev.filter(batch => batch.selectedCocktail?.name !== editingCocktail.name))

    // Refresh cocktails list
    await refetchCocktails()
    success(`Recipe "${editingCocktail.name}" deleted successfully!`)
    setShowEditModal(false)
  }, [editingCocktail, refetchCocktails, success])

  // Open edit modal
  const handleOpenEditModal = useCallback((cocktail: CocktailRecipe, cocktailId?: number) => {
    setEditingCocktail(cocktail)
    setEditingCocktailId(cocktailId)
    setShowEditModal(true)
  }, [])

  const favoriteCocktails = useMemo(() => {
    return availableCocktails.filter(
      cocktail => 
        cocktail.name === "Espresso Martini" || 
        cocktail.name === "Blackberry Collins" ||
        cocktail.name === "Maple Bourbon Cider"
    )
  }, [availableCocktails])

  const hasSelectedCocktails = selectedCocktails.length > 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-1 sm:py-2 px-0">
      <div className="max-w-4xl mx-auto">
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

        {/* Multi-Select Cocktail Search */}
        <div className="mb-6 px-0">
          {cocktailsLoading ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm mb-4">
              Loading cocktails from database...
            </div>
          ) : cocktailsError ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-600 text-sm mb-4">
              ⚠️ Database unavailable, using static data fallback. Error: {cocktailsError}
            </div>
          ) : apiCocktails.length > 0 ? (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs mb-2">
              ✓ Loaded {apiCocktails.length} cocktails from database
            </div>
          ) : null}
          <MultiSelectCocktailSearch
            cocktails={availableCocktails}
            selectedCocktails={selectedCocktails}
            onSelectionChange={handleCocktailSelectionChange}
            label="Search and Add Cocktails"
          />
        </div>

        {/* Show favorite cocktails if no cocktails are selected */}
        {!hasSelectedCocktails && (
          <div className="mb-6 px-0">
            <p className="text-sm font-medium text-gray-600 mb-3">Popular Cocktails</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteCocktails.map(cocktail => (
                <button
                  key={cocktail.name}
                  onClick={() => handleCocktailSelectionChange([cocktail])}
                  className="p-4 bg-white border border-gray-300 rounded-lg hover:border-orange-500 hover:shadow-md transition-all duration-200 text-left"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{cocktail.name}</h3>
                  <p className="text-sm text-gray-600">{cocktail.garnish}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 sm:space-y-8 mb-4">
          {/* Render all independent cocktail batch slots */}
          {batches.map(batch => (
            <BatchItem
              key={batch.id}
              batch={batch}
              onServingsChange={handleServingsChange}
              onIngredientChange={handleIngredientChange}
              onNameChange={handleNameChange}
              onGarnishChange={handleGarnishChange}
              onMethodChange={handleMethodChange}
              onRemove={handleRemoveBatch}
              onEditRecipe={handleOpenEditModal}
              isOnlyItem={batches.length === 1}
              hasError={batchesWithMissingServings.has(batch.id)}
            />
          ))}
        </div>

        {/* Final Export Button - Only show if cocktails are selected */}
        {hasSelectedCocktails && (
          <div className="mt-3 space-y-3 px-0">
            <button
              className={`w-full py-4 text-xl font-bold rounded-xl transition duration-300 shadow-xl uppercase tracking-widest
                              ${
                                canExport
                                  ? "bg-orange-600 text-white border border-orange-700 hover:bg-orange-700 shadow-orange-600/30"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                              }`}
              onClick={handleGeneratePdfReport}
              disabled={!canExport}
            >
              Download All Batch Sheets (Print-Ready PDF)
            </button>
          </div>
        )}

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

