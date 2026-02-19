import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ServingsInputProps {
  value: number | ""
  onChange: (value: string) => void
  disabled: boolean
  label: string
  id: string
  icon: LucideIcon
  hasError?: boolean
}

// Quick select presets (most common values)
const QUICK_PRESETS = [50, 100, 150, 200, 250]

// Full dropdown options from 20 to 800 in intervals of 20, plus 50, 150, and 250
const DROPDOWN_OPTIONS = [
  ...Array.from({ length: 40 }, (_, i) => 20 + i * 20),
  50, 150, 250
].sort((a, b) => a - b).filter((v, i, arr) => arr.indexOf(v) === i)

export const ServingsInput: React.FC<ServingsInputProps> = React.memo(
  ({ value, onChange, disabled, label, id, icon: Icon, hasError = false }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef<number>(0)
    const isScrolling = useRef<boolean>(false)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside, { passive: true })
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("touchstart", handleClickOutside)
      }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      // Don't open dropdown when typing - keep them separate
    }

    const handleSelectOption = (option: number) => {
      if (!isScrolling.current) {
        onChange(option.toString())
        setIsDropdownOpen(false)
      }
    }

    const handlePresetClick = (preset: number) => {
      onChange(preset.toString())
    }

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      isScrolling.current = false
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      const touchY = e.touches[0].clientY
      const deltaY = Math.abs(touchY - touchStartY.current)
      if (deltaY > 5) {
        isScrolling.current = true
      }
    }

    const handleTouchEnd = (e: React.TouchEvent, option: number) => {
      if (!isScrolling.current) {
        e.preventDefault()
        handleSelectOption(option)
      }
      isScrolling.current = false
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        inputRef.current?.blur()
      }
      // Arrow down opens the dropdown
      if (e.key === "ArrowDown" && !isDropdownOpen) {
        e.preventDefault()
        setIsDropdownOpen(true)
      }
      if (e.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    const handleToggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDropdownOpen(!isDropdownOpen)
      }
    }

    const isCustomValue = value !== "" && !DROPDOWN_OPTIONS.includes(Number(value))

    return (
      <div className="flex flex-col w-full" ref={containerRef}>
        {/* Main input with dropdown toggle */}
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600 z-10" />
          <input
            ref={inputRef}
            id={id}
            type="number"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            required
            className={`w-full py-2.5 pl-10 pr-12 text-gray-900 border rounded-lg focus:ring-2 focus:outline-none transition duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              disabled
                ? "opacity-60 cursor-not-allowed border-gray-300 bg-gray-100"
                : hasError
                  ? "bg-red-50 border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "bg-white border-gray-300 hover:border-gray-400 focus:border-orange-400 focus:ring-orange-100"
            }`}
            disabled={disabled}
            placeholder="Servings"
          />
          <button
            type="button"
            onClick={handleToggleDropdown}
            disabled={disabled}
            className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-all duration-200 ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : isDropdownOpen
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
            }`}
            aria-label="Show all options"
            aria-expanded={isDropdownOpen}
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && !disabled && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="py-1">
                {DROPDOWN_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectOption(option)
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, option)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      value === option
                        ? "bg-orange-100 text-orange-900 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick preset buttons - separate from the input */}
        {!disabled && (
          <div className="mt-2 w-full">
            <div className="flex items-center gap-1.5 flex-nowrap w-full">
              <span className="text-xs text-gray-500 mr-1">Quick:</span>
              {QUICK_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
                    value === preset
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
              {isCustomValue && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                  Custom: {value}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

ServingsInput.displayName = "ServingsInput"
