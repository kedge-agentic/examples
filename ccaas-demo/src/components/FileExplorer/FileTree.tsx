import { FileTreeNode } from './FileTreeNode'
import type { FileTreeNode as FileTreeNodeType } from '../../types'

interface FileTreeProps {
  nodes: FileTreeNodeType[]
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  onFileClick: (node: FileTreeNodeType) => void
  searchQuery: string
}

/**
 * FileTree - Recursive tree renderer for workspace files
 */
export function FileTree({
  nodes,
  expandedFolders,
  onToggleFolder,
  onFileClick,
  searchQuery
}: FileTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-sm">
          {searchQuery ? 'No files match your search' : 'No files in workspace'}
        </p>
      </div>
    )
  }

  return (
    <div className="file-tree">
      {nodes.map(node => (
        <FileTreeNode
          key={node.id}
          node={node}
          level={0}
          isExpanded={expandedFolders.has(node.id)}
          expandedFolders={expandedFolders}
          onToggle={() => onToggleFolder(node.id)}
          onFileClick={onFileClick}
          onToggleFolder={onToggleFolder}
          isSearchMatch={false}
        />
      ))}
    </div>
  )
}
