import React, { useEffect } from "react"
import { X, AlertCircle } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  children?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
    >
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-30 pointer-events-auto animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-300 pointer-events-auto animate-modal-enter relative z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 whitespace-pre-line">{message}</p>
          {children}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-300 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200 shadow-md"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
