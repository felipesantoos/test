import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get all roles
router.get('/', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, '/roles.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching roles:', error.message);
    return res.status(500).json({ error: 'Failed to fetch roles', details: error.message });
  }
});

export default router;