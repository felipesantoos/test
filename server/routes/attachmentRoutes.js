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
