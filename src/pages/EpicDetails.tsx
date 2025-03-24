import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { AlertCircle, Calendar, FolderKanban, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { EditEpicModal } from '../components/epic/EditEpicModal';
import { DeleteEpicModal } from '../components/epic/DeleteEpicModal';

export const EpicDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    isLoading, 
    error, 
    fetchEpicById, 
    updateEpic, 
    deleteEpic,
    fetchIssues,
    fetchProjectDetails
  } = useApi();

  // State
  const [epic, setEpic] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<any>(null);
  const [epicToDelete, setEpicToDelete] = useState<any>(null);

  // Load epic data and project details
  useEffect(() => {
    const loadEpicData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Fetch epic details
        const epicData = await fetchEpicById(id);
        if (!epicData) {
          throw new Error('Epic not found');
        }
        setEpic(epicData);
        
        // Fetch project details
        if (epicData.project_id) {
          const projectData = await fetchProjectDetails(epicData.project_id);
          setProject(projectData);
        }
        
        // Fetch all issues
        const allIssues = await fetchIssues();
        
        // Filter issues that have this epic ID in their custom fields
        const epicIssues = allIssues.filter(issue => {
          const epicField = issue.custom_fields?.find(
            (field: any) => field.id == import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID
          );
          return epicField?.value === id; // Compare with epic ID instead of name
        });
        
        setIssues(epicIssues);
      } catch (err: any) {
        console.error('Error loading epic data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadEpicData();
  }, [id, fetchEpicById, fetchIssues, fetchProjectDetails]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  // Handle updating an epic
  const handleUpdateEpic = async (epicData: any) => {
    if (!epic) return;
    
    setLoadingAction(true);
    
    try {
      const updatedEpic = await updateEpic(epic.id, epicData);
      setEpic(updatedEpic);
      
      // Fetch updated project details if project changed
      if (updatedEpic.project_id !== epic.project_id) {
        const projectData = await fetchProjectDetails(updatedEpic.project_id);
        setProject(projectData);
      }
      
      setSelectedEpic(null);
    } catch (err: any) {
      console.error('Error updating epic:', err);
      alert(err.message || 'Failed to update epic');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting an epic
  const handleDeleteEpic = async () => {
    if (!epic) return;
    
    setLoadingAction(true);
    
    try {
      await deleteEpic(epic.id);
      // Navigate back to epics list
      window.location.href = '/epics';
    } catch (err: any) {
      console.error('Error deleting epic:', err);
      alert(err.message || 'Failed to delete epic');
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

  if (error || !epic) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Epic</h2>
        <p className="text-gray-600 mb-4">{error || 'Epic not found'}</p>
        <Link to="/epics" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Back to Epics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Epic Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{epic.name}</h1>
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
                Created {formatDate(epic.created_at)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedEpic(epic)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Epic
            </button>
            <button
              onClick={() => setEpicToDelete(epic)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Epic
            </button>
          </div>
        </div>
      </div>

      {/* Epic Issues */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Epic Issues</h3>
        </div>
        
        {issues.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No issues assigned to this epic</p>
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

      {/* Edit Epic Modal */}
      {selectedEpic && (
        <EditEpicModal
          epic={selectedEpic}
          onSubmit={handleUpdateEpic}
          onClose={() => setSelectedEpic(null)}
          loading={loadingAction}
        />
      )}

      {/* Delete Epic Modal */}
      {epicToDelete && (
        <DeleteEpicModal
          epic={epicToDelete}
          onConfirm={handleDeleteEpic}
          onClose={() => setEpicToDelete(null)}
          loading={loadingAction}
        />
      )}
    </div>
  );
};
