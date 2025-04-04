import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { Link } from 'react-router-dom';
import { AlertCircle, Plus, Upload } from 'lucide-react';
import { IssueList } from '../components/issue/IssueList';
import { BulkCreateIssueModal } from '../components/issue/modals/BulkCreateIssueModal';
import { EditIssueModal } from '../components/project/modals/EditIssueModal';
import { IssueDetailsModal } from '../components/issue/modals/IssueDetailsModal';
import { CreateIssueModal } from '../components/project/modals/CreateIssueModal';
import { SuccessNotification } from '../components/shared/SuccessNotification';

export const Issues = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    projects, 
    issues, 
    users,
    issueStatuses,
    trackers,
    priorities,
    epics,
    sprints,
    refreshData, 
    fetchIssues,
    fetchEpics,
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
  const [epicFilter, setEpicFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  
  // State for issues and loading
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for viewing issue details
  const [viewingIssueId, setViewingIssueId] = useState<number | null>(null);

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
    assigned_to_id: '',
    custom_fields: [
      { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value: '' }
    ]
  });
  
  // State for bulk creating issues
  const [isBulkCreatingIssues, setIsBulkCreatingIssues] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Add new state for success notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (isConnected) {
        setLoading(true);
        try {
          await Promise.all([
            refreshData(),
            fetchEpics()
          ]);
        } catch (err) {
          console.error('Error loading initial data:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
  }, [isConnected]);

  // Save filter values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('issues_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('issues_statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('issues_projectFilter', projectFilter);
  }, [projectFilter]);

  useEffect(() => {
    localStorage.setItem('issues_priorityFilter', priorityFilter);
  }, [priorityFilter]);

  useEffect(() => {
    localStorage.setItem('issues_assigneeFilter', assigneeFilter);
  }, [assigneeFilter]);

  useEffect(() => {
    localStorage.setItem('issues_dateFilter', dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    localStorage.setItem('issues_epicFilter', epicFilter);
  }, [epicFilter]);

  useEffect(() => {
    localStorage.setItem('issues_sprintFilter', sprintFilter);
  }, [sprintFilter]);

  // On mount, load saved filter values (if any)
  useEffect(() => {
    setSearchQuery(localStorage.getItem('issues_searchQuery') || '');
    setStatusFilter(localStorage.getItem('issues_statusFilter') || 'all');
    setProjectFilter(localStorage.getItem('issues_projectFilter') || 'all');
    setPriorityFilter(localStorage.getItem('issues_priorityFilter') || 'all');
    setAssigneeFilter(localStorage.getItem('issues_assigneeFilter') || 'all');
    setDateFilter(localStorage.getItem('issues_dateFilter') || 'all');
    setEpicFilter(localStorage.getItem('issues_epicFilter') || 'all');
    setSprintFilter(localStorage.getItem('issues_sprintFilter') || 'all');
  }, []);

  // Handle bulk delete
  const handleDeleteIssue = async (id: number) => {
    if (!isConnected) return;
    
    setLoadingAction(true);
    
    try {
      // Delete issue
      await deleteIssue(id);  
      
      // Refresh the issues list
      await refreshData();
      
      // Show success message
      setSuccessMessage('Issue deleted successfully');
    } catch (err) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete the issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (issueIds: number[]) => {
    if (!isConnected) return;
    
    setLoadingAction(true);
    
    try {
      // Create an array of promises for each issue deletion
      const deletePromises = issueIds.map(id => deleteIssue(id));
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      // Refresh the issues list
      await refreshData();
      
      // Show success message
      setSuccessMessage('Issues deleted successfully');
    } catch (err) {
      console.error('Error deleting issues:', err);
      alert('Failed to delete some issues. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Filter issues when filters or issues change
  useEffect(() => {
    if (issues.length > 0) {
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

      // Apply epic filter
      if (epicFilter !== 'all') {
        filtered = filtered.filter(issue => {
          if (epicFilter === 'none') {
            return getEpicValue(issue) === '-';
          }
          return getEpicValue(issue) === epicFilter;
        });
      }

      // Apply sprint filter
      if (sprintFilter !== 'all') {
        filtered = filtered.filter(issue => {
          if (sprintFilter === 'none') {
            return getSprintValue(issue) === '-';
          }
          return getSprintValue(issue) === sprintFilter;
        });
      }
      
      setFilteredIssues(filtered);
    } else {
      setFilteredIssues([]);
    }
  }, [issues, searchQuery, statusFilter, projectFilter, priorityFilter, assigneeFilter, dateFilter, epicFilter, sprintFilter]);

  // Handle bulk update
  const handleBulkUpdate = async (issueIds: number[], updates: any) => {
    if (!isConnected) return;
    
    setLoadingAction(true);
    
    try {
      // Create an array of promises for each issue update
      const updatePromises = issueIds.map(id => 
        updateIssue(id, { issue: updates })
      );
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Refresh the issues list
      await refreshData();
      
      // Show success message
      setSuccessMessage('Issues updated successfully');
    } catch (err) {
      console.error('Error updating issues:', err);
      alert('Failed to update some issues. Please try again.');
    } finally {
      setLoadingAction(false);
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

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
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

  // Get epic value from custom fields
  const getEpicValue = (issue: any) => {
    const epicField = issue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID);
    const epicId = epicField?.value;
    
    // If no epic ID, return default value
    if (!epicId) return '-';

    // Find the epic by ID in the epics array
    const epic = epics.find(e => e.id === epicId);
    return epic ? epic.name : '-';
  };

  // Get unique epics from issues
  const getUniqueEpics = () => {
    const uniqueEpics = new Set<string>();
    
    issues.forEach(issue => {
      const epicValue = getEpicValue(issue);
      if (epicValue !== '-') {
        uniqueEpics.add(epicValue);
      }
    });
    
    return Array.from(uniqueEpics).sort();
  };

  // Get sprint value from custom fields
  const getSprintValue = (issue: any) => {
    const sprintField = issue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID);
    const sprintId = sprintField?.value;
    
    // If no sprint ID, return default value
    if (!sprintId) return '-';

    // Find the sprint by ID in the sprints array
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : '-';
  };

  // Get unique sprints from issues
  const getUniqueSprints = () => {
    const sprints = new Set<string>();
    
    issues.forEach(issue => {
      const sprintValue = getSprintValue(issue);
      if (sprintValue !== '-') {
        sprints.add(sprintValue);
      }
    });
    
    return Array.from(sprints).sort();
  };

  const onStatusChange = async (issueId: any, newStatusId: any) => {
    await updateIssue(issueId, { issue: { status_id: newStatusId } });
    await refreshData();
  }

  // Reset all filters (also clear localStorage)
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDateFilter('all');
    setEpicFilter('all');
    setSprintFilter('all');
    localStorage.removeItem('issues_searchQuery');
    localStorage.removeItem('issues_statusFilter');
    localStorage.removeItem('issues_projectFilter');
    localStorage.removeItem('issues_priorityFilter');
    localStorage.removeItem('issues_assigneeFilter');
    localStorage.removeItem('issues_dateFilter');
    localStorage.removeItem('issues_epicFilter');
    localStorage.removeItem('issues_sprintFilter');
  };

  // Handle filter change
  const handleFilterChange = () => {
    // No-op as we're filtering client-side
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
      {/* Success Notification */}
      {successMessage && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

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
            onClick={() => setIsCreatingIssue(true)}
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
        getStatusColorClass={getStatusColorClass}
        getPriorityColorClass={getPriorityColorClass}
        formatDate={formatDate}
        handleDeleteIssue={handleDeleteIssue}
        handleEditIssue={setSelectedIssue}
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
        epicFilter={epicFilter}
        setEpicFilter={setEpicFilter}
        sprintFilter={sprintFilter}
        setSprintFilter={setSprintFilter}
        projects={projects}
        issueStatuses={issueStatuses}
        priorities={priorities}
        users={users}
        getUniqueAssignees={getUniqueAssignees}
        resetFilters={resetFilters}
        handleFilterChange={handleFilterChange}
        onViewIssue={setViewingIssueId}
        onBulkUpdate={handleBulkUpdate}
        handleBulkDelete={handleBulkDelete}
        getEpicValue={getEpicValue}
        getUniqueEpics={getUniqueEpics}
        onStatusChange={onStatusChange}
        getSprintValue={getSprintValue}
        getUniqueSprints={getUniqueSprints}
      />

      {/* Create Issue Modal */}
      {isCreatingIssue && (
        <CreateIssueModal
          newIssue={newIssue}
          setNewIssue={setNewIssue}
          handleCreateIssue={async () => {
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
                assigned_to_id: '',
                custom_fields: [
                  { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value: '' }
                ]
              });
              
              setIsCreatingIssue(false);
            } catch (err: any) {
              console.error('Error creating issue:', err);
              alert('Failed to create issue. Please try again.');
            } finally {
              setLoadingAction(false);
            }
          }}
          setIsCreatingIssue={setIsCreatingIssue}
          loadingAction={loadingAction}
          projects={projects}
          users={users}
        />
      )}

      {/* Bulk Create Issues Modal */}
      {isBulkCreatingIssues && (
        <BulkCreateIssueModal
          projectId={projectFilter !== 'all' ? parseInt(projectFilter) : (projects.length > 0 ? projects[0].id : 0)}
          handleBulkCreateIssues={async (issues) => {
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
          }}
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
            if (!isConnected || !selectedIssue || !selectedIssue.subject) return;
            
            setLoadingAction(true);
            
            try {
              const issueData = {
                issue: {
                  subject: selectedIssue.subject,
                  description: selectedIssue.description,
                  status_id: selectedIssue.status.id,
                  priority_id: selectedIssue.priority.id,
                  assigned_to_id: selectedIssue.assigned_to?.id || null,
                  uploads: selectedIssue.uploads,
                  custom_fields: selectedIssue.custom_fields
                }
              };
              
              await updateIssue(selectedIssue.id, issueData);
              await refreshData();
              setSelectedIssue(null);
              
              // Show success message
              setSuccessMessage('Issue updated successfully');
            } catch (err) {
              console.error('Error updating issue:', err);
              alert('Failed to update issue. Please try again.');
            } finally {
              setLoadingAction(false);
            }
          }}
          loadingAction={loadingAction}
          users={users}
          onCancel={() => setSelectedIssue(null)}
        />
      )}

      {/* Issue Details Modal */}
      {viewingIssueId && (
        <IssueDetailsModal
          issueId={viewingIssueId}
          onClose={() => setViewingIssueId(null)}
        />
      )}
    </div>
  );
};
