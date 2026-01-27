/**
 * Users management page component (Admin only)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPlus, FiEdit3, FiTrash2, FiUser, FiShield, FiEye, FiSearch, FiMail, FiCalendar, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as userApi from '../services/userApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NewUserModal from '../components/modals/NewUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { hasRole } = useAuth();
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch users from API
  const { data: usersData, isLoading, error } = useQuery(
    'users',
    userApi.getUsers,
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
      refetchOnWindowFocus: true,
      onError: (error) => {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users');
      }
    }
  );

  const users = usersData?.users || [];

  // Delete user mutation
  const deleteUserMutation = useMutation(userApi.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => userApi.toggleUserStatus(id, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  if (!hasRole('admin')) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-400 mb-4">
          <FiShield className="h-24 w-24" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Access Denied</h3>
        <p className="text-red-400">Admin role required to access user management.</p>
      </div>
    );
  }

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({
      id: user._id,
      isActive: !user.isActive
    });
  };

  const handleUserUpdate = () => {
    // Refresh users list when a user is updated
    queryClient.invalidateQueries('users');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return FiShield;
      case 'editor': return FiEdit3;
      case 'viewer': return FiEye;
      default: return FiUser;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-danger',
      editor: 'badge-info',
      viewer: 'badge-gray'
    };
    return badges[role] || 'badge-gray';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    viewers: users.filter(u => u.role === 'viewer').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-400 mb-4">
          <FiUser className="h-24 w-24" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Error loading users</h3>
        <p className="text-red-400">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 font-heading">User Management</h1>
          <p className="mt-2 text-slate-400">
            Manage system users and their access levels.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="btn-primary btn-lg"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card">
          <div className="card-body">
            <div>
              <p className="text-sm font-medium text-slate-400">User</p>
              <p className="text-2xl font-bold text-slate-100">{userStats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div>
              <p className="text-sm font-medium text-slate-400">Current Role</p>
              <p className="text-2xl font-bold text-slate-100">{userStats.active}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div>
              <p className="text-sm font-medium text-slate-400">Actions</p>
              <p className="text-2xl font-bold text-slate-100">{userStats.admins}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div>
              <p className="text-sm font-medium text-slate-400">Editors</p>
              <p className="text-2xl font-bold text-slate-100">{userStats.editors}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div>
              <p className="text-sm font-medium text-slate-400">Viewers</p>
              <p className="text-2xl font-bold text-slate-100">{userStats.viewers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Search Users</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Filter by Role</label>
              <select
                className="form-input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-slate-100 font-heading">System Users</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/30 divide-y divide-slate-800">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user._id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                              <span className="text-slate-300 font-medium text-sm">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-200">
                              {user.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <RoleIcon className="h-4 w-4 mr-2 text-slate-400" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'badge-success' : 'badge-gray'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {user.lastLoginAt ? (
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-1" />
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              user.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'
                            }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                            disabled={toggleStatusMutation.isLoading}
                          >
                            {user.isActive ? <FiToggleRight className="h-4 w-4" /> : <FiToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-violet-400 hover:text-violet-300 p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Edit user"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Delete user"
                            disabled={deleteUserMutation.isLoading}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FiUser className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-2 text-sm font-medium text-slate-200">No users found</h3>
              <p className="mt-1 text-sm text-slate-400">
                {searchTerm || roleFilter ? 'Try adjusting your search criteria.' : 'Get started by creating a new user.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onUserCreate={handleUserUpdate}
      />
      
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        user={selectedUser}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
};

export default UsersPage;