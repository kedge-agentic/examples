<script setup lang="ts">
import { ChatPanel } from '@kedge-agentic/vue-sdk'
import DeliverablePanel from './components/DeliverablePanel.vue'
import { useMckinseySession } from './hooks/useMckinseySession'

const session = useMckinseySession()

function handleSendMessage(content: string) {
  session.sendMessage(content)
}

function handleDownload(fileId: string) {
  session.downloadFile(fileId)
}

function handleRefreshFiles() {
  session.refetchFiles()
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-gray-800">McKinsey Consultant</h1>
        <span class="text-sm text-gray-400">KedgeAgentic Platform</span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="session.fileCount.value > 0" class="text-xs text-gray-500">
          {{ session.fileCount.value }} file(s)
        </span>
        <button
          @click="session.clearConversation"
          class="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          New Session
        </button>
      </div>
    </header>

    <!-- Main content: split panel -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left: Chat (40%) -->
      <div class="w-2/5 border-r border-gray-200">
        <ChatPanel
          :messages="session.messages.value"
          :is-processing="session.isProcessing.value"
          :connected="session.connected.value"
          :active-tools="session.activeTools.value"
          :is-thinking="session.isThinking.value"
          :thinking-content="session.thinkingContent.value"
          :thinking-start-time="session.thinkingStartTime.value"
          :thinking-verb="session.thinkingVerb.value"
          :todo-items="session.todoItems.value"
          :todo-stats="session.todoStats.value"
          :active-sub-agents="session.activeSubAgents.value"
          :token-usage="session.tokenUsage.value"
          title="McKinsey Consultant"
          color-scheme="blue"
          empty-state-text="McKinsey Consultant"
          empty-state-subtext="Describe a business problem to start the consulting workflow"
          placeholder="e.g. Help me analyze the online education market..."
          @send-message="handleSendMessage"
          @cancel="session.cancelProcessing"
        />
      </div>

      <!-- Right: Deliverables (60%) -->
      <div class="w-3/5">
        <DeliverablePanel
          :files="session.files.value"
          :is-loading="session.filesLoading.value"
          :new-files-count="session.newFilesCount.value"
          :connected="session.connected.value"
          @download="handleDownload"
          @refresh="handleRefreshFiles"
        />
      </div>
    </div>
  </div>
</template>
