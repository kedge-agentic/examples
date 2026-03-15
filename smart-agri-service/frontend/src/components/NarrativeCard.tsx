import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import type { ViewMode } from '../types'
import { policyMarkdownComponents } from '../utils/markdownComponents'

interface NarrativeCardProps {
  title: string
  icon: string
  content: unknown
  viewMode: ViewMode
  isLoading?: boolean
  index?: number
}

export function NarrativeCard({ title, icon, content, viewMode, isLoading, index = 0 }: NarrativeCardProps) {
  const [expanded, setExpanded] = useState(true)
  const isFarmer = viewMode === 'farmer'

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl shadow-card p-4 mb-3 animate-slide-in"
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
            isFarmer ? 'bg-agri-green-50' : 'bg-bank-blue-50'
          }`}>
            {icon}
          </div>
          <span className="font-medium text-gray-400">{title}</span>
        </div>
        <div className="space-y-2.5">
          <div className="h-3 skeleton-shimmer rounded w-full" />
          <div className="h-3 skeleton-shimmer rounded w-5/6" />
          <div className="h-3 skeleton-shimmer rounded w-4/5" />
          <div className="h-3 skeleton-shimmer rounded w-3/5" />
        </div>
      </div>
    )
  }

  if (!content) return null

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div className="markdown-content text-gray-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={policyMarkdownComponents}>{content}</ReactMarkdown>
        </div>
      )
    }

    // Handle JSON arrays (opportunity_list, policy_matches)
    if (Array.isArray(content)) {
      return (
        <div className="space-y-2">
          {content.map((item: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border ${
              isFarmer ? 'bg-agri-green-50 border-agri-green-100' : 'bg-bank-blue-50 border-bank-blue-100'
            }`}>
              {item.title && <div className="font-medium text-sm mb-1">{item.title}</div>}
              {item.policy_name && (
                <div className="font-medium text-sm mb-1">
                  {item.policy_id ? (
                    <Link
                      to={`/policy/${item.policy_id}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.policy_name}
                      {item.has_full_text && <span className="ml-1 text-xs text-blue-400">[full text]</span>}
                    </Link>
                  ) : (
                    item.policy_name
                  )}
                </div>
              )}
              {item.product_name && <div className="font-medium text-sm mb-1">{item.product_name}</div>}
              {item.description && <div className="text-xs text-gray-600">{item.description}</div>}
              {item.benefit && <div className="text-xs text-gray-600 mt-1">收益: {item.benefit}</div>}
              {item.category && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                  isFarmer ? 'bg-agri-green-100 text-agri-green-700' : 'bg-bank-blue-100 text-bank-blue-700'
                }`}>
                  {item.category}
                </span>
              )}
              {item.urgency && (
                <span className={`inline-block mt-1 ml-1 px-2 py-0.5 rounded-full text-xs ${
                  item.urgency === '高' ? 'bg-red-100 text-red-700' :
                  item.urgency === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.urgency}
                </span>
              )}
              {item.relevance && (
                <span className={`inline-block mt-1 ml-1 px-2 py-0.5 rounded-full text-xs ${
                  item.relevance === '高' ? 'bg-green-100 text-green-700' :
                  item.relevance === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  相关度: {item.relevance}
                </span>
              )}
              {item.action && <div className="text-xs text-gray-500 mt-1">→ {item.action}</div>}
            </div>
          ))}
        </div>
      )
    }

    // Handle JSON objects (loan_recommendation)
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>
      return (
        <div className={`p-3 rounded-lg border ${
          isFarmer ? 'bg-agri-green-50 border-agri-green-100' : 'bg-bank-blue-50 border-bank-blue-100'
        }`}>
          {Object.entries(obj).map(([key, val]) => (
            <div key={key} className="flex justify-between text-sm py-1 border-b last:border-0 border-gray-100">
              <span className="text-gray-500">{key}</span>
              <span className="text-gray-800 font-medium">{String(val)}</span>
            </div>
          ))}
        </div>
      )
    }

    return <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow mb-3 overflow-hidden animate-slide-in ${
        expanded ? (isFarmer ? 'border-l-[3px] border-l-agri-green-400' : 'border-l-[3px] border-l-bank-blue-400') : ''
      }`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
            isFarmer ? 'bg-agri-green-50' : 'bg-bank-blue-50'
          }`}>
            {icon}
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        {/* Chevron icon with rotation */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? '' : '-rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-3 pb-3 animate-slide-up">
          {renderContent()}
        </div>
      )}
    </div>
  )
}
