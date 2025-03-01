import React, { useState, useEffect } from 'react';
import { useApi } from '../../../context/ApiContext';
import { AlertCircle, Trophy, Clock, CheckSquare, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, parseISO } from 'date-fns';

interface MemberPerformanceTabProps {
  projectId: number;
}

export const MemberPerformanceTab: React.FC<MemberPerformanceTabProps> = ({ projectId }) => {
  const { fetchIssues, fetchProjectMemberships } = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberPerformance, setMemberPerformance] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  
  // Load project issues and calculate member performance
  useEffect(() => {
    const loadMemberPerformance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all issues for this project
        const issues = await fetchIssues({ 
          projectId, 
          include: 'journals,relations,children'
        });
        
        // Fetch project memberships to get all members
        const memberships = await fetchProjectMemberships(projectId);
        
        // Create a map of members
        const membersMap = new Map();
        
        // Initialize with all project members
        memberships.forEach((membership: any) => {
          if (membership.user) {
            membersMap.set(membership.user.id, {
              id: membership.user.id,
              name: membership.user.name,
              assignedIssues: 0,
              resolvedIssues: 0,
              totalUpdates: 0,
              avgResolutionTime: 0,
              resolutionTimes: [],
              lastActivity: null
            });
          }
        });
        
        // Process issues to calculate performance metrics
        issues.forEach(issue => {
          // Skip issues without an assignee
          if (!issue.assigned_to) return;
          
          const assigneeId = issue.assigned_to.id;
          
          // Initialize member if not already in the map
          if (!membersMap.has(assigneeId)) {
            membersMap.set(assigneeId, {
              id: assigneeId,
              name: issue.assigned_to.name,
              assignedIssues: 0,
              resolvedIssues: 0,
              totalUpdates: 0,
              avgResolutionTime: 0,
              resolutionTimes: [],
              lastActivity: null
            });
          }
          
          const member = membersMap.get(assigneeId); priority: string) => {
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
          assigned_to_id: selectedIssue.assigned_to?.id || null
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

  // Handle updating a project
  const handleUpdateProject = async () => {
    if (!isConnected || !editedProject || !editedProject.name || !editedProject.identifier) return;
    
    setLoadingAction(true);
    
    try {
      const projectData = {
        project: {
          name: editedProject.name,
          identifier: editedProject.identifier,
          description: editedProject.description,
          is_public: editedProject.is_public
        }
      };
      
      await updateProject(parseInt(id || '0'), projectData);
      
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

  // Handle deleting an issue
  const handleDeleteIssue = async (issueId: number) => {
    if (!isConnected) return;
    
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }
    
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
      {/* Project Header */}
      <ProjectHeader 
        project={project} 
        projectProgress={projectProgress} 
        issueStats={issueStats} 
        formatDate={formatDate} 
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
            handleBulkCreateIssues={handleBulkCreateIssues}
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

        {/* Figma Integration Tab */}
        {activeTab === 'figma' && (
          <FigmaIntegrationTab 
            projectId={parseInt(id || '0')}
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
        />
      )}

      {selectedIssue && (
        <EditIssueModal 
          selectedIssue={selectedIssue}
          setSelectedIssue={setSelectedIssue}
          handleUpdateIssue={handleUpdateIssue}
          loadingAction={loadingAction}
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