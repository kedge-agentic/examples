import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  filterTree,
  sortTree,
  matchesSearch,
  generateNodeId,
} from '../fileUtils'
import type { FileTreeNode } from '../../types'

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(100)).toBe('100.0 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })

    it('handles large sizes', () => {
      expect(formatFileSize(1099511627776)).toBe('1.0 TB')
    })
  })

  describe('matchesSearch', () => {
    it('returns false for empty query', () => {
      const node: FileTreeNode = {
        id: '1',
        name: 'test.txt',
        type: 'file',
        path: 'test.txt',
      }
      expect(matchesSearch(node, '')).toBe(false)
    })

    it('matches case-insensitive', () => {
      const node: FileTreeNode = {
        id: '1',
        name: 'Test.txt',
        type: 'file',
        path: 'Test.txt',
      }
      expect(matchesSearch(node, 'test')).toBe(true)
      expect(matchesSearch(node, 'TEST')).toBe(true)
      expect(matchesSearch(node, 'TeSt')).toBe(true)
    })

    it('returns false for non-matching query', () => {
      const node: FileTreeNode = {
        id: '1',
        name: 'test.txt',
        type: 'file',
        path: 'test.txt',
      }
      expect(matchesSearch(node, 'foo')).toBe(false)
    })
  })

  describe('filterTree', () => {
    const mockTree: FileTreeNode[] = [
      {
        id: '1',
        name: 'folder1',
        type: 'folder',
        path: 'folder1',
        children: [
          {
            id: '2',
            name: 'test.txt',
            type: 'file',
            path: 'folder1/test.txt',
          },
          {
            id: '3',
            name: 'intro.md',
            type: 'file',
            path: 'folder1/intro.md',
          },
        ],
      },
      {
        id: '4',
        name: 'readme.md',
        type: 'file',
        path: 'readme.md',
      },
    ]

    it('returns all nodes when query is empty', () => {
      const result = filterTree(mockTree, '')
      expect(result).toEqual(mockTree)
    })

    it('filters files by name', () => {
      const result = filterTree(mockTree, 'intro')
      expect(result).toHaveLength(1)
      expect(result[0]?.type).toBe('folder')
      expect(result[0]?.children).toHaveLength(1)
      expect(result[0]?.children?.[0]?.name).toBe('intro.md')
    })

    it('includes folder if name matches', () => {
      const result = filterTree(mockTree, 'folder1')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('folder1')
    })

    it('includes folder if child matches', () => {
      const result = filterTree(mockTree, 'test')
      expect(result).toHaveLength(1)
      expect(result[0]?.type).toBe('folder')
      expect(result[0]?.children).toHaveLength(1)
      expect(result[0]?.children?.[0]?.name).toBe('test.txt')
    })

    it('returns empty array for non-matching query', () => {
      const result = filterTree(mockTree, 'nonexistent')
      expect(result).toEqual([])
    })
  })

  describe('sortTree', () => {
    const mockTree: FileTreeNode[] = [
      {
        id: '1',
        name: 'zebra.txt',
        type: 'file',
        path: 'zebra.txt',
        size: 1000,
        mimeType: 'text/plain',
      },
      {
        id: '2',
        name: 'alpha.txt',
        type: 'file',
        path: 'alpha.txt',
        size: 5000,
        mimeType: 'text/plain',
      },
      {
        id: '3',
        name: 'folder-z',
        type: 'folder',
        path: 'folder-z',
        children: [],
      },
      {
        id: '4',
        name: 'folder-a',
        type: 'folder',
        path: 'folder-a',
        children: [],
      },
    ]

    it('sorts by name ascending', () => {
      const result = sortTree(mockTree, 'name', 'asc')
      // Folders first, then files, both alphabetically
      expect(result[0]?.name).toBe('folder-a')
      expect(result[1]?.name).toBe('folder-z')
      expect(result[2]?.name).toBe('alpha.txt')
      expect(result[3]?.name).toBe('zebra.txt')
    })

    it('sorts by name descending', () => {
      const result = sortTree(mockTree, 'name', 'desc')
      // Folders first (reversed), then files (reversed)
      expect(result[0]?.name).toBe('folder-z')
      expect(result[1]?.name).toBe('folder-a')
      expect(result[2]?.name).toBe('zebra.txt')
      expect(result[3]?.name).toBe('alpha.txt')
    })

    it('sorts by size ascending', () => {
      const result = sortTree(mockTree, 'size', 'asc')
      // Folders first, then files by size
      expect(result[0]?.type).toBe('folder')
      expect(result[1]?.type).toBe('folder')
      expect(result[2]?.size).toBe(1000)
      expect(result[3]?.size).toBe(5000)
    })

    it('sorts by size descending', () => {
      const result = sortTree(mockTree, 'size', 'desc')
      // Folders first, then files by size (reversed)
      expect(result[0]?.type).toBe('folder')
      expect(result[1]?.type).toBe('folder')
      expect(result[2]?.size).toBe(5000)
      expect(result[3]?.size).toBe(1000)
    })

    it('recursively sorts children', () => {
      const treeWithChildren: FileTreeNode[] = [
        {
          id: '1',
          name: 'folder',
          type: 'folder',
          path: 'folder',
          children: [
            {
              id: '2',
              name: 'z.txt',
              type: 'file',
              path: 'folder/z.txt',
            },
            {
              id: '3',
              name: 'a.txt',
              type: 'file',
              path: 'folder/a.txt',
            },
          ],
        },
      ]

      const result = sortTree(treeWithChildren, 'name', 'asc')
      expect(result[0]?.children?.[0]?.name).toBe('a.txt')
      expect(result[0]?.children?.[1]?.name).toBe('z.txt')
    })
  })

  describe('generateNodeId', () => {
    it('generates ID from path', () => {
      expect(generateNodeId('folder/file.txt')).toBe('node-folder-file-txt')
      expect(generateNodeId('test')).toBe('node-test')
    })

    it('handles special characters', () => {
      expect(generateNodeId('foo/bar.baz')).toBe('node-foo-bar-baz')
      expect(generateNodeId('a@b#c$d')).toBe('node-a-b-c-d')
    })
  })
})
