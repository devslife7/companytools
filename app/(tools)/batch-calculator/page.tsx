"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"

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
import { BatchCalculatorModal } from "@/features/batch-calculator/components"
import { EditRecipeModal } from "@/features/batch-calculator/components/EditRecipeModal"
import { Modal } from "@/components/ui"
import { Plus, Search, Filter, Wine, GlassWater, Citrus, CheckCheck, Loader2 } from "lucide-react"

// --- MAIN APP COMPONENT ---
export default function BatchCalculatorPage() {
  const [batches, setBatches] = useState<BatchState[]>([])
  const nextIdRef = React.useRef<number>(1)
  const [selectedCocktails, setSelectedCocktails] = useState<CocktailRecipe[]>([])
  const [showServingsModal, setShowServingsModal] = useState(false)
  const [missingServingsMessage, setMissingServingsMessage] = useState("")
  const [batchesWithMissingServings, setBatchesWithMissingServings] = useState<Set<number>>(new Set())

  // UI States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

  const [editingCocktail, setEditingCocktail] = useState<CocktailRecipe | null>(null)
  const [editingCocktailId, setEditingCocktailId] = useState<number | undefined>()

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpirit, setSelectedSpirit] = useState<string>('All')
  const [selectedStyle, setSelectedStyle] = useState<string>('All')
  const [selectedGlass, setSelectedGlass] = useState<string>('All')

  const [availableLiquors, setAvailableLiquors] = useState<string[]>([])

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast()

  // Fetch cocktails from database
  const { cocktails: apiCocktails, loading: cocktailsLoading, error: cocktailsError, refetch: refetchCocktails } = useCocktails({
    enabled: true,
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

  const { createCocktail } = useCreateCocktail()

  // Use database cocktails if available, fallback to static data
  const allCocktails = useMemo(() => {
    if (!cocktailsLoading && apiCocktails.length > 0) return apiCocktails
    if (cocktailsError || (!cocktailsLoading && apiCocktails.length === 0)) return COCKTAIL_DATA
    return COCKTAIL_DATA
  }, [apiCocktails, cocktailsLoading, cocktailsError])

  // Filter Logic
  const filteredCocktails = useMemo(() => {
    return allCocktails.filter(cocktail => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = cocktail.name.toLowerCase().includes(q)
        const matchesIng = cocktail.ingredients.some(i => i.name.toLowerCase().includes(q))
        if (!matchesName && !matchesIng) return false
      }

      // 2. Spirit Filter
      if (selectedSpirit !== 'All') {
        const hasSpirit = cocktail.ingredients.some(ing =>
          ing.name.toLowerCase().includes(selectedSpirit.toLowerCase())
        )
        if (!hasSpirit) return false
      }

      // 3. Style Filter (Method)
      if (selectedStyle !== 'All') {
        if (selectedStyle === 'Shaken' && cocktail.method !== 'Shake') return false
        if (selectedStyle === 'Stirred/Built' && cocktail.method !== 'Build') return false
      }

      // 4. Glass Filter
      if (selectedGlass !== 'All') {
        if (!cocktail.glassType || cocktail.glassType !== selectedGlass) return false
      }

      return true
    })
  }, [allCocktails, searchQuery, selectedSpirit, selectedStyle, selectedGlass])

  // Sync batches with selected cocktails
  useEffect(() => {
    setBatches(prevBatches => {
      const existingBatchesMap = new Map<string, BatchState>()
      prevBatches.forEach(batch => {
        if (batch.selectedCocktail) {
          existingBatchesMap.set(batch.selectedCocktail.name, batch)
        }
      })

      const newBatches: BatchState[] = []
      selectedCocktails.forEach(cocktail => {
        if (!existingBatchesMap.has(cocktail.name)) {
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

      const selectedCocktailNames = new Set(selectedCocktails.map(c => c.name))
      const filteredBatches = prevBatches.filter(
        batch => !batch.selectedCocktail || selectedCocktailNames.has(batch.selectedCocktail.name)
      )

      return [...filteredBatches, ...newBatches]
    })
  }, [selectedCocktails])

  // --- Handlers (Existing Logic) ---

  const handleUpdateBatch = useCallback((id: number, updates: Partial<BatchState>) => {
    setBatches(prev => prev.map(batch => (batch.id === id ? { ...batch, ...updates } : batch)))
  }, [])

  const handleRemoveBatch = useCallback((idToRemove: number) => {
    const batchToRemove = batches.find(b => b.id === idToRemove)
    if (batchToRemove?.selectedCocktail) {
      setSelectedCocktails(prev => prev.filter(c => c.id !== batchToRemove.selectedCocktail!.id))
    }
    setBatches(prev => prev.filter(batch => batch.id !== idToRemove))
  }, [batches])

  const handleServingsChange = useCallback((id: number, value: string) => {
    if (batchesWithMissingServings.has(id)) {
      setBatchesWithMissingServings(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
    if (value === "") {
      handleUpdateBatch(id, { servings: "" })
      return
    }
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      handleUpdateBatch(id, { servings: num })
    }
  }, [handleUpdateBatch, batchesWithMissingServings]
  )

  const handleIngredientChange = useCallback((id: number, newIngredients: Ingredient[]) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === id && batch.editableRecipe) {
        return { ...batch, editableRecipe: { ...batch.editableRecipe, ingredients: newIngredients } }
      }
      return batch
    }))
  }, [])

  const handleNameChange = useCallback((id: number, newName: string) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === id && batch.editableRecipe) {
        return { ...batch, editableRecipe: { ...batch.editableRecipe, name: newName } }
      }
      return batch
    }))
  }, [])

  const handleMethodChange = useCallback((id: number, newMethod: CocktailMethod) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === id && batch.editableRecipe) {
        return { ...batch, editableRecipe: { ...batch.editableRecipe, method: newMethod } }
      }
      return batch
    }))
  }, [])

  const canExport = batches.some(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )

  const servingsProgress = useMemo(() => {
    const totalBatches = batches.filter(b => b.editableRecipe).length
    const batchesWithServings = batches.filter(
      b => b.editableRecipe && typeof b.servings === "number" && b.servings > 0
    ).length
    return { completed: batchesWithServings, total: totalBatches }
  }, [batches])

  const handleGenerateShoppingList = () => generateShoppingListPdf(batches)

  const handleGenerateBatchCalculations = () => {
    const batchesWithoutServings = batches.filter(
      b => b.editableRecipe && (b.servings === "" || b.servings === 0 || (typeof b.servings === "number" && b.servings <= 0))
    )
    if (batchesWithoutServings.length > 0) {
      const missingIds = new Set(batchesWithoutServings.map(b => b.id))
      setBatchesWithMissingServings(missingIds)
      const names = batchesWithoutServings.map(b => b.selectedCocktail?.name).join(", ")
      setMissingServingsMessage(`Missing servings for: ${names}`)
      setShowServingsModal(true)
      return
    }
    setBatchesWithMissingServings(new Set())
    generateBatchCalculationsPdf(batches)
  }

  const handleGeneratePdfReport = () => {
    const batchesWithoutServings = batches.filter(
      b => b.editableRecipe && (b.servings === "" || b.servings === 0 || (typeof b.servings === "number" && b.servings <= 0))
    )
    if (batchesWithoutServings.length > 0) {
      const missingIds = new Set(batchesWithoutServings.map(b => b.id))
      setBatchesWithMissingServings(missingIds)
      const names = batchesWithoutServings.map(b => b.selectedCocktail?.name).join(", ")
      setMissingServingsMessage(`Missing servings for: ${names}`)
      setShowServingsModal(true)
      return
    }
    setBatchesWithMissingServings(new Set())
    if (!canExport) return
    generatePdfReport(batches)
  }

  // Handle create/update/delete cocktails
  const handleCreateCocktail = useCallback(async (recipe: CocktailRecipe) => {
    const newRecipe = await createCocktail(recipe)
    if (newRecipe) {
      success(`Recipe "${newRecipe.name}" created!`)
      await refetchCocktails()
      setSelectedCocktails(prev => [...prev, newRecipe])
      setShowAddModal(false)
    } else {
      showError("Failed to create recipe.")
    }
  }, [createCocktail, refetchCocktails, success, showError])

  const handleUpdateCocktail = useCallback(async (updatedRecipe: CocktailRecipe) => {
    // Update logic same as before...
    setBatches(prev => prev.map(batch => {
      if (batch.selectedCocktail?.id === updatedRecipe.id || batch.editableRecipe?.id === updatedRecipe.id) {
        return { ...batch, selectedCocktail: updatedRecipe, editableRecipe: updatedRecipe }
      }
      return batch
    }))
    setSelectedCocktails(prev => prev.map(c => (c.id === updatedRecipe.id ? updatedRecipe : c)))
    await refetchCocktails()
    success("Recipe updated!")
    setShowEditModal(false)
  }, [refetchCocktails, success])

  const handleDeleteCocktail = useCallback(async () => {
    if (!editingCocktail) return
    setSelectedCocktails(prev => prev.filter(c => c.id !== editingCocktail.id))
    setBatches(prev => prev.filter(batch => batch.selectedCocktail?.id !== editingCocktail.id))
    await refetchCocktails()
    success("Recipe deleted!")
    setShowEditModal(false)
  }, [editingCocktail, refetchCocktails, success])


  // Toggle Selection
  const toggleSelection = (cocktail: CocktailRecipe) => {
    const isSelected = selectedCocktails.some(c => c.id === cocktail.id)
    if (isSelected) {
      setSelectedCocktails(prev => prev.filter(c => c.id !== cocktail.id))
    } else {
      setSelectedCocktails(prev => [...prev, cocktail])
    }
  }

  return (
    <div className="min-h-screen text-gray-900 pb-32">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Curated Gallery</h1>
          <p className="text-lg text-gray-500">Manage and batch seasonal beverage programs.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-6 py-3.5 bg-brand-primary text-brand-primary-foreground font-bold rounded-xl hover:bg-brand-primary-hover transition-all shadow-sm gap-2 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          New Recipe
        </button>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm mb-10 flex flex-col md:flex-row gap-4 md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:bg-white focus:border-brand-primary/20 transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Separator on Desktop */}
        <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 px-1 md:px-0 scrollbar-hide">
          {/* Spirit Filter */}
          <div className="relative group min-w-[140px]">
            <select
              value={selectedSpirit}
              onChange={(e) => setSelectedSpirit(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 bg-gray-100/50 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all border-none"
            >
              <option value="All">Spirit: All</option>
              {availableLiquors.map(l => <option key={l} value={l}>Spirit: {l}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          {/* Style Filter */}
          <div className="relative group min-w-[140px]">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 bg-gray-100/50 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all border-none"
            >
              <option value="All">Style: All</option>
              <option value="Shaken">Style: Shaken</option>
              <option value="Stirred/Built">Style: Stirred</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Wine className="w-4 h-4" />
            </div>
          </div>

          {/* Glass Filter */}
          <div className="relative group min-w-[140px]">
            <select
              value={selectedGlass}
              onChange={(e) => setSelectedGlass(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 bg-gray-100/50 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all border-none"
            >
              <option value="All">Glass: All</option>
              <option value="Rocks Glass">Glass: Rocks Glass</option>
              <option value="Coupe">Glass: Coupe</option>
              <option value="Martini">Glass: Martini</option>
              <option value="Highball">Glass: Highball</option>
              <option value="Flute">Glass: Flute</option>
              <option value="Wine Glass">Glass: Wine Glass</option>
              <option value="Served Up">Glass: Served Up</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Citrus className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grid Gallery */}
      {cocktailsLoading ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-t-brand-primary rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Loading recipes...</p>
        </div>
      ) : filteredCocktails.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
          <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search terms or filters to find what you're looking for.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedSpirit('All'); setSelectedStyle('All'); setSelectedGlass('All'); }}
            className="mt-8 text-brand-primary font-bold hover:text-brand-primary-hover transition-colors inline-flex items-center gap-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCocktails.map(cocktail => {
            const isSelected = selectedCocktails.some(c => c.id === cocktail.id)
            const mainSpirit = cocktail.ingredients.find(i => availableLiquors.includes(i.name) || i.name.includes("Vodka") || i.name.includes("Gin") || i.name.includes("Rum") || i.name.includes("Whiskey") || i.name.includes("Tequila") || i.name.includes("Bourbon"))?.name || "Spirit"

            // Determine tags
            const tags = []
            if (cocktail.featured) tags.push({ label: "SIGNATURE", color: "bg-brand-primary" })
            else if (cocktail.method === 'Build') tags.push({ label: "CLASSIC", color: "bg-slate-700" })
            else tags.push({ label: "SEASONAL", color: "bg-amber-500" })

            // Zero proof check (naive)
            const isZeroProof = !cocktail.ingredients.some(i => ["Vodka", "Gin", "Rum", "Whiskey", "Tequila", "Bourbon", "Pisco", "Mezcal", "Liqueur"].some(spirit => i.name.includes(spirit)))
            if (isZeroProof) tags.push({ label: "ZERO-PROOF", color: "bg-emerald-600" })

            return (
              <div
                key={cocktail.id}
                className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Image Area */}
                <div
                  className="aspect-[4/5] relative overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => toggleSelection(cocktail)}
                >
                  {cocktail.image ? (
                    <Image
                      src={cocktail.image}
                      alt={cocktail.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 p-6 text-center">
                      <GlassWater className="w-12 h-12 mb-3 opacity-20" />
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-40">No Image</span>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {tags.map((tag, idx) => (
                      <span key={idx} className={`${tag.color} text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider uppercase`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  {/* Selection Checkmark Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <CheckCheck className="w-8 h-8 text-brand-primary" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-brand-primary transition-colors cursor-pointer" onClick={() => { setEditingCocktail(cocktail); setEditingCocktailId(cocktail.id); setShowEditModal(true); }}>
                    {cocktail.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">
                    <span className="text-brand-primary">{mainSpirit.toUpperCase()}</span>
                    <span>•</span>
                    <span>{cocktail.glassType?.toUpperCase() ?? "GLASSWARE"}</span>
                  </div>

                  {/* Actions (Hover) */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelection(cocktail); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${isSelected ? 'bg-brand-primary text-brand-primary-foreground border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-primary hover:text-brand-primary'}`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => { setEditingCocktail(cocktail); setEditingCocktailId(cocktail.id); setShowEditModal(true); }}
                      className="px-3 py-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Floating Action Bar (Batch) */}
      <div className={`fixed bottom-0 left-0 md:left-64 right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 z-30 ${selectedCocktails.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-brand-primary-foreground font-bold text-lg shadow-sm">
              {selectedCocktails.length}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Recipes Selected</h3>
              <p className="text-sm text-gray-500">Ready to calculate batch volumes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCocktails([])}
              className="px-4 py-2 text-gray-500 font-semibold hover:text-gray-900 transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-6 py-3 bg-brand-accent text-brand-secondary font-bold rounded-lg shadow-lg hover:bg-brand-accent/90 hover:shadow-xl transition-all flex items-center gap-2"
            >
              <CheckCheck className="w-5 h-5" />
              Review Batch
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BatchCalculatorModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        batches={batches}
        onServingsChange={handleServingsChange}
        onIngredientChange={handleIngredientChange}
        onNameChange={handleNameChange}
        onMethodChange={handleMethodChange}
        onRemove={handleRemoveBatch}
        onEditRecipe={(c, id) => { setShowBatchModal(false); setEditingCocktail(c); setEditingCocktailId(id); setShowEditModal(true); }}
        batchesWithMissingServings={batchesWithMissingServings}
        servingsProgress={servingsProgress}
        onGenerateShoppingList={handleGenerateShoppingList}
        onGenerateBatchCalculations={handleGenerateBatchCalculations}
        onGeneratePdfReport={handleGeneratePdfReport}
        canExport={canExport}
      />

      <Modal
        isOpen={showServingsModal}
        onClose={() => setShowServingsModal(false)}
        title="Servings Required"
        message={missingServingsMessage}
      />

      {showAddModal && (
        <EditRecipeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          recipe={null}
          mode="create"
          onSave={handleCreateCocktail}
          onSaveSuccess={() => setShowAddModal(false)}
        />
      )}

      {editingCocktail && (
        <EditRecipeModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingCocktail(null); setEditingCocktailId(undefined); }}
          recipe={editingCocktail}
          cocktailId={editingCocktailId}
          mode="edit"
          onSave={handleUpdateCocktail}
          onDelete={handleDeleteCocktail}
          onSaveSuccess={() => { setShowEditModal(false); setEditingCocktail(null); setEditingCocktailId(undefined); }}
        />
      )}
    </div>
  )
}
