import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get projects
router.get('/', async (req, res) => {
  const { authToken, redmineUrl, offset, limit, include } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const params = {
      offset: offset || 0,
      limit: limit || 100,
      include: include || 'trackers,issue_categories'
    };

    const response = await createRedmineRequest(authToken, redmineUrl, '/projects.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    return res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

// Get project details
router.get('/:id', async (req, res) => {
  const { authToken, redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'trackers,issue_categories,enabled_modules'
    };

    const response = await createRedmineRequest(authToken, redmineUrl, `/projects/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch project ${id}`, details: error.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const projectData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      authToken, 
      redmineUrl, 
      '/projects.json', 
      {}, 
      'post', 
      projectData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating project:', error.message);
    return res.status(422).json({ 
      error: 'Failed to create project', 
      details: error.response?.data || error.message 
    });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const projectData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    // Ensure the project data is properly wrapped in a "project" object
    const formattedData = projectData.project ? projectData : { project: projectData };

    const response = await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/projects/${id}.json`, 
      {}, 
      'put', 
      formattedData
    );

    // Check if the project was updated successfully
    const updatedProject = await createRedmineRequest(
      authToken,
      redmineUrl,
      `/projects/${id}.json`,
      { include: 'trackers,issue_categories,enabled_modules' }
    );

    return res.json(updatedProject.data);
  } catch (error) {
    console.error(`Error updating project ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to update project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Archive a project
router.put('/:id/archive', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/projects/${id}/archive.json`, 
      {}, 
      'put'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error archiving project ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to archive project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Unarchive a project
router.put('/:id/unarchive', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/projects/${id}/unarchive.json`, 
      {}, 
      'put'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error unarchiving project ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to unarchive project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Delete a project
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
      `/projects/${id}.json`, 
      {}, 
      'delete'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error.message);
    return res.status(500).json({ 
      error: `Failed to delete project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Get versions for a project
router.get('/:id/versions', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, `/projects/${id}/versions.json`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching versions for project ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch versions for project ${id}`, details: error.message });
  }
});

// Get project memberships
router.get('/:id/memberships', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(authToken, redmineUrl, `/projects/${id}/memberships.json`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching memberships for project ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch memberships for project ${id}`, details: error.message });
  }
});

// Add a member to a project
router.post('/:id/memberships', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const membershipData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/projects/${id}/memberships.json`, 
      {}, 
      'post', 
      membershipData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    console.error(`Error adding membership to project ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to add membership to project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

export default router;