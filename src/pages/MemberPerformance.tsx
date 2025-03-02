import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertCircle,
  Trophy,
  Users,
  CheckSquare,
  Clock,
  Filter,
  RefreshCw,
  Download,
  Search,
  SortAsc,
  SortDesc,
  X,
  EyeOff,
  Calendar,
  BarChart as BarChartIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns";

interface PerformanceMetrics {
  id: number;
  name: string;
  assignedIssues: number;
  resolvedIssues: number;
  totalUpdates: number;
  avgResolutionTime: number;
  resolutionTimes: number[];
  lastActivity: Date | null;
  efficiency: number;
  responseTime: number;
  team?: string;
  role?: string;
}

interface FilterState {
  search: string;
  team: string;
  role: string;
  metric: string;
  timeRange: string;
  customDateFrom: string;
  customDateTo: string;
  excludedUsers: number[];
}

interface SortConfig {
  key: keyof PerformanceMetrics;
  direction: "asc" | "desc";
}

export const MemberPerformance = () => {
  const { isConnected, isLoading, error, users, fetchIssues, refreshData } =
    useApi();

  // State
  const [loading, setLoading] = useState(true);
  const [memberPerformance, setMemberPerformance] = useState<
    PerformanceMetrics[]
  >([]);
  const [filteredPerformance, setFilteredPerformance] = useState<
    PerformanceMetrics[]
  >([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    team: "all",
    role: "all",
    metric: "resolved",
    timeRange: "month",
    customDateFrom: "",
    customDateTo: "",
    excludedUsers: [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "resolvedIssues",
    direction: "desc",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mock data for teams and roles (replace with actual data)
  const teams = ["Development", "Design", "QA", "Management"];
  const roles = [
    "Developer",
    "Designer",
    "Tester",
    "Project Manager",
    "Team Lead",
  ];

  // Load and process performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      if (!isConnected) return;

      setLoading(true);

      try {
        // Fetch all issues
        const allIssues = await fetchIssues({
          include: "journals,relations,children",
        });

        // Process performance metrics for each user
        const performanceData: PerformanceMetrics[] = users.map((user) => {
          const userIssues = allIssues.filter(
            (issue) => issue.assigned_to && issue.assigned_to.id === user.id
          );

          // Calculate basic metrics
          const assignedCount = userIssues.length;
          const resolvedCount = userIssues.filter(
            (issue) =>
              issue.status.name.toLowerCase() === "resolved" ||
              issue.status.name.toLowerCase() === "closed"
          ).length;

          // Calculate resolution times
          const resolutionTimes = userIssues
            .filter((issue) => issue.closed_on)
            .map((issue) => {
              const created = new Date(issue.created_on);
              const closed = new Date(issue.closed_on);
              return (
                (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
              ); // Days
            });

          // Calculate average resolution time
          const avgResolutionTime =
            resolutionTimes.length > 0
              ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
                resolutionTimes.length
              : 0;

          // Calculate total updates
          const totalUpdates = userIssues.reduce(
            (sum, issue) => sum + (issue.journals?.length || 0),
            0
          );

          // Find last activity
          const lastActivity =
            userIssues.length > 0
              ? new Date(
                  Math.max(
                    ...userIssues.map((issue) =>
                      new Date(issue.updated_on).getTime()
                    )
                  )
                )
              : null;

          // Calculate efficiency (resolved issues / assigned issues)
          const efficiency =
            assignedCount > 0 ? (resolvedCount / assignedCount) * 100 : 0;

          // Calculate average response time (mock data - replace with actual calculation)
          const responseTime = Math.random() * 24; // Random hours for demonstration

          return {
            id: user.id,
            name: `${user.firstname} ${user.lastname}`,
            assignedIssues: assignedCount,
            resolvedIssues: resolvedCount,
            totalUpdates,
            avgResolutionTime,
            resolutionTimes,
            lastActivity,
            efficiency,
            responseTime,
            team: teams[Math.floor(Math.random() * teams.length)], // Mock data
            role: roles[Math.floor(Math.random() * roles.length)], // Mock data
          };
        });

        setMemberPerformance(performanceData);
        applyFiltersAndSort(performanceData);
      } catch (err) {
        console.error("Error loading performance data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformanceData();
  }, [isConnected, users, fetchIssues]);

  // Apply filters and sorting
  const applyFiltersAndSort = (data: PerformanceMetrics[]) => {
    let filtered = [...data];

    // Remove excluded users
    filtered = filtered.filter(
      (member) => !filters.excludedUsers.includes(member.id)
    );

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((member) =>
        member.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply team filter
    if (filters.team !== "all") {
      filtered = filtered.filter((member) => member.team === filters.team);
    }

    // Apply role filter
    if (filters.role !== "all") {
      filtered = filtered.filter((member) => member.role === filters.role);
    }

    // Apply time range filter
    const now = new Date();
    let startDate: Date | null = null; // Initialize with null

    switch (filters.timeRange) {
      case "day":
        startDate = subDays(now, 1);
        break;
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subDays(now, 30);
        break;
      case "quarter":
        startDate = subDays(now, 90);
        break;
      case "custom":
        if (filters.customDateFrom) {
          startDate = startOfDay(new Date(filters.customDateFrom));
        }
        break;
      default:
        startDate = subDays(now, 30); // Default to month
    }

    if (startDate) {
      filtered = filtered.filter(
        (member) => member.lastActivity && member.lastActivity >= startDate
      );
    }

    if (filters.timeRange === "custom" && filters.customDateTo) {
      const endDate = endOfDay(new Date(filters.customDateTo));
      filtered = filtered.filter(
        (member) => member.lastActivity && member.lastActivity <= endDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null or undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      // Compare values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredPerformance(filtered);
  };

  // Update filtered data when filters or sort config changes
  useEffect(() => {
    if (memberPerformance.length > 0) {
      applyFiltersAndSort(memberPerformance);
    }
  }, [filters, sortConfig, memberPerformance]);

  // Handle sort change
  const handleSortChange = (key: keyof PerformanceMetrics) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle user exclusion
  const toggleUserExclusion = (userId: number) => {
    setFilters((prev) => ({
      ...prev,
      excludedUsers: prev.excludedUsers.includes(userId)
        ? prev.excludedUsers.filter((id) => id !== userId)
        : [...prev.excludedUsers, userId],
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      team: "all",
      role: "all",
      metric: "resolved",
      timeRange: "month",
      customDateFrom: "",
      customDateTo: "",
      excludedUsers: [],
    });
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return format(date, "MMM d, yyyy");
  };

  // Get chart colors
  const getChartColor = (index: number) => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#6366F1",
    ];
    return colors[index % colors.length];
  };

  // Export data as CSV
  const exportCSV = () => {
    const headers = [
      "Name",
      "Team",
      "Role",
      "Assigned Issues",
      "Resolved Issues",
      "Efficiency (%)",
      "Avg. Resolution Time (days)",
      "Response Time (hours)",
      "Total Updates",
      "Last Activity",
    ];

    const rows = filteredPerformance.map((member) => [
      member.name,
      member.team,
      member.role,
      member.assignedIssues,
      member.resolvedIssues,
      member.efficiency.toFixed(1),
      member.avgResolutionTime.toFixed(1),
      member.responseTime.toFixed(1),
      member.totalUpdates,
      member.lastActivity ? formatDate(member.lastActivity) : "Never",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `performance_report_${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Connected to Redmine</h2>
        <p className="text-gray-600 mb-4">
          Please configure your Redmine API settings to get started.
        </p>
        <Link
          to="/settings"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Member Performance</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search members..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.metric}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, metric: e.target.value }))
              }
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="resolved">Resolved Issues</option>
              <option value="efficiency">Efficiency</option>
              <option value="response">Response Time</option>
              <option value="updates">Updates</option>
            </select>

            <select
              value={filters.timeRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, timeRange: e.target.value }))
              }
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Filter size={16} className="mr-2" />
              {showAdvancedFilters ? "Hide Filters" : "More Filters"}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={filters.team}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, team: e.target.value }))
                  }
                  className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Teams</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {filters.timeRange === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={filters.customDateFrom}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            customDateFrom: e.target.value,
                          }))
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={filters.customDateTo}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            customDateTo: e.target.value,
                          }))
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Filters */}
            {(filters.search ||
              filters.team !== "all" ||
              filters.role !== "all" ||
              filters.timeRange !== "month" ||
              filters.excludedUsers.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Active filters:
                </span>

                {filters.search && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {filters.search}
                    <X
                      size={14}
                      className="ml-1 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                    />
                  </span>
                )}

                {filters.team !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Team: {filters.team}
                    <X
                      size={14}
                      className="ml-1 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, team: "all" }))
                      }
                    />
                  </span>
                )}

                {filters.role !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Role: {filters.role}
                    <X
                      size={14}
                      className="ml-1 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, role: "all" }))
                      }
                    />
                  </span>
                )}

                {filters.timeRange !== "month" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Time Range:{" "}
                    {filters.timeRange === "custom"
                      ? `${filters.customDateFrom} to ${filters.customDateTo}`
                      : filters.timeRange}
                    <X
                      size={14}
                      className="ml-1 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          timeRange: "month",
                          customDateFrom: "",
                          customDateTo: "",
                        }))
                      }
                    />
                  </span>
                )}

                {filters.excludedUsers.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {filters.excludedUsers.length} Hidden Users
                    <X
                      size={14}
                      className="ml-1 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, excludedUsers: [] }))
                      }
                    />
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  Clear All Filters
                  <X size={14} className="ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Team Size</h2>
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users size={20} className="text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {filteredPerformance.length}
          </div>
          <p className="text-sm text-gray-500">Active members</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Total Issues
            </h2>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {filteredPerformance.reduce(
              (sum, member) => sum + member.assignedIssues,
              0
            )}
          </div>
          <p className="text-sm text-gray-500">Assigned issues</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Avg. Efficiency
            </h2>
            <div className="bg-yellow-100 p-2 rounded-full">
              <BarChartIcon size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {(
              filteredPerformance.reduce(
                (sum, member) => sum + member.efficiency,
                0
              ) / (filteredPerformance.length || 1)
            ).toFixed(1)}
            %
          </div>
          <p className="text-sm text-gray-500">Team average</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Avg. Response
            </h2>
            <div className="bg-purple-100 p-2 rounded-full">
              <Clock size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {(
              filteredPerformance.reduce(
                (sum, member) => sum + member.responseTime,
                0
              ) / (filteredPerformance.length || 1)
            ).toFixed(1)}
            h
          </div>
          <p className="text-sm text-gray-500">Response time</p>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Member Performance Details</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">
              Loading performance data...
            </p>
          </div>
        ) : filteredPerformance.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              No performance data available for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("name")}
                    >
                      <span>Member</span>
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Team / Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("assignedIssues")}
                    >
                      <span>Assigned</span>
                      {sortConfig.key === "assignedIssues" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("resolvedIssues")}
                    >
                      <span>Resolved</span>
                      {sortConfig.key === "resolvedIssues" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text- left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("efficiency")}
                    >
                      <span>Efficiency</span>
                      {sortConfig.key === "efficiency" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("avgResolutionTime")}
                    >
                      <span>Avg. Time</span>
                      {sortConfig.key === "avgResolutionTime" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      className="flex items-center space-x-1 hover:text-gray-700"
                      onClick={() => handleSortChange("responseTime")}
                    >
                      <span>Response</span>
                      {sortConfig.key === "responseTime" &&
                        (sortConfig.direction === "asc" ? (
                          <SortAsc size={14} />
                        ) : (
                          <SortDesc size={14} />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Last Active
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
                {filteredPerformance.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="font-medium text-indigo-800">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.team}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.assignedIssues}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckSquare
                          size={16}
                          className="text-green-500 mr-2"
                        />
                        <span className="text-sm text-gray-900">
                          {member.resolvedIssues}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-16 rounded-full mr-2 ${
                            member.efficiency >= 75
                              ? "bg-green-500"
                              : member.efficiency >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          <div
                            className="h-full rounded-full bg-opacity-50"
                            style={{ width: `${member.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {member.efficiency.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {member.avgResolutionTime.toFixed(1)} days
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {member.responseTime.toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.lastActivity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleUserExclusion(member.id)}
                        className={`text-gray-400 hover:text                        -gray-600 ${
                          filters.excludedUsers.includes(member.id)
                            ? "text-red-500 hover:text-red-700"
                            : ""
                        }`}
                        title={
                          filters.excludedUsers.includes(member.id)
                            ? "Show Member"
                            : "Hide Member"
                        }
                      >
                        <EyeOff size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Performance by Metric</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey={
                    filters.metric === "resolved"
                      ? "resolvedIssues"
                      : filters.metric === "efficiency"
                      ? "efficiency"
                      : filters.metric === "response"
                      ? "responseTime"
                      : "totalUpdates"
                  }
                  name={
                    filters.metric === "resolved"
                      ? "Resolved Issues"
                      : filters.metric === "efficiency"
                      ? "Efficiency (%)"
                      : filters.metric === "response"
                      ? "Response Time (h)"
                      : "Updates"
                  }
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Team Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredPerformance}
                  dataKey="assignedIssues"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {filteredPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
