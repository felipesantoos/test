import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Use environment variable with fallback
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string;
  redmineUrl: string;
  setRedmineUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, redmineUrl: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [redmineUrl, setRedmineUrl] = useState<string>(() => localStorage.getItem('redmine_url') || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('redmine_username');
    const storedAuth = localStorage.getItem('redmine_auth');
    const storedUrl = localStorage.getItem('redmine_url');
    const storedIsAdmin = localStorage.getItem('redmine_is_admin');
    
    if (storedUsername && storedAuth && storedUrl) {
      setUsername(storedUsername);
      setRedmineUrl(storedUrl);
      setIsAuthenticated(true);
      setIsAdmin(storedIsAdmin === 'true');
    }
  }, []);

  // Save redmine URL to localStorage when it changes
  useEffect(() => {
    if (redmineUrl) {
      localStorage.setItem('redmine_url', redmineUrl);
    }
  }, [redmineUrl]);

  // Login with username and password
  const login = async (username: string, password: string, url: string): Promise<boolean> => {
    if (!username || !password || !url) {
      setError('Username, password, and Redmine URL are required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create auth token for Basic Authentication
      const authToken = btoa(`${username}:${password}`);
      
      // Test authentication with the Redmine API
      const response = await axios.get(`${SERVER_URL}/api/auth/login`, {
        params: { 
          redmineUrl: url,
          authToken
        }
      });
      
      if (response.data.success) {
        // Check if user is admin
        const isUserAdmin = response.data.user?.admin === true;
        
        // Store authentication data
        localStorage.setItem('redmine_username', username);
        localStorage.setItem('redmine_auth', authToken);
        localStorage.setItem('redmine_url', url);
        localStorage.setItem('redmine_is_admin', isUserAdmin ? 'true' : 'false');
        
        setUsername(username);
        setRedmineUrl(url);
        setIsAuthenticated(true);
        setIsAdmin(isUserAdmin);
        setIsLoading(false);
        
        return true;
      } else {
        throw new Error(response.data.error || 'Authentication failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to authenticate with Redmine';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('redmine_username');
    localStorage.removeItem('redmine_auth');
    localStorage.removeItem('redmine_is_admin');
    // Don't remove redmine_url to make it easier for users to log back in
    
    setUsername('');
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/login');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    isAuthenticated,
    isAdmin,
    username,
    redmineUrl,
    setRedmineUrl,
    isLoading,
    error,
    login,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};