/**
 * Edit User Modal Component
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { FiX, FiUser, FiMail, FiShield, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EditUserModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'viewer',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    }
  }, [user]);

  const updateUserMutation = useMutation(
    async (userData) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        ...user,
        ...userData,
        updatedAt: new Date()
      };
    },
    {
      onSuccess: (updatedUser) => {
        queryClient.invalidateQueries('users');
        toast.success(`User ${updatedUser.email} updated successfully`);
        handleClose();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update user');
      }
    }
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    updateUserMutation.mutate({
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive
    });
  };

  const handleClose = () => {
    setFormData({
      email: '',
      role: 'viewer',
      isActive: true
    });
    setErrors({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleActive = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl animate-slide-up border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center mr-3">
                <FiUser className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 font-heading">
                  Edit User
                </h3>
                <p className="text-sm text-slate-400">
                  Update user information and permissions
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">
                <FiMail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="user@example.com"
                disabled={updateUserMutation.isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                <FiShield className="inline w-4 h-4 mr-2" />
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`form-input ${errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                disabled={updateUserMutation.isLoading}
              >
                <option value="viewer">Viewer - Read-only access</option>
                <option value="editor">Editor - Can create and edit content</option>
                <option value="admin">Admin - Full system access</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-400">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="form-label">Account Status</label>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formData.isActive 
                      ? 'User can log in and access the system' 
                      : 'User cannot log in or access the system'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleActive}
                  className={`flex-shrink-0 transition-colors ${
                    formData.isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                  disabled={updateUserMutation.isLoading}
                >
                  {formData.isActive ? (
                    <FiToggleRight className="w-8 h-8" />
                  ) : (
                    <FiToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <h4 className="text-sm font-semibold text-violet-300 mb-2">User Information</h4>
              <div className="space-y-1 text-xs text-violet-200">
                <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                <p>Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                <p>User ID: {user._id}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={updateUserMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updateUserMutation.isLoading}
              >
                {updateUserMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;