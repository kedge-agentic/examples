interface FileExplorerHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: 'name' | 'size' | 'type'
  onSortChange: (sortBy: 'name' | 'size' | 'type') => void
  onRefresh: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

/**
 * FileExplorerHeader - Toolbar with search, sort, and action buttons
 */
export function FileExplorerHeader({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onRefresh,
  onExpandAll,
  onCollapseAll,
}: FileExplorerHeaderProps) {
  return (
    <div className="file-explorer-header border-b border-slate-700 pb-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'name' | 'size' | 'type')}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors outline-none"
          aria-label="Sort by"
        >
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="type">Type</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 transition-colors"
          aria-label="Refresh file tree"
          title="Refresh"
        >
          <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Expand/Collapse All Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExpandAll}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 transition-colors text-slate-300"
          aria-label="Expand all folders"
        >
          Expand All
        </button>
        <button
          onClick={onCollapseAll}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 transition-colors text-slate-300"
          aria-label="Collapse all folders"
        >
          Collapse All
        </button>
      </div>
    </div>
  )
}
