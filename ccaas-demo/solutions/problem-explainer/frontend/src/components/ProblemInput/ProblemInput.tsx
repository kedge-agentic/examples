import React, { useCallback, useRef, useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface ProblemInputProps {
  content: string;
  imageUrl?: string;
  subject: string;
  gradeLevel: string;
  onContentChange: (content: string) => void;
  onImageChange: (imageUrl: string) => void;
  sessionId: string;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({
  content,
  imageUrl,
  subject,
  gradeLevel,
  onContentChange,
  onImageChange,
  sessionId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, uploadError } = useFileUpload({
    sessionId,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        try {
          const path = await uploadFile(file);
          onImageChange(path);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    },
    [uploadFile, onImageChange]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        try {
          const path = await uploadFile(file);
          onImageChange(path);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    },
    [uploadFile, onImageChange]
  );

  return (
    <div className="flex flex-col h-full p-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">题目内容</h2>

      {/* Text Input */}
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="输入题目内容..."
        className="flex-1 border rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Image Upload */}
      <div className="mt-3">
        <h3 className="text-xs font-medium text-gray-600 mb-1">题目图片</h3>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            'border-2 border-dashed rounded p-3 text-center cursor-pointer transition-colors ' +
            (isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400')
          }
        >
          {isUploading ? (
            <div className="text-sm text-gray-500">上传中...</div>
          ) : imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="题目图片"
                className="max-h-32 mx-auto rounded"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageChange('');
                }}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              拖拽图片到此处
              <br />
              或点击上传
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        {uploadError && (
          <div className="text-xs text-red-500 mt-1">{uploadError}</div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 text-xs text-gray-500">
        <div>学科: {subject}</div>
        <div>年级: {gradeLevel}</div>
      </div>
    </div>
  );
};
