import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get membership details
router.get('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, `/memberships/${id}.json`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching membership ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch membership ${id}`, details: error.message });
  }
});

// Update a membership (only roles can be updated)
router.put('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const membershipData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/memberships/${id}.json`, 
      {}, 
      'put', 
      membershipData
    );
    return res.status(204).json({ success: true });
  } catch (error) {
    console.error(`Error updating membership ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to update membership ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Delete a membership
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
      `/memberships/${id}.json`, 
      {}, 
      'delete'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting membership ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to delete membership ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

export default router;