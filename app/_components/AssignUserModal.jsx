// components/AssignUserModal.js
import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';

const AssignUserModal = ({ isOpen, onClose, post, onRefresh }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assigningUser, setAssigningUser] = useState(null);
  const [currentlyAssignedUser, setCurrentlyAssignedUser] = useState(null);

  // Fetch page users and current assignment
  useEffect(() => {
    if (isOpen && post?.page_id) {
      fetchPageUsers();
      fetchCurrentAssignment();
    }
  }, [isOpen, post?.page_id, post?.issue_details?.assigned_to_user_id]);

  // Filter users based on role and search term
  useEffect(() => {
    let filtered = users;
    
    // Filter by role (exclude 'Member' role)
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role_name === selectedRole);
    } else {
      filtered = filtered.filter(user => user.role_name !== 'Member');
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, selectedRole, searchTerm]);

  const fetchPageUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/centers/${post.page_id}/members`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching page users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentAssignment = async () => {
    if (post.issue_details?.assigned_to_user_id) {
      try {
        const response = await fetch(`/api/user/${post.issue_details.assigned_to_user_id}`);
        if (response.ok) {
          const userData = await response.json();
          setCurrentlyAssignedUser(userData);
        }
      } catch (error) {
        console.error('Error fetching assigned user:', error);
      }
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      setAssigningUser(userId);
      const response = await fetch(`/api/centers/issues/${post.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to_user_id: userId }),
      });
      
      if (response.ok) {
        onRefresh?.();
        onClose();
      }
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setAssigningUser(null);
    }
  };

  const handleUnassign = async () => {
    try {
      const response = await fetch(`/api/centers/issues/${post.id}/unassign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        onRefresh?.();
        onClose();
      }
    } catch (error) {
      console.error('Error unassigning user:', error);
    }
  };

  // Get unique roles for filter (excluding 'Member')
  const uniqueRoles = [...new Set(users.map(user => user.role_name))].filter(role => role !== 'Member');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    {post.issue_details?.assigned_to_user_id ? 'Reassign Issue' : 'Assign Issue'}
                  </Dialog.Title>
                  <p className="text-blue-100 text-sm mt-1">
                    {post.issue_details?.assigned_to_user_id 
                      ? 'Change assignment or assign to another team member' 
                      : 'Assign this issue to a team member'}
                  </p>
                </div>

                {/* Current Assignment Section */}
                {currentlyAssignedUser && (
                  <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned To:</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={currentlyAssignedUser.profile_image || "/user-placeholder.png"}
                          alt={currentlyAssignedUser.user_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {currentlyAssignedUser.user_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {currentlyAssignedUser.role_name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnassign}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex gap-3 mb-3">
                    {/* Role Filter */}
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Roles</option>
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Image
                                src={user.profile_image || "/user-placeholder.png"}
                                alt={user.user_name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              {user.user_id === post.issue_details?.assigned_to_user_id && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {user.user_name}
                                {user.user_id === post.issue_details?.assigned_to_user_id && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.role_name}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAssignUser(user.user_id)}
                            disabled={assigningUser === user.user_id || user.user_id === post.issue_details?.assigned_to_user_id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              user.user_id === post.issue_details?.assigned_to_user_id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {user.user_id === post.issue_details?.assigned_to_user_id 
                              ? 'Assigned' 
                              : assigningUser === user.user_id 
                                ? 'Assigning...' 
                                : 'Assign'
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AssignUserModal;