"use client"
import React, { useState, useEffect, useCallback } from "react"
import { Wine, PlusCircle } from "lucide-react"

// Import types
import type { Ingredient, CocktailRecipe, BatchState } from "@/features/batch-calculator/types"

// Import utilities
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport } from "@/features/batch-calculator/lib/pdf-generator"

// Import components
import { BatchItem } from "@/features/batch-calculator/components/BatchItem"

// --- MAIN APP COMPONENT ---
export default function BatchCalculatorPage() {
  const defaultServings: number = 120
  const [batches, setBatches] = useState<BatchState[]>([])
  const [nextId, setNextId] = useState<number>(1)

  // Initialize with one empty batch slot on load
  useEffect(() => {
    if (batches.length === 0) {
      handleAddBatch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- CRUD Handlers for Batches Array (Memoized using useCallback) ---

  const handleUpdateBatch = useCallback((id: number, updates: Partial<BatchState>) => {
    setBatches(prev => prev.map(batch => (batch.id === id ? { ...batch, ...updates } : batch)))
  }, [])

  const handleAddBatch = useCallback(() => {
    const newBatch: BatchState = {
      id: nextId,
      selectedCocktail: null,
      editableRecipe: null,
      servings: defaultServings,
      targetLiters: FIXED_BATCH_LITERS, // Fixed to 20L
      searchTerm: "",
    }
    setBatches(prev => [...prev, newBatch])
    setNextId(prev => prev + 1)
  }, [nextId, defaultServings])

  const handleRemoveBatch = useCallback((idToRemove: number) => {
    setBatches(prev => prev.filter(batch => batch.id !== idToRemove))
  }, [])

  // --- Specific Data Handlers (Memoized using useCallback) ---

  const handleSelectCocktail = useCallback(
    (id: number, cocktail: CocktailRecipe) => {
      // Deep copy of the recipe for editing
      const editableRecipe = JSON.parse(JSON.stringify(cocktail)) as CocktailRecipe
      handleUpdateBatch(id, {
        selectedCocktail: cocktail,
        editableRecipe: editableRecipe,
        searchTerm: "",
        servings: defaultServings,
        targetLiters: FIXED_BATCH_LITERS,
      })
    },
    [handleUpdateBatch, defaultServings]
  )

  const handleServingsChange = useCallback(
    (id: number, value: string) => {
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
    [handleUpdateBatch]
  )

  const handleSearchTermChange = useCallback(
    (id: number, term: string) => {
      handleUpdateBatch(id, { searchTerm: term })
    },
    [handleUpdateBatch]
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
    if (!canExport) return
    generatePdfReport(batches)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-1 sm:py-2 px-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-2 px-0">
          <Wine className="w-10 h-10 mr-3 text-orange-600" />
          Batch Calculator
        </h1>

        <div className="space-y-6 sm:space-y-8 mb-4">
          {/* Render all independent cocktail batch slots */}
          {batches.map(batch => (
            <BatchItem
              key={batch.id}
              batch={batch}
              onSelect={handleSelectCocktail}
              onServingsChange={handleServingsChange}
              onSearchTermChange={handleSearchTermChange}
              onIngredientChange={handleIngredientChange}
              onNameChange={handleNameChange}
              onRemove={handleRemoveBatch}
              isOnlyItem={batches.length === 1}
            />
          ))}
        </div>

        {/* "Add New" Button */}
        <div className="mt-4 pt-3 border-t border-gray-300 px-0">
          <button
            onClick={handleAddBatch}
            className={`w-full py-4 text-xl font-bold rounded-xl transition duration-300 shadow-lg uppercase tracking-widest flex items-center justify-center space-x-3 
                            bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-800`}
          >
            <PlusCircle className="w-6 h-6 text-orange-600" />
            <span>Add New Cocktail Slot</span>
          </button>
        </div>

        {/* Final Export Button */}
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
      </div>
    </div>
  )
}

