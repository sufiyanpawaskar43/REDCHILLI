export default function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-4 flex-1" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="card overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-10 m-2" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid border-t border-charcoal-800" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-8 m-2" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

export function FullPageSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-charcoal-950">
      <Spinner size={32} className="text-chilli-500" />
      <p className="text-sm text-charcoal-400">{label}</p>
    </div>
  );
}
export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to load the requested data.',
  onRetry,
}) {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <div className="mb-3 text-3xl">⚠️</div>

        <h3 className="text-lg font-semibold text-red-500">
          {title}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}