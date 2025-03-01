import express from 'express';
import { createRedmineApiKeyRequest } from '../utils/apiClient.js';
import dotenv from 'dotenv';

dotenv.config();
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const router = express.Router();

// Get groups
router.get('/', async (req, res) => {
  const { redmineUrl, offset, limit } = req.query;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    const params = {
      offset: offset || 0,
      limit: limit || 100
    };

    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(ADMIN_API_KEY, redmineUrl, '/groups.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    return res.status(500).json({ error: 'Failed to fetch groups', details: error.message });
  }
});

// Get group details
router.get('/:id', async (req, res) => {
  const { redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    const params = {};
    
    // Add include parameter if provided
    if (include) {
      params.include = include;
    }

    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(ADMIN_API_KEY, redmineUrl, `/groups/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching group ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch group ${id}`, details: error.message });
  }
});

// Create a new group
router.post('/', async (req, res) => {
  const { redmineUrl } = req.query;
  const groupData = req.body;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      '/groups.json', 
      {}, 
      'post', 
      groupData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating group:', error.message);
    return res.status(422).json({ 
      error: 'Failed to create group', 
      details: error.response?.data || error.message 
    });
  }
});

// Update a group
router.put('/:id', async (req, res) => {
  const { redmineUrl } = req.query;
  const { id } = req.params;
  const groupData = req.body;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    const response = await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      `/groups/${id}.json`, 
      {}, 
      'put', 
      groupData
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error updating group ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to update group ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Delete a group
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
      `/groups/${id}.json`, 
      {}, 
      'delete'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting group ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to delete group ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Add a user to a group
router.post('/:id/users', async (req, res) => {
  const { redmineUrl } = req.query;
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Use the admin API key for this request
    await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      `/groups/${id}/users.json`, 
      {}, 
      'post', 
      { user_id }
    );
    return res.status(204).json();
  } catch (error) {
    console.error(`Error adding user to group ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to add user to group ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Remove a user from a group
router.delete('/:id/users/:user_id', async (req, res) => {
  const { redmineUrl } = req.query;
  const { id, user_id } = req.params;
  
  if (!ADMIN_API_KEY || !redmineUrl) {
    return res.status(400).json({ error: 'Admin API key and Redmine URL are required' });
  }

  try {
    // Use the admin API key for this request
    await createRedmineApiKeyRequest(
      ADMIN_API_KEY, 
      redmineUrl, 
      `/groups/${id}/users/${user_id}.json`, 
      {}, 
      'delete'
    );
    return res.status(204).json();
  } catch (error) {
    console.error(`Error removing user from group ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to remove user from group ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

export default router;