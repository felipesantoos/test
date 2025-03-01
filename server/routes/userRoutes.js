import express from 'express';
import { createRedmineApiKeyRequest } from '../utils/apiClient.js';
import dotenv from 'dotenv';

dotenv.config();
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const router = express.Router();

// Get users - Using admin API key instead of user authentication
router.get('/', async (req, res) => {
  const { redmineUrl, offset, limit, status, group_id, name } = req.query;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    const params = {
      offset: offset || 0,
      limit: limit || 100
    };

    // Add optional filters if provided
    if (status && status !== 'all') {
      params.status = status;
    }
    if (group_id) {
      params.group_id = group_id;
    }
    if (name) {
      params.name = name;
    }

    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(ADMIN_API_KEY, redmineUrl, '/users.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get user details
router.get('/:id', async (req, res) => {
  const { redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'memberships,groups'
    };

    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(ADMIN_API_KEY, redmineUrl, `/users/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch user ${id}`, details: error.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { redmineUrl } = req.query;
  const userData = req.body;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      '/users.json', 
      {}, 
      'post', 
      userData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating user:', error.message);
    return res.status(422).json({ 
      error: 'Failed to create user', 
      details: error.response?.data || error.message 
    });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  const { redmineUrl } = req.query;
  const { id } = req.params;
  const userData = req.body;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      `/users/${id}.json`, 
      {}, 
      'put', 
      userData
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error updating user ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to update user ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  const { redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      `/users/${id}.json`, 
      {}, 
      'delete'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to delete user ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

export default router;