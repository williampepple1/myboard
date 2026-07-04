export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#DFE1E6] dark:bg-[#454F59] rounded ${className}`} />
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-8 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex flex-col gap-3 w-64 shrink-0">
          <Skeleton className="h-5 w-24" />
          {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-24 w-full" />)}
        </div>
      ))}
    </div>
  )
}
