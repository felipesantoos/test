import React, { useState } from 'react';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { Save, RefreshCw, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

export const Settings = () => {
  const { 
    isConnected, 
    isLoading, 
    error: apiError, 
    refreshData 
  } = useApi();
  
  const {
    username,
    redmineUrl,
    setRedmineUrl,
    error: authError,
    logout
  } = useAuth();

  const [localRedmineUrl, setLocalRedmineUrl] = useState(redmineUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setRedmineUrl(localRedmineUrl);
    await handleTestConnection();
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestError(null);
    
    try {
      await refreshData();
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestError('An unexpected error occurred while testing the connection.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Redmine Connection</h2>
        
        {/* Connection Status */}
        <div className={`mb-6 p-4 rounded-md ${isConnected ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                {isConnected ? 'Connected to Redmine API' : 'Not connected to Redmine API'}
              </h3>
              <div className={`mt-2 text-sm ${isConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                <p>
                  {isConnected 
                    ? 'Your connection to the Redmine API is active. You can now view and analyze your Redmine data.' 
                    : 'Please check your Redmine URL and authentication settings.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"
              value={username}
              readOnly
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              To change your username, you need to log out and log back in
            </p>
          </div>

          <div>
            <label htmlFor="redmineUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Redmine URL
            </label>
            <input
              type="text"
              id="redmineUrl"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://your-redmine-instance.com"
              value={localRedmineUrl}
              onChange={(e) => setLocalRedmineUrl(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of your Redmine instance (e.g., https://redmine.example.com)
            </p>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading || testStatus === 'loading'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              <Save size={16} className="mr-2" />
              Save Settings
            </button>
            
            <button
              onClick={handleTestConnection}
              disabled={isLoading || testStatus === 'loading'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500"
            >
              {testStatus === 'loading' ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Test Connection
            </button>
            
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>

          {/* Test Connection Status */}
          {testStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>Connection successful! Your Redmine API settings are working correctly.</span>
            </div>
          )}
          
          {testStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{testError || 'Connection failed. Please check your API key and Redmine URL.'}</span>
            </div>
          )}
          
          {(apiError || authError) && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{apiError || authError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Data Synchronization</h2>
        <p className="text-gray-600 mb-4">
          Configure how often the dashboard should sync data with your Redmine instance.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700 mb-1">
              Sync Interval
            </label>
            <select
              id="syncInterval"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              defaultValue="30"
            >
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
              <option value="manual">Manual refresh only</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              id="syncOnStartup"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              defaultChecked
            />
            <label htmlFor="syncOnStartup" className="text-sm text-gray-700">
              Sync data on application startup
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="defaultView" className="block text-sm font-medium text-gray-700 mb-1">
              Default Dashboard View
            </label>
            <select
              id="defaultView"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              defaultValue="overview"
            >
              <option value="overview">Overview</option>
              <option value="projects">Projects</option>
              <option value="issues">Issues</option>
              <option value="team">Team Performance</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              id="darkMode"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="darkMode" className="text-sm text-gray-700">
              Enable dark mode
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};