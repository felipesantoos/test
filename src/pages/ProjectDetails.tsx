import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { AlertCircle } from 'lucide-react';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { ProjectTabs } from '../components/project/ProjectTabs';
import { OverviewTab } from '../components/project/tabs/OverviewTab';
import { IssuesTab } from '../components/project/tabs/IssuesTab';
import { AnalyticsTab } from '../components/project/tabs/AnalyticsTab';
import { MembersTab } from '../components/project/tabs/MembersTab';
import { SettingsTab } from '../components/project/tabs/SettingsTab';
import { GanttChartTab } from '../components/project/tabs/GanttChartTab';
import { MemberPerformanceTab } from '../components/project/tabs/MemberPerformanceTab';
import { CreateIssueModal } from '../components/project/modals/CreateIssueModal';
import { EditIssueModal } from '../components/project/modals/EditIssueModal';
import { DeleteConfirmModal } from '../components/project/modals/DeleteConfirmModal';
import { ArchiveConfirmModal } from '../components/project/modals/ArchiveConfirmModal';
import { EditProjectModal } from '../components/project/modals/EditProjectModal';
import { format, parseISO, subDays, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { GitHubIntegrationTab } from '../components/project/tabs/GitHubIntegrationTab';
import { SuccessNotification } from '../components/shared/SuccessNotification';
import { ProjectKanbanTab } from '../components/project/tabs/ProjectKanbanTab';

export const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    isConnected, 
    fetchProjectDetails, 
    fetchProjectMemberships,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    archiveProject,
    unarchiveProject,
    deleteProject,
    updateProject,
    issueStatuses,
    priorities,
    trackers,
    users,
    sprints,
    refreshData
  } = useApi();

  // State
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [projectProgress, setProjectProgress] = useState(0);
  const [issueStats, setIssueStats] = useState({ total: 0, open: 0, closed: 0 });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Add this near the top of the component with other state declarations
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  // Modals state
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  // New issue form state
  const [newIssue, setNewIssue] = useState({
    subject: '',
    description: '',
    project_id: parseInt(id || '0'),
    status_id: 1,
    priority_id: 2,
    assigned_to_id: ''
  });
  
  // Chart data
  const [issueStatusData, setIssueStatusData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [issuesOverTimeData, setIssuesOverTimeData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Add this useEffect near the top of the component
  useEffect(() => {
    if (isConnected && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
      refreshData();
    }
  }, [isConnected, hasLoadedInitialData, refreshData]);

  // Load project details and issues
  useEffect(() => {
    if (!isConnected || !id) return;
    
    const loadProjectData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch project details
        const projectData = await fetchProjectDetails(parseInt(id));
        if (!projectData) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        // Get project memberships
        const projectMembershipData = await fetchProjectMemberships(parseInt(id));
        projectData.memberships = projectMembershipData;
        
        setProject(projectData);
        setEditedProject({
          name: projectData.name,
          identifier: projectData.identifier,
          description: projectData.description || '',
          is_public: projectData.is_public
        });
        
        // Fetch issues for this project
        const projectIssues = await fetchIssues({ projectId: id });
        setIssues(projectIssues);
        
        // Calculate project progress and stats
        const totalIssues = projectIssues.length;
        const closedIssues = projectIssues.filter(issue => 
          issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
        ).length;
        const openIssues = totalIssues - closedIssues;
        
        setIssueStats({
          total: totalIssues,
          open: openIssues,
          closed: closedIssues
        });
        
        // Calculate progress percentage
        const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
        setProjectProgress(progress);
        
        // Process data for charts
        processChartData(projectIssues);
        
        // Process recent activity
        const activity = projectIssues
          .sort((a, b) => new Date(b.updated_on).getTime() - new Date(a.updated_on).getTime())
          .slice(0, 5)
          .map(issue => ({
            id: issue.id,
            title: issue.subject,
            status: issue.status.name,
            date: formatRelativeTime(new Date(issue.updated_on))
          }));
        
        setRecentActivity(activity);
      } catch (err: any) {
        console.error('Error loading project data:', err);
        setError('Failed to load project data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjectData();
  }, [id, isConnected, fetchProjectDetails, fetchProjectMemberships, fetchIssues]);

  // Process chart data
  const processChartData = (projectIssues: any[]) => {
    // Process status data for pie chart
    const statusCounts: Record<string, number> = {};
    const statusColors: Record<string, string> = {
      'New': '#3B82F6',
      'In Progress': '#FBBF24',
      'Resolved': '#10B981',
      'Feedback': '#8B5CF6',
      'Closed': '#6B7280',
      'Rejected': '#EF4444'
    };
    
    projectIssues.forEach(issue => {
      const statusName = issue.status.name;
      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
    });
    
    // Filter out statuses with zero issues and convert to array format for chart
    const statusData = Object.entries(statusCounts)
      .filter(([_, value]) => value > 0) // Only include statuses with at least one issue
      .map(([name, value]) => ({
        name,
        value,
        color: statusColors[name as keyof typeof statusColors] || '#9CA3AF'
      }));
    
    setIssueStatusData(statusData);
    
    // Process priority data for bar chart
    const priorityCounts: Record<string, number> = {};
    
    projectIssues.forEach(issue => {
      const priorityName = issue.priority.name;
      priorityCounts[priorityName] = (priorityCounts[priorityName] || 0) + 1;
    });
    
    // Filter out priorities with zero issues and convert to array format for chart
    const priorityData = Object.entries(priorityCounts)
      .filter(([_, count]) => count > 0) // Only include priorities with at least one issue
      .map(([name, count]) => ({
        name,
        count
      }));
    
    setPriorityData(priorityData);
    
    // Generate issues over time data (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    // Create an array of dates for the last 30 days
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, 29 - i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    
    // Initialize data for each date
    const timeData = dates.map(date => ({
      date,
      open: 0,
      closed: 0
    }));
    
    // For each date, count how many issues were open and closed on that date
    timeData.forEach((dataPoint, dateIndex) => {
      const currentDate = parseISO(dataPoint.date);
      const currentDateStart = startOfDay(currentDate);
      const nextDate = dateIndex < timeData.length - 1 ? parseISO(timeData[dateIndex + 1].date) : new Date();
      
      projectIssues.forEach(issue => {
        const createdDate = parseISO(issue.created_on);
        const isClosed = issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected';
        
        // If the issue was created on or before this date
        if (isBefore(createdDate, nextDate) || isEqual(createdDate, nextDate)) {
          if (isClosed) {
            // For closed issues, check when they were closed
            const closedDate = issue.closed_on ? parseISO(issue.closed_on) : parseISO(issue.updated_on);
            
            // If closed after or on this date but before the next date, it was open on this date
            if (isBefore(currentDateStart, closedDate) && (isBefore(closedDate, nextDate) || isEqual(closedDate, nextDate))) {
              dataPoint.closed++;
            }
            // If closed after the next date, it was open on this date
            else if (isAfter(closedDate, nextDate)) {
              dataPoint.open++;
            }
            // If closed before or on this date, it was already closed
            else {
              // Don't count it for this date
            }
          } else {
            // If not closed, it's open on this date
            dataPoint.open++;
          }
        }
      });
    });
    
    setIssuesOverTimeData(timeData);
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Format relative time for activity feed
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else {
      return 'just now';
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
  const getPriorityColorClass = ( priority: string) => {
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

  // Custom label renderer for pie chart to prevent overlap
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={issueStatusData[index]?.color || '#000'} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
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
        const updatedIssues = await fetchIssues({ projectId: id });
        setIssues(updatedIssues);
        
        // Recalculate project progress and stats
        const totalIssues = updatedIssues.length;
        const closedIssues = updatedIssues.filter(issue => 
          issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
        ).length;
        const openIssues = totalIssues - closedIssues;
        
        setIssueStats({
          total: totalIssues,
          open: openIssues,
          closed: closedIssues
        });
        
        // Calculate progress percentage
        const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
        setProjectProgress(progress);
        
        // Process data for charts
        processChartData(updatedIssues);
      }
      
      return { success: successfulIssues, failed: failedIssues };
    } catch (err: any) {
      console.error('Error in bulk issue creation:', err);
      throw new Error('Failed to process bulk issue creation');
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
          assigned_to_id: selectedIssue.assigned_to?.id || null,
          uploads: selectedIssue.uploads,
          custom_fields: selectedIssue.custom_fields
        }
      };
      
      await updateIssue(selectedIssue.id, issueData);
      
      // Refresh issues
      const updatedIssues = await fetchIssues({ projectId: id });
      setIssues(updatedIssues);
      
      // Recalculate project progress and stats
      const totalIssues = updatedIssues.length;
      const closedIssues = updatedIssues.filter(issue => 
        issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
      ).length;
      const openIssues = totalIssues - closedIssues;
      
      setIssueStats({
        total: totalIssues,
        open: openIssues,
        closed: closedIssues
      });
      
      // Calculate progress percentage
      const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
      setProjectProgress(progress);
      
      // Process data for charts
      processChartData(updatedIssues);
      
      setSelectedIssue(null);
    } catch (err: any) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle creating a new issue
  const handleCreateIssue = async () => {
    if (!isConnected || !newIssue.subject) return;
    
    setLoadingAction(true);
    
    try {
      const issueData = {
        issue: {
          ...newIssue,
          project_id: parseInt(id || '0')
        }
      };
      
      await createIssue(issueData);
      
      // Refresh issues
      const updatedIssues = await fetchIssues({ projectId: id });
      setIssues(updatedIssues);
      
      // Recalculate project progress and stats
      const totalIssues = updatedIssues.length;
      const closedIssues = updatedIssues.filter(issue => 
        issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
      ).length;
      const openIssues = totalIssues - closedIssues;
      
      setIssueStats({
        total: totalIssues,
        open: openIssues,
        closed: closedIssues
      });
      
      // Calculate progress percentage
      const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
      setProjectProgress(progress);
      
      // Process data for charts
      processChartData(updatedIssues);
      
      // Reset form
      setNewIssue({
        subject: '',
        description: '',
        project_id: parseInt(id || '0'),
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

  // Handle deleting an issue
  const handleDeleteIssue = async (issueId: number) => {
    if (!isConnected) return;
    
    setLoadingAction(true);
    
    try {
      await deleteIssue(issueId);
      
      // Refresh issues
      const updatedIssues = await fetchIssues({ projectId: id });
      setIssues(updatedIssues);
      
      // Recalculate project progress and stats
      const totalIssues = updatedIssues.length;
      const closedIssues = updatedIssues.filter(issue => 
        issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
      ).length;
      const openIssues = totalIssues - closedIssues;
      
      setIssueStats({
        total: totalIssues,
        open: openIssues,
        closed: closedIssues
      });
      
      // Calculate progress percentage
      const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
      setProjectProgress(progress);
      
      // Process data for charts
      processChartData(updatedIssues);
    } catch (err: any) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle updating a project
  const handleUpdateProject = async () => {
    if (!project || !editedProject) return;
  
    setLoadingAction(true);
  
    try {
      await updateProject(project.id, editedProject);
  
      // Refresh project details
      const updatedProject = await fetchProjectDetails(parseInt(id || '0'));
      setProject(updatedProject);
      setIsEditingProject(false);
    } catch (err: any) {
      console.error('Error updating project:', err);
      alert('Failed to update project. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };  

  // Handle archiving/unarchiving a project
  const handleArchiveProject = async () => {
    if (!isConnected || !project) return;
    
    setLoadingAction(true);
    
    try {
      if (project.status === 9) {
        // Unarchive
        await unarchiveProject(project.id);
      } else {
        // Archive
        await archiveProject(project.id);
      }
      
      // Refresh project details
      const updatedProject = await fetchProjectDetails(parseInt(id || '0'));
      setProject(updatedProject);
      
      setShowArchiveConfirm(false);
    } catch (err: any) {
      console.error('Error archiving/unarchiving project:', err);
      alert('Failed to archive/unarchive project. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async () => {
    if (!isConnected || !project) return;
    
    setLoadingAction(true);
    
    try {
      await deleteProject(project.id);
      
      // Redirect to projects list
      navigate('/projects');
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
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
      
      // Refresh the project data to update the issues list
      const projectIssues = await fetchIssues({ projectId: parseInt(id || '0') });
      setIssues(projectIssues);
      
      // Show success message
      setSuccessMessage('Issues deleted successfully');
    } catch (err) {
      console.error('Error deleting issues:', err);
      alert('Failed to delete some issues. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

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
      
      // Refresh issues
      const updatedIssues = await fetchIssues({ projectId: id });
      setIssues(updatedIssues);
      
      // Recalculate project progress and stats
      const totalIssues = updatedIssues.length;
      const closedIssues = updatedIssues.filter(issue => 
        issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'rejected')
      ).length;
      const openIssues = totalIssues - closedIssues;
      
      setIssueStats({
        total: totalIssues,
        open: openIssues,
        closed: closedIssues
      });
      
      // Calculate progress percentage
      const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
      setProjectProgress(progress);
      
      // Process data for charts
      processChartData(updatedIssues);
      
      // Show success message
      setSuccessMessage('Issues updated successfully');
    } catch (err) {
      console.error('Error updating issues:', err);
      alert('Failed to update some issues. Please try again.');
    } finally {
      setLoadingAction(false);
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

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Project</h2>
        <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
        <Link to="/projects" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Back to Projects
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
      
      {/* Project Header */}
      <ProjectHeader 
        project={project} 
        projectProgress={projectProgress} 
        issueStats={issueStats} 
        formatDate={formatDate}
        memberships={project.memberships}
      />
      
      {/* Tabs */}
      <ProjectTabs activeTab={activeTab} setActiveTab={setActiveTab} project={project} />
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab 
            project={project} 
            issueStats={issueStats} 
            recentActivity={recentActivity} 
            formatDate={formatDate} 
          />
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <IssuesTab 
            projectId={parseInt(id || '0')}
            issues={issues}
            loading={loading}
            getStatusColorClass={getStatusColorClass}
            getPriorityColorClass={getPriorityColorClass}
            formatDate={formatDate}
            handleDeleteIssue={handleDeleteIssue}
            setSelectedIssue={setSelectedIssue}
            setIsCreatingIssue={setIsCreatingIssue}
            trackers={trackers}
            statuses={issueStatuses}
            priorities={priorities}
            users={users}
            sprints={sprints}
            handleBulkCreateIssues={handleBulkCreateIssues}
            onBulkUpdate={handleBulkUpdate}
            handleBulkDelete={handleBulkDelete}
            updateIssue={updateIssue}
            refreshData={refreshData}
          />
        )}

        {/* Kanban Board Tab */}
        {activeTab === 'kanban' && (
          <ProjectKanbanTab 
            projectId={parseInt(id || '0')}
            issues={issues}
            loading={loading}
            updateIssue={updateIssue}
            createIssue={createIssue}
            refreshData={refreshData}
          />
        )}

        {/* Gantt Chart Tab */}
        {activeTab === 'gantt' && (
          <GanttChartTab 
            projectId={parseInt(id || '0')}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            issuesOverTimeData={issuesOverTimeData}
            issueStatusData={issueStatusData}
            priorityData={priorityData}
            renderCustomizedLabel={renderCustomizedLabel}
          />
        )}

        {/* Member Performance Tab */}
        {activeTab === 'performance' && (
          <MemberPerformanceTab 
            projectId={parseInt(id || '0')}
          />
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <MembersTab 
            projectId={parseInt(id || '0')}
          />
        )}

        {/* GitHub Integration Tab */}
        {activeTab === 'github' && (
          <GitHubIntegrationTab 
            projectId={parseInt(id || '0')}
            issues={issues}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab 
            project={project}
            formatDate={formatDate}
            setIsEditingProject={setIsEditingProject}
            setShowArchiveConfirm={setShowArchiveConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
          />
        )}
      </div>

      {/* Modals */}
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

      {isEditingProject && editedProject && (
        <EditProjectModal
          project={project}
          editedProject={editedProject}
          setEditedProject={setEditedProject}
          handleUpdateProject={handleUpdateProject}
          setIsEditingProject={setIsEditingProject}
          loadingAction={loadingAction}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal 
          handleDeleteProject={handleDeleteProject}
          setShowDeleteConfirm={setShowDeleteConfirm}
          loadingAction={loadingAction}
        />
      )}

      {showArchiveConfirm && (
        <ArchiveConfirmModal 
          project={project}
          handleArchiveProject={handleArchiveProject}
          setShowArchiveConfirm={setShowArchiveConfirm}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};
