"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Import types
import type { Ingredient, CocktailRecipe, BatchState, CocktailMethod } from "@/features/batch-calculator/types"
import { COCKTAIL_SEASONS } from "@/features/batch-calculator/types"

// Import utilities
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { generatePdfReport, generateShoppingListPdf, generateBatchCalculationsPdf } from "@/features/batch-calculator/lib/pdf-generator"
import type { LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"
import { COCKTAIL_DATA } from "@/features/batch-calculator/data/cocktails"

// Constants
const SPIRIT_KEYWORDS = ["Vodka", "Gin", "Rum", "Whiskey", "Tequila", "Bourbon", "Pisco", "Mezcal", "Liqueur", "Brandy", "Cognac", "Vermouth", "Aperol", "Campari", "Wine", "Prosecco", "Champagne", "Beer", "Cider", "Stout", "Ale", "Lager", "Sake", "Soju", "Absinthe", "Chartreuse", "Amaro", "Bitters", "Cointreau", "Triple Sec", "Curacao", "Schnapps", "Spirit", "Alcohol"];

function checkIsMocktail(cocktail: CocktailRecipe): boolean {
  const hasAlcohol = cocktail.ingredients.some(i => SPIRIT_KEYWORDS.some(spirit => i.name.toLowerCase().includes(spirit.toLowerCase())));
  const isExplicitMocktail = cocktail.name.toLowerCase().includes("mocktail") || cocktail.name.toLowerCase().includes("zero proof");
  // It is a mocktail if:
  // 1. ABV is explicitly 0
  // 2. OR (No alcohol keyword found AND ABV is undefined/null/0)
  // 3. OR Name contains "mocktail"/"zero proof"
  return (cocktail.abv === 0) || (!hasAlcohol && !cocktail.abv) || isExplicitMocktail;
}

// Import hooks
import { useCocktails, useCreateCocktail } from "@/features/batch-calculator/hooks"
import { useToast, ToastContainer } from "@/components/ui"

// Import components
import { BatchCalculatorModal } from "@/features/batch-calculator/components"
import { EditRecipeModal } from "@/features/batch-calculator/components/EditRecipeModal"
import { Modal } from "@/components/ui"
import { Plus, Search, GlassWater, CheckCheck, FilterX, ChevronDown } from "lucide-react"

// --- MAIN APP COMPONENT ---
export default function BatchCalculatorPage() {
  const router = useRouter()
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
  const [filterType, setFilterType] = useState<string>('All') // 'All', 'Featured', 'Cocktail', 'Mocktail'
  const [selectedGlass, setSelectedGlass] = useState<string>('All')
  const [selectedSeason, setSelectedSeason] = useState<string>('All')

  const [availableLiquors, setAvailableLiquors] = useState<string[]>([])
  const [liquorPrices, setLiquorPrices] = useState<LiquorPriceMap | undefined>()

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast()

  // Fetch cocktails from database
  const { cocktails: apiCocktails, loading: cocktailsLoading, error: cocktailsError, refetch: refetchCocktails } = useCocktails({
    enabled: true,
  })

  // Fetch unique liquors and liquor prices
  useEffect(() => {
    const fetchLiquors = async () => {
      try {
        const response = await fetch('/api/cocktails?liquors=true')
        if (response.ok) {
          const data = await response.json()
          const seen = new Map<string, string>()
          for (const l of (data.liquors || [])) {
            const key = l.toLowerCase()
            const titled = l.replace(/\b\w/g, (c: string) => c.toUpperCase())
            if (!seen.has(key)) seen.set(key, titled)
          }
          setAvailableLiquors(Array.from(seen.values()))
        }
      } catch (err) {
        console.error('Failed to fetch liquors:', err)
      }
    }
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/liquor-prices')
        if (response.ok) {
          const data = await response.json()
          setLiquorPrices(data)
        }
      } catch (err) {
        console.error('Failed to fetch liquor prices:', err)
      }
    }
    fetchLiquors()
    fetchPrices()
  }, [])

  const { createCocktail } = useCreateCocktail()

  // Use database cocktails if available, fallback to static data
  const allCocktails = useMemo(() => {
    if (cocktailsError) return COCKTAIL_DATA
    if (apiCocktails.length > 0) return apiCocktails
    return COCKTAIL_DATA
  }, [apiCocktails, cocktailsError])

  // Filter Logic
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

      // 3. Type Filter (Featured, Cocktail, Mocktail)
      if (filterType !== 'All') {
        if (filterType === 'Featured') {
          if (!cocktail.featured) return false
        } else if (filterType === 'Mocktail') {
          if (!checkIsMocktail(cocktail)) return false
        } else if (filterType === 'Cocktail') {
          if (checkIsMocktail(cocktail)) return false
        }
      }

      // 4. Glass Filter
      if (selectedGlass !== 'All') {
        if (!cocktail.glassType || cocktail.glassType !== selectedGlass) return false
      }

      // 5. Season Filter
      if (selectedSeason !== 'All') {
        if (!cocktail.season || cocktail.season !== selectedSeason) return false
      }

      return true
    })
  }, [allCocktails, searchQuery, selectedSpirit, filterType, selectedGlass, selectedSeason])

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

  const hasActiveFilters = searchQuery !== '' || selectedSpirit !== 'All' || filterType !== 'All' || selectedGlass !== 'All' || selectedSeason !== 'All'

  const canExport = batches.some(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )

  const handleGenerateShoppingList = () => generateShoppingListPdf(batches, liquorPrices)

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
    generatePdfReport(batches, liquorPrices)
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
    <div className="min-h-screen text-gray-900 pb-24 sm:pb-32">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-1 sm:mb-2">Curated Gallery</h1>
          <p className="text-sm sm:text-lg text-gray-500">Manage and batch seasonal beverage programs.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-primary text-brand-primary-foreground font-bold rounded-xl hover:bg-brand-primary-hover transition-all shadow-sm gap-2 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          New Recipe
        </button>
      </div>

      {/* 2. Filters & Search */}
      {/* 2. Redesigned Search & Filters Bar */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-2 mb-6 sm:mb-10 flex flex-col md:flex-row md:items-center gap-2 transition-all hover:shadow-2xl hover:shadow-gray-200/50">

        {/* Search Input Section */}
        <div className="flex-1 w-full md:w-auto min-w-[200px] flex items-center px-3 sm:px-4 py-2 relative rounded-xl focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all duration-300">
          <Search className="text-gray-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search cocktails or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base sm:text-lg text-gray-900 placeholder:text-gray-400 font-medium px-3 sm:px-4 py-1"
          />
        </div>

        {/* Reset Filters (Desktop: Next to search) */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => { setSearchQuery(''); setSelectedSpirit('All'); setFilterType('All'); setSelectedGlass('All'); setSelectedSeason('All'); }}
            disabled={!hasActiveFilters}
            className={`p-2 rounded-xl transition-all ${hasActiveFilters ? 'text-brand-primary hover:bg-brand-primary/10 cursor-pointer' : 'text-gray-200 cursor-default'}`}
            title={hasActiveFilters ? "Clear all filters" : "No active filters"}
          >
            <FilterX className="w-5 h-5" />
          </button>
        </div>



        {/* Horizontal Divider (Mobile) */}
        <div className="md:hidden h-px w-full bg-gray-100 my-1"></div>

        {/* Reset Filters (Mobile: Above filters) */}
        {hasActiveFilters && (
          <div className="md:hidden flex justify-end px-2 pb-1">
            <button
              onClick={() => { setSearchQuery(''); setSelectedSpirit('All'); setFilterType('All'); setSelectedGlass('All'); setSelectedSeason('All'); }}
              className="text-xs font-medium text-red-500 flex items-center gap-1"
            >
              <FilterX className="w-3 h-3" /> Clear Filters
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-2 md:px-0 pb-2 md:pb-0 scrollbar-hide">

          {/* Type Filter */}
          <div className="relative group min-w-[120px]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none w-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer outline-none focus:bg-white border border-transparent"
            >
              <option value="All">Any Type</option>
              <option value="Featured">Featured</option>
              <option value="Cocktail">Cocktail</option>
              <option value="Mocktail">Mocktail</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>

          {/* Spirit Filter */}
          <div className="relative group min-w-[120px]">
            <select
              value={selectedSpirit}
              onChange={(e) => setSelectedSpirit(e.target.value)}
              className="appearance-none w-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer outline-none focus:bg-white border border-transparent"
            >
              <option value="All">Any Spirit</option>
              {availableLiquors.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>

          {/* Glass Filter */}
          <div className="relative group min-w-[130px]">
            <select
              value={selectedGlass}
              onChange={(e) => setSelectedGlass(e.target.value)}
              className="appearance-none w-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer outline-none focus:bg-white border border-transparent"
            >
              <option value="All">Any Glass</option>
              <option value="Coupe">Coupe</option>
              <option value="Flute">Flute</option>
              <option value="Highball">Highball</option>
              <option value="Martini">Martini</option>
              <option value="Rocks">Rocks</option>
              <option value="Served Up">Served Up</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>

          {/* Season Filter */}
          <div className="relative group min-w-[130px]">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="appearance-none w-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer outline-none focus:bg-white border border-transparent"
            >
              <option value="All">Any Season</option>
              {COCKTAIL_SEASONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
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
        <div className="text-center py-16 sm:py-32 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
          <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search terms or filters to find what you're looking for.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedSpirit('All'); setFilterType('All'); setSelectedGlass('All'); setSelectedSeason('All'); }}
            className="mt-8 text-brand-primary font-bold hover:text-brand-primary-hover transition-colors inline-flex items-center gap-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6 w-full">
          {filteredCocktails.map(cocktail => {
            const isSelected = selectedCocktails.some(c => c.id === cocktail.id)



            // ABV & Mocktail Logic
            const isMocktail = checkIsMocktail(cocktail);

            let abvBadge = null;
            if (isMocktail) {
              abvBadge = (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm border border-emerald-100 flex items-center gap-1 sm:gap-1.5 z-10 group-hover:scale-105 transition-transform">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[8px] sm:text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">Mocktail</span>
                </div>
              )
            } else if (cocktail.abv && cocktail.abv > 0) {
              abvBadge = (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm border border-amber-100 flex items-center gap-1 sm:gap-1.5 z-10 group-hover:scale-105 transition-transform">
                  <span className="text-[8px] sm:text-[10px] font-extrabold text-amber-700 tracking-wider uppercase">{cocktail.abv}% ABV</span>
                </div>
              )
            }

            return (
              <div
                key={cocktail.id}
                className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Image Area */}
                <div
                  className="aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden bg-gray-100 cursor-pointer"
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

                  {/* Featured Badge */}
                  {cocktail.featured && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-brand-primary/95 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm border border-brand-primary/20 flex items-center z-10">
                      <span className="text-[8px] sm:text-[10px] font-extrabold text-brand-primary-foreground tracking-wider uppercase">Featured</span>
                    </div>
                  )}

                  {/* ABV / Mocktail Badge */}
                  {abvBadge}



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
                <div className="p-3 sm:p-5">
                  <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 leading-tight group-hover:text-brand-primary transition-colors cursor-pointer" onClick={() => { setEditingCocktail(cocktail); setEditingCocktailId(cocktail.id); setShowEditModal(true); }}>
                    {cocktail.name}
                  </h3>



                  <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5 sm:mt-1 truncate">
                    {cocktail.ingredients.slice(0, 3).map(i => i.name).join(' • ')}
                  </p>

                  {/* Actions (Hover) */}

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Floating Action Bar (Batch) */}
      <div className={`fixed bottom-0 left-0 md:left-56 right-0 p-3 sm:p-6 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 z-30 ${selectedCocktails.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-primary rounded-full flex items-center justify-center text-brand-primary-foreground font-bold text-base sm:text-lg shadow-sm flex-shrink-0">
              {selectedCocktails.length}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">Recipes Selected</h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Ready to calculate batch volumes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedCocktails([])}
              className="px-3 sm:px-4 py-2 text-gray-500 font-semibold hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const ids = selectedCocktails.map(c => c.id).join(",")
                router.push(`/batch-calculator/review?recipes=${ids}`)
              }}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-primary text-brand-primary-foreground font-bold rounded-lg shadow-lg hover:bg-brand-primary-hover hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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
