import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { AlertCircle, Calendar, Clock, ArrowUpRight, CheckSquare, Users, Edit2, Trash2, FolderKanban } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { EditSprintModal } from '../components/sprint/EditSprintModal';
import { DeleteSprintModal } from '../components/sprint/DeleteSprintModal';

export const SprintDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    isLoading, 
    error, 
    fetchSprintById, 
    updateSprint, 
    deleteSprint,
    fetchIssues,
    fetchProjectDetails
  } = useApi();

  // State
  const [sprint, setSprint] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [sprintToDelete, setSprintToDelete] = useState<any>(null);

  // Load sprint data and project details
  useEffect(() => {
    const loadSprintData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Fetch sprint details
        const sprintData = await fetchSprintById(id);
        if (!sprintData) {
          throw new Error('Sprint not found');
        }
        setSprint(sprintData);
        
        // Fetch project details
        if (sprintData.project_id) {
          const projectData = await fetchProjectDetails(sprintData.project_id);
          setProject(projectData);
        }
        
        // Fetch all issues
        const allIssues = await fetchIssues();
        
        // Filter issues that have this sprint ID in their custom fields
        const sprintIssues = allIssues.filter(issue => {
          const sprintField = issue.custom_fields?.find(
            (field: any) => field.id == import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
          );
          return sprintField?.value === id;
        });
        
        setIssues(sprintIssues);
      } catch (err: any) {
        console.error('Error loading sprint data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSprintData();
  }, [id, fetchSprintById, fetchIssues, fetchProjectDetails]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  // Get sprint status
  const getSprintStatus = () => {
    if (!sprint) return null;
    
    const now = new Date();
    const startDate = parseISO(sprint.start_date);
    const endDate = parseISO(sprint.end_date);
    
    if (now > endDate) {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    } else if (now >= startDate && now <= endDate) {
      return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Calculate sprint metrics
  const getSprintMetrics = () => {
    const totalIssues = issues.length;
    const completedIssues = issues.filter(issue => 
      issue.status.name.toLowerCase() === 'closed' || 
      issue.status.name.toLowerCase() === 'resolved'
    ).length;
    const inProgressIssues = issues.filter(issue => 
      issue.status.name.toLowerCase() === 'in progress'
    ).length;
    
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
    
    return {
      totalIssues,
      completedIssues,
      inProgressIssues,
      progress
    };
  };

  // Calculate sprint duration
  const getSprintDuration = () => {
    if (!sprint) return 0;
    return differenceInDays(parseISO(sprint.end_date), parseISO(sprint.start_date));
  };

  // Handle updating a sprint
  const handleUpdateSprint = async (sprintData: any) => {
    if (!sprint) return;
    
    setLoadingAction(true);
    
    try {
      const updatedSprint = await updateSprint(sprint.id, sprintData);
      setSprint(updatedSprint);
      
      // Fetch updated project details if project changed
      if (updatedSprint.project_id !== sprint.project_id) {
        const projectData = await fetchProjectDetails(updatedSprint.project_id);
        setProject(projectData);
      }
      
      setSelectedSprint(null);
    } catch (err: any) {
      console.error('Error updating sprint:', err);
      alert(err.message || 'Failed to update sprint');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting a sprint
  const handleDeleteSprint = async () => {
    if (!sprint) return;
    
    setLoadingAction(true);
    
    try {
      await deleteSprint(sprint.id);
      // Navigate back to sprints list
      window.location.href = '/sprints';
    } catch (err: any) {
      console.error('Error deleting sprint:', err);
      alert(err.message || 'Failed to delete sprint');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Sprint</h2>
        <p className="text-gray-600 mb-4">{error || 'Sprint not found'}</p>
        <Link to="/sprints" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Back to Sprints
        </Link>
      </div>
    );
  }

  const status = getSprintStatus();
  const metrics = getSprintMetrics();
  const duration = getSprintDuration();

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{sprint.name}</h1>
              {status && (
                <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <FolderKanban size={16} className="mr-2" />
                {project ? (
                  <Link to={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-800">
                    {project.name}
                  </Link>
                ) : (
                  'Unknown Project'
                )}
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                {duration} days duration
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSprint(sprint)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Sprint
            </button>
            <button
              onClick={() => setSprintToDelete(sprint)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Sprint Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
            <div className="bg-blue-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{metrics.totalIssues}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12%</span>
            <span className="text-gray-500 ml-1">from last sprint</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{metrics.completedIssues}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">8%</span>
            <span className="text-gray-500 ml-1">completion rate</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
            <div className="bg-yellow-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{metrics.inProgressIssues}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-yellow-500 mr-1" />
            <span className="text-yellow-500 font-medium">5</span>
            <span className="text-gray-500 ml-1">active tasks</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Team Members</h3>
            <div className="bg-purple-100 p-2 rounded-full">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {new Set(issues.map(issue => issue.assigned_to?.id).filter(Boolean)).size}
          </div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-purple-500 mr-1" />
            <span className="text-purple-500 font-medium">Active</span>
            <span className="text-gray-500 ml-1">contributors</span>
          </div>
        </div>
      </div>

      {/* Sprint Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Sprint Progress</h3>
          <span className="text-sm text-gray-500">{metrics.progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${metrics.progress}%` }}
          ></div>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>{metrics.completedIssues} completed</span>
          <span>{metrics.totalIssues - metrics.completedIssues} remaining</span>
        </div>
      </div>

      {/* Sprint Issues */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Sprint Issues</h3>
        </div>
        
        {issues.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No issues assigned to this sprint</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        to={`/issues/${issue.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {issue.subject}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {issue.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.assigned_to ? issue.assigned_to.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(issue.updated_on)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Sprint Modal */}
      {selectedSprint && (
        <EditSprintModal
          sprint={selectedSprint}
          onSubmit={handleUpdateSprint}
          onClose={() => setSelectedSprint(null)}
          loading={loadingAction}
        />
      )}

      {/* Delete Sprint Modal */}
      {sprintToDelete && (
        <DeleteSprintModal
          sprint={sprintToDelete}
          onConfirm={handleDeleteSprint}
          onClose={() => setSprintToDelete(null)}
          loading={loadingAction}
        />
      )}
    </div>
  );
};
