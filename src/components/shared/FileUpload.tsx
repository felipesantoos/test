import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../services/attachmentService';

interface FileUploadProps {
  onUploadComplete: (upload: { token: string; filename: string; content_type: string }) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes, default 5MB
  accept?: string; // file types to accept
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  multiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      const error = `File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`;
      setError(error);
      onError?.(error);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const uploadResponse = await uploadFile(file);
      onUploadComplete(uploadResponse);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload file';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (!multiple && files.length > 1) {
      const error = 'Only one file can be uploaded at a time';
      setError(error);
      onError?.(error);
      return;
    }

    for (const file of files) {
      await processFile(file);
    }
  }, [multiple, maxSize, onUploadComplete, onError]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!multiple && files.length > 1) {
      const error = 'Only one file can be uploaded at a time';
      setError(error);
      onError?.(error);
      return;
    }

    for (const file of files) {
      await processFile(file);
    }

    // Reset the input
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {error ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Upload className={`h-12 w-12 ${uploading ? 'animate-bounce' : ''} ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div className="space-y-1">
            <p className={`text-sm font-medium ${error ? 'text-red-800' : 'text-gray-700'}`}>
              {error ? (
                error
              ) : uploading ? (
                'Uploading...'
              ) : (
                <>
                  <span className="text-indigo-600">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? 'Files up to' : 'File up to'} {maxSize / 1024 / 1024}MB
            </p>
          </div>
        </div>

        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept={accept}
          multiple={multiple}
          disabled={uploading}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center">
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-600 hover:text-red-500"
          >
            Clear error
          </button>
        </div>
      )}
    </div>
  );
};
