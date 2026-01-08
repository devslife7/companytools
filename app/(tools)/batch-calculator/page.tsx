"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"

// Import types
import type { Ingredient, CocktailRecipe, BatchState } from "@/features/batch-calculator/types"

// Import utilities
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport } from "@/features/batch-calculator/lib/pdf-generator"
import { COCKTAIL_DATA } from "@/features/batch-calculator/data/cocktails"

// Import components
import { BatchItem } from "@/features/batch-calculator/components/BatchItem"
import { MultiSelectCocktailSearch, Modal } from "@/components/ui"

// --- MAIN APP COMPONENT ---
export default function BatchCalculatorPage() {
  const [batches, setBatches] = useState<BatchState[]>([])
  const nextIdRef = React.useRef<number>(1)
  const [selectedCocktails, setSelectedCocktails] = useState<CocktailRecipe[]>([])
  const [showServingsModal, setShowServingsModal] = useState(false)
  const [missingServingsMessage, setMissingServingsMessage] = useState("")
  const [batchesWithMissingServings, setBatchesWithMissingServings] = useState<Set<number>>(new Set())

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
  const favoriteCocktails = useMemo(() => {
    return COCKTAIL_DATA.filter(
      cocktail => 
        cocktail.name === "Espresso Martini" || 
        cocktail.name === "Blackberry Collins" ||
        cocktail.name === "Maple Bourbon Cider"
    )
  }, [])

  const hasSelectedCocktails = selectedCocktails.length > 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-1 sm:py-2 px-0">
      <div className="max-w-4xl mx-auto">
        {/* Multi-Select Cocktail Search */}
        <div className="mb-6 px-0">
          <MultiSelectCocktailSearch
            cocktails={COCKTAIL_DATA}
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
              onRemove={handleRemoveBatch}
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
      </div>
    </div>
  )
}

