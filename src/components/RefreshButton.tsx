export function RefreshButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="icon-btn"
      aria-label="Refresh sentiment data"
      title="Refresh"
    >
      <svg
        className={`w-4 h-4 ${isLoading ? 'animate-spin-reverse' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
