import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface DemoGuideModalProps {
  open: boolean
  onClose: () => void
}

export function DemoGuideModal({ open, onClose }: DemoGuideModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 animate-fade-in max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">慧农服 — AI 智慧农业金融服务平台</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-5">
          本 Demo 展示 AI 驱动的农业金融顾问能力。同一套农户数据，通过不同的 <strong>Skill</strong> 和 <strong>Session Template</strong>，呈现完全不同的分析视角。
        </p>

        <div className="space-y-5 text-sm text-gray-700">
          {/* --- 架构说明 --- */}
          <section className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="font-semibold text-base mb-3">🧩 平台架构</h3>
            <p className="text-gray-600 mb-3">
              慧农服基于 <strong>即见Agentic</strong> 平台构建，核心概念：
            </p>
            <div className="space-y-3 text-gray-600">
              <div>
                <span className="font-medium text-gray-700">Skill（技能）</span>
                <span className="mx-1">—</span>
                用自然语言描述 AI 的角色、工作流程和输出格式。本 Demo 定义了两个 Skill：
                <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">farmer-advisor</span>
                <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">bank-assessor</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">MCP Tools（工具）</span>
                <span className="mx-1">—</span>
                AI 通过 MCP 协议调用的外部工具，连接数据库、API 等。本 Demo 提供 10 个农业数据工具。
              </div>
              <div>
                <span className="font-medium text-gray-700">Session Template（会话模板）</span>
                <span className="mx-1">—</span>
                绑定 Skill + 系统提示词，切换「农户端 / 银行端」实际是切换不同的 Session Template。
              </div>
            </div>
          </section>

          {/* --- 两端对比 --- */}
          <div className="grid grid-cols-2 gap-3">
            <section className="bg-green-50/60 rounded-xl p-4 border border-green-100">
              <h3 className="font-semibold text-base mb-2 text-green-800">🌾 农户端</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Session Template</p>
                  <p className="text-xs text-green-700 font-mono font-medium">farmer-advisor</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">加载 Skill</p>
                  <p className="text-xs text-green-700 font-medium">farmer-advisor — 农技顾问</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">调用 MCP 工具</p>
                  <div className="flex flex-wrap gap-1">
                    {['get_farmer_by_phone', 'get_farmer_land', 'get_farmer_crops', 'get_farmer_equipment', 'get_farmer_loans', 'get_farmer_summary', 'search_gov_policies'].map(t => (
                      <code key={t} className="text-[10px] px-1 py-0.5 bg-green-100 text-green-700 rounded">{t}</code>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">输出面板（7 个）</p>
                  <p className="text-xs text-gray-600">农户画像 · 经营分析 · 机会推荐 · 政策匹配 · 行动计划 · 风险提示 · 市场展望</p>
                </div>
              </div>
            </section>
            <section className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <h3 className="font-semibold text-base mb-2 text-blue-800">🏦 银行端</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Session Template</p>
                  <p className="text-xs text-blue-700 font-mono font-medium">bank-assessor</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">加载 Skill</p>
                  <p className="text-xs text-blue-700 font-medium">bank-assessor — 信贷评估师</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">调用 MCP 工具</p>
                  <div className="flex flex-wrap gap-1">
                    {['get_farmer_by_phone', 'get_farmer_land', 'get_farmer_crops', 'get_farmer_equipment', 'get_farmer_loans', 'get_farmer_summary', 'search_gov_policies', 'search_loan_products', 'get_market_prices'].map(t => (
                      <code key={t} className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded">{t}</code>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">输出面板（8 个）</p>
                  <p className="text-xs text-gray-600">信贷评估 · 农户背景 · 资产概况 · 收入分析 · 还款记录 · 风险评估 · 贷款建议 · 抵押评估</p>
                </div>
              </div>
            </section>
          </div>

          {/* --- 工作流说明 --- */}
          <section className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="font-semibold text-base mb-2">🔗 工作流程</h3>
            <p className="text-xs text-gray-600">
              切换「农户端 / 银行端」→ 选择对应 Session Template → 加载绑定的 Skill → AI 按 Skill 定义的流程依次调用 MCP 工具采集数据 → 通过 <code className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">write_output</code> 将结构化结果推送到右侧面板实时渲染。
            </p>
          </section>

          {/* --- 使用说明 --- */}
          <section>
            <h3 className="font-semibold text-base mb-2">📱 测试号码</h3>
            <p className="ml-1 text-gray-600">
              13812345001 ~ 13812345050（共 50 个模拟农户）
              <br />
              也可点击聊天区底部的快捷角色按钮（种植大户、普通农户…）
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">💡 操作提示</h3>
            <ul className="space-y-1 ml-5 list-disc text-gray-600">
              <li>顶部切换「农户端 / 银行端」查看不同视角</li>
              <li>左侧聊天，右侧实时展示结构化分析结果</li>
              <li>点击左上角时钟图标查看历史对话</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
