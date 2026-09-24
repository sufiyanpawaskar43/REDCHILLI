import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function DateRangeFilter({ startDate, endDate, onChange, onApply }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="label">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange({ start: e.target.value, end: endDate })}
          className="input-sm"
        />
      </div>
      <div>
        <label className="label">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange({ start: startDate, end: e.target.value })}
          className="input-sm"
        />
      </div>
      {onApply && <button onClick={onApply} className="btn-primary btn-sm">Apply</button>}
    </div>
  );
}

export function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost btn-sm"
      >
        {label}: <span className="text-chilli-400">{value || 'All'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-20 bg-charcoal-800 border border-charcoal-700 rounded-lg shadow-xl py-1 min-w-[140px]">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-charcoal-300 hover:bg-charcoal-700"
            >
              All
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-charcoal-300 hover:bg-charcoal-700"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
