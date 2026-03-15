/**
 * Slugify Utility Tests
 */

import { describe, it, expect } from 'vitest'
import { slugify } from '../slugify'

describe('slugify', () => {
  it('converts basic string to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('my skill name')).toBe('my-skill-name')
  })

  it('replaces underscores with hyphens', () => {
    expect(slugify('my_skill_name')).toBe('my-skill-name')
  })

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world')
  })

  it('handles multiple consecutive spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('handles multiple consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('trims leading hyphens', () => {
    expect(slugify('---hello')).toBe('hello')
  })

  it('trims trailing hyphens', () => {
    expect(slugify('hello---')).toBe('hello')
  })

  it('handles Unicode characters with diacritics', () => {
    expect(slugify('Café résumé')).toBe('cafe-resume')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles whitespace only string', () => {
    expect(slugify('   ')).toBe('')
  })

  it('handles null/undefined input', () => {
    expect(slugify(null as unknown as string)).toBe('')
    expect(slugify(undefined as unknown as string)).toBe('')
  })

  it('respects maxLength parameter', () => {
    expect(slugify('this is a very long string that should be truncated', 20)).toBe('this-is-a-very-long-')
  })

  it('handles numbers', () => {
    expect(slugify('Skill 123')).toBe('skill-123')
  })

  it('handles mixed case', () => {
    expect(slugify('HeLLo WoRLD')).toBe('hello-world')
  })

  it('handles CJK characters (removes them)', () => {
    expect(slugify('Hello 世界')).toBe('hello')
  })

  it('handles emoji (removes them)', () => {
    expect(slugify('Hello 👋 World')).toBe('hello-world')
  })

  it('preserves existing hyphens', () => {
    expect(slugify('pre-existing-slug')).toBe('pre-existing-slug')
  })

  it('handles string with only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('')
  })
})
