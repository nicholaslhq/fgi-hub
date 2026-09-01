export function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-text-primary font-medium">No sentiment data loaded</p>
        <p className="text-sm text-text-muted mt-1">Click refresh to load the latest Fear & Greed indices.</p>
      </div>
      <button
        onClick={onRefresh}
        className="mt-2 px-4 py-2 bg-text-primary text-white rounded-lg text-sm font-medium hover:bg-text-secondary transition-colors"
      >
        Load Data
      </button>
    </div>
  );
}
