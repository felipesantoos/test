import React, { useState } from 'react';
import { Paperclip, Download, Trash2, Edit2, Save, X, FileText, Image, File as FileIcon } from 'lucide-react';
import { deleteAttachment, updateAttachment, downloadAttachment } from '../../services/attachmentService';

interface AttachmentsProps {
  attachments: any[];
  onDelete?: (attachmentId: number) => void;
  onUpdate?: (attachmentId: number, description: string) => void;
  readOnly?: boolean;
}

export const Attachments: React.FC<AttachmentsProps> = ({
  attachments,
  onDelete,
  onUpdate,
  readOnly = false
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type.startsWith('text/')) return <FileText size={16} className="text-green-500" />;
    return <FileIcon size={16} className="text-gray-500" />;
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
      onDelete?.(attachmentId);
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
      onUpdate?.(attachmentId, editingDescription);
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

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Paperclip size={24} className="mx-auto mb-2" />
        <p>No attachments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getFileIcon(attachment.content_type)}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(attachment.id, attachment.filename)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate"
                >
                  {attachment.filename}
                </button>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(attachment.filesize)})
                </span>
              </div>
              
              {editingId === attachment.id ? (
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                <p className="text-sm text-gray-500 truncate">
                  {attachment.description || 'No description'}
                </p>
              )}
            </div>
          </div>
          
          {!readOnly && (
            <div className="ml-4 flex items-center space-x-2">
              <button
                onClick={() => handleDownload(attachment.id, attachment.filename)}
                className="text-gray-400 hover:text-gray-600"
                title="Download"
              >
                <Download size={16} />
              </button>
              
              {editingId !== attachment.id && (
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
              )}
              
              <button
                onClick={() => handleDelete(attachment.id)}
                disabled={loading}
                className="text-red-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
