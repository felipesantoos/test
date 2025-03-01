import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Tag, 
  User, 
  Users, 
  FileText, 
  Paperclip, 
  MessageSquare, 
  Link as LinkIcon, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  BarChart3,
  Hourglass
} from 'lucide-react';
import { format } from 'date-fns';

export const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    isConnected, 
    fetchIssueDetails, 
    updateIssue, 
    deleteIssue,
    addWatcher,
    removeWatcher,
    isLoading: apiLoading
  } = useApi();

  // State
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIssue, setEditedIssue] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Load issue details
  useEffect(() => {
    if (!isConnected || !id) return;
    
    const loadIssueData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const issueData = await fetchIssueDetails(parseInt(id));
        if (!issueData) {
          setError('Issue not found');
          setLoading(false);
          return;
        }
        
        setIssue(issueData);
        setEditedIssue({
          subject: issueData.subject,
          description: issueData.description || '',
          status_id: issueData.status.id,
          priority_id: issueData.priority.id,
          assigned_to_id: issueData.assigned_to?.id || null,
          start_date: issueData.start_date,
          due_date: issueData.due_date,
          estimated_hours: issueData.estimated_hours,
          done_ratio: issueData.done_ratio
        });
      } catch (err: any) {
        console.error('Error loading issue data:', err);
        setError('Failed to load issue data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadIssueData();
  }, [id, isConnected, fetchIssueDetails]);

  // Format date to a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Format datetime to a readable format
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Get color class for status badge
  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'feedback':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color class for priority badge
  const getPriorityColorClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'immediate':
        return 'bg-red-100 text-red-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle updating an issue
  const handleUpdateIssue = async () => {
    if (!isConnected || !editedIssue) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: editedIssue
      };
      
      await updateIssue(parseInt(id || '0'), issueData);
      
      // Refresh issue details
      const updatedIssue = await fetchIssueDetails(parseInt(id || '0'));
      setIssue(updatedIssue);
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting an issue
  const handleDeleteIssue = async () => {
    if (!isConnected || !issue) return;
    
    setLoadingAction(true);
    
    try {
      await deleteIssue(parseInt(id || '0'));
      
      // Redirect to issues list
      navigate('/issues');
    } catch (err: any) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle adding a watcher
  const handleAddWatcher = async (userId: number) => {
    if (!isConnected || !issue) return;
    
    setLoadingAction(true);
    
    try {
      await addWatcher(parseInt(id || '0'), userId);
      
      // Refresh issue details
      const updatedIssue = await fetchIssueDetails(parseInt(id || '0'));
      setIssue(updatedIssue);
    } catch (err: any) {
      console.error('Error adding watcher:', err);
      alert('Failed to add watcher. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle removing a watcher
  const handleRemoveWatcher = async (userId: number) => {
    if (!isConnected || !issue) return;
    
    setLoadingAction(true);
    
    try {
      await removeWatcher(parseInt(id || '0'), userId);
      
      // Refresh issue details
      const updatedIssue = await fetchIssueDetails(parseInt(id || '0'));
      setIssue(updatedIssue);
    } catch (err: any) {
      console.error('Error removing watcher:', err);
      alert('Failed to remove watcher. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Get file size in human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (loading || apiLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Issue</h2>
        <p className="text-gray-600 mb-4">{error || 'Issue not found'}</p>
        <Link to="/issues" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Back to Issues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link 
            to="/issues" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to Issues</span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit size={16} className="mr-2" />
                Edit Issue
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Issue
              </button>
            </>
          )}
        </div>
      </div>

      {/* Issue Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(issue.status.name)}`}>
                {issue.status.name}
              </span>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClass(issue.priority.name)}`}>
                {issue.priority.name}
              </span>
              <span className="text-gray-500 text-sm">#{issue.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{issue.subject}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <User size={16} className="mr-2" />
                Reported by: {issue.author.name}
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Created: {formatDateTime(issue.created_on)}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                Updated: {formatDateTime(issue.updated_on)}
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 w-full md:w-64">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="font-bold text-indigo-600">{issue.done_ratio}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${issue.done_ratio}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {issue.estimated_hours ? `${issue.estimated_hours}h estimated` : 'No estimate'}
              </span>
              <span>
                {issue.spent_hours ? `${issue.spent_hours}h spent` : 'No time logged'}
              </span>
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
              <FileText size={16} className="mr-2" />
              Details
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare size={16} className="mr-2" />
              History
            </button>
            
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'attachments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Paperclip size={16} className="mr-2" />
              Attachments
              {issue.attachments && issue.attachments.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.attachments.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('relations')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'relations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LinkIcon size={16} className="mr-2" />
              Relations
              {issue.relations && issue.relations.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.relations.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('watchers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'watchers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye size={16} className="mr-2" />
              Watchers
              {issue.watchers && issue.watchers.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.watchers.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editedIssue.subject}
                    onChange={(e) => setEditedIssue({ ...editedIssue, subject: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editedIssue.description || ''}
                    onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.status_id}
                      onChange={(e) => setEditedIssue({ ...editedIssue, status_id: parseInt(e.target.value) })}
                    >
                      {issue.allowed_statuses?.map((status: any) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      )) || (
                        <option value={issue.status.id}>{issue.status.name}</option>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.priority_id}
                      onChange={(e) => setEditedIssue({ ...editedIssue, priority_id: parseInt(e.target.value) })}
                    >
                      <option value="1">Low</option>
                      <option value="2">Normal</option>
                      <option value="3">High</option>
                      <option value="4">Urgent</option>
                      <option value="5">Immediate</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      id="assignedTo"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.assigned_to_id || ''}
                      onChange={(e) => setEditedIssue({ ...editedIssue, assigned_to_id: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="User ID (optional)"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="doneRatio" className="block text-sm font-medium text-gray-700 mb-1">
                      % Done
                    </label>
                    <select
                      id="doneRatio"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.done_ratio}
                      onChange={(e) => setEditedIssue({ ...editedIssue, done_ratio: parseInt(e.target.value) })}
                    >
                      <option value="0">0%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                      <option value="30">30%</option>
                      <option value="40">40%</option>
                      <option value="50">50%</option>
                      <option value="60">60%</option>
                      <option value="70">70%</option>
                      <option value="80">80%</option>
                      <option value="90">90%</option>
                      <option value="100">100%</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.start_date || ''}
                      onChange={(e) => setEditedIssue({ ...editedIssue, start_date: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editedIssue.due_date || ''}
                      onChange={(e) => setEditedIssue({ ...editedIssue, due_date: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    id="estimatedHours"
                    step="0.5"
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={editedIssue.estimated_hours || ''}
                    onChange={(e) => setEditedIssue({ ...editedIssue, estimated_hours: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Hours (optional)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateIssue}
                    disabled={!editedIssue.subject || loadingAction}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {loadingAction ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-md prose max-w-none">
                    {issue.description ? (
                      <p className="whitespace-pre-wrap">{issue.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Details</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <dl className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(issue.status.name)}`}>
                              {issue.status.name}
                            </span>
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Priority</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClass(issue.priority.name)}`}>
                              {issue.priority.name}
                            </span>
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {issue.assigned_to ? (
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                                  <User size={12} className="text-indigo-600" />
                                </div>
                                <span>{issue.assigned_to.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Unassigned</span>
                            )}
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Reporter</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                                <User size={12} className="text-indigo-600" />
                              </div>
                              <span>{issue.author.name}</span>
                            </div>
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Project</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            <Link to={`/projects/${issue.project.id}`} className="text-indigo-600 hover:text-indigo-800">
                              {issue.project.name}
                            </Link>
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Tracker</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{issue.tracker.name}</dd>
                        </div>
                        
                        {issue.category && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Category</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{issue.category.name}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Dates & Progress</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <dl className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Created</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{formatDateTime(issue.created_on)}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Updated</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{formatDateTime(issue.updated_on)}</dd>
                        </div>
                        
                        {issue.closed_on && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Closed</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{formatDateTime(issue.closed_on)}</dd>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {issue.start_date ? formatDate(issue.start_date) : '-'}
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {issue.due_date ? formatDate(issue.due_date) : '-'}
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">% Done</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            <div className="flex items-center">
                              <span className="mr-2">{issue.done_ratio}%</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full" 
                                  style={{ width: `${issue.done_ratio}%` }}
                                ></div>
                              </div>
                            </div>
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Estimated</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {issue.estimated_hours ? `${issue.estimated_hours} hours` : '-'}
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Spent Time</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {issue.spent_hours ? `${issue.spent_hours} hours` : '-'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                
                {issue.custom_fields && issue.custom_fields.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Fields</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <dl className="space-y-3">
                        {issue.custom_fields.map((field: any) => (
                          <div key={field.id} className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">{field.name}</dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {field.value || '-'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
                
                {issue.children && issue.children.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Subtasks</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <ul className="space-y-2">
                        {issue.children.map((child: any) => (
                          <li key={child.id} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                            <Link 
                              to={`/issues/${child.id}`} 
                              className="flex items-start hover:bg-gray-100 p-2 rounded-md"
                            >
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="text-indigo-600 font-medium">#{child.id}</span>
                                  <span className="mx-2">-</span>
                                  <span className="font-medium">{child.subject}</span>
                                </div>
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(child.status.name)}`}>
                                    {child.status.name}
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span>
                                    {child.assigned_to ? `Assigned to ${child.assigned_to.name}` : 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-indigo-600 h-1.5 rounded-full" 
                                    style={{ width: `${child.done_ratio}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-xs text-gray-500">{child.done_ratio}%</span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue History</h3>
            
            {issue.journals && issue.journals.length > 0 ? (
              <div className="space-y-6">
                {issue.journals.map((journal: any) => (
                  <div key={journal.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <User size={20} className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{journal.user.name}</h4>
                          <span className="text-sm text-gray-500">{formatDateTime(journal.created_on)}</span>
                        </div>
                        
                        {journal.notes && (
                          <div className="mt-2 bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{journal.notes}</p>
                          </div>
                        )}
                        
                        {journal.details && journal.details.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Changes</h5>
                            <ul className="space-y-1">
                              {journal.details.map((detail: any, index: number) => (
                                <li key={index} className="text-sm">
                                  <span className="font-medium">{detail.name}</span>:
                                  {detail.old_value && (
                                    <span className="line-through text-red-600 mx-1">{detail.old_value}</span>
                                  )}
                                  {detail.new_value && (
                                    <span className="text-green-600">{detail.new_value}</span>
                                  )}
                                  {!detail.old_value && !detail.new_value && (
                                    <span className="text-gray-500 ml-1">changed</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-500">No history available for this issue</p>
              </div>
            )}
          </div>
        )}

        {/* Attachments Tab */}
        {activeTab === 'attachments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
            
            {issue.attachments && issue.attachments.length > 0 ? (
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {issue.attachments.map((attachment: any) => (
                    <li key={attachment.id} className="p-4 hover:bg-gray-100">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <Paperclip size={20} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              <a 
                                href={attachment.content_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                {attachment.filename}
                              </a>
                            </h4>
                            <span className="text-sm text-gray-500">{formatDateTime(attachment.created_on)}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">
                              {formatFileSize(attachment.filesize)}
                            </span>
                            <span>
                              {attachment.content_type}
                            </span>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Uploaded by: </span>
                            <span className="font-medium">{attachment.author.name}</span>
                          </div>
                          {attachment.description && (
                            <div className="mt-2 text-sm text-gray-700">
                              {attachment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-500">No attachments for this issue</p>
              </div>
            )}
          </div>
        )}

        {/* Relations Tab */}
        {activeTab === 'relations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Related Issues</h3>
            
            {issue.relations && issue.relations.length > 0 ? (
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {issue.relations.map((relation: any) => (
                    <li key={relation.id} className="p-4 hover:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 mr-2">
                            {relation.relation_type === 'blocks' ? 'Blocks' : 
                             relation.relation_type === 'precedes' ? 'Precedes' :
                             relation.relation_type === 'follows' ? 'Follows' :
                             relation.relation_type === 'relates' ? 'Related to' :
                             relation.relation_type === 'duplicates' ? 'Duplicates' :
                             relation.relation_type === 'duplicated' ? ' Duplicated by' :
                             relation.relation_type === 'copied_to' ? 'Copied to' :
                             relation.relation_type === 'copied_from' ? 'Copied from' :
                             relation.relation_type}:
                          </span>
                          <Link 
                            to={`/issues/${relation.issue_id === issue.id ? relation.issue_to_id : relation.issue_id}`} 
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            #{relation.issue_id === issue.id ? relation.issue_to_id : relation.issue_id}
                          </Link>
                        </div>
                        <button
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={() => {
                            // Handle removing relation
                            alert('Removing relations is not implemented in this demo');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-500">No related issues</p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Add Related Issue</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="relationType" className="block text-sm font-medium text-gray-700 mb-1">
                      Relation Type
                    </label>
                    <select
                      id="relationType"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      defaultValue="relates"
                    >
                      <option value="relates">Related to</option>
                      <option value="blocks">Blocks</option>
                      <option value="precedes">Precedes</option>
                      <option value="follows">Follows</option>
                      <option value="duplicates">Duplicates</option>
                      <option value="duplicated">Duplicated by</option>
                      <option value="copied_to">Copied to</option>
                      <option value="copied_from">Copied from</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="issueId" className="block text-sm font-medium text-gray-700 mb-1">
                      Issue ID
                    </label>
                    <input
                      type="number"
                      id="issueId"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter issue ID"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        // Handle adding relation
                        alert('Adding relations is not implemented in this demo');
                      }}
                    >
                      Add Relation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Watchers Tab */}
        {activeTab === 'watchers' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Watchers</h3>
            
            {issue.watchers && issue.watchers.length > 0 ? (
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {issue.watchers.map((watcher: any) => (
                    <li key={watcher.id} className="p-4 hover:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <User size={16} className="text-indigo-600" />
                          </div>
                          <span className="font-medium">{watcher.name}</span>
                        </div>
                        <button
                          className="text-red-600 hover:text-red-800 text-sm flex items-center"
                          onClick={() => handleRemoveWatcher(watcher.id)}
                          disabled={loadingAction}
                        >
                          <EyeOff size={16} className="mr-1" />
                          {loadingAction ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-500">No watchers for this issue</p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Add Watcher</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="watcherId" className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="number"
                      id="watcherId"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter user ID"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        const watcherId = (document.getElementById('watcherId') as HTMLInputElement).value;
                        if (watcherId) {
                          handleAddWatcher(parseInt(watcherId));
                        } else {
                          alert('Please enter a user ID');
                        }
                      }}
                      disabled={loadingAction}
                    >
                      {loadingAction ? 'Adding...' : 'Add Watcher'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Issue
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this issue? This action cannot be undone and all associated data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteIssue}
                  disabled={loadingAction}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-red-400"
                >
                  {loadingAction ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};