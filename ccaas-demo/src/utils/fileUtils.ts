import type { FileTreeNode } from '../types'

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Filter file tree by search query (recursive)
 */
export function filterTree(
  nodes: FileTreeNode[],
  searchQuery: string
): FileTreeNode[] {
  if (!searchQuery) return nodes

  const query = searchQuery.toLowerCase()

  return nodes.reduce<FileTreeNode[]>((acc, node) => {
    const nameMatches = node.name.toLowerCase().includes(query)

    if (node.type === 'folder' && node.children) {
      const filteredChildren = filterTree(node.children, searchQuery)

      if (nameMatches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        })
      }
    } else if (nameMatches) {
      acc.push(node)
    }

    return acc
  }, [])
}

/**
 * Sort file tree by specified criteria (recursive)
 */
export function sortTree(
  nodes: FileTreeNode[],
  sortBy: 'name' | 'size' | 'type',
  sortOrder: 'asc' | 'desc'
): FileTreeNode[] {
  const sorted = [...nodes].sort((a, b) => {
    // Folders always first
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }

    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = (a.size || 0) - (b.size || 0)
        break
      case 'type':
        comparison = (a.mimeType || '').localeCompare(b.mimeType || '')
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Recursively sort children
  return sorted.map(node => {
    if (node.type === 'folder' && node.children) {
      return {
        ...node,
        children: sortTree(node.children, sortBy, sortOrder)
      }
    }
    return node
  })
}

/**
 * Check if a node matches search query
 */
export function matchesSearch(node: FileTreeNode, searchQuery: string): boolean {
  if (!searchQuery) return false
  return node.name.toLowerCase().includes(searchQuery.toLowerCase())
}

/**
 * Flatten tree structure for virtualization (optional)
 */
export function flattenTree(
  nodes: FileTreeNode[],
  expandedFolders: Set<string>,
  level: number = 0
): Array<FileTreeNode & { level: number }> {
  const result: Array<FileTreeNode & { level: number }> = []

  for (const node of nodes) {
    result.push({ ...node, level })

    if (node.type === 'folder' && node.children && expandedFolders.has(node.id)) {
      result.push(...flattenTree(node.children, expandedFolders, level + 1))
    }
  }

  return result
}

/**
 * Generate unique ID for file tree node
 */
export function generateNodeId(path: string): string {
  return `node-${path.replace(/[^a-zA-Z0-9]/g, '-')}`
}
