import { useState, useEffect } from 'react';
import { FiTrash2, FiUser, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as userApi from '../services/userApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userApi.getUsers();
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (userId) => {
    try {
      setDeleting(true);
      await userApi.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      deleteUser(user._id);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createUser = async (userData) => {
    try {
      setCreating(true);
      
      // Use real API instead of mock
      const newUser = await userApi.createUser(userData);
      
      toast.success(`User ${userData.email} created successfully`);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'viewer'
      });
      setFormErrors({});
      
      // Reload users to show the new user
      await loadUsers();
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('Email already exists')) {
        setFormErrors({ email: 'A user with this email already exists' });
        toast.error('Email already exists');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check all required fields');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    createUser({
      email: formData.email,
      password: formData.password,
      role: formData.role
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 font-heading">User Management</h1>
        <p className="mt-2 text-slate-400">Create new users and manage existing ones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - New User Form */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 font-heading">Create New User</h2>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="user@example.com"
                  disabled={creating}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="form-label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`form-input ${formErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  disabled={creating}
                >
                  <option value="viewer">Viewer </option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.role}</p>
                )}
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input pr-10 ${formErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Enter password"
                    disabled={creating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input pr-10 ${formErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Confirm password"
                    disabled={creating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Users List */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 font-heading">All Users</h2>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-red-400 mb-4">
                  <FiUser className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Error loading users</h3>
                <p className="text-red-400">Please try again later.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <FiUser className="mx-auto h-12 w-12 text-slate-600" />
                    <h3 className="mt-2 text-sm font-medium text-slate-200">No users found</h3>
                    <p className="mt-1 text-sm text-slate-400">Create your first user using the form.</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user._id} className="p-4 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-slate-300 font-medium text-sm">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">
                              {user.email}
                            </div>
                            <div className="text-xs text-slate-400">
                              {user.role} • {user.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 transition-colors"
                          title="Delete user"
                          disabled={deleting}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;