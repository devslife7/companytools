import React, { useState, useMemo, useRef, useEffect } from "react"
import { Search, X, Check } from "lucide-react"
import type { CocktailRecipe } from "@/features/batch-calculator/types"

interface MultiSelectCocktailSearchProps {
  cocktails: CocktailRecipe[]
  selectedCocktails: CocktailRecipe[]
  onSelectionChange: (selected: CocktailRecipe[]) => void
  label?: string
}

export const MultiSelectCocktailSearch: React.FC<MultiSelectCocktailSearchProps> = React.memo(
  ({ cocktails, selectedCocktails, onSelectionChange }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    const filteredCocktails = useMemo(() => {
      if (!searchTerm) return cocktails
      return cocktails.filter(cocktail => cocktail.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm, cocktails])

    const isSelected = (cocktail: CocktailRecipe) => {
      return selectedCocktails.some(selected => selected.name === cocktail.name)
    }

    const handleToggleCocktail = (cocktail: CocktailRecipe) => {
      if (isSelected(cocktail)) {
        // Remove cocktail
        onSelectionChange(selectedCocktails.filter(selected => selected.name !== cocktail.name))
      } else {
        // Add cocktail
        onSelectionChange([...selectedCocktails, cocktail])
      }
      setSearchTerm("") // Clear search after selection
      setIsOpen(false)
    }

    const handleRemoveCocktail = (cocktail: CocktailRecipe) => {
      onSelectionChange(selectedCocktails.filter(selected => selected.name !== cocktail.name))
    }

    return (
      <div className="flex flex-col space-y-3" ref={searchRef}>
   
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-orange-600 z-10" />
          <input
            id="multi-search"
            type="text"
            placeholder="Search for cocktails to add..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full py-4 pl-12 pr-4 text-lg bg-white text-gray-900 border-2 border-orange-300 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:border-orange-400"
          />
        </div>

        {/* Selected Cocktails Chips */}
        {selectedCocktails.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            {selectedCocktails.map(cocktail => (
              <div
                key={cocktail.name}
                className="flex items-center gap-1 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full text-sm font-semibold text-gray-900"
              >
                <span>{cocktail.name}</span>
                <button
                  onClick={() => handleRemoveCocktail(cocktail)}
                  className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  title="Remove cocktail"
                >
                  <X className="w-3 h-3 text-orange-700" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dropdown Results */}
        {isOpen && searchTerm && filteredCocktails.length > 0 && (
          <div className="mt-2 max-h-64 overflow-y-auto pr-1 border border-gray-300 rounded-lg bg-white shadow-lg z-50">
            <div className="space-y-1 p-1">
              {filteredCocktails.map(cocktail => {
                const selected = isSelected(cocktail)
                return (
                  <button
                    key={cocktail.name}
                    onClick={() => handleToggleCocktail(cocktail)}
                    className={`w-full text-left p-2 rounded-md transition duration-200 ease-in-out flex justify-between items-center ${
                      selected
                        ? "bg-orange-100 border border-orange-500 text-gray-900 shadow-md"
                        : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
                    }`}
                  >
                    <span className="font-semibold">{cocktail.name}</span>
                    {selected && <Check className="w-5 h-5 text-orange-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isOpen && searchTerm && filteredCocktails.length === 0 && (
          <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm">
            No cocktails found matching "{searchTerm}".
          </div>
        )}
      </div>
    )
  }
)

MultiSelectCocktailSearch.displayName = "MultiSelectCocktailSearch"
