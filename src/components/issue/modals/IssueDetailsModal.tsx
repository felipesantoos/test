import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X, Paperclip, Link2, Eye, MessageSquare, Clock, Tag, AlertCircle, Edit } from 'lucide-react';
import { useApi } from '../../../context/ApiContext';
import { EditIssueModal } from '../../project/modals/EditIssueModal';
import { MarkdownEditor } from '../../shared/MarkdownEditor';

interface IssueDetailsModalProps {
  issueId: number;
  onClose: () => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({ issueId, onClose }) => {
  const { users, fetchIssueDetails, updateIssue, refreshData } = useApi();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'relations'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadIssueDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const issueData = await fetchIssueDetails(issueId);
        setIssue(issueData);
      } catch (err: any) {
        console.error('Error loading issue details:', err);
        setError(err.message || 'Failed to load issue details');
      } finally {
        setLoading(false);
      }
    };
    
    loadIssueDetails();
  }, [issueId, fetchIssueDetails, refreshTrigger]);

  // Handle updating an issue
  const handleUpdateIssue = async () => {
    if (!issue || !issue.subject) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: {
          subject: issue.subject,
          description: issue.description,
          status_id: issue.status.id,
          priority_id: issue.priority.id,
          assigned_to_id: issue.assigned_to?.id || null
        }
      };
      
      await updateIssue(issue.id, issueData);
      
      // Refresh the issue details and the main data
      setRefreshTrigger(prev => prev + 1);
      refreshData();
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Get color class for status badge
  const getStatusColor = (status: string) => {
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
  const getPriorityColor = (priority: string) => {
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

  if (isEditing && issue) {
    return (
      <EditIssueModal
        selectedIssue={issue}
        setSelectedIssue={setIssue}
        handleUpdateIssue={handleUpdateIssue}
        loadingAction={loadingAction}
        onCancel={() => setIsEditing(false)}
        users={users}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {loading ? (
            <div className="bg-white p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-white p-6">
              <div className="flex items-center text-red-600 mb-4">
                <AlertCircle className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-medium">Error Loading Issue</h3>
              </div>
              <p className="text-gray-600">{error}</p>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : issue ? (
            <>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                        #{issue.id}: {issue.subject}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={onClose}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status.name)}`}>
                        {issue.status.name}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority.name)}`}>
                        {issue.priority.name}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {issue.tracker.name}
                      </span>
                    </div>
                    
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                      <nav className="flex -mb-px">
                        <button
                          onClick={() => setActiveTab('details')}
                          className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'details'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'history'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          History
                        </button>
                        <button
                          onClick={() => setActiveTab('relations')}
                          className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'relations'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Relations
                        </button>
                      </nav>
                    </div>
                    
                    {/* Tab Content */}
                    {activeTab === 'details' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Project</h4>
                            <p className="text-sm text-gray-900">{issue.project.name}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h4>
                            <p className="text-sm text-gray-900">{issue.assigned_to ? issue.assigned_to.name : 'Unassigned'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                            <p className="text-sm text-gray-900">{formatDate(issue.created_on)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Updated</h4>
                            <p className="text-sm text-gray-900">{formatDate(issue.updated_on)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                          <MarkdownEditor
                            value={issue.description || ''}
                            onChange={() => {}}
                            preview={true}
                          />
                        </div>
                        
                        {issue.attachments && issue.attachments.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Attachments</h4>
                            <ul className="space-y-2">
                              {issue.attachments.map((attachment: any) => (
                                <li key={attachment.id} className="flex items-center text-sm">
                                  <Paperclip size={16} className="text-gray-400 mr-2" />
                                  <a 
                                    href={attachment.content_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800"
                                  >
                                    {attachment.filename} ({Math.round(attachment.filesize / 1024)} KB)
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {issue.watchers && issue.watchers.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Watchers</h4>
                            <div className="flex flex-wrap gap-2">
                              {issue.watchers.map((watcher: any) => (
                                <div key={watcher.id} className="flex items-center text-sm bg-gray-100 px-2 py-1 rounded-full">
                                  <Eye size={14} className="text-gray-500 mr-1" />
                                  <span>{watcher.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Issue History</h4>
                        {issue.journals && issue.journals.length > 0 ? (
                          <div className="space-y-4">
                            {issue.journals.map((journal: any) => (
                              <div key={journal.id} className="border-l-2 border-gray-200 pl-4 py-2">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                    <div className="font-medium text-gray-900">{journal.user.name}</div>
                                    <div className="text-xs text-gray-500 ml-2">
                                      <Clock size={12} className="inline mr-1" />
                                      {formatDate(journal.created_on)}
                                    </div>
                                  </div>
                                </div>
                                
                                {journal.notes && (
                                  <MarkdownEditor
                                    value={journal.notes}
                                    onChange={() => {}}
                                    preview={true}
                                  />
                                )}
                                
                                {journal.details && journal.details.length > 0 && (
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {journal.details.map((detail: any, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <Tag size={12} className="text-gray-400 mr-1 mt-0.5" />
                                        <span>
                                          Changed <strong>{detail.name}</strong> from{' '}
                                          <span className="line-through">{detail.old_value || '(none)'}</span> to{' '}
                                          <span className="font-medium">{detail.new_value || '(none)'}</span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No history available.</p>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'relations' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Related Issues</h4>
                        {issue.relations && issue.relations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Relation
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Issue
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {issue.relations.map((relation: any) => (
                                  <tr key={relation.id}>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                      {relation.relation_type === 'relates' && 'Related to'}
                                      {relation.relation_type === 'duplicates' && 'Duplicates'}
                                      {relation.relation_type === 'duplicated' && 'Duplicated by'}
                                      {relation.relation_type === 'blocks' && 'Blocks'}
                                      {relation.relation_type === 'blocked' && 'Blocked by'}
                                      {relation.relation_type === 'precedes' && 'Precedes'}
                                      {relation.relation_type === 'follows' && 'Follows'}
                                      {relation.relation_type === 'copied_to' && 'Copied to'}
                                      {relation.relation_type === 'copied_from' && 'Copied from'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                      <a 
                                        href={`#/issues/${relation.issue_id || relation.issue_to_id}`} 
                                        className="text-indigo-600 hover:text-indigo-800"
                                      >
                                        #{relation.issue_id || relation.issue_to_id}
                                      </a>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                      {relation.status ? (
                                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(relation.status)}`}>
                                          {relation.status}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500">Unknown</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No related issues.</p>
                        )}
                        
                        {issue.children && issue.children.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1 mt-4">Subtasks</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      ID
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Subject
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {issue.children.map((child: any) => (
                                    <tr key={child.id}>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <a 
                                          href={`#/issues/${child.id}`} 
                                          className="text-indigo-600 hover:text-indigo-800"
                                        >
                                          #{child.id}
                                        </a>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        {child.subject}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(child.status.name)}`}>
                                          {child.status.name}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 flex items-center justify-center">
              <p className="text-gray-500">No issue data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
