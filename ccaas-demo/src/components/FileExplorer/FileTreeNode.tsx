import { FileIcon, FolderIcon, ChevronRightIcon } from './FileIcon'
import { formatFileSize } from '../../utils/fileUtils'
import type { FileTreeNode } from '../../types'

interface FileTreeNodeProps {
  node: FileTreeNode
  level: number
  isExpanded: boolean
  expandedFolders: Set<string>
  onToggle: () => void
  onFileClick: (node: FileTreeNode) => void
  onToggleFolder: (id: string) => void
  isSearchMatch: boolean
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * FileTreeNode - Renders a single file or folder with interactions
 */
export function FileTreeNode({
  node,
  level,
  isExpanded,
  expandedFolders,
  onToggle,
  onFileClick,
  onToggleFolder,
  isSearchMatch
}: FileTreeNodeProps) {
  const isFolder = node.type === 'folder'

  return (
    <div className="file-tree-node">
      <button
        onClick={isFolder ? onToggle : () => onFileClick(node)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-left',
          'hover:bg-slate-700/50 transition-colors duration-200',
          'cursor-pointer rounded-md',
          isSearchMatch && 'bg-green-500/10 border-l-2 border-green-500'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        aria-label={isFolder ? `${isExpanded ? 'Collapse' : 'Expand'} folder ${node.name}` : `Download file ${node.name}`}
      >
        {isFolder ? (
          <>
            <ChevronRightIcon
              className={cn(
                'w-4 h-4 transition-transform duration-200 text-slate-300',
                isExpanded && 'rotate-90'
              )}
            />
            <FolderIcon className="w-5 h-5 text-blue-400" />
          </>
        ) : (
          <>
            <div className="w-4" /> {/* Spacer for alignment */}
            <FileIcon mimeType={node.mimeType} className="w-5 h-5 text-slate-400" />
          </>
        )}

        <span className="flex-1 font-mono text-sm text-slate-200 truncate">
          {node.name}
        </span>

        {!isFolder && node.size !== undefined && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatFileSize(node.size)}
          </span>
        )}
      </button>

      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div className="folder-children">
          {node.children.map(child => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={expandedFolders.has(child.id)}
              expandedFolders={expandedFolders}
              onToggle={() => onToggleFolder(child.id)}
              onFileClick={onFileClick}
              onToggleFolder={onToggleFolder}
              isSearchMatch={false} // Can be enhanced with search logic
            />
          ))}
        </div>
      )}
    </div>
  )
}
