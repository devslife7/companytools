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

// Generate options from 20 to 800 in intervals of 20
const SERVINGS_OPTIONS = Array.from({ length: 40 }, (_, i) => 20 + i * 20)

export const ServingsInput: React.FC<ServingsInputProps> = React.memo(
  ({ value, onChange, disabled, label, id, icon: Icon, hasError = false }) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef<number>(0)
    const isScrolling = useRef<boolean>(false)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("touchstart", handleClickOutside)
      }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      setIsOpen(true)
    }

    const handleSelectOption = (option: number) => {
      if (!isScrolling.current) {
        onChange(option.toString())
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    const handleTouchStart = (e: React.TouchEvent, option: number) => {
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

    const handleInputFocus = () => {
      setIsOpen(true)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    const handleToggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsOpen(!isOpen)
        inputRef.current?.focus()
      }
    }

    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative" ref={containerRef}>
          <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600 z-10" />
          <input
            ref={inputRef}
            id={id}
            type="number"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            required
            className={`w-full py-2 pl-9 pr-10 text-gray-900 border rounded-lg focus:ring-2 transition duration-300 ${
              disabled
                ? "opacity-60 cursor-not-allowed border-gray-300 bg-gray-50"
                : hasError
                  ? "bg-red-50 border-red-500 focus:border-red-600 focus:ring-red-500"
                  : "bg-gray-50 border-gray-300 focus:border-orange-300 focus:ring-orange-300"
            }`}
            disabled={disabled}
            placeholder="Enter servings (required)"
          />
          <button
            type="button"
            onClick={handleToggleDropdown}
            onTouchStart={handleToggleDropdown}
            disabled={disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-orange-600 active:text-orange-700"
            }`}
            aria-label="Toggle dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="py-1">
                {SERVINGS_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectOption(option)
                    }}
                    onTouchStart={(e) => handleTouchStart(e, option)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, option)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      value === option
                        ? "bg-orange-100 text-orange-900 font-semibold"
                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

ServingsInput.displayName = "ServingsInput"
