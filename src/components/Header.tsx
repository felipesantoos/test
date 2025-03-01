import React, { useState } from 'react';
import { Bell, Search, RefreshCw, LogOut, User } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { refreshData, isLoading } = useApi();
  const { username, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="w-full md:w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search issues, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex items-center space-x-4 ml-4">
          <button 
            onClick={refreshData}
            className="hidden md:flex items-center space-x-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden md:inline">Refresh Data</span>
          </button>
          
          <div className="relative">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
          
          <div className="relative">
            <button 
              className="flex items-center text-sm text-gray-700 hover:text-indigo-600 focus:outline-none"
              onClick={toggleDropdown}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                <User size={16} className="text-indigo-600" />
              </div>
              <span className="hidden md:inline">{username}</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="mr-2" />
                    <span>Sign out</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};