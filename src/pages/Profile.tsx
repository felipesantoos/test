import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../context/ApiContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

export const Profile = () => {
  const { username, redmineUrl, isAuthenticated } = useAuth();
  const { isConnected } = useApi();
  
  // State for user data
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // State for password change
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Server URL from environment variable
  const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !isConnected) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get auth token from localStorage
        const authToken = localStorage.getItem('redmine_auth') || '';
        
        // Fetch current user data
        const response = await axios.get(`${SERVER_URL}/api/users/current`, {
          params: { 
            authToken,
            redmineUrl,
            include: 'memberships,groups'
          }
        });
        
        if (response.data && response.data.user) {
          setUserData(response.data.user);
          setEditedData({
            firstname: response.data.user.firstname || '',
            lastname: response.data.user.lastname || '',
            mail: response.data.user.mail || ''
          });
        } else {
          throw new Error('Failed to load user data');
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, isConnected, redmineUrl]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!editedData || !userData) return;
    
    // Validate form
    if (!editedData.firstname || !editedData.lastname || !editedData.mail) {
      setError('All fields are required');
      return;
    }
    
    setSavingProfile(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('redmine_auth') || '';
      
      // Prepare user data for API
      const updateData = {
        user: {
          firstname: editedData.firstname,
          lastname: editedData.lastname,
          mail: editedData.mail
        }
      };
      
      // Update user
      await axios.put(`${SERVER_URL}/api/users/${userData.id}`, updateData, {
        params: { 
          redmineUrl
        }
      });
      
      // Update local user data
      setUserData({
        ...userData,
        ...updateData.user
      });
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Validate password form
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirmation) {
      setPasswordError('All password fields are required');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirmation) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('redmine_auth') || '';
      
      // Prepare password data for API
      const updateData = {
        user: {
          password: passwordData.new_password,
          current_password: passwordData.current_password
        }
      };
      
      // Update password
      await axios.put(`${SERVER_URL}/api/my/password`, updateData, {
        params: { 
          authToken,
          redmineUrl
        }
      });
      
      setPasswordSuccess(true);
      setIsChangingPassword(false);
      
      // Reset password form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirmation: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.error || err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({
      firstname: userData?.firstname || '',
      lastname: userData?.lastname || '',
      mail: userData?.mail || ''
    });
    setError(null);
  };

  // Cancel password change
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirmation: ''
    });
    setPasswordError(null);
  };

  if (!isAuthenticated || !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Connected</h2>
        <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
        <a href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Go to Login
        </a>
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

  if (error && !userData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <div className="flex gap-2">
          {!isEditing && !isChangingPassword && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              >
                <User size={16} className="mr-2" />
                Edit Profile
              </button>
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <Lock size={16} className="mr-2" />
                Change Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Profile updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {passwordSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Password changed successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstname"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={editedData.firstname}
                  onChange={(e) => setEditedData({ ...editedData, firstname: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastname"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={editedData.lastname}
                  onChange={(e) => setEditedData({ ...editedData, lastname: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editedData.mail}
                onChange={(e) => setEditedData({ ...editedData, mail: e.target.value })}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={16} className="inline mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="inline mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : isChangingPassword ? (
          <div className="space-y-4">
            {passwordError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="current_password"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="new_password"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmation"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  value={passwordData.confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmation: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCancelPasswordChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {savingPassword ? (
                  <>
                    <RefreshCw size={16} className="inline mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Save size={16} className="inline mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                <p className="text-sm text-gray-900">{userData?.login}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                <p className="text-sm text-gray-900">{userData?.firstname} {userData?.lastname}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-sm text-gray-900">{userData?.mail}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Last Login</h3>
                <p className="text-sm text-gray-900">{userData?.last_login_on ? formatDate(userData.last_login_on) : 'Never'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created On</h3>
                <p className="text-sm text-gray-900">{formatDate(userData?.created_on)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Administrator</h3>
                <p className="text-sm text-gray-900">{userData?.admin ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Key Section */}
      {!isEditing && !isChangingPassword && userData?.api_key && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">API Access</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">API Key</h3>
              <div className="flex items-center">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {userData.api_key}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userData.api_key);
                    alert('API key copied to clipboard!');
                  }}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This key can be used for API access. Keep it secret!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Group Memberships */}
      {!isEditing && !isChangingPassword && userData?.groups && userData.groups.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Group Memberships</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userData.groups.map((group: any) => (
              <div key={group.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Users size={16} className="text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};