import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const searchRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

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
      setHighlightedIndex(-1)
    }

    // Reset highlighted index when search results change
    useEffect(() => {
      setHighlightedIndex(-1)
    }, [searchTerm])

    // Auto-scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll('[data-result-item]')
        items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
      }
    }, [highlightedIndex])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!isOpen || !searchTerm || filteredCocktails.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < filteredCocktails.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCocktails.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < filteredCocktails.length) {
            handleToggleCocktail(filteredCocktails[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }, [isOpen, searchTerm, filteredCocktails, highlightedIndex, handleToggleCocktail])

    const dropdownOpen = isOpen && searchTerm && filteredCocktails.length > 0

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
          onKeyDown={handleKeyDown}
          className={`w-full py-2 pl-10 pr-4 font-semibold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:border-gray-300 focus:outline-none transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal ${dropdownOpen ? "rounded-t-xl border-b-0" : "rounded-xl"
            }`}
        />

        {/* Dropdown Results — flush against input, no gap */}
        {dropdownOpen && (
          <div
            ref={listRef}
            className="absolute left-0 right-0 top-full max-h-64 overflow-y-auto border border-gray-200 border-t border-t-gray-100 rounded-b-xl bg-white shadow-lg z-50"
          >
            <div className="py-1">
              {filteredCocktails.map((cocktail, index) => {
                const selected = isSelected(cocktail)
                const highlighted = index === highlightedIndex
                return (
                  <button
                    key={cocktail.name}
                    data-result-item
                    onClick={() => handleToggleCocktail(cocktail)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 flex justify-between items-center transition-colors duration-100 ${selected
                        ? highlighted
                          ? "bg-orange-100 border-l-[3px] border-l-orange-500 text-gray-900 font-semibold"
                          : "bg-orange-50 border-l-[3px] border-l-orange-400 text-gray-900 font-semibold"
                        : highlighted
                          ? "bg-gray-100 border-l-[3px] border-l-gray-300 text-gray-900"
                          : "bg-white border-l-[3px] border-l-transparent text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <span>{cocktail.name}</span>
                    {selected && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isOpen && searchTerm && filteredCocktails.length === 0 && (
          <div className="absolute left-0 right-0 top-full border border-gray-200 border-t border-t-gray-100 rounded-b-xl bg-white shadow-lg z-50 p-3 text-gray-400 text-sm">
            No cocktails found matching &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    )
  }
)

MultiSelectCocktailSearch.displayName = "MultiSelectCocktailSearch"
