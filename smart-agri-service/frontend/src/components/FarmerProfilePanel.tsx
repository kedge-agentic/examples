import React from 'react'
import { NarrativeCard } from './NarrativeCard'
import { FARMER_FIELDS } from '../types'
import type { SyncField, DisplayItem } from '../types'

interface FarmerProfilePanelProps {
  displayData: Map<SyncField, DisplayItem>
  isProcessing: boolean
}

export function FarmerProfilePanel({ displayData, isProcessing }: FarmerProfilePanelProps) {
  const hasAnyData = FARMER_FIELDS.some(f => displayData.has(f.field))

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
      {!hasAnyData && !isProcessing && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="border-2 border-dashed border-agri-green-200 rounded-2xl p-10 bg-gradient-to-b from-agri-green-50/50 to-transparent">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-agri-green-100 flex items-center justify-center mb-4">
                <span className="text-5xl">🌾</span>
              </div>
              <p className="text-lg font-medium text-agri-green-700 mb-2">农户服务面板</p>
              <p className="text-sm text-gray-400">← 从左侧输入手机号开始</p>
            </div>
          </div>
        </div>
      )}

      {FARMER_FIELDS.map(({ field, title, icon }, index) => {
        const item = displayData.get(field)
        const isLoading = isProcessing && !item && hasAnyData

        return (
          <NarrativeCard
            key={field}
            title={title}
            icon={icon}
            content={item?.value}
            viewMode="farmer"
            isLoading={isLoading}
            index={index}
          />
        )
      })}
    </div>
  )
}
