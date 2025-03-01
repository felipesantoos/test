import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Users,
  Shield,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CreateUserModal } from "../components/user/CreateUserModal";
import { EditUserModal } from "../components/user/EditUserModal";
import { DeleteConfirmModal } from "../components/user/DeleteConfirmModal";

export const UserManagement = () => {
  const { isConnected, isLoading, error } = useApi();
  const { isAdmin, redmineUrl } = useAuth();
  const navigate = useNavigate();

  // State for users data
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(10);

  // State for filters
  const [filters, setFilters] = useState({
    status: "all",
    groupId: "",
    name: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // State for modals
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // State for groups
  const [groups, setGroups] = useState<any[]>([]);

  // State to track when to refresh data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Server URL from environment variable
  const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isConnected || !isAdmin || !redmineUrl) return;

      setLoading(true);
      setApiError(null);

      try {
        // Prepare query parameters
        const queryParams = new URLSearchParams({
          redmineUrl: redmineUrl,
          offset: ((currentPage - 1) * usersPerPage).toString(),
          limit: usersPerPage.toString()
        });

        // Add filters if they exist
        if (filters.status !== "all") {
          queryParams.append("status", filters.status);
        }
        if (filters.groupId) {
          queryParams.append("group_id", filters.groupId);
        }
        if (filters.name) {
          queryParams.append("name", filters.name);
        }

        // Fetch users with filters
        const response = await fetch(
          `${SERVER_URL}/api/users?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data.users || []);
        setTotalUsers(data.total_count || 0);

        // Fetch groups for filtering
        try {
          const groupsResponse = await fetch(`${SERVER_URL}/api/groups?redmineUrl=${encodeURIComponent(redmineUrl)}`);
          if (groupsResponse.ok) {
            const groupsData = await groupsResponse.json();
            setGroups(groupsData.groups || []);
          }
        } catch (groupErr) {
          console.warn("Could not fetch groups:", groupErr);
          // Don't fail the whole operation if groups can't be fetched
        }
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setApiError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [
    isConnected,
    isAdmin,
    redmineUrl,
    currentPage,
    usersPerPage,
    filters,
    refreshTrigger,
    SERVER_URL
  ]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Apply search filter
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, name: searchInput }));
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      groupId: "",
      name: "",
    });
    setSearchInput("");
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
    setCurrentPage(1);
  };

  // Handle group filter change
  const handleGroupChange = (groupId: string) => {
    setFilters((prev) => ({ ...prev, groupId }));
    setCurrentPage(1);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Create a new user
  const handleCreateUser = async (userData: any): Promise<boolean> => {
    if (!isConnected || !isAdmin || !redmineUrl) return false;

    setLoadingAction(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/users?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to create user";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use text as is (but truncate if too long)
          errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh users list
      setRefreshTrigger((prev) => prev + 1);
      setIsCreatingUser(false);

      return true;
    } catch (err: any) {
      console.error("Error creating user:", err);
      alert(`Failed to create user: ${err.message}`);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  // Update a user
  const handleUpdateUser = async (
    userId: number,
    userData: any
  ): Promise<boolean> => {
    if (!isConnected || !isAdmin || !redmineUrl) return false;

    setLoadingAction(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/users/${userId}?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to update user";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use text as is (but truncate if too long)
          errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh users list
      setRefreshTrigger((prev) => prev + 1);
      setSelectedUser(null);

      return true;
    } catch (err: any) {
      console.error("Error updating user:", err);
      alert(`Failed to update user: ${err.message}`);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete a user
  const handleDeleteUser = async (userId: number): Promise<boolean> => {
    if (!isConnected || !isAdmin || !redmineUrl) return false;

    setLoadingAction(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/users/${userId}?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to delete user";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use text as is (but truncate if too long)
          errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh users list
      setRefreshTrigger((prev) => prev + 1);
      setUserToDelete(null);

      return true;
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert(`Failed to delete user: ${err.message}`);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  // Add user to group
  const handleAddUserToGroup = async (userId: number, groupId: number): Promise<boolean> => {
    if (!isConnected || !isAdmin || !redmineUrl) return false;

    setLoadingAction(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/groups/${groupId}/users?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to add user to group";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use text as is (but truncate if too long)
          errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh users list
      setRefreshTrigger((prev) => prev + 1);

      return true;
    } catch (err: any) {
      console.error("Error adding user to group:", err);
      alert(`Failed to add user to group: ${err.message}`);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove user from group
  const handleRemoveUserFromGroup = async (userId: number, groupId: number): Promise<boolean> => {
    if (!isConnected || !isAdmin || !redmineUrl) return false;

    setLoadingAction(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/groups/${groupId}/users/${userId}?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to remove user from group";
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, use text as is (but truncate if too long)
          errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh users list
      setRefreshTrigger((prev) => prev + 1);

      return true;
    } catch (err: any) {
      console.error("Error removing user from group:", err);
      alert(`Failed to remove user from group: ${err.message}`);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  // Get status label
  const getStatusLabel = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "Active";
      case 2:
        return "Registered";
      case 3:
        return "Locked";
      default:
        return "Unknown";
    }
  };

  // Get status badge color
  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // If not admin, don't render anything
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || loadingAction}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${
                loading || loadingAction ? "animate-spin" : ""
              }`}
            />
            {loading || loadingAction ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setIsCreatingUser(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search users by name or email..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="1">Active</option>
              <option value="2">Registered</option>
              <option value="3">Locked</option>
            </select>

            {groups.length > 0 && (
              <select
                value={filters.groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}

            <button
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleSearch}
            >
              <Search size={16} />
              <span>Search</span>
            </button>

            {(filters.status !== "all" || filters.groupId || filters.name) && (
              <button
                className="flex items-center space-x-1 px-3 py-2 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50"
                onClick={resetFilters}
              >
                <X size={16} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.status !== "all" || filters.groupId || filters.name) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>

            {filters.status !== "all" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {getStatusLabel(parseInt(filters.status))}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => handleStatusChange("all")}
                />
              </span>
            )}

            {filters.groupId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Group:{" "}
                {groups.find((g) => g.id.toString() === filters.groupId)
                  ?.name || filters.groupId}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => handleGroupChange("")}
                />
              </span>
            )}

            {filters.name && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Search: {filters.name}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, name: "" }));
                    setSearchInput("");
                  }}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : apiError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {apiError}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <Users size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No users found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or create a new user
            </p>
            <button
              onClick={() => setIsCreatingUser(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create New User
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Last Login
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Admin
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User size={20} className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.login}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.mail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_on
                        ? formatDate(user.last_login_on)
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.admin ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <X size={18} className="text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/users/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View User Details"
                        >
                          <User size={16} />
                        </Link>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * usersPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * usersPerPage, totalUsers)}
                    </span>{" "}
                    of <span className="font-medium">{totalUsers}</span> users
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {isCreatingUser && (
        <CreateUserModal
          handleCreateUser={handleCreateUser}
          setIsCreatingUser={setIsCreatingUser}
          loadingAction={loadingAction}
          groups={groups}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          handleUpdateUser={handleUpdateUser}
          setSelectedUser={setSelectedUser}
          loadingAction={loadingAction}
          groups={groups}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          handleDeleteUser={handleDeleteUser}
          setUserToDelete={setUserToDelete}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};