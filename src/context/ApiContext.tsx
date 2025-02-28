import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Use environment variable with fallback
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiContextType {
  apiKey: string;
  redmineUrl: string;
  setApiKey: (key: string) => void;
  setRedmineUrl: (url: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  projects: any[];
  issues: any[];
  users: any[];
  issueStatuses: any[];
  trackers: any[];
  priorities: any[];
  refreshData: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  fetchIssues: (filters?: any) => Promise<any[]>;
  fetchProjects: (filters?: any) => Promise<any[]>;
  fetchIssueDetails: (id: number) => Promise<any>;
  fetchProjectDetails: (id: number) => Promise<any>;
  createIssue: (issueData: any) => Promise<any>;
  updateIssue: (id: number, issueData: any) => Promise<boolean>;
  deleteIssue: (id: number) => Promise<boolean>;
  addWatcher: (issueId: number, userId: number) => Promise<boolean>;
  removeWatcher: (issueId: number, userId: number) => Promise<boolean>;
  fetchVersions: (projectId: number) => Promise<any[]>;
  createProject: (projectData: any) => Promise<any>;
  updateProject: (id: number, projectData: any) => Promise<boolean>;
  archiveProject: (id: number) => Promise<boolean>;
  unarchiveProject: (id: number) => Promise<boolean>;
  deleteProject: (id: number) => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('redmine_api_key') || '');
  const [redmineUrl, setRedmineUrl] = useState<string>(() => localStorage.getItem('redmine_url') || '');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [issueStatuses, setIssueStatuses] = useState<any[]>([]);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);

  // Save API key and URL to localStorage when they change
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('redmine_api_key', apiKey);
    }
    if (redmineUrl) {
      localStorage.setItem('redmine_url', redmineUrl);
    }
  }, [apiKey, redmineUrl]);

  // Test connection to Redmine API
  const testConnection = async (): Promise<boolean> => {
    if (!apiKey || !redmineUrl) {
      setError('API key and Redmine URL are required');
      setIsConnected(false);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the proxy server to avoid CORS issues
      const response = await axios.get(`${SERVER_URL}/api/test-connection`, {
        params: { apiKey, redmineUrl }
      });
      
      setIsConnected(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError('Failed to connect to Redmine API. Please check your credentials.');
      setIsConnected(false);
      setIsLoading(false);
      return false;
    }
  };

  // Fetch data from Redmine API
  const refreshData = async (): Promise<void> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch projects
      const projectsResponse = await axios.get(`${SERVER_URL}/api/projects`, {
        params: { apiKey, redmineUrl }
      });
      setProjects(projectsResponse.data.projects || []);

      // Fetch issues
      const issuesResponse = await axios.get(`${SERVER_URL}/api/issues`, {
        params: { apiKey, redmineUrl }
      });
      setIssues(issuesResponse.data.issues || []);

      // Fetch users
      const usersResponse = await axios.get(`${SERVER_URL}/api/users`, {
        params: { apiKey, redmineUrl }
      });
      setUsers(usersResponse.data.users || []);

      // Fetch issue statuses
      const statusesResponse = await axios.get(`${SERVER_URL}/api/issue_statuses`, {
        params: { apiKey, redmineUrl }
      });
      setIssueStatuses(statusesResponse.data.issue_statuses || []);

      // Fetch trackers
      const trackersResponse = await axios.get(`${SERVER_URL}/api/trackers`, {
        params: { apiKey, redmineUrl }
      });
      setTrackers(trackersResponse.data.trackers || []);

      // Fetch priorities
      const prioritiesResponse = await axios.get(`${SERVER_URL}/api/enumerations/issue_priorities`, {
        params: { apiKey, redmineUrl }
      });
      setPriorities(prioritiesResponse.data.issue_priorities || []);

      setIsLoading(false);
    } catch (err: any) {
      setError('Failed to fetch data from Redmine API');
      setIsLoading(false);
    }
  };

  // Fetch issues with filters
  const fetchIssues = async (filters: any = {}): Promise<any[]> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/issues`, {
        params: { 
          apiKey, 
          redmineUrl,
          ...filters
        }
      });
      return response.data.issues || [];
    } catch (err: any) {
      console.error('Error fetching issues:', err);
      return [];
    }
  };

  // Fetch projects with filters
  const fetchProjects = async (filters: any = {}): Promise<any[]> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/projects`, {
        params: { 
          apiKey, 
          redmineUrl,
          ...filters
        }
      });
      return response.data.projects || [];
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      return [];
    }
  };

  // Fetch issue details
  const fetchIssueDetails = async (id: number): Promise<any> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/issues/${id}`, {
        params: { apiKey, redmineUrl }
      });
      return response.data.issue || null;
    } catch (err: any) {
      console.error(`Error fetching issue ${id}:`, err);
      return null;
    }
  };

  // Fetch project details
  const fetchProjectDetails = async (id: number): Promise<any> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/projects/${id}`, {
        params: { apiKey, redmineUrl }
      });
      return response.data.project || null;
    } catch (err: any) {
      console.error(`Error fetching project ${id}:`, err);
      return null;
    }
  };

  // Create a new issue
  const createIssue = async (issueData: any): Promise<any> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const response = await axios.post(`${SERVER_URL}/api/issues`, issueData, {
        params: { apiKey, redmineUrl }
      });
      return response.data.issue || null;
    } catch (err: any) {
      console.error('Error creating issue:', err);
      throw new Error(err.response?.data?.error || 'Failed to create issue');
    }
  };

  // Update an issue
  const updateIssue = async (id: number, issueData: any): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.put(`${SERVER_URL}/api/issues/${id}`, issueData, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error updating issue ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update issue ${id}`);
    }
  };

  // Delete an issue
  const deleteIssue = async (id: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.delete(`${SERVER_URL}/api/issues/${id}`, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error deleting issue ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete issue ${id}`);
    }
  };

  // Add a watcher to an issue
  const addWatcher = async (issueId: number, userId: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.post(`${SERVER_URL}/api/issues/${issueId}/watchers`, { user_id: userId }, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error adding watcher to issue ${issueId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to add watcher to issue ${issueId}`);
    }
  };

  // Remove a watcher from an issue
  const removeWatcher = async (issueId: number, userId: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.delete(`${SERVER_URL}/api/issues/${issueId}/watchers/${userId}`, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error removing watcher from issue ${issueId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to remove watcher from issue ${issueId}`);
    }
  };

  // Fetch versions for a project
  const fetchVersions = async (projectId: number): Promise<any[]> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/projects/${projectId}/versions`, {
        params: { apiKey, redmineUrl }
      });
      return response.data.versions || [];
    } catch (err: any) {
      console.error(`Error fetching versions for project ${projectId}:`, err);
      return [];
    }
  };

  // Create a new project
  const createProject = async (projectData: any): Promise<any> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const response = await axios.post(`${SERVER_URL}/api/projects`, projectData, {
        params: { apiKey, redmineUrl }
      });
      return response.data.project || null;
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw new Error(err.response?.data?.error || 'Failed to create project');
    }
  };

  // Update a project
  const updateProject = async (id: number, projectData: any): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.put(`${SERVER_URL}/api/projects/${id}`, projectData, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error updating project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update project ${id}`);
    }
  };

  // Archive a project
  const archiveProject = async (id: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.put(`${SERVER_URL}/api/projects/${id}/archive`, {}, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error archiving project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to archive project ${id}`);
    }
  };

  // Unarchive a project
  const unarchiveProject = async (id: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.put(`${SERVER_URL}/api/projects/${id}/unarchive`, {}, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error unarchiving project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to unarchive project ${id}`);
    }
  };

  // Delete a project
  const deleteProject = async (id: number): Promise<boolean> => {
    if (!isConnected && (apiKey && redmineUrl)) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      await axios.delete(`${SERVER_URL}/api/projects/${id}`, {
        params: { apiKey, redmineUrl }
      });
      return true;
    } catch (err: any) {
      console.error(`Error deleting project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete project ${id}`);
    }
  };

  // Initial connection test if credentials are available
  useEffect(() => {
    if (apiKey && redmineUrl) {
      testConnection();
    }
  }, []);

  const value = {
    apiKey,
    redmineUrl,
    setApiKey,
    setRedmineUrl,
    isConnected,
    isLoading,
    error,
    projects,
    issues,
    users,
    issueStatuses,
    trackers,
    priorities,
    refreshData,
    testConnection,
    fetchIssues,
    fetchProjects,
    fetchIssueDetails,
    fetchProjectDetails,
    createIssue,
    updateIssue,
    deleteIssue,
    addWatcher,
    removeWatcher,
    fetchVersions,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    deleteProject
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
