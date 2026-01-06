import React from "react"
import type { LucideIcon } from "lucide-react"

interface BatchInputProps {
  value: number | ""
  onChange: (value: string) => void
  disabled: boolean
  label: string
  id: string
  icon: LucideIcon
  unit?: string
}

export const BatchInput: React.FC<BatchInputProps> = React.memo(
  ({ value, onChange, disabled, label, id, icon: Icon, unit }) => (
    <div className="flex flex-col space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600" />
        <input
          id={id}
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min="0"
          step={unit === "L" ? "0.5" : "1"}
          className={`w-full py-2 pl-9 pr-11 bg-gray-50 text-gray-900 border rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-300 shadow-sm ${
            disabled ? "opacity-60 cursor-not-allowed border-gray-300" : "border-gray-300 focus:border-orange-500"
          }`}
          disabled={disabled}
        />
        {unit && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{unit}</span>}
      </div>
    </div>
  )
)

BatchInput.displayName = "BatchInput"

