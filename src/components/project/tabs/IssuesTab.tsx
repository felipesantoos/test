import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { IssueList } from '../../issue/IssueList';
import { BulkCreateIssueModal } from '../../issue/modals/BulkCreateIssueModal';
import { IssueDetailsModal } from '../../issue/modals/IssueDetailsModal';

interface IssuesTabProps {
  projectId: number;
  issues: any[];
  loading: boolean;
  getStatusColorClass: (status: string) => string;
  getPriorityColorClass: (priority: string) => string;
  formatDate: (date: string) => string;
  handleDeleteIssue: (id: number) => void;
  setSelectedIssue: (issue: any) => void;
  setIsCreatingIssue: (isCreating: boolean) => void;
  trackers: any[];
  statuses: any[];
  priorities: any[];
  handleBulkCreateIssues: (issues: any[]) => Promise<{success: any[], failed: any[]}>;
}

export const IssuesTab = ({ 
  projectId, 
  issues, 
  loading, 
  getStatusColorClass, 
  getPriorityColorClass, 
  formatDate,
  handleDeleteIssue,
  setSelectedIssue,
  setIsCreatingIssue,
  trackers,
  statuses,
  priorities,
  handleBulkCreateIssues
}: IssuesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isBulkCreatingIssues, setIsBulkCreatingIssues] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // State for viewing issue details
  const [viewingIssueId, setViewingIssueId] = useState<number | null>(null);
  
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

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDateFilter('all');
  };

  // Handle filter change (dummy function as we're filtering client-side)
  const handleFilterChange = () => {
    // No-op as we're filtering client-side in the IssueList component
  };

  // Filter issues based on search query and filters
  const filteredIssues = issues.filter(issue => {
    // Apply search filter
    if (searchQuery && !issue.subject.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && issue.status.name.toLowerCase() !== statusFilter) {
      return false;
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all' && issue.priority.id.toString() !== priorityFilter) {
      return false;
    }
    
    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && issue.assigned_to) {
        return false;
      } else if (assigneeFilter !== 'unassigned' && 
                (!issue.assigned_to || issue.assigned_to.id.toString() !== assigneeFilter)) {
        return false;
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
      
      if (new Date(issue.updated_on) <= compareDate) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Project Issues</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBulkCreatingIssues(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Upload size={16} className="mr-2" />
            Bulk Create
          </button>
          <button
            onClick={() => setIsCreatingIssue(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus size={16} className="mr-2" />
            Create Issue
          </button>
        </div>
      </div>
      
      {/* Issue List Component */}
      <IssueList
        issues={filteredIssues}
        loading={loading}
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
        issueStatuses={statuses}
        priorities={priorities}
        getUniqueAssignees={getUniqueAssignees}
        resetFilters={resetFilters}
        handleFilterChange={handleFilterChange}
        onViewIssue={setViewingIssueId}
      />

      {/* Bulk Create Issues Modal */}
      {isBulkCreatingIssues && (
        <BulkCreateIssueModal
          projectId={projectId}
          handleBulkCreateIssues={handleBulkCreateIssues}
          setBulkCreatingIssues={setIsBulkCreatingIssues}
          loadingAction={loadingAction}
          trackers={trackers}
          statuses={statuses}
          priorities={priorities}
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