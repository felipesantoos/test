import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';

interface UserSelectProps {
  users: any[];
  projectMembers: any[];
  selectedUserId: string | number | null;
  onChange: (userId: string | number | null) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  users,
  projectMembers,
  selectedUserId,
  onChange,
  placeholder = "Select user...",
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // We'll create a separate state for filtering project members
  const [filteredProjectMembers, setFilteredProjectMembers] = useState(projectMembers);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter project members when search query changes
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = projectMembers.filter(member => {
        // Filter by membership name
        const matchesName = member.name?.toLowerCase().includes(query);
        // Get corresponding user to filter by email if available
        const correspondingUser = users.find(u => u.id === member.id);
        const matchesEmail = correspondingUser?.mail?.toLowerCase().includes(query);
        return matchesName || matchesEmail;
      });
      setFilteredProjectMembers(filtered);
    } else {
      setFilteredProjectMembers(projectMembers);
    }
  }, [searchQuery, projectMembers, users]);

  // Position dropdown and calculate heights
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const maxDropdownHeight = Math.min(320, Math.max(spaceBelow, spaceAbove) - 20);
      const searchHeight = searchRef.current?.offsetHeight || 0;
      const listMaxHeight = maxDropdownHeight - searchHeight;

      if (listRef.current) {
        listRef.current.style.maxHeight = `${listMaxHeight}px`;
      }
      if (spaceBelow >= maxDropdownHeight || spaceBelow >= spaceAbove) {
        dropdownRef.current?.style.setProperty('top', '100%');
        dropdownRef.current?.style.setProperty('bottom', 'auto');
      } else {
        dropdownRef.current?.style.setProperty('bottom', '100%');
        dropdownRef.current?.style.setProperty('top', 'auto');
      }
      dropdownRef.current?.style.setProperty('max-height', `${maxDropdownHeight}px`);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected user details (from users array)
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="relative">
      <div 
        ref={triggerRef}
        className={`flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer ${
          error 
            ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500' 
            : 'border-gray-300 focus-within:ring-indigo-500 focus-within:border-indigo-500'
        } ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedUser ? (
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={14} className="text-indigo-600" />
            </div>
            <div className="ml-2 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {selectedUser.firstname} {selectedUser.lastname}
              </div>
              <div className="text-xs text-gray-500">
                {selectedUser.mail}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white rounded-md shadow-lg border border-gray-200 flex flex-col"
          style={{ minWidth: '250px' }}
        >
          <div 
            ref={searchRef}
            className="sticky top-0 bg-white p-2 border-b border-gray-200"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div 
            ref={listRef}
            className="overflow-y-auto"
          >
            {filteredProjectMembers.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No project members found
              </div>
            ) : (
              <div className="py-1">
                {filteredProjectMembers.map(member => {
                  const correspondingUser = users.find(u => u.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedUserId === member.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => {
                        onChange(member.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {correspondingUser ? correspondingUser.mail : 'No email available'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
