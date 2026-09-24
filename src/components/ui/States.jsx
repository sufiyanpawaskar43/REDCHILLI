import { Search, PackageOpen, AlertTriangle } from 'lucide-react';

export function EmptyState({ icon: Icon = PackageOpen, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-charcoal-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-charcoal-500" />
      </div>
      <h3 className="text-base font-semibold text-charcoal-200 mb-1">{title || 'Nothing here yet'}</h3>
      {message && <p className="text-sm text-charcoal-500 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-charcoal-200 mb-1">Something went wrong</h3>
      <p className="text-sm text-charcoal-500 max-w-sm">{message || 'An unexpected error occurred.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4">Try Again</button>
      )}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...', autoFocus, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input pl-10"
      />
    </div>
  );
}
