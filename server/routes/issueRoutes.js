import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get issues with advanced filtering
router.get('/', async (req, res) => {
  const { 
    authToken, redmineUrl, projectId, status, assignedTo, offset, limit, sort,
    include, issueId, trackerId, parentId, subprojectId, createdOn, updatedOn,
    priorityId, categoryId, fixedVersionId, ...customFields
  } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'attachments,relations,children,journals,watchers',
      status_id: status || '*',
      project_id: projectId,
      assigned_to_id: assignedTo,
      offset: offset || 0,
      limit: limit || 100,
      sort: sort,
      issue_id: issueId,
      tracker_id: trackerId,
      parent_id: parentId,
      subproject_id: subprojectId,
      created_on: createdOn,
      updated_on: updatedOn,
      priority_id: priorityId,
      category_id: categoryId,
      fixed_version_id: fixedVersionId
    };

    // Add custom fields if present
    Object.keys(customFields).forEach(key => {
      if (key.startsWith('cf_')) {
        params[key] = customFields[key];
      }
    });

    // Remove undefined params
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    const response = await createRedmineRequest(authToken, redmineUrl, '/issues.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    return res.status(500).json({ error: 'Failed to fetch issues', details: error.message });
  }
});

// Get issue details
router.get('/:id', async (req, res) => {
  const { authToken, redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'attachments,relations,children,journals,watchers,allowed_statuses'
    };

    const response = await createRedmineRequest(authToken, redmineUrl, `/issues/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch issue ${id}`, details: error.message });
  }
});

// Create a new issue
router.post('/', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const issueData = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      authToken, 
      redmineUrl, 
      '/issues.json', 
      {}, 
      'post', 
      issueData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating issue:', error.message);
    return res.status(500).json({ error: 'Failed to create issue', details: error.message });
  }
});

// Update an issue
router.put('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const issueData = req.body;
  console.log(issueData);
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/issues/${id}.json`, 
      {}, 
      'put', 
      issueData
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error updating issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to update issue ${id}`, details: error.message });
  }
});

// Delete an issue
router.delete('/:id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(authToken, redmineUrl, `/issues/${id}.json`, {}, 'delete');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to delete issue ${id}`, details: error.message });
  }
});

// Add a watcher to an issue
router.post('/:id/watchers', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/issues/${id}/watchers.json`, 
      {}, 
      'post', 
      { user_id }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error adding watcher to issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to add watcher to issue ${id}`, details: error.message });
  }
});

// Remove a watcher from an issue
router.delete('/:id/watchers/:user_id', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  const { id, user_id } = req.params;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      authToken, 
      redmineUrl, 
      `/issues/${id}/watchers/${user_id}.json`, 
      {}, 
      'delete'
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error removing watcher from issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to remove watcher from issue ${id}`, details: error.message });
  }
});

export default router;