import React from 'react'

/** Render text with query highlighted using <mark>, with optional ref on first mark for scrolling */
export function HighlightedText({ text, query, markRef }: {
  text: string
  query: string | null
  markRef?: React.RefObject<HTMLElement>
}) {
  if (!query || !text.includes(query)) return <>{text}</>
  const parts = text.split(query)
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark
              ref={i === 0 ? markRef : undefined}
              className="bg-amber-200 px-0.5 rounded"
            >
              {query}
            </mark>
          )}
        </React.Fragment>
      ))}
    </>
  )
}

/** Extract the sentence containing the query from a text block */
export function extractSentence(text: string, query: string): string {
  const sentences = text.split(/(?<=[。！？；\n])/).map(s => s.trim()).filter(Boolean)
  const found = sentences.find(s => s.includes(query))
  if (found) return found

  // Fallback: show a window of ~100 chars around the query
  const idx = text.indexOf(query)
  if (idx === -1) return text.slice(0, 200) + (text.length > 200 ? '...' : '')
  const start = Math.max(0, idx - 50)
  const end = Math.min(text.length, idx + query.length + 50)
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
}
