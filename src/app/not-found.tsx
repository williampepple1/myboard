import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-[#DFE1E6] mb-4">404</h1>
        <h2 className="text-lg font-semibold text-[#172B4D] mb-2">Page not found</h2>
        <p className="text-sm text-foreground/60 mb-6">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#0C66E4] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
