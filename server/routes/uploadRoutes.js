import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Upload a file to Redmine
router.post('/', express.raw({ type: 'application/octet-stream', limit: '10mb' }), async (req, res) => {
  const { authToken, redmineUrl, filename, content_type } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  if (!req.body || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'No file data provided' });
  }

  try {
    // First, get the CSRF token by making a GET request to any page
    const tokenResponse = await createRedmineRequest(
      authToken,
      redmineUrl,
      '/',
      {},
      'get'
    );

    // Extract CSRF token from the response cookies
    const cookies = tokenResponse.headers['set-cookie'];
    let csrfToken = '';
    if (cookies) {
      const csrfCookie = cookies.find((cookie) => cookie.includes('CSRF-TOKEN='));
      if (csrfCookie) {
        csrfToken = csrfCookie.split('CSRF-TOKEN=')[1].split(';')[0];
      }
    }

    // Build query parameters for the Redmine upload endpoint
    const queryParams = new URLSearchParams({
      filename: filename,
      content_type: content_type
    });

    // Create the upload request to Redmine with CSRF token
    const response = await createRedmineRequest(
      authToken,
      redmineUrl,
      `/uploads.json?${queryParams.toString()}`,
      {},
      'post',
      req.body,
      {
        'Content-Type': 'application/octet-stream',
        'X-CSRF-Token': csrfToken
      }
    );

    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to upload file', 
      details: error.response?.data || error.message 
    });
  }
});

export default router;
