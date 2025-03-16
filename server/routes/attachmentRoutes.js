import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get attachment details
router.get('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      authToken,
      redmineUrl,
      `/attachments/${id}.json`
    );

    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch attachment', 
      details: error.response?.data || error.message 
    });
  }
});

// Get attachment binary data
router.get('/:id/raw', async (req, res) => {
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

    // Now get the actual file with proper binary handling
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
    res.setHeader('Content-Length', fileResponse.data.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Send the file as a buffer
    return res.send(Buffer.from(fileResponse.data));
  } catch (error) {
    console.error('Error fetching attachment binary:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch attachment binary', 
      details: error.response?.data || error.message 
    });
  }
});

// Update attachment description
router.patch('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const { description } = req.body.attachment || {};
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken,
      redmineUrl,
      `/attachments/${id}.json`,
      {},
      'patch',
      { attachment: { description } }
    );

    return res.status(204).send();
  } catch (error) {
    console.error('Error updating attachment:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to update attachment', 
      details: error.response?.data || error.message 
    });
  }
});

// Delete an attachment
router.delete('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken,
      redmineUrl,
      `/attachments/${id}.json`,
      {},
      'delete'
    );

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to delete attachment', 
      details: error.response?.data || error.message 
    });
  }
});

export default router;
