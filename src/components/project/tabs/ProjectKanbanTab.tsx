import React, { useState, useEffect } from 'react';
import { useApi } from '../../../context/ApiContext';
import { Link } from 'react-router-dom';
import { AlertCircle, Filter, RefreshCw, Plus, Eye, Edit } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { KanbanColumn } from '../../kanban/KanbanColumn';
import { KanbanCard } from '../../kanban/KanbanCard';
import { CreateIssueModal } from '../modals/CreateIssueModal';
import { EditIssueModal } from '../modals/EditIssueModal';
import { IssueDetailsModal } from '../../issue/modals/IssueDetailsModal';
import { KanbanFilters } from '../../kanban/KanbanFilters';

interface ProjectKanbanTabProps {
  projectId: number;
  issues: any[];
  loading: boolean;
  updateIssue: (id: number, issueData: any) => Promise<boolean>;
  createIssue: (issueData: any) => Promise<any>;
  refreshData: () => Promise<void>;
}

export const ProjectKanbanTab: React.FC<ProjectKanbanTabProps> = ({
  projectId,
  issues,
  loading,
  updateIssue,
  createIssue,
  refreshData
}) => {
  const { issueStatuses, priorities, users } = useApi();
  
  // State for issues by status
  const [issuesByStatus, setIssuesByStatus] = useState<Record<string, any[]>>({});
  
  // State for drag and drop
  const [activeIssue, setActiveIssue] = useState<any>(null);
  
  // State for creating a new issue
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({
    subject: '',
    description: '',
    project_id: projectId,
    status_id: 1,
    priority_id: 2,
    assigned_to_id: ''
  });
  
  // State for editing an issue
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // State for viewing issue details
  const [viewingIssueId, setViewingIssueId] = useState<number | null>(null);

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    assignee: 'all',
    priority: [] as string[],
    tracker: 'all',
    status: [] as string[],
    dateFrom: '',
    dateTo: ''
  });

  // State for filtered issues
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Apply filters to issues
  useEffect(() => {
    if (issues.length > 0) {
      let filtered = [...issues];
      
      // Filter by search query
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(issue => 
          issue.subject.toLowerCase().includes(searchLower) || 
          issue.id.toString().includes(searchLower)
        );
      }
      
      // Filter by assignee
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned') {
          filtered = filtered.filter(issue => !issue.assigned_to);
        } else {
          filtered = filtered.filter(issue => 
            issue.assigned_to && issue.assigned_to.id.toString() === filters.assignee
          );
        }
      }
      
      // Filter by priority
      if (filters.priority.length > 0) {
        filtered = filtered.filter(issue => 
          filters.priority.includes(issue.priority.id.toString())
        );
      }
      
      // Filter by tracker
      if (filters.tracker !== 'all') {
        filtered = filtered.filter(issue => 
          issue.tracker.id.toString() === filters.tracker
        );
      }
      
      // Filter by date range
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filtered = filtered.filter(issue => 
          new Date(issue.updated_on) >= fromDate
        );
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(issue => 
          new Date(issue.updated_on) <= toDate
        );
      }
      
      setFilteredIssues(filtered);
    } else {
      setFilteredIssues([]);
    }
  }, [issues, filters]);

  // Group issues by status when filtered issues or statuses change
  useEffect(() => {
    if (filteredIssues.length > 0 && issueStatuses.length > 0) {
      // Group issues by status
      const groupedIssues: Record<string, any[]> = {};
      
      // Initialize with all statuses from the API
      issueStatuses.forEach(status => {
        // Only include statuses that are not filtered out
        if (filters.status.length === 0 || filters.status.includes(status.id.toString())) {
          groupedIssues[status.id.toString()] = [];
        }
      });
      
      // Add issues to their respective status groups
      filteredIssues.forEach(issue => {
        const statusId = issue.status.id.toString();
        if (groupedIssues[statusId] !== undefined) {
          groupedIssues[statusId].push(issue);
        }
      });
      
      setIssuesByStatus(groupedIssues);
    } else {
      // Initialize with all statuses but empty arrays
      const emptyGroups: Record<string, any[]> = {};
      
      if (issueStatuses.length > 0) {
        issueStatuses.forEach(status => {
          // Only include statuses that are not filtered out
          if (filters.status.length === 0 || filters.status.includes(status.id.toString())) {
            emptyGroups[status.id.toString()] = [];
          }
        });
      }
      
      setIssuesByStatus(emptyGroups);
    }
  }, [filteredIssues, issueStatuses, filters.status]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issueId = active.id.toString().split('-')[1]; // Extract issue ID from draggable ID
    const issue = issues.find(i => i.id.toString() === issueId);
    setActiveIssue(issue);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveIssue(null);
      return;
    }
    
    // Extract issue ID from draggable ID
    const issueId = active.id.toString().split('-')[1];
    
    // Get the new status ID from the column ID
    const newStatusId = over.id.toString();
    
    // Find the issue
    const issue = issues.find(i => i.id.toString() === issueId);
    
    if (!issue) {
      setActiveIssue(null);
      return;
    }
    
    // If the status hasn't changed, do nothing
    if (issue.status.id.toString() === newStatusId) {
      setActiveIssue(null);
      return;
    }
    
    // Update local state immediately for a responsive UI
    const updatedIssuesByStatus = { ...issuesByStatus };
    
    // Remove issue from old status
    const oldStatusId = issue.status.id.toString();
    if (updatedIssuesByStatus[oldStatusId]) {
      updatedIssuesByStatus[oldStatusId] = updatedIssuesByStatus[oldStatusId].filter(
        i => i.id !== issue.id
      );
    }
    
    // Create a copy of the issue with updated status
    const updatedIssue = { 
      ...issue, 
      status: { 
        ...issue.status, 
        id: parseInt(newStatusId) 
      } 
    };
    
    // Add issue to new status
    if (!updatedIssuesByStatus[newStatusId]) {
      updatedIssuesByStatus[newStatusId] = [];
    }
    updatedIssuesByStatus[newStatusId] = [...updatedIssuesByStatus[newStatusId], updatedIssue];
    
    // Update state
    setIssuesByStatus(updatedIssuesByStatus);
    setActiveIssue(null);
    
    // Now update on the server
    setLoadingAction(true);
    
    try {
      // Update issue status
      const issueData = {
        issue: {
          status_id: parseInt(newStatusId)
        }
      };
      
      await updateIssue(parseInt(issueId), issueData);
      
      // Refresh data
      await refreshData();
    } catch (err) {
      console.error('Error updating issue status:', err);
      
      // Revert the UI change if the server update fails
      setIssuesByStatus(prevState => {
        const revertedState = { ...prevState };
        
        // Remove issue from new status
        if (revertedState[newStatusId]) {
          revertedState[newStatusId] = revertedState[newStatusId].filter(
            i => i.id !== issue.id
          );
        }
        
        // Add issue back to old status
        if (!revertedState[oldStatusId]) {
          revertedState[oldStatusId] = [];
        }
        revertedState[oldStatusId] = [...revertedState[oldStatusId], issue];
        
        return revertedState;
      });
      
      // Show error to user
      alert('Failed to update issue status. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle creating a new issue
  const handleCreateIssue = async () => {
    if (!newIssue.subject) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: newIssue
      };
      
      await createIssue(issueData);
      
      // Refresh data
      await refreshData();
      
      // Reset form
      setNewIssue({
        subject: '',
        description: '',
        project_id: projectId,
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

  // Handle updating an issue
  const handleUpdateIssue = async () => {
    if (!selectedIssue || !selectedIssue.subject) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: {
          subject: selectedIssue.subject,
          description: selectedIssue.description,
          status_id: selectedIssue.status.id,
          priority_id: selectedIssue.priority.id,
          assigned_to_id: selectedIssue.assigned_to?.id || null,
          uploads: selectedIssue.uploads
        }
      };
      
      await updateIssue(selectedIssue.id, issueData);
      
      // Refresh data
      await refreshData();
      
      setSelectedIssue(null);
    } catch (err: any) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    // The filtering is handled by the useEffect
    // This function is just a trigger for the filter application
    // We can use it to save filters to localStorage if needed
    saveFiltersToLocalStorage();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      assignee: 'all',
      priority: [],
      tracker: 'all',
      status: [],
      dateFrom: '',
      dateTo: ''
    });
    
    // Clear localStorage filters
    localStorage.removeItem('kanbanFilters');
  };

  // Save filters to localStorage
  const saveFiltersToLocalStorage = () => {
    localStorage.setItem('kanbanFilters', JSON.stringify(filters));
  };

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('kanbanFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFilters(parsedFilters);
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Project Kanban Board</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => refreshData()}
            disabled={loading || loadingAction}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${(loading || loadingAction) ? 'animate-spin' : ''}`} />
            {loading || loadingAction ? 'Refreshing...' : 'Refresh'}
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

      {/* Kanban Filters Component */}
      <KanbanFilters
        selectedProject={projectId.toString()}
        setSelectedProject={() => {}} // No-op since we're in project context
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />

      {/* Kanban Board */}
      {loading || loadingAction ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4 min-w-max">
              {issueStatuses.map(status => (
                // Only render columns that are not filtered out
                (filters.status.length === 0 || filters.status.includes(status.id.toString())) && (
                  <KanbanColumn 
                    key={status.id}
                    id={status.id.toString()}
                    title={status.name}
                    issues={issuesByStatus[status.id.toString()] || []}
                    getPriorityColor={getPriorityColor}
                    onEditIssue={setSelectedIssue}
                    onViewIssue={setViewingIssueId}
                  />
                )
              ))}
            </div>
            
            <DragOverlay>
              {activeIssue ? (
                <div className="w-[300px]">
                  <KanbanCard 
                    issue={activeIssue}
                    getPriorityColor={getPriorityColor}
                    onEditIssue={() => {}}
                    onViewIssue={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Create Issue Modal */}
      {isCreatingIssue && (
        <CreateIssueModal
          newIssue={newIssue}
          setNewIssue={setNewIssue}
          handleCreateIssue={handleCreateIssue}
          setIsCreatingIssue={setIsCreatingIssue}
          loadingAction={loadingAction}
          users={users}
        />
      )}

      {/* Edit Issue Modal */}
      {selectedIssue && (
        <EditIssueModal
          selectedIssue={selectedIssue}
          setSelectedIssue={setSelectedIssue}
          handleUpdateIssue={handleUpdateIssue}
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