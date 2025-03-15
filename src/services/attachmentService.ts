import axios from 'axios';

// Use environment variable with fallback
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('redmine_auth') || '';
};

// Helper function to get Redmine URL from localStorage
const getRedmineUrl = () => {
  return localStorage.getItem('redmine_url') || '';
};

interface UploadResponse {
  token: string;
  filename: string;
  content_type: string;
}

interface AttachmentResponse {
  id: number;
  filename: string;
  filesize: number;
  content_type: string;
  description: string | null;
  content_url: string;
  thumbnail_url?: string;
  author: {
    id: number;
    name: string;
  };
  created_on: string;
}

// Upload a file and get a token
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();
    
    // Upload file to Redmine through our proxy
    const response = await axios.post(`${SERVER_URL}/api/uploads`, fileData, {
      params: { 
        authToken,
        redmineUrl,
        filename: file.name,
        content_type: file.type
      },
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    // Get the token from the response
    const token = response.data.upload.token;

    return {
      token: token,
      filename: file.name,
      content_type: file.type
    };
  } catch (err: any) {
    console.error('Error uploading file:', err);
    throw new Error(err.response?.data?.error || 'Failed to upload file');
  }
};

// Get attachment details
export const getAttachmentDetails = async (attachmentId: number): Promise<AttachmentResponse> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios.get(`${SERVER_URL}/api/attachments/${attachmentId}`, {
      params: { 
        authToken,
        redmineUrl
      }
    });

    return response.data.attachment;
  } catch (err: any) {
    console.error('Error getting attachment details:', err);
    throw new Error(err.response?.data?.error || 'Failed to get attachment details');
  }
};

// Download an attachment
export const downloadAttachment = async (attachmentId: number, filename: string): Promise<void> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    // Get the file through our proxy server with proper binary handling
    const response = await axios.get(`${SERVER_URL}/api/downloads/${attachmentId}`, {
      params: { 
        authToken,
        redmineUrl
      },
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Error downloading attachment:', err);
    throw new Error(err.response?.data?.error || 'Failed to download attachment');
  }
};

// Delete an attachment
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    await axios.delete(`${SERVER_URL}/api/attachments/${attachmentId}`, {
      params: { 
        authToken,
        redmineUrl
      }
    });
  } catch (err: any) {
    console.error('Error deleting attachment:', err);
    throw new Error(err.response?.data?.error || 'Failed to delete attachment');
  }
};

// Update attachment description
export const updateAttachment = async (attachmentId: number, description: string): Promise<void> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    await axios.patch(`${SERVER_URL}/api/attachments/${attachmentId}`, 
      { attachment: { description } },
      {
        params: { 
          authToken,
          redmineUrl
        }
      }
    );
  } catch (err: any) {
    console.error('Error updating attachment:', err);
    throw new Error(err.response?.data?.error || 'Failed to update attachment');
  }
};
