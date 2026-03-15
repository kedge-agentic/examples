export interface PolicySection {
  key: string       // "一", "二", "三-一"
  heading: string   // "一、补贴对象", "（一）农户申报"
  title: string     // "补贴对象", "农户申报"
  level: 1 | 2
  content: string   // Full text of this section (including heading)
}

const CN_NUMBERS = '一二三四五六七八九十'
const TOP_RE = new RegExp(`^([${CN_NUMBERS}]+)、(.+)$`, 'm')
const SUB_RE = new RegExp(`^（([${CN_NUMBERS}]+)）(.+)$`, 'm')

/**
 * Parse policy full_text into structured sections by Chinese-numbered headings.
 * Returns { preamble, sections } where preamble is text before the first heading.
 */
export function parsePolicySections(fullText: string): {
  preamble: string
  sections: PolicySection[]
} {
  const lines = fullText.split('\n')
  const sections: PolicySection[] = []
  let preambleLines: string[] = []
  let currentSection: { key: string; heading: string; title: string; level: 1 | 2; lines: string[] } | null = null
  let currentTopKey = ''

  for (const line of lines) {
    const trimmed = line.trim()
    const topMatch = trimmed.match(TOP_RE)
    const subMatch = trimmed.match(SUB_RE)

    if (topMatch) {
      // Flush previous section
      if (currentSection) {
        sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() })
      }
      currentTopKey = topMatch[1]
      currentSection = {
        key: topMatch[1],
        heading: trimmed,
        title: topMatch[2],
        level: 1,
        lines: [line],
      }
    } else if (subMatch && currentTopKey) {
      // Flush previous section
      if (currentSection) {
        sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() })
      }
      currentSection = {
        key: `${currentTopKey}-${subMatch[1]}`,
        heading: trimmed,
        title: subMatch[2],
        level: 2,
        lines: [line],
      }
    } else if (currentSection) {
      currentSection.lines.push(line)
    } else {
      preambleLines.push(line)
    }
  }

  // Flush last section
  if (currentSection) {
    sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() })
  }

  return {
    preamble: preambleLines.join('\n').trim(),
    sections,
  }
}
