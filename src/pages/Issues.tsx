import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { AlertCircle, Plus, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { IssueList } from '../components/issue/IssueList';
import { EditIssueModal } from '../components/project/modals/EditIssueModal';
import { CreateIssueModal } from '../components/project/modals/CreateIssueModal';
import { BulkCreateIssueModal } from '../components/issue/modals/BulkCreateIssueModal';

export const Issues = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    issues, 
    projects, 
    priorities,
    issueStatuses,
    trackers,
    refreshData, 
    fetchIssues,
    updateIssue,
    deleteIssue,
    createIssue
  } = useApi();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // State for issues and loading
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for selected issue (for editing)
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  
  // State for creating a new issue
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({
    subject: '',
    description: '',
    project_id: 0,
    status_id: 1,
    priority_id: 2,
    assigned_to_id: ''
  });
  
  // State for bulk creating issues
  const [isBulkCreatingIssues, setIsBulkCreatingIssues] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load issues on initial render
  useEffect(() => {
    if (isConnected && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  // Update new issue project when project filter changes
  useEffect(() => {
    if (projectFilter !== 'all') {
      setNewIssue(prev => ({
        ...prev,
        project_id: parseInt(projectFilter)
      }));
    } else if (projects.length > 0) {
      setNewIssue(prev => ({
        ...prev,
        project_id: projects[0].id
      }));
    }
  }, [projectFilter, projects]);

  // Filter issues when filters or issues change
  useEffect(() => {
    const loadIssues = async () => {
      if (!isConnected) return;
      
      setLoading(true);
      
      try {
        const filters: any = {};
        
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        
        if (projectFilter !== 'all') {
          filters.projectId = projectFilter;
        }
        
        if (priorityFilter !== 'all') {
          filters.priorityId = priorityFilter;
        }
        
        if (assigneeFilter !== 'all') {
          filters.assignedTo = assigneeFilter;
        }
        
        if (dateFilter === 'today') {
          filters.updatedOn = '>t-1d';
        } else if (dateFilter === 'week') {
          filters.updatedOn = '>t-7d';
        } else if (dateFilter === 'month') {
          filters.updatedOn = '>t-30d';
        }
        
        const fetchedIssues = await fetchIssues(filters);
        
        // Apply search filter client-side
        const filtered = searchQuery 
          ? fetchedIssues.filter(issue => 
              issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : fetchedIssues;
          
        setFilteredIssues(filtered);
      } catch (err) {
        console.error('Error loading issues:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (issues.length > 0) {
      // Filter existing issues client-side if we already have them
      let filtered = [...issues];
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(issue => 
          issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.status.name.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Apply project filter
      if (projectFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.project.id.toString() === projectFilter
        );
      }
      
      // Apply priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.priority.id.toString() === priorityFilter
        );
      }
      
      // Apply assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          filtered = filtered.filter(issue => !issue.assigned_to);
        } else {
          filtered = filtered.filter(issue => 
            issue.assigned_to && issue.assigned_to.id.toString() === assigneeFilter
          );
        }
      }
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let compareDate = new Date();
        
        if (dateFilter === 'today') {
          compareDate.setDate(now.getDate() - 1);
        } else if (dateFilter === 'week') {
          compareDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          compareDate.setDate(now.getDate() - 30);
        }
        
        filtered = filtered.filter(issue => 
          new Date(issue.updated_on) > compareDate
        );
      }
      
      setFilteredIssues(filtered);
    } else {
      // Otherwise load from API
      loadIssues();
    }
  }, [issues, searchQuery, statusFilter, projectFilter, priorityFilter, assigneeFilter, dateFilter, isConnected]);

  // Apply filters and fetch issues from API
  const handleFilterChange = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    
    try {
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (projectFilter !== 'all') {
        filters.projectId = projectFilter;
      }
      
      if (priorityFilter !== 'all') {
        filters.priorityId = priorityFilter;
      }
      
      if (assigneeFilter !== 'all') {
        filters.assignedTo = assigneeFilter;
      }
      
      if (dateFilter === 'today') {
        filters.updatedOn = '>t-1d';
      } else if (dateFilter === 'week') {
        filters.updatedOn = '>t-7d';
      } else if (dateFilter === 'month') {
        filters.updatedOn = '>t-30d';
      }
      
      const fetchedIssues = await fetchIssues(filters);
      
      // Apply search filter client-side
      const filtered = searchQuery 
        ? fetchedIssues.filter(issue => 
            issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : fetchedIssues;
        
      setFilteredIssues(filtered);
    } catch (err) {
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDateFilter('all');
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

  // Handle issue edit
  const handleEditIssue = (issue: any) => {
    setSelectedIssue(issue);
  };

  // Handle issue delete
  const handleDeleteIssue = async (issueId: number) => {
    if (!isConnected) return;
    
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteIssue(issueId);
      
      // Refresh issues
      await refreshData();
      
      alert('Issue deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new issue
  const handleCreateIssue = async () => {
    if (!isConnected || !newIssue.subject || !newIssue.project_id) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: newIssue
      };
      
      await createIssue(issueData);
      
      // Refresh issues
      await refreshData();
      
      // Reset form
      setNewIssue({
        subject: '',
        description: '',
        project_id: projectFilter !== 'all' ? parseInt(projectFilter) : (projects.length > 0 ? projects[0].id : 0),
        status_id: 1,
        priority_id: 2,
        assigned_to_id: ''
      });
      
      setIsCreatingIssue(false);
    } catch (err: any) {
      console.error('Error creating issue:', err);
      alert('Failed to create issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle bulk creating issues
  const handleBulkCreateIssues = async (issues: any[]): Promise<{success: any[], failed: any[]}> => {
    if (!isConnected || issues.length === 0) return { success: [], failed: [] };
    
    setLoadingAction(true);
    
    const successfulIssues: any[] = [];
    const failedIssues: any[] = [];
    
    try {
      // Process issues one by one to track which ones fail
      for (const issueData of issues) {
        try {
          const result = await createIssue({ issue: issueData });
          successfulIssues.push(result);
        } catch (err: any) {
          // Add error information to the failed issue
          failedIssues.push({
            ...issueData,
            error: err.message || 'Failed to create issue'
          });
        }
      }
      
      // Refresh issues if any were created successfully
      if (successfulIssues.length > 0) {
        await refreshData();
      }
      
      return { success: successfulIssues, failed: failedIssues };
    } catch (err: any) {
      console.error('Error in bulk issue creation:', err);
      throw new Error('Failed to process bulk issue creation');
    } finally {
      setLoadingAction(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Get unique assignees from issues
  const getUniqueAssignees = () => {
    const assignees = new Map();
    
    issues.forEach(issue => {
      if (issue.assigned_to) {
        assignees.set(issue.assigned_to.id, issue.assigned_to);
      }
    });
    
    return Array.from(assignees.values());
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Issues</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsBulkCreatingIssues(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <Upload size={16} className="mr-2" />
            Bulk Create
          </button>
          <button 
            onClick={() => {
              // Set default project based on filter or first available
              const projectId = projectFilter !== 'all' 
                ? parseInt(projectFilter) 
                : (projects.length > 0 ? projects[0].id : 0);
                
              setNewIssue({
                ...newIssue,
                project_id: projectId
              });
              setIsCreatingIssue(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Issue
          </button>
        </div>
      </div>

      {/* Issue List Component */}
      <IssueList
        issues={filteredIssues}
        loading={loading || isLoading}
        getStatusColorClass={getStatusColor}
        getPriorityColorClass={getPriorityColor}
        formatDate={formatDate}
        handleDeleteIssue={handleDeleteIssue}
        handleEditIssue={handleEditIssue}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        projects={projects}
        issueStatuses={issueStatuses}
        priorities={priorities}
        getUniqueAssignees={getUniqueAssignees}
        resetFilters={resetFilters}
        handleFilterChange={handleFilterChange}
      />

      {/* Create Issue Modal */}
      {isCreatingIssue && (
        <CreateIssueModal
          newIssue={newIssue}
          setNewIssue={setNewIssue}
          handleCreateIssue={handleCreateIssue}
          setIsCreatingIssue={setIsCreatingIssue}
          loadingAction={loadingAction}
          projects={projects}
        />
      )}

      {/* Bulk Create Issues Modal */}
      {isBulkCreatingIssues && (
        <BulkCreateIssueModal
          projectId={projectFilter !== 'all' ? parseInt(projectFilter) : (projects.length > 0 ? projects[0].id : 0)}
          handleBulkCreateIssues={handleBulkCreateIssues}
          setBulkCreatingIssues={setIsBulkCreatingIssues}
          loadingAction={loadingAction}
          trackers={trackers}
          statuses={issueStatuses}
          priorities={priorities}
          projects={projects}
        />
      )}

      {/* Edit Issue Modal */}
      {selectedIssue && (
        <EditIssueModal
          selectedIssue={selectedIssue}
          setSelectedIssue={setSelectedIssue}
          handleUpdateIssue={async () => {
            if (!selectedIssue || !selectedIssue.subject) return;
            
            setLoadingAction(true);
            
            try {
              const issueData = {
                issue: {
                  subject: selectedIssue.subject,
                  description: selectedIssue.description,
                  status_id: selectedIssue.status.id,
                  priority_id: selectedIssue.priority.id,
                  assigned_to_id: selectedIssue.assigned_to?.id || null
                }
              };
              
              await updateIssue(selectedIssue.id, issueData);
              await refreshData();
              setSelectedIssue(null);
              
              alert('Issue updated successfully.');
            } catch (err) {
              console.error('Error updating issue:', err);
              alert('Failed to update issue. Please try again.');
            } finally {
              setLoadingAction(false);
            }
          }}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};