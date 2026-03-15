<script setup lang="ts">
import { computed } from 'vue'
import type { FileMetadata } from '@kedge-agentic/vue-sdk'
import { getFileTypeLabel } from '../types'

const props = defineProps<{
  file: FileMetadata
}>()

const emit = defineEmits<{
  download: [fileId: string]
}>()

const typeLabel = computed(() => getFileTypeLabel(props.file.mimeType, props.file.filename))

const fileSize = computed(() => {
  const bytes = props.file.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const isNew = computed(() => props.file.status === 'new')

const badgeColor = computed(() => {
  switch (typeLabel.value) {
    case 'PPTX': return 'bg-orange-100 text-orange-700'
    case 'XLSX': return 'bg-green-100 text-green-700'
    case 'DOCX': return 'bg-blue-100 text-blue-700'
    case 'PDF': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
})
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50',
      isNew ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white',
    ]"
    @click="emit('download', file.id)"
  >
    <!-- File type badge -->
    <div :class="['flex-shrink-0 px-2 py-1 rounded text-xs font-bold', badgeColor]">
      {{ typeLabel }}
    </div>

    <!-- File info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-800 truncate">{{ file.filename }}</p>
      <p class="text-xs text-gray-500">{{ fileSize }}</p>
    </div>

    <!-- New badge -->
    <span v-if="isNew" class="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-600">
      NEW
    </span>

    <!-- Download icon -->
    <svg class="flex-shrink-0 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </div>
</template>
