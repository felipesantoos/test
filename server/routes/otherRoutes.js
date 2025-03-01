import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get issue statuses
router.get('/issue_statuses', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, '/issue_statuses.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching issue statuses:', error.message);
    return res.status(500).json({ error: 'Failed to fetch issue statuses', details: error.message });
  }
});

// Get trackers
router.get('/trackers', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, '/trackers.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching trackers:', error.message);
    return res.status(500).json({ error: 'Failed to fetch trackers', details: error.message });
  }
});

// Get priorities
router.get('/enumerations/issue_priorities', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, '/enumerations/issue_priorities.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching priorities:', error.message);
    return res.status(500).json({ error: 'Failed to fetch priorities', details: error.message });
  }
});

export default router;