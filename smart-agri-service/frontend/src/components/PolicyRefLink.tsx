import React, { useState, useRef, useCallback, useEffect } from 'react'
import { usePolicyCache } from '../hooks/usePolicyCache'
import { HighlightedText, extractSentence } from './HighlightedText'
import type { PolicySection } from '../utils/parsePolicySections'

const BASENAME = '/huinongfu'
const POLICY_HREF_RE = /^\/policy\/([^#]+)(?:#section=([^&]+)(?:&text=(.+))?)?$/

interface PolicyRefLinkProps {
  href?: string
  children?: React.ReactNode
}

export function PolicyRefLink({ href, children, ...rest }: PolicyRefLinkProps) {
  // Check if this is a policy link
  const match = href ? href.match(POLICY_HREF_RE) : null

  if (!match) {
    // Render as normal link
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  }

  return <PolicyLink policyId={match[1]} sectionKey={match[2] || null} textQuery={match[3] ? decodeURIComponent(match[3]) : null}>{children}</PolicyLink>
}

function PolicyLink({
  policyId,
  sectionKey,
  textQuery,
  children,
}: {
  policyId: string
  sectionKey: string | null
  textQuery: string | null
  children?: React.ReactNode
}) {
  const { getPolicy, getPolicySection } = usePolicyCache()
  const [popover, setPopover] = useState<{
    policyName: string
    title: string
    content: string
  } | null>(null)
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [position, setPosition] = useState<'above' | 'below'>('above')
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const linkRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      clearTimers()
    }
  }, [clearTimers])

  const computePosition = useCallback(() => {
    if (!linkRef.current) return
    const rect = linkRef.current.getBoundingClientRect()
    // If there's less than 200px above the link, show below
    setPosition(rect.top < 200 ? 'below' : 'above')
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    if (popoverVisible) return

    hoverTimerRef.current = setTimeout(async () => {
      computePosition()
      if (sectionKey) {
        const section = await getPolicySection(policyId, sectionKey)
        if (!mountedRef.current) return
        if (section) {
          const content = textQuery ? extractSentence(section.content, textQuery) : section.content
          setPopover({ policyName: '', title: section.heading, content })
        } else {
          const policy = await getPolicy(policyId)
          if (!mountedRef.current) return
          if (policy) {
            const preview = policy.data.full_text
              ? policy.data.full_text.slice(0, 200) + '...'
              : policy.data.description
            setPopover({ policyName: policy.data.policy_name, title: policy.data.policy_name, content: preview })
          }
        }
      } else if (textQuery) {
        const policy = await getPolicy(policyId)
        if (!mountedRef.current) return
        if (policy && policy.data.full_text) {
          const sentence = extractSentence(policy.data.full_text, textQuery)
          setPopover({ policyName: policy.data.policy_name, title: policy.data.policy_name, content: sentence })
        } else if (policy) {
          setPopover({ policyName: policy.data.policy_name, title: policy.data.policy_name, content: policy.data.description })
        }
      } else {
        const policy = await getPolicy(policyId)
        if (!mountedRef.current) return
        if (policy) {
          setPopover({
            policyName: policy.data.policy_name,
            title: policy.data.policy_name,
            content: policy.data.description,
          })
        }
      }
      setPopoverVisible(true)
    }, 300)
  }, [policyId, sectionKey, textQuery, getPolicySection, getPolicy, popoverVisible, computePosition])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
    leaveTimerRef.current = setTimeout(() => {
      setPopoverVisible(false)
    }, 150)
  }, [])

  const handlePopoverEnter = useCallback(() => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
  }, [])

  const handlePopoverLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setPopoverVisible(false)
    }, 150)
  }, [])

  const handleClick = useCallback(() => {
    let url = `${BASENAME}/policy/${policyId}`
    if (sectionKey) {
      url += `?highlight=${encodeURIComponent(sectionKey)}`
      if (textQuery) {
        url += `&q=${encodeURIComponent(textQuery)}`
      }
    }
    window.open(url, '_blank')
  }, [policyId, sectionKey, textQuery])

  return (
    <span className="relative inline" ref={linkRef}>
      <span
        className="underline decoration-dotted decoration-blue-400 text-blue-600 cursor-pointer hover:text-blue-800 hover:decoration-blue-600 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
      >
        {children}
      </span>

      {popoverVisible && popover && (
        <div
          ref={popoverRef}
          className={`absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 ${
            position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
        >
          <div className="text-sm font-medium text-gray-800 mb-1.5 border-b border-gray-100 pb-1.5">
            {popover.title}
          </div>
          <div className="text-xs text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            <HighlightedText text={popover.content} query={textQuery} />
          </div>
        </div>
      )}
    </span>
  )
}
