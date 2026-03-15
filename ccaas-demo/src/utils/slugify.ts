/**
 * Convert a name to a URL-friendly slug
 */
export function slugify(name: string, maxLength = 100): string {
  if (!name || typeof name !== 'string') return ''

  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')                    // Normalize Unicode
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritics
    .replace(/[\s_]+/g, '-')             // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, '')            // Remove non-word characters except hyphens
    .replace(/\-\-+/g, '-')              // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')                  // Trim hyphens from start
    .replace(/-+$/, '')                  // Trim hyphens from end
    .slice(0, maxLength)                 // Enforce maximum length
}
