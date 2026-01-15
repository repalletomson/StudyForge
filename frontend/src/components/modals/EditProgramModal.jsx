/**
 * Edit Program Modal Component
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { FiX, FiSave, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../../services/programApi';
import AssetManagerModal from './AssetManagerModal';

const EditProgramModal = ({ isOpen, onClose, program, onProgramUpdate }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [languages, setLanguages] = useState(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Available topics
  const availableTopics = [
    { _id: '1', name: 'Mathematics' },
    { _id: '2', name: 'Science' },
    { _id: '3', name: 'Technology' },
    { _id: '4', name: 'Language Arts' },
    { _id: '5', name: 'History' },
    { _id: '6', name: 'Art & Design' }
  ];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'te', name: 'Telugu' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' }
  ];

  // Initialize form with program data
  useEffect(() => {
    if (program && isOpen) {
      setValue('title', program.title);
      setValue('description', program.description || '');
      setValue('status', program.status);
      setPrimaryLanguage(program.languagePrimary);
      setLanguages(program.languagesAvailable || ['en']);
      
      // Set selected topics based on program topics
      const topicIds = availableTopics
        .filter(topic => program.topics?.includes(topic.name))
        .map(topic => topic._id);
      setSelectedTopics(topicIds);
    }
  }, [program, isOpen, setValue]);

  const updateProgramMutation = useMutation(
    (data) => programApi.updateProgram(program._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['program', program._id]);
        queryClient.invalidateQueries('programs');
        toast.success('Program updated successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update program');
      }
    }
  );

  const handleClose = () => {
    reset();
    setSelectedTopics([]);
    setLanguages(['en']);
    setPrimaryLanguage('en');
    setIsAssetManagerOpen(false);
    onClose();
  };

  const handleManageAssets = () => {
    setIsAssetManagerOpen(true);
  };

  const handleAssetUpdate = () => {
    // Refresh program data when assets are updated
    queryClient.invalidateQueries(['program', program._id]);
    queryClient.invalidateQueries('programs');
    
    // Call parent callback to update program detail page
    if (onProgramUpdate) {
      onProgramUpdate();
    }
  };

  const onSubmit = (data) => {
    const programData = {
      ...data,
      languagePrimary: primaryLanguage,
      languagesAvailable: languages,
      topicIds: selectedTopics
    };
    
    updateProgramMutation.mutate(programData);
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const addLanguage = (langCode) => {
    if (!languages.includes(langCode)) {
      setLanguages(prev => [...prev, langCode]);
    }
  };

  const removeLanguage = (langCode) => {
    if (langCode !== primaryLanguage && languages.length > 1) {
      setLanguages(prev => prev.filter(lang => lang !== langCode));
    }
  };

  const setPrimary = (langCode) => {
    setPrimaryLanguage(langCode);
    if (!languages.includes(langCode)) {
      setLanguages(prev => [...prev, langCode]);
    }
  };

  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl animate-slide-up border border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 font-heading">
                Edit Program
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Update program information and settings
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Basic Information</h4>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <label className="form-label">Program Title</label>
                      <input
                        type="text"
                        className={`form-input ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder="Enter program title"
                        {...register('title', { 
                          required: 'Program title is required',
                          minLength: { value: 3, message: 'Title must be at least 3 characters' }
                        })}
                      />
                      {errors.title && (
                        <p className="form-error">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Description</label>
                      <textarea
                        rows={4}
                        className="form-input resize-none"
                        placeholder="Describe your program..."
                        {...register('description')}
                      />
                    </div>

                    <div>
                      <label className="form-label">Status</label>
                      <select
                        className="form-input"
                        {...register('status')}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Language Settings</h4>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <label className="form-label">Primary Language</label>
                      <select
                        className="form-input"
                        value={primaryLanguage}
                        onChange={(e) => setPrimary(e.target.value)}
                      >
                        {availableLanguages.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name} ({lang.code.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Available Languages</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {languages.map(langCode => {
                          const lang = availableLanguages.find(l => l.code === langCode);
                          return (
                            <span
                              key={langCode}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                langCode === primaryLanguage
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-slate-700 text-slate-300 border border-slate-600'
                              }`}
                            >
                              {lang?.name}
                              {langCode === primaryLanguage && (
                                <span className="ml-1 text-xs">(Primary)</span>
                              )}
                              {langCode !== primaryLanguage && languages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLanguage(langCode)}
                                  className="ml-2 text-slate-400 hover:text-red-400"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      
                      <select
                        className="form-input"
                        onChange={(e) => {
                          if (e.target.value) {
                            addLanguage(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Add a language...</option>
                        {availableLanguages
                          .filter(lang => !languages.includes(lang.code))
                          .map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Topics */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Topics & Categories</h4>
                  </div>
                  <div className="card-body">
                    <label className="form-label">Select Topics</label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableTopics.map(topic => (
                        <label
                          key={topic._id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTopics.includes(topic._id)
                              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selectedTopics.includes(topic._id)}
                            onChange={() => toggleTopic(topic._id)}
                          />
                          <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                            selectedTopics.includes(topic._id)
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-slate-600'
                          }`}>
                            {selectedTopics.includes(topic._id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">{topic.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Current Assets */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Program Images</h4>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Portrait */}
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Portrait</p>
                        {program?.assets?.posters?.[program.languagePrimary]?.portrait ? (
                          <div className="relative">
                            <img
                              src={program.assets.posters[program.languagePrimary].portrait}
                              alt="Portrait poster"
                              className="w-full h-24 object-cover rounded-lg border border-emerald-500/50"
                            />
                            <div className="absolute top-1 right-1">
                              <span className="px-1 py-0.5 bg-emerald-500 text-white text-xs rounded">
                                ✓
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center text-slate-400 border border-slate-700">
                            <div className="text-center">
                              <div className="text-lg mb-1">📱</div>
                              <div className="text-xs opacity-90">Portrait</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Landscape */}
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Landscape</p>
                        {program?.assets?.posters?.[program.languagePrimary]?.landscape ? (
                          <div className="relative">
                            <img
                              src={program.assets.posters[program.languagePrimary].landscape}
                              alt="Landscape poster"
                              className="w-full h-24 object-cover rounded-lg border border-emerald-500/50"
                            />
                            <div className="absolute top-1 right-1">
                              <span className="px-1 py-0.5 bg-emerald-500 text-white text-xs rounded">
                                ✓
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center text-slate-400 border border-slate-700">
                            <div className="text-center">
                              <div className="text-lg mb-1">🖥️</div>
                              <div className="text-xs opacity-90">Landscape</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleManageAssets && handleManageAssets()}
                      className="w-full mt-4 btn-primary"
                    >
                      <FiUpload className="w-4 h-4 mr-2" />
                      Upload Program Images
                    </button>
                    
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Portrait and landscape images are required for publishing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline"
                disabled={updateProgramMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updateProgramMutation.isLoading}
              >
                {updateProgramMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Update Program
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Asset Manager Modal */}
      <AssetManagerModal 
        isOpen={isAssetManagerOpen}
        onClose={() => setIsAssetManagerOpen(false)}
        entity={program}
        entityType="program"
        onAssetUpdate={handleAssetUpdate}
      />
    </div>
  );
};

export default EditProgramModal;