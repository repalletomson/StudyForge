/**
 * New Term Modal Component
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NewTermModal = ({ isOpen, onClose, programId }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      termNumber: 1,
      title: ''
    }
  });

  // Create term mutation
  const createTermMutation = useMutation(
    async (data) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/programs/${programId}/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create term');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // Invalidate multiple queries for real-time updates
        queryClient.invalidateQueries(['terms', programId]);
        queryClient.invalidateQueries(['program', programId]);
        queryClient.invalidateQueries(['programs']); // Update programs list
        toast.success('Term created successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create term');
      }
    }
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data) => {
    const termData = {
      ...data,
      programId,
      termNumber: parseInt(data.termNumber)
    };
    
    createTermMutation.mutate(termData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl animate-slide-up border border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-100 font-heading">
                Add New Term
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Create a new term for this program
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="form-label">Term Number</label>
              <input
                type="number"
                min="1"
                className={`form-input ${errors.termNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="Enter term number"
                {...register('termNumber', { 
                  required: 'Term number is required',
                  min: { value: 1, message: 'Term number must be at least 1' }
                })}
              />
              {errors.termNumber && (
                <p className="form-error">{errors.termNumber.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Term Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter term title (optional)"
                {...register('title')}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty to use default term title
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline"
                disabled={createTermMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createTermMutation.isLoading}
              >
                {createTermMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Term
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTermModal;