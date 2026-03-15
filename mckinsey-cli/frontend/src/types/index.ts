/** McKinsey consulting workflow steps */
export type ConsultingStep =
  | 'problem-deconstruction'
  | 'issue-tree'
  | 'hypotheses'
  | 'argumentation'
  | 'dummy-pages'
  | 'ppt-generation'
  | 'excel-generation'
  | 'word-report'
  | 'optimization'

/** File type icons mapping */
export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/pdf': 'PDF',
  'text/markdown': 'MD',
  'text/plain': 'TXT',
}

/** Get display label for a file's MIME type */
export function getFileTypeLabel(mimeType: string | null, filename: string): string {
  if (mimeType && FILE_TYPE_ICONS[mimeType]) {
    return FILE_TYPE_ICONS[mimeType]
  }
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'FILE'
}
