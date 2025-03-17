import React, { useState } from 'react';
import { FileUpload } from '../../shared/FileUpload';
import { Paperclip, Download, Trash2, Edit2, Save, X, FileText, Image as ImageIcon, File, Eye, Copy } from 'lucide-react';
import { downloadAttachment, deleteAttachment, updateAttachment, getAttachmentBinaryUrl } from '../../../services/attachmentService';
import { useApi } from '../../../context/ApiContext';

interface AttachmentsTabProps {
  issueId?: number; // Add issueId prop
  attachments: any[];
  onAttachmentDelete?: (attachmentId: number) => void;
  onAttachmentUpdate?: (attachmentId: number, description: string) => void;
  onUploadComplete?: (upload: { token: string; filename: string; content_type: string }) => void;
}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  issueId,
  attachments,
  onAttachmentDelete,
  onAttachmentUpdate,
  onUploadComplete
}) => {
  const { updateIssue } = useApi();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />;
    if (type.startsWith('text/')) return <FileText size={16} className="text-green-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle attachment deletion
  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    setLoading(true);
    try {
      await deleteAttachment(attachmentId);
      onAttachmentDelete?.(attachmentId);
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert('Failed to delete attachment');
    } finally {
      setLoading(false);
    }
  };

  // Handle description update
  const handleUpdate = async (attachmentId: number) => {
    setLoading(true);
    try {
      await updateAttachment(attachmentId, editingDescription);
      onAttachmentUpdate?.(attachmentId, editingDescription);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating attachment:', err);
      alert('Failed to update attachment description');
    } finally {
      setLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async (attachmentId: number, filename: string) => {
    try {
      await downloadAttachment(attachmentId, filename);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment');
    }
  };

  // Handle copying the attachment URL to clipboard
  const handleCopyUrl = (attachmentId: number) => {
    try {
      const url = getAttachmentBinaryUrl(attachmentId);
      navigator.clipboard.writeText(url)
        .then(() => alert('Attachment URL copied to clipboard!'))
        .catch((err) => {
          console.error('Failed to copy URL:', err);
          alert('Failed to copy URL');
        });
    } catch (err) {
      console.error('Error getting attachment URL:', err);
      alert('Failed to get attachment URL');
    }
  };

  // Handle file upload completion
  const handleUploadComplete = async (upload: { token: string; filename: string; content_type: string }) => {
    onUploadComplete?.(upload);

    if (issueId) {
      try {
        setLoading(true);
        await updateIssue(issueId, {
          issue: {
            uploads: [{
              token: upload.token,
              filename: upload.filename,
              content_type: upload.content_type
            }]
          }
        });
      } catch (err) {
        console.error('Error updating issue with new attachment:', err);
        alert('Failed to attach file to issue');
      } finally {
        setLoading(false);
      }
    }
  };

  // Check if file is an image
  const isImage = (contentType: string) => {
    return contentType.startsWith('image/');
  };

  // Preview image
  const handlePreviewImage = (attachmentId: number) => {
    try {
      const imageUrl = getAttachmentBinaryUrl(attachmentId);
      setPreviewImage(imageUrl);
    } catch (err) {
      console.error('Error getting image URL:', err);
      alert('Failed to load image preview');
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Upload New Files</h2>
        <FileUpload
          onUploadComplete={handleUploadComplete}
          multiple={true}
          maxSize={5 * 1024 * 1024} // 5MB
        />
      </div>

      {/* Attachments List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Issue Attachments</h2>
        
        {attachments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Paperclip size={24} className="mx-auto mb-2" />
            <p>No attachments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-col border rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Image Preview (if applicable) */}
                {isImage(attachment.content_type) && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={getAttachmentBinaryUrl(attachment.id)}
                      alt={attachment.filename}
                      className="w-full h-full object-contain"
                      onClick={() => handlePreviewImage(attachment.id)}
                    />
                    <button
                      onClick={() => handlePreviewImage(attachment.id)}
                      className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      title="Preview Image"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getFileIcon(attachment.content_type)}
                      <span className="ml-2 font-medium text-sm text-gray-900 truncate">
                        {attachment.filename}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(attachment.filesize)}
                    </span>
                  </div>
                  
                  {editingId === attachment.id ? (
                    <div className="mt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter description..."
                      />
                      <button
                        onClick={() => handleUpdate(attachment.id)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">
                      {attachment.description || 'No description'}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Uploaded on {new Date(attachment.created_on).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(attachment.id, attachment.filename)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(attachment.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy URL"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(attachment.id);
                          setEditingDescription(attachment.description || '');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit description"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(attachment.id)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
