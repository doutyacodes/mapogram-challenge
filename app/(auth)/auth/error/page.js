'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

  const errorMessages = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access denied. You may not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  }

  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <div className="mt-4 text-xs text-gray-500">
            Error code: {error || 'Unknown'}
          </div>
          <button
            onClick={() => router.push('/auth/signup')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
