import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Authentication endpoints
router.get('/login', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    // Try to fetch the current user to test the authentication
    const response = await createRedmineRequest(authToken, redmineUrl, '/users/current.json');
    return res.json({ success: true, user: response.data.user });
  } catch (error) {
    console.error('Error authenticating with Redmine:', error.message);
    return res.status(401).json({ 
      error: 'Authentication failed. Please check your credentials.', 
      details: error.message 
    });
  }
});

router.get('/verify', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    // Verify the authentication by fetching the current user
    const response = await createRedmineRequest(authToken, redmineUrl, '/users/current.json');
    return res.json({ success: true, user: response.data.user });
  } catch (error) {
    console.error('Error verifying authentication:', error.message);
    return res.status(401).json({ 
      error: 'Authentication verification failed', 
      details: error.message 
    });
  }
});

export default router;