import express from 'express';
import { createRedmineRequest } from '../utils/apiClient.js';

const router = express.Router();

// Get epics
router.get('/epics', async (req, res) => {
  const { authToken, redmineUrl } = req.query;
  
  if (!authToken || !redmineUrl) {
    return res.status(400).json({ error: 'Authentication token and Redmine URL are required' });
  }

  try {
    const params = {
      offset: 0,
      limit: 1000000,
    };

    const response = await createRedmineRequest(authToken, redmineUrl, '/issues.json', params);
    
    const issues = response.data.issues || response.data;
    const epicValues = [];

    issues.forEach(issue => {
      if (issue.custom_fields && Array.isArray(issue.custom_fields)) {
        issue.custom_fields.forEach(field => {
          if (field.name === "Epic" && field.value) {
            epicValues.push(field.value);
          }
        });
      }
    });

    const uniqueEpicValues = [...new Set(epicValues)];
    return res.json({ epics: uniqueEpicValues });
  } catch (error) {
    console.error("Error fetching epic values:", error.message);
    return res.status(500).json({ error: "Failed to fetch epic values", details: error.message });
  }
});

export default router;
