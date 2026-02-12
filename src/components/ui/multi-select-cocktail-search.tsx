import React, { useState, useMemo, useRef, useEffect } from "react"
import { Search, Check } from "lucide-react"
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
        onSelectionChange(selectedCocktails.filter(selected => selected.name !== cocktail.name))
      } else {
        onSelectionChange([...selectedCocktails, cocktail])
      }
      setSearchTerm("")
      setIsOpen(false)
    }

    return (
      <div ref={searchRef} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <input
          id="multi-search"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full py-2 pl-10 pr-4 rounded-xl font-semibold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:border-gray-300 focus:outline-none transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal"
        />

        {/* Dropdown Results — absolutely positioned, overlays content */}
        {isOpen && searchTerm && filteredCocktails.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg z-50">
            <div className="space-y-1 p-1">
              {filteredCocktails.map(cocktail => {
                const selected = isSelected(cocktail)
                return (
                  <button
                    key={cocktail.name}
                    onClick={() => handleToggleCocktail(cocktail)}
                    className={`w-full text-left p-2 rounded-md transition duration-200 ease-in-out flex justify-between items-center ${selected
                      ? "bg-orange-100 text-gray-900 shadow-md"
                      : "bg-white hover:bg-gray-100 text-gray-700"
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
          <div className="absolute left-0 right-0 top-full mt-1 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm z-50">
            No cocktails found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    )
  }
)

MultiSelectCocktailSearch.displayName = "MultiSelectCocktailSearch"
