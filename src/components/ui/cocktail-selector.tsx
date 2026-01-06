import React, { useMemo } from "react"
import { Search, Check } from "lucide-react"
import type { CocktailRecipe } from "@/features/batch-calculator/types"

interface CocktailSelectorProps {
  selected: CocktailRecipe | null
  onSelect: (cocktail: CocktailRecipe) => void
  searchTerm: string
  onSearch: (term: string) => void
  cocktails: CocktailRecipe[]
  label: string
}

export const CocktailSelector: React.FC<CocktailSelectorProps> = React.memo(
  ({ selected, onSelect, searchTerm, onSearch, cocktails, label }) => {
    const filteredCocktails = useMemo(() => {
      return cocktails.filter(cocktail => cocktail.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm, cocktails])

    return (
      <div className="flex flex-col space-y-1">
        <label htmlFor={`search-${label}`} className="text-sm font-medium text-gray-600">
          {label}
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600" />
          <input
            id={`search-${label}`}
            type="text"
            placeholder="Search for a recipe..."
            value={searchTerm}
            onChange={e => onSearch(e.target.value)}
            className="w-full py-2 pl-9 pr-4 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-300 shadow-sm focus:border-orange-500"
          />
        </div>

        {searchTerm && filteredCocktails.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto pr-1 border border-gray-300 rounded-lg bg-white shadow-lg">
            <div className="space-y-1 p-1">
              {filteredCocktails.map(cocktail => (
                <button
                  key={cocktail.name}
                  onClick={() => onSelect(cocktail)}
                  className={`w-full text-left p-2 rounded-md transition duration-200 ease-in-out flex justify-between items-center ${
                    selected?.name === cocktail.name
                      ? "bg-orange-100 border border-orange-500 text-gray-900 shadow-md"
                      : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="font-semibold">{cocktail.name}</span>
                  {selected?.name === cocktail.name && <Check className="w-5 h-5 text-orange-600" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {searchTerm && filteredCocktails.length === 0 && (
          <p className="text-red-600 p-3 bg-red-50 rounded-lg border border-red-300">
            No recipes found matching "{searchTerm}".
          </p>
        )}
      </div>
    )
  }
)

CocktailSelector.displayName = "CocktailSelector"

