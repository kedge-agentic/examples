import React, { createContext, useContext, useRef, useCallback } from 'react'
import { parsePolicySections, type PolicySection } from '../utils/parsePolicySections'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3003') + '/api'

interface PolicyData {
  id: string
  policy_name: string
  description: string
  full_text: string | null
  has_full_text: boolean
}

interface CachedPolicy {
  data: PolicyData
  sections: PolicySection[]
  preamble: string
}

interface PolicyCacheContextValue {
  getPolicy(id: string): Promise<CachedPolicy | null>
  getPolicySection(id: string, sectionKey: string): Promise<PolicySection | null>
}

const PolicyCacheContext = createContext<PolicyCacheContextValue | null>(null)

export function PolicyCacheProvider({ children }: { children: React.ReactNode }) {
  const cache = useRef<Map<string, CachedPolicy>>(new Map())
  const pending = useRef<Map<string, Promise<CachedPolicy | null>>>(new Map())

  const getPolicy = useCallback(async (id: string): Promise<CachedPolicy | null> => {
    const cached = cache.current.get(id)
    if (cached) return cached

    // Deduplicate concurrent requests for the same policy
    const inflight = pending.current.get(id)
    if (inflight) return inflight

    const promise = fetch(`${API_BASE}/policies/${id}`)
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data: PolicyData | null) => {
        if (!data) return null
        const { preamble, sections } = data.full_text
          ? parsePolicySections(data.full_text)
          : { preamble: '', sections: [] }
        const entry: CachedPolicy = { data, sections, preamble }
        cache.current.set(id, entry)
        return entry
      })
      .catch(() => null)
      .finally(() => {
        pending.current.delete(id)
      })

    pending.current.set(id, promise)
    return promise
  }, [])

  const getPolicySection = useCallback(async (id: string, sectionKey: string): Promise<PolicySection | null> => {
    const policy = await getPolicy(id)
    if (!policy) return null
    return policy.sections.find(s => s.key === sectionKey) ?? null
  }, [getPolicy])

  return React.createElement(
    PolicyCacheContext.Provider,
    { value: { getPolicy, getPolicySection } },
    children,
  )
}

export function usePolicyCache(): PolicyCacheContextValue {
  const ctx = useContext(PolicyCacheContext)
  if (!ctx) throw new Error('usePolicyCache must be used within PolicyCacheProvider')
  return ctx
}
