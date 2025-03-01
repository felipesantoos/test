import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
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
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { CreateIssueModal } from '../components/project/modals/CreateIssueModal';
import { EditIssueModal } from '../components/project/modals/EditIssueModal';

export const KanbanBoard = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    projects, 
    issues, 
    issueStatuses,
    priorities,
    refreshData, 
    fetchIssues,
    updateIssue,
    createIssue
  } = useApi();

  // State for selected project
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // State for issues by status
  const [issuesByStatus, setIssuesByStatus] = useState<Record<string, any[]>>({});
  
  // State for loading
  const [loading, setLoading] = useState(false);
  
  // State for drag and drop
  const [activeIssue, setActiveIssue] = useState<any>(null);
  
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
  
  // State for editing an issue
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

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

  // Load issues on initial render
  useEffect(() => {
    if (isConnected && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  // Update new issue project when selected project changes
  useEffect(() => {
    if (selectedProject !== 'all') {
      setNewIssue(prev => ({
        ...prev,
        project_id: parseInt(selectedProject)
      }));
    } else if (projects.length > 0) {
      setNewIssue(prev => ({
        ...prev,
        project_id: projects[0].id
      }));
    }
  }, [selectedProject, projects]);

  // Group issues by status when issues or selected project changes
  useEffect(() => {
    if (issues.length > 0) {
      let filteredIssues = [...issues];
      
      // Filter by selected project if not "all"
      if (selectedProject !== 'all') {
        filteredIssues = filteredIssues.filter(issue => 
          issue.project.id.toString() === selectedProject
        );
      }
      
      // Group issues by status
      const groupedIssues: Record<string, any[]> = {};
      
      // Initialize with all statuses from the API
      issueStatuses.forEach(status => {
        groupedIssues[status.id] = [];
      });
      
      // Add issues to their respective status groups
      filteredIssues.forEach(issue => {
        const statusId = issue.status.id;
        if (!groupedIssues[statusId]) {
          groupedIssues[statusId] = [];
        }
        groupedIssues[statusId].push(issue);
      });
      
      setIssuesByStatus(groupedIssues);
    }
  }, [issues, selectedProject, issueStatuses]);

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
    
    if (!over) return;
    
    // Extract issue ID and status ID from draggable IDs
    const issueId = active.id.toString().split('-')[1];
    const newStatusId = over.id.toString();
    
    // Find the issue
    const issue = issues.find(i => i.id.toString() === issueId);
    
    if (!issue || issue.status.id.toString() === newStatusId) {
      setActiveIssue(null);
      return;
    }
    
    setLoading(true);
    
    try {
      // Update issue status
      const issueData = {
        issue: {
          status_id: parseInt(newStatusId)
        }
      };
      
      await updateIssue(parseInt(issueId), issueData);
      
      // Refresh issues
      await refreshData();
      
      // Update local state for immediate UI update
      const updatedIssuesByStatus = { ...issuesByStatus };
      
      // Remove issue from old status
      const oldStatusId = issue.status.id;
      updatedIssuesByStatus[oldStatusId] = updatedIssuesByStatus[oldStatusId].filter(
        i => i.id !== issue.id
      );
      
      // Add issue to new status
      const updatedIssue = { ...issue, status: { ...issue.status, id: parseInt(newStatusId) } };
      
      // Ensure the array exists before trying to spread it
      if (!updatedIssuesByStatus[newStatusId]) {
        updatedIssuesByStatus[newStatusId] = [];
      }
      
      updatedIssuesByStatus[newStatusId] = [...updatedIssuesByStatus[newStatusId], updatedIssue];
      
      setIssuesByStatus(updatedIssuesByStatus);
    } catch (err) {
      console.error('Error updating issue status:', err);
    } finally {
      setLoading(false);
      setActiveIssue(null);
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
        project_id: selectedProject !== 'all' ? parseInt(selectedProject) : (projects.length > 0 ? projects[0].id : 0),
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
    if (!isConnected || !selectedIssue || !selectedIssue.subject) return;
    
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
      
      // Refresh issues
      await refreshData();
      
      setSelectedIssue(null);
    } catch (err: any) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue. Please try again.');
    } finally {
      setLoadingAction(false);
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
        <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        <div className="flex gap-2">
          <button 
            onClick={refreshData}
            disabled={isLoading || loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${(isLoading || loading) ? 'animate-spin' : ''}`} />
            {isLoading || loading ? 'Refreshing...' : 'Refresh'}
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

      {/* Project Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <label htmlFor="projectFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              id="projectFilter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading || loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
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
                <KanbanColumn 
                  key={status.id}
                  id={status.id.toString()}
                  title={status.name}
                  issues={issuesByStatus[status.id] || []}
                  getPriorityColor={getPriorityColor}
                  onEditIssue={setSelectedIssue}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeIssue ? (
                <div className="w-[300px]">
                  <KanbanCard 
                    issue={activeIssue}
                    getPriorityColor={getPriorityColor}
                    onEditIssue={() => {}}
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
          projects={projects}
        />
      )}

      {/* Edit Issue Modal */}
      {selectedIssue && (
        <EditIssueModal
          selectedIssue={selectedIssue}
          setSelectedIssue={setSelectedIssue}
          handleUpdateIssue={handleUpdateIssue}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};