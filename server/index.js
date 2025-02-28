import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to create Redmine API request
const createRedmineRequest = (apiKey, redmineUrl, endpoint, params = {}, method = 'get', data = null) => {
  const url = `${redmineUrl}/` + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
  
  const config = {
    method,
    url,
    headers: {
      'X-Redmine-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    params
  };

  if (data && (method === 'post' || method === 'put')) {
    config.data = data;
  }

  return axios(config);
};

// Test connection to Redmine API
app.get('/api/test-connection', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    // Try to fetch the current user to test the connection
    const response = await createRedmineRequest(apiKey, redmineUrl, '/users/current.json');
    return res.json({ success: true, user: response.data.user });
  } catch (error) {
    console.error('Error testing Redmine connection:', error.message);
    return res.status(401).json({ 
      error: 'Failed to connect to Redmine API', 
      details: error.message 
    });
  }
});

// Get projects
app.get('/api/projects', async (req, res) => {
  const { apiKey, redmineUrl, offset, limit, include } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const params = {
      offset: offset || 0,
      limit: limit || 100,
      include: include || 'trackers,issue_categories'
    };

    const response = await createRedmineRequest(apiKey, redmineUrl, '/projects.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    return res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

// Get project details
app.get('/api/projects/:id', async (req, res) => {
  const { apiKey, redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'trackers,issue_categories,enabled_modules'
    };

    const response = await createRedmineRequest(apiKey, redmineUrl, `/projects/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch project ${id}`, details: error.message });
  }
});

// Create a new project
app.post('/api/projects', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const projectData = req.body;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      apiKey, 
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
app.put('/api/projects/:id', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  const projectData = req.body;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      apiKey, 
      redmineUrl, 
      `/projects/${id}.json`, 
      {}, 
      'put', 
      projectData
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error updating project ${id}:`, error.message);
    return res.status(422).json({ 
      error: `Failed to update project ${id}`, 
      details: error.response?.data || error.message 
    });
  }
});

// Archive a project
app.put('/api/projects/:id/archive', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      apiKey, 
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
app.put('/api/projects/:id/unarchive', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      apiKey, 
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
app.delete('/api/projects/:id', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      apiKey, 
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

// Get issues with advanced filtering
app.get('/api/issues', async (req, res) => {
  const { 
    apiKey, redmineUrl, projectId, status, assignedTo, offset, limit, sort,
    include, issueId, trackerId, parentId, subprojectId, createdOn, updatedOn,
    priorityId, categoryId, fixedVersionId, ...customFields
  } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
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

    const response = await createRedmineRequest(apiKey, redmineUrl, '/issues.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    return res.status(500).json({ error: 'Failed to fetch issues', details: error.message });
  }
});

// Get users
app.get('/api/users', async (req, res) => {
  const { apiKey, redmineUrl, offset, limit } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const params = {
      offset: offset || 0,
      limit: limit || 100
    };

    const response = await createRedmineRequest(apiKey, redmineUrl, '/users.json', params);
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get issue statuses
app.get('/api/issue_statuses', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(apiKey, redmineUrl, '/issue_statuses.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching issue statuses:', error.message);
    return res.status(500).json({ error: 'Failed to fetch issue statuses', details: error.message });
  }
});

// Get issue details
app.get('/api/issues/:id', async (req, res) => {
  const { apiKey, redmineUrl, include } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const params = {
      include: include || 'attachments,relations,children,journals,watchers,allowed_statuses'
    };

    const response = await createRedmineRequest(apiKey, redmineUrl, `/issues/${id}.json`, params);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch issue ${id}`, details: error.message });
  }
});

// Create a new issue
app.post('/api/issues', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const issueData = req.body;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      apiKey, 
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
app.put('/api/issues/:id', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  const issueData = req.body;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(
      apiKey, 
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
app.delete('/api/issues/:id', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(apiKey, redmineUrl, `/issues/${id}.json`, {}, 'delete');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting issue ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to delete issue ${id}`, details: error.message });
  }
});

// Add a watcher to an issue
app.post('/api/issues/:id/watchers', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    await createRedmineRequest(
      apiKey, 
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
app.delete('/api/issues/:id/watchers/:user_id', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id, user_id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    await createRedmineRequest(
      apiKey, 
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

// Get trackers
app.get('/api/trackers', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(apiKey, redmineUrl, '/trackers.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching trackers:', error.message);
    return res.status(500).json({ error: 'Failed to fetch trackers', details: error.message });
  }
});

// Get priorities
app.get('/api/enumerations/issue_priorities', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(apiKey, redmineUrl, '/enumerations/issue_priorities.json');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching priorities:', error.message);
    return res.status(500).json({ error: 'Failed to fetch priorities', details: error.message });
  }
});

// Get versions for a project
app.get('/api/projects/:id/versions', async (req, res) => {
  const { apiKey, redmineUrl } = req.query;
  const { id } = req.params;
  
  if (!apiKey || !redmineUrl) {
    return res.status(400).json({ error: 'API key and Redmine URL are required' });
  }

  try {
    const response = await createRedmineRequest(apiKey, redmineUrl, `/projects/${id}/versions.json`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching versions for project ${id}:`, error.message);
    return res.status(500).json({ error: `Failed to fetch versions for project ${id}`, details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});