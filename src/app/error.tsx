'use client'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-border rounded-md shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 text-red-500 rounded-md mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[#172B4D] mb-2">Something went wrong</h1>
        <p className="text-sm text-foreground/60 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
