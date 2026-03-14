import React from 'react'
import { LoaderIcon } from 'react-hot-toast'

function LoadingOverlay({loadText}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="flex items-center space-x-2">
        <LoaderIcon className="w-10 h-10 text-white text-4xl animate-spin" />
        <span className="text-white">{loadText}</span>
      </div>
    </div>
  )
}

export default LoadingOverlay

