import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get current user account details
router.get('/account', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, '/my/account.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching user account:', error.message);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch user account', 
      details: error.message 
    });
  }
});

// Update current user account
router.put('/account', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const userData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      '/my/account.json', 
      {}, 
      'put', 
      userData
    );
    return res.status(204).send();
  } catch (error) {
    console.error('Error updating user account:', error.message);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to update user account', 
      details: error.message 
    });
  }
});

// Change user password
router.put('/password', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const passwordData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      '/my/password.json', 
      {}, 
      'put', 
      passwordData
    );
    return res.status(204).send();
  } catch (error) {
    console.error('Error changing password:', error.message);
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to change password', 
      details: error.response?.data?.errors || error.message 
    });
  }
});

export default router;