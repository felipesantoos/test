import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Download a file from Redmine
router.get('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    // First get the attachment details to get the content_url
    const attachmentResponse = await createRedmineRequest(
      authToken,
      redmineUrl,
      `/attachments/${id}.json`
    );

    if (!attachmentResponse.data?.attachment) {
      throw new Error('Attachment not found');
    }

    const attachment = attachmentResponse.data.attachment;

    // Now download the actual file with proper binary handling
    const fileResponse = await createRedmineRequest(
      authToken,
      redmineUrl,
      `/attachments/download/${id}/${encodeURIComponent(attachment.filename)}`,
      {},
      'get',
      null,
      {
        responseType: 'arraybuffer',
        'Accept': '*/*'
      }
    );

    // Set response headers for proper binary handling
    res.setHeader('Content-Type', attachment.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Length', fileResponse.data.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Send the file as a buffer
    return res.send(Buffer.from(fileResponse.data));
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to download file', 
      details: error.message 
    });
  }
});

export default router;
