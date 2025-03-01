import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { AlertCircle, User, Mail, Calendar, Shield, UserCog, FolderKanban } from 'lucide-react';
import { UserProjectsTab } from '../components/user/UserProjectsTab';

export const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, isLoading: apiLoading } = useApi();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Server URL from environment variable
  const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isConnected || !id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const redmineUrl = localStorage.getItem('redmine_url') || '';
        
        const response = await fetch(`${SERVER_URL}/api/users/${id}?redmineUrl=${encodeURIComponent(redmineUrl)}&include=memberships,groups`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err: any) {
        console.error('Error fetching user details:', err);
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [id, isConnected, SERVER_URL]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status label
  const getStatusLabel = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "Active";
      case 2:
        return "Registered";
      case 3:
        return "Locked";
      default:
        return "Unknown";
    }
  };

  // Get status color class
  const getStatusColorClass = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Connected to Redmine</h2>
        <p className="text-gray-600 mb-4">Please configure your Redmine API settings to get started.</p>
        <Link to="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
        <p className="text-gray-600 mb-4">{error || 'User not found'}</p>
        <Link to="/users" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
              <User size={32} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{user.firstname} {user.lastname}</h1>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(user.status)}`}>
                  {getStatusLabel(user.status)}
                </span>
                {user.admin && (
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                    Administrator
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={16} className="mr-2" />
              {user.mail || 'No email provided'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2" />
              Last login: {user.last_login_on ? formatDate(user.last_login_on) : 'Never'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <UserCog size={16} className="mr-2" />
              Created: {formatDate(user.created_on)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User size={16} className="mr-2" />
              User Details
            </button>
            
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderKanban size={16} className="mr-2" />
              Projects
            </button>
            
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'groups'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield size={16} className="mr-2" />
              Groups
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* User Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                  <p className="text-sm text-gray-900">{user.login}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                  <p className="text-sm text-gray-900">{user.firstname} {user.lastname}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-sm text-gray-900">{user.mail || 'No email provided'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <p className="text-sm text-gray-900">{getStatusLabel(user.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Administrator</h3>
                  <p className="text-sm text-gray-900">{user.admin ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Login</h3>
                  <p className="text-sm text-gray-900">{user.last_login_on ? formatDate(user.last_login_on) : 'Never'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Fields</h3>
              {user.custom_fields && user.custom_fields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.custom_fields.map((field: any) => (
                    <div key={field.id}>
                      <h4 className="text-xs font-medium text-gray-500">{field.name}</h4>
                      <p className="text-sm text-gray-900">{field.value || '-'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No custom fields available</p>
              )}
            </div>
          </div>
        )}
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <UserProjectsTab userId={parseInt(id || '0')} userName={`${user.firstname} ${user.lastname}`} />
        )}
        
        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">User Groups</h2>
            
            {user.groups && user.groups.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {user.groups.map((group: any) => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Shield size={20} className="text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{group.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Remove from Group"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="flex flex-col items-center">
                  <Shield size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No groups found</h3>
                  <p className="text-gray-500 mb-4">This user is not a member of any groups</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};