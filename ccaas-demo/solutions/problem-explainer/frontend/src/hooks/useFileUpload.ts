import { useCallback, useState } from 'react';

interface UseFileUploadOptions {
  ccaasUrl?: string;
  sessionId: string;
}

interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<string>;
  isUploading: boolean;
  uploadError: string | null;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { ccaasUrl = '', sessionId } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', sessionId);
        formData.append('folder', 'images');

        const response = await fetch((ccaasUrl || '') + '/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.path || data.originalPath;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [ccaasUrl, sessionId]
  );

  return {
    uploadFile,
    isUploading,
    uploadError,
  };
}
