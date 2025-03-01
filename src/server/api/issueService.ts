import axios from 'axios';

// Use environment variable with fallback
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('redmine_auth') || '';
};

// Helper function to get Redmine URL from localStorage
const getRedmineUrl = () => {
  return localStorage.getItem('redmine_url') || '';
};

// Create a new issue
export const createIssue = async (issueData: any): Promise<any> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios.post(`${SERVER_URL}/api/issues`, issueData, {
      params: { 
        authToken,
        redmineUrl 
      }
    });
    return response.data.issue || null;
  } catch (err: any) {
    console.error('Error creating issue:', err);
    throw new Error(err.response?.data?.error || 'Failed to create issue');
  }
};

// Bulk create issues with error tracking
export const bulkCreateIssues = async (issues: any[]): Promise<{success: any[], failed: any[]}> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl || issues.length === 0) {
    throw new Error('Authentication required or no issues provided');
  }

  const successfulIssues: any[] = [];
  const failedIssues: any[] = [];
  
  // Process issues one by one to track which ones fail
  for (const issueData of issues) {
    try {
      const response = await axios.post(`${SERVER_URL}/api/issues`, { issue: issueData }, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      successfulIssues.push(response.data.issue || issueData);
    } catch (err: any) {
      // Add error information to the failed issue
      failedIssues.push({
        ...issueData,
        error: err.response?.data?.error || err.message || 'Failed to create issue'
      });
    }
  }
  
  return { success: successfulIssues, failed: failedIssues };
};

// Update an issue
export const updateIssue = async (id: number, issueData: any): Promise<boolean> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    await axios.put(`${SERVER_URL}/api/issues/${id}`, issueData, {
      params: { 
        authToken,
        redmineUrl 
      }
    });
    return true;
  } catch (err: any) {
    console.error(`Error updating issue ${id}:`, err);
    throw new Error(err.response?.data?.error || `Failed to update issue ${id}`);
  }
};

// Delete an issue
export const deleteIssue = async (id: number): Promise<boolean> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    await axios.delete(`${SERVER_URL}/api/issues/${id}`, {
      params: { 
        authToken,
        redmineUrl 
      }
    });
    return true;
  } catch (err: any) {
    console.error(`Error deleting issue ${id}:`, err);
    throw new Error(err.response?.data?.error || `Failed to delete issue ${id}`);
  }
};

// Fetch issues with filters
export const fetchIssues = async (filters: any = {}): Promise<any[]> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios.get(`${SERVER_URL}/api/issues`, {
      params: { 
        authToken,
        redmineUrl,
        ...filters
      }
    });
    return response.data.issues || [];
  } catch (err: any) {
    console.error('Error fetching issues:', err);
    throw new Error(err.response?.data?.error || 'Failed to fetch issues');
  }
};

// Fetch issue details
export const fetchIssueDetails = async (id: number): Promise<any> => {
  const authToken = getAuthToken();
  const redmineUrl = getRedmineUrl();
  
  if (!authToken || !redmineUrl) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios.get(`${SERVER_URL}/api/issues/${id}`, {
      params: { 
        authToken,
        redmineUrl 
      }
    });
    return response.data.issue || null;
  } catch (err: any) {
    console.error(`Error fetching issue ${id}:`, err);
    throw new Error(err.response?.data?.error || `Failed to fetch issue ${id}`);
  }
};