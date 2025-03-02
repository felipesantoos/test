import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings,
  BarChart3,
  Trello,
  UserCog,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { username, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-4">
        <button 
          onClick={toggleMobileMenu}
          className="text-white bg-indigo-600 p-2 rounded-md hover:bg-indigo-700 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex bg-indigo-800 text-white w-64 flex-col h-full">
        <SidebarContent username={username} isAdmin={isAdmin} />
      </div>
      
      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-800 text-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent username={username} isAdmin={isAdmin} onItemClick={toggleMobileMenu} />
          </div>
        </div>
      )}
    </>
  );
};

interface SidebarContentProps {
  username: string;
  isAdmin: boolean;
  onItemClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ username, isAdmin, onItemClick }) => {
  return (
    <>
      <div className="p-5 border-b border-indigo-700">
        <div className="flex items-center space-x-2">
          <BarChart3 size={24} />
          <h1 className="text-xl font-bold">DIT Manager</h1>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              end
              onClick={onItemClick}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/projects" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              onClick={onItemClick}
            >
              <FolderKanban size={20} />
              <span>Projects</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/issues" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              onClick={onItemClick}
            >
              <CheckSquare size={20} />
              <span>Issues</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/kanban" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              onClick={onItemClick}
            >
              <Trello size={20} />
              <span>Kanban Board</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/member-performance" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              onClick={onItemClick}
            >
              <Users size={20} />
              <span>Member Performance</span>
            </NavLink>
          </li>
          
          {/* Admin-only User Management Link */}
          {isAdmin && (
            <li>
              <NavLink 
                to="/users" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-indigo-700 text-white' 
                      : 'text-indigo-100 hover:bg-indigo-700'
                  }`
                }
                onClick={onItemClick}
              >
                <UserCog size={20} />
                <span>User Management</span>
              </NavLink>
            </li>
          )}
          
          <li>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
              onClick={onItemClick}
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-indigo-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="font-medium">{username ? username.substring(0, 2).toUpperCase() : 'JD'}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{username || 'John Doe'}</p>
            <p className="text-xs text-indigo-300">{isAdmin ? 'Administrator' : 'Redmine User'}</p>
          </div>
        </div>
      </div>
    </>
  );
};