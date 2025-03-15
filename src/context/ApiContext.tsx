import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Use environment variable with fallback
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProjectsResponse {
  projects: any[];
  total_count: number;
  offset?: number;
  limit?: number;
}

interface ApiContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  projects: any[];
  issues: any[];
  users: any[];
  issueStatuses: any[];
  trackers: any[];
  priorities: any[];
  roles: any[];
  refreshData: () => Promise<void>;
  fetchIssues: (filters?: any) => Promise<any[]>;
  fetchProjects: (filters?: any) => Promise<ProjectsResponse>;
  fetchIssueDetails: (id: number) => Promise<any>;
  fetchProjectDetails: (id: number) => Promise<any>;
  fetchProjectMemberships: (projectId: number) => Promise<any[]>;
  fetchRoles: () => Promise<any[]>;
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
  addProjectMember: (projectId: number, memberData: any) => Promise<any>;
  updateMembership: (membershipId: number, membershipData: any) => Promise<boolean>;
  deleteMembership: (membershipId: number) => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, redmineUrl } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [issueStatuses, setIssueStatuses] = useState<any[]>([]);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Get authentication token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('redmine_auth') || '';
  };

  // Test connection to Redmine API
  const testConnection = async (): Promise<boolean> => {
    if (!isAuthenticated || !redmineUrl) {
      setError('Authentication required');
      setIsConnected(false);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the proxy server to avoid CORS issues
      const response = await axios.get(`${SERVER_URL}/api/auth/verify`, {
        params: { 
          redmineUrl,
          authToken: getAuthToken()
        }
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
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      
      // Fetch projects
      const projectsResponse = await axios.get(`${SERVER_URL}/api/projects`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setProjects(projectsResponse.data.projects || []);

      // Fetch issues
      const issuesResponse = await axios.get(`${SERVER_URL}/api/issues`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setIssues(issuesResponse.data.issues || []);

      // Fetch users - this endpoint now uses admin API key
      const usersResponse = await axios.get(`${SERVER_URL}/api/users`, {
        params: { 
          redmineUrl 
        }
      });
      setUsers(usersResponse.data.users || []);

      // Fetch issue statuses
      const statusesResponse = await axios.get(`${SERVER_URL}/api/issue_statuses`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setIssueStatuses(statusesResponse.data.issue_statuses || []);

      // Fetch trackers
      const trackersResponse = await axios.get(`${SERVER_URL}/api/trackers`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setTrackers(trackersResponse.data.trackers || []);

      // Fetch priorities
      const prioritiesResponse = await axios.get(`${SERVER_URL}/api/enumerations/issue_priorities`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setPriorities(prioritiesResponse.data.issue_priorities || []);

      // Fetch roles
      const rolesResponse = await axios.get(`${SERVER_URL}/api/roles`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      setRoles(rolesResponse.data.roles || []);

      setIsLoading(false);
    } catch (err: any) {
      setError('Failed to fetch data from Redmine API');
      setIsLoading(false);
    }
  };

  // Fetch issues with filters
  const fetchIssues = async (filters: any = {}): Promise<any[]> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const authToken = getAuthToken();
      
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
      return [];
    }
  };

  // Fetch projects with filters
  const fetchProjects = async (filters: any = {}): Promise<ProjectsResponse> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return { projects: [], total_count: 0 };
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/projects`, {
        params: { 
          authToken,
          redmineUrl,
          ...filters
        }
      });
      
      return {
        projects: response.data.projects || [],
        total_count: response.data.total_count || 0,
        offset: response.data.offset,
        limit: response.data.limit
      };
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      return { projects: [], total_count: 0 };
    }
  };

  // Fetch issue details
  const fetchIssueDetails = async (id: number): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/issues/${id}`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return response.data.issue || null;
    } catch (err: any) {
      console.error(`Error fetching issue ${id}:`, err);
      return null;
    }
  };

  // Fetch project details
  const fetchProjectDetails = async (id: number): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/projects/${id}`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return response.data.project || null;
    } catch (err: any) {
      console.error(`Error fetching project ${id}:`, err);
      return null;
    }
  };

  // Fetch project memberships
  const fetchProjectMemberships = async (projectId: number): Promise<any[]> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/projects/${projectId}/memberships`, {
        params: { 
          authToken,
          redmineUrl
        }
      });
      return response.data.memberships || [];
    } catch (err: any) {
      console.error(`Error fetching memberships for project ${projectId}:`, err);
      return [];
    }
  };

  // Fetch roles
  const fetchRoles = async (): Promise<any[]> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/roles`, {
        params: { 
          authToken,
          redmineUrl
        }
      });
      return response.data.roles || [];
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      return [];
    }
  };

  // Create a new issue
  const createIssue = async (issueData: any): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
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

  // Update an issue
  const updateIssue = async (id: number, issueData: any): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
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
  const deleteIssue = async (id: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
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

  // Add a watcher to an issue
  const addWatcher = async (issueId: number, userId: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.post(`${SERVER_URL}/api/issues/${issueId}/watchers`, { user_id: userId }, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error adding watcher to issue ${issueId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to add watcher to issue ${issueId}`);
    }
  };

  // Remove a watcher from an issue
  const removeWatcher = async (issueId: number, userId: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.delete(`${SERVER_URL}/api/issues/${issueId}/watchers/${userId}`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error removing watcher from issue ${issueId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to remove watcher from issue ${issueId}`);
    }
  };

  // Fetch versions for a project
  const fetchVersions = async (projectId: number): Promise<any[]> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return [];
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.get(`${SERVER_URL}/api/projects/${projectId}/versions`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return response.data.versions || [];
    } catch (err: any) {
      console.error(`Error fetching versions for project ${projectId}:`, err);
      return [];
    }
  };

  // Create a new project
  const createProject = async (projectData: any): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.post(`${SERVER_URL}/api/projects`, projectData, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return response.data.project || null;
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw new Error(err.response?.data?.error || 'Failed to create project');
    }
  };

  // Update a project
  const updateProject = async (id: number, projectData: any): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.put(`${SERVER_URL}/api/projects/${id}`, projectData, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error updating project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update project ${id}`);
    }
  };

  // Archive a project
  const archiveProject = async (id: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.put(`${SERVER_URL}/api/projects/${id}/archive`, {}, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error archiving project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to archive project ${id}`);
    }
  };

  // Unarchive a project
  const unarchiveProject = async (id: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.put(`${SERVER_URL}/api/projects/${id}/unarchive`, {}, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error unarchiving project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to unarchive project ${id}`);
    }
  };

  // Delete a project
  const deleteProject = async (id: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.delete(`${SERVER_URL}/api/projects/${id}`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error deleting project ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete project ${id}`);
    }
  };

  // Add a member to a project
  const addProjectMember = async (projectId: number, memberData: any): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
      const response = await axios.post(`${SERVER_URL}/api/projects/${projectId}/memberships`, memberData, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return response.data.membership || null;
    } catch (err: any) {
      console.error(`Error adding member to project ${projectId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to add member to project ${projectId}`);
    }
  };

  // Update a membership
  const updateMembership = async (membershipId: number, membershipData: any): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.put(`${SERVER_URL}/api/memberships/${membershipId}`, membershipData, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error updating membership ${membershipId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update membership ${membershipId}`);
    }
  };

  // Delete a membership
  const deleteMembership = async (membershipId: number): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      
      await axios.delete(`${SERVER_URL}/api/memberships/${membershipId}`, {
        params: { 
          authToken,
          redmineUrl 
        }
      });
      return true;
    } catch (err: any) {
      console.error(`Error deleting membership ${membershipId}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete membership ${membershipId}`);
    }
  };

  // Initial connection test if authenticated
  useEffect(() => {
    if (isAuthenticated && redmineUrl) {
      testConnection();
    }
  }, [isAuthenticated, redmineUrl]);

  const value = {
    isConnected,
    isLoading,
    error,
    projects,
    issues,
    users,
    issueStatuses,
    trackers,
    priorities,
    roles,
    refreshData,
    fetchIssues,
    fetchProjects,
    fetchIssueDetails,
    fetchProjectDetails,
    fetchProjectMemberships,
    fetchRoles,
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
    deleteProject,
    addProjectMember,
    updateMembership,
    deleteMembership
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
