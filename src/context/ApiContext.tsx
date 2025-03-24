import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

// Use environment variable with fallback 
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProjectsResponse {
  projects: any[];
  total_count: number;
  offset?: number;
  limit?: number;
}

interface Sprint {
  id: string;
  project_id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface Epic {
  id: string;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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
  sprints: Sprint[];
  epics: Epic[];
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
  fetchSprints: () => Promise<Sprint[]>;
  fetchSprintById: (id: string) => Promise<Sprint | null>;
  createSprint: (sprintData: Omit<Sprint, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Sprint>;
  updateSprint: (id: string, sprintData: Partial<Sprint>) => Promise<Sprint>;
  deleteSprint: (id: string) => Promise<boolean>;
  fetchEpics: () => Promise<Epic[]>;
  fetchEpicById: (id: string) => Promise<Epic | null>;
  createEpic: (epicData: Omit<Epic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Epic>;
  updateEpic: (id: string, epicData: Partial<Epic>) => Promise<Epic>;
  deleteEpic: (id: string) => Promise<boolean>;
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
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  
  // Cache refs to prevent unnecessary re-renders
  const epicsCache = useRef<string[]>([]);
  const sprintsCache = useRef<Sprint[]>([]);
  const lastFetchTimestamp = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get authentication token from localStorage
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('redmine_auth') || '';
  }, []);

  // Debounced version of setIsLoading
  const debouncedSetLoading = useCallback(
    debounce((value: boolean) => {
      setIsLoading(value);
    }, 300),
    []
  );

  // Test connection to Redmine API
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !redmineUrl) {
      setError('Authentication required');
      setIsConnected(false);
      return false;
    }

    debouncedSetLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${SERVER_URL}/api/auth/verify`, {
        params: { 
          redmineUrl,
          authToken: getAuthToken()
        }
      });
      
      setIsConnected(true);
      debouncedSetLoading(false);
      return true;
    } catch (err: any) {
      setError('Failed to connect to Redmine API. Please check your credentials.');
      setIsConnected(false);
      debouncedSetLoading(false);
      return false;
    }
  }, [isAuthenticated, redmineUrl, getAuthToken, debouncedSetLoading]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return Date.now() - lastFetchTimestamp.current < CACHE_DURATION;
  }, []);

  // Fetch data from Redmine API with debouncing
  const refreshData = useCallback(async (): Promise<void> => {
    // Force refresh by resetting cache timestamp
    lastFetchTimestamp.current = 0;

    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return;
    }

    debouncedSetLoading(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      
      // Use Promise.all for parallel requests
      const [
        projectsResponse,
        issuesResponse,
        usersResponse,
        statusesResponse,
        trackersResponse,
        prioritiesResponse,
        rolesResponse,
        sprintsResponse
      ] = await Promise.all([
        axios.get(`${SERVER_URL}/api/projects`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/issues`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/users`, { params: { redmineUrl } }),
        axios.get(`${SERVER_URL}/api/issue_statuses`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/trackers`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/enumerations/issue_priorities`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/roles`, { params: { authToken, redmineUrl } }),
        axios.get(`${SERVER_URL}/api/sprints`)
      ]);

      setProjects(projectsResponse.data.projects || []);
      setIssues(issuesResponse.data.issues || []);
      setUsers(usersResponse.data.users || []);
      setIssueStatuses(statusesResponse.data.issue_statuses || []);
      setTrackers(trackersResponse.data.trackers || []);
      setPriorities(prioritiesResponse.data.issue_priorities || []);
      setRoles(rolesResponse.data.roles || []);
      setSprints(sprintsResponse.data || []);
      
      // Update cache timestamp
      lastFetchTimestamp.current = Date.now();
      
      debouncedSetLoading(false);
    } catch (err: any) {
      setError('Failed to fetch data from Redmine API');
      debouncedSetLoading(false);
    }
  }, [isConnected, isAuthenticated, redmineUrl, testConnection, getAuthToken, debouncedSetLoading]);

  // Update the fetchSprints function to use ref-based cache
  const fetchSprints = useCallback(async (): Promise<Sprint[]> => {
    if (sprintsCache.current.length > 0 && isCacheValid()) {
      return sprintsCache.current;
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/sprints`);
      const sprints = response.data || [];
      setSprints(sprints);
      sprintsCache.current = sprints;
      return sprints;
    } catch (err: any) {
      console.error('Error fetching sprints:', err);
      throw new Error(err.response?.data?.error || 'Failed to fetch sprints');
    }
  }, [isCacheValid]);

  const fetchSprintById = async (id: string): Promise<Sprint | null> => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/sprints/${id}`);
      return response.data;
    } catch (err: any) {
      console.error(`Error fetching sprint ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to fetch sprint ${id}`);
    }
  };

  const createSprint = async (
    sprintData: Omit<Sprint, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<Sprint> => {
    try {
      const response = await axios.post(`${SERVER_URL}/api/sprints`, sprintData);
      const newSprint = response.data;
      setSprints((prev) => [...prev, newSprint]);
      sprintsCache.current = [...sprintsCache.current, newSprint];
      return newSprint;
    } catch (err: any) {
      console.error('Error creating sprint:', err);
      throw new Error(err.response?.data?.error || 'Failed to create sprint');
    }
  };
  
  const updateSprint = async (
    id: string,
    sprintData: Partial<Sprint>
  ): Promise<Sprint> => {
    try {
      const response = await axios.put(`${SERVER_URL}/api/sprints/${id}`, sprintData);
      const updatedSprint = response.data;
      setSprints((prev) =>
        prev.map((sprint) => (sprint.id === id ? updatedSprint : sprint))
      );
      sprintsCache.current = sprintsCache.current.map((sprint) =>
        sprint.id === id ? updatedSprint : sprint
      );
      return updatedSprint;
    } catch (err: any) {
      console.error(`Error updating sprint ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update sprint ${id}`);
    }
  };

  const deleteSprint = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${SERVER_URL}/api/sprints/${id}`);
      setSprints(prev => prev.filter(sprint => sprint.id !== id));
      sprintsCache.current = sprintsCache.current.filter(sprint => sprint.id !== id);
      return true;
    } catch (err: any) {
      console.error(`Error deleting sprint ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete sprint ${id}`);
    }
  };

  const fetchEpics = useCallback(async (): Promise<Epic[]> => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/epics`);
      const epics = response.data || [];
      setEpics(epics);
      return epics;
    } catch (err: any) {
      console.error('Error fetching epics:', err);
      throw new Error(err.response?.data?.error || 'Failed to fetch epics');
    }
  }, []);

  const fetchEpicById = async (id: string): Promise<Epic | null> => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/epics/${id}`);
      return response.data;
    } catch (err: any) {
      console.error(`Error fetching epic ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to fetch epic ${id}`);
    }
  };

  const createEpic = async (
    epicData: Omit<Epic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<Epic> => {
    try {
      const response = await axios.post(`${SERVER_URL}/api/epics`, epicData);
      const newEpic = response.data;
      setEpics((prev) => [...prev, newEpic]);
      return newEpic;
    } catch (err: any) {
      console.error('Error creating epic:', err);
      throw new Error(err.response?.data?.error || 'Failed to create epic');
    }
  };
  
  const updateEpic = async (
    id: string,
    epicData: Partial<Epic>
  ): Promise<Epic> => {
    try {
      const response = await axios.put(`${SERVER_URL}/api/epics/${id}`, epicData);
      const updatedEpic = response.data;
      setEpics((prev) =>
        prev.map((epic) => (epic.id === id ? updatedEpic : epic))
      );
      return updatedEpic;
    } catch (err: any) {
      console.error(`Error updating epic ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to update epic ${id}`);
    }
  };

  const deleteEpic = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${SERVER_URL}/api/epics/${id}`);
      setEpics(prev => prev.filter(epic => epic.id !== id));
      return true;
    } catch (err: any) {
      console.error(`Error deleting epic ${id}:`, err);
      throw new Error(err.response?.data?.error || `Failed to delete epic ${id}`);
    }
  };

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

  const createIssue = async (issueData: any): Promise<any> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return null;
    }

    try {
      const authToken = getAuthToken();
      
      if (issueData.issue.uploads && issueData.issue.uploads.length > 0) {
        issueData.issue.uploads = issueData.issue.uploads.map((upload: any) => ({
          token: upload.token,
          filename: upload.filename,
          content_type: upload.content_type,
          description: upload.description
        }));
      }

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

  const updateIssue = async (id: number, issueData: any): Promise<boolean> => {
    if (!isConnected && isAuthenticated && redmineUrl) {
      const connected = await testConnection();
      if (!connected) return false;
    }

    try {
      const authToken = getAuthToken();
      if (issueData.issue.uploads && issueData.issue.uploads.length > 0) {
        issueData.issue.uploads = issueData.issue.uploads.map((upload: any) => ({
          token: upload.token,
          filename: upload.filename,
          content_type: upload.content_type,
          description: upload.description
        }));
      }

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
  
      // Update local projects state
      const newProject = response.data.project;
      if (newProject) {
        setProjects(prev => [...prev, newProject]);
      }
  
      return newProject || null;
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw new Error(err.response?.data?.error || 'Failed to create project');
    }
  };

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      debouncedSetLoading.cancel();
    };
  }, [debouncedSetLoading]);

  // Initial connection test if authenticated
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && redmineUrl) {
      testConnection().then(() => {
        if (mounted && !isCacheValid()) {
          refreshData();
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, redmineUrl, testConnection, refreshData, isCacheValid]);

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
    sprints,
    epics,
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
    deleteMembership,
    fetchSprints,
    fetchSprintById,
    createSprint,
    updateSprint,
    deleteSprint,
    fetchEpics,
    fetchEpicById,
    createEpic,
    updateEpic,
    deleteEpic,
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
