<script setup lang="ts">
import type { FileMetadata } from '@kedge-agentic/vue-sdk'
import FileDownloadCard from './FileDownloadCard.vue'

defineProps<{
  files: FileMetadata[]
  isLoading: boolean
  newFilesCount: number
  connected: boolean
}>()

const emit = defineEmits<{
  download: [fileId: string]
  refresh: []
}>()
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold text-gray-800">Deliverables</h2>
        <span v-if="files.length > 0" class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          {{ files.length }}
        </span>
        <span v-if="newFilesCount > 0" class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
          {{ newFilesCount }} new
        </span>
      </div>
      <button
        @click="emit('refresh')"
        class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="Refresh files"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <svg class="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="files.length === 0" class="flex flex-col items-center justify-center h-full text-center">
        <svg class="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 font-medium">No deliverables yet</p>
        <p class="mt-1 text-sm text-gray-400">
          Generated PPT, Excel, and Word files will appear here
        </p>
      </div>

      <!-- File list -->
      <div v-else class="space-y-2">
        <FileDownloadCard
          v-for="file in files"
          :key="file.id"
          :file="file"
          @download="emit('download', $event)"
        />
      </div>
    </div>

    <!-- Footer: connection status -->
    <div class="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
      <span :class="['inline-block w-1.5 h-1.5 rounded-full', connected ? 'bg-green-400' : 'bg-red-400']" />
      {{ connected ? 'Connected to CCAAS' : 'Disconnected' }}
    </div>
  </div>
</template>
