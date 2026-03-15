import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, Paperclip, Calendar, MapPin, Users, Banknote, Building2 } from 'lucide-react'
import { parsePolicySections } from '../utils/parsePolicySections'
import { HighlightedText } from '../components/HighlightedText'

// Solution backend URL
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3003') + '/api'

interface PolicyData {
  id: string
  policy_name: string
  doc_number: string | null
  category: string
  description: string
  full_text: string | null
  has_full_text: boolean
  benefit_amount: string
  target_audience: string
  application_method: string
  deadline: string
  region: string
  source: string
  publish_date: string
  attachments: { name: string; type: string }[] | null
}

export function PolicyDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightKey = searchParams.get('highlight')
  const textQuery = searchParams.get('q')
  const [policy, setPolicy] = useState<PolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${API_BASE}/policies/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Policy not found (${res.status})`)
        return res.json()
      })
      .then(data => {
        setPolicy(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  // Scroll highlighted section into view after render
  useEffect(() => {
    if (!loading && highlightKey) {
      // Small delay to ensure DOM is painted
      const timer = setTimeout(() => {
        // Prefer mark element for precise scrolling, fall back to section
        const target = markRef.current || highlightRef.current
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading, highlightKey])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">loading...</div>
      </div>
    )
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">{error || 'Policy not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <FileText size={16} />
            <span className="text-sm font-medium">Policy</span>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Document Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            {policy.source && (
              <div className="text-red-700 font-bold text-lg tracking-widest mb-2">
                {policy.source}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {policy.full_text
                ? extractTitle(policy.full_text, policy.policy_name)
                : policy.policy_name
              }
            </h1>
            {policy.doc_number && (
              <div className="text-gray-500 text-sm">{policy.doc_number}</div>
            )}
          </div>

          {/* Summary Card */}
          <div className="mx-8 my-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-amber-600"><Banknote size={14} /></span>
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium text-gray-800">{policy.benefit_amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600"><Calendar size={14} /></span>
                <span className="text-gray-500">Deadline:</span>
                <span className="font-medium text-gray-800">{policy.deadline}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600"><MapPin size={14} /></span>
                <span className="text-gray-500">Region:</span>
                <span className="font-medium text-gray-800">{policy.region}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600"><Users size={14} /></span>
                <span className="text-gray-500">Target:</span>
                <span className="font-medium text-gray-800 truncate">{policy.target_audience}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="text-amber-600"><Building2 size={14} /></span>
                <span className="text-gray-500">Category:</span>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {policy.category}
                </span>
                <span className="text-gray-500 ml-2">Method:</span>
                <span className="font-medium text-gray-800 truncate">{policy.application_method}</span>
              </div>
            </div>
          </div>

          {/* Full Text or Structured Summary */}
          <div className="px-8 pb-8">
            {policy.has_full_text && policy.full_text ? (
              <PolicyFullText fullText={policy.full_text} highlightKey={highlightKey} textQuery={textQuery} highlightRef={highlightRef} markRef={markRef} />
            ) : (
              <div className="space-y-4">
                <div className="text-gray-500 text-sm italic mb-4">
                  (No full text available, showing structured summary)
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700">{policy.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          {policy.attachments && policy.attachments.length > 0 && (
            <div className="px-8 pb-8 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Paperclip size={14} />
                Attachments
              </h3>
              <div className="space-y-2">
                {policy.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <Paperclip size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{att.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {att.type === 'form' ? 'Form' : att.type === 'template' ? 'Template' : att.type === 'catalog' ? 'Catalog' : att.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Extract the title line from full_text (the "关于..." line) */
function extractTitle(fullText: string, fallback: string): string {
  const lines = fullText.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('关于')) {
      return trimmed
    }
  }
  return fallback
}

/** Strip header lines (before and including doc number line) from full text */
function stripHeader(fullText: string): string {
  const lines = fullText.split('\n')
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/〔\d{4}〕/.test(trimmed) && !trimmed.startsWith('各')) {
      bodyStart = i + 1
      break
    }
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
    bodyStart++
  }
  return lines.slice(bodyStart).join('\n').trim()
}

/** Renders full text with section anchors and optional highlighting */
function PolicyFullText({
  fullText,
  highlightKey,
  textQuery,
  highlightRef,
  markRef,
}: {
  fullText: string
  highlightKey: string | null
  textQuery: string | null
  highlightRef: React.RefObject<HTMLDivElement>
  markRef: React.RefObject<HTMLElement>
}) {
  const { stripped, preamble, sections } = useMemo(() => {
    const s = stripHeader(fullText)
    const parsed = parsePolicySections(s)
    return { stripped: s, ...parsed }
  }, [fullText])

  // If no sections found, fall back to plain rendering
  if (sections.length === 0) {
    return (
      <div className="policy-full-text text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap font-serif">
        {stripped}
      </div>
    )
  }

  return (
    <div className="policy-full-text text-gray-700 text-[15px] leading-relaxed font-serif">
      {preamble && (
        <div className="whitespace-pre-wrap mb-4">{preamble}</div>
      )}
      {sections.map((section) => {
        const isHighlighted = highlightKey === section.key
        const hasTextMatch = isHighlighted && !!textQuery && section.content.includes(textQuery)
        return (
          <div
            key={section.key}
            id={`section-${section.key}`}
            ref={isHighlighted ? highlightRef : undefined}
            className={`whitespace-pre-wrap mb-3 px-3 py-2 rounded-lg transition-all duration-500 ${
              isHighlighted
                ? 'bg-amber-50 ring-2 ring-amber-300'
                : ''
            }`}
          >
            {hasTextMatch ? (
              <HighlightedText text={section.content} query={textQuery!} markRef={markRef} />
            ) : (
              section.content
            )}
          </div>
        )
      })}
    </div>
  )
}
