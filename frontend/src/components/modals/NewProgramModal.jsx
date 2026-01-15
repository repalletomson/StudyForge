/**
 * New Program Modal Component
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { FiX, FiUpload, FiPlay, FiImage, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../../services/programApi';
import * as topicApi from '../../services/topicApi';

const NewProgramModal = ({ isOpen, onClose }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [languages, setLanguages] = useState(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [customThumbnail, setCustomThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      youtubeUrl: '',
      difficulty: 'beginner',
      languagePrimary: 'en',
      languagesAvailable: ['en']
    }
  });

  const youtubeUrl = watch('youtubeUrl');

  // Fetch topics from API
  const { data: topicsData, isLoading: topicsLoading } = useQuery(
    'topics',
    topicApi.getTopics,
    {
      onError: (error) => {
        console.error('Failed to fetch topics:', error);
        toast.error('Failed to load topics');
      }
    }
  );

  const availableTopics = topicsData?.topics || [];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'te', name: 'Telugu' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' }
  ];

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId) => {
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomThumbnail(file);
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createProgramMutation = useMutation(programApi.createProgram, {
    onSuccess: () => {
      // Invalidate multiple queries for real-time updates
      queryClient.invalidateQueries('programs');
      queryClient.invalidateQueries('topics'); // In case new topics were created
      toast.success('Program created successfully');
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create program');
    }
  });

  const handleClose = () => {
    reset();
    setSelectedTopics([]);
    setLanguages(['en']);
    setPrimaryLanguage('en');
    onClose();
  };

  const onSubmit = async (data) => {
    const youtubeVideoId = extractYouTubeId(data.youtubeUrl);
    
    let thumbnailUrl = '';
    if (customThumbnail) {
      thumbnailUrl = thumbnailPreview;
    } else if (youtubeVideoId) {
      thumbnailUrl = getYouTubeThumbnail(youtubeVideoId);
    }
    
    const programData = {
      ...data,
      youtubeVideoId,
      thumbnail: thumbnailUrl,
      customThumbnail: !!customThumbnail,
      languagePrimary: primaryLanguage,
      languagesAvailable: languages,
      topicIds: selectedTopics
    };
    
    createProgramMutation.mutate(programData);
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
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl animate-slide-up border border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 font-heading">
                Create New Program
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Add a new educational program to your catalog
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

                    {/* <div>
                      <label className="form-label">YouTube Video URL</label>
                      <input
                        type="url"
                        className={`form-input ${errors.youtubeUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...register('youtubeUrl', {
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
                            message: 'Please enter a valid YouTube URL'
                          }
                        })}
                      />
                      {errors.youtubeUrl && (
                        <p className="form-error">{errors.youtubeUrl.message}</p>
                      )}
                      {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <p className="text-sm text-emerald-400">Valid YouTube video detected</p>
                        </div>
                      )}
                    </div> */}

                    <div>
                      <label className="form-label">Difficulty Level</label>
                      <select
                        className="form-input"
                        {...register('difficulty')}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Section */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Program Images</h4>
                  </div>
                  <div className="card-body space-y-4">
                    {/* Main Thumbnail Preview */}
                    <div className="text-center">
                      <div className="mb-4">
                        {thumbnailPreview || 
                         (youtubeUrl && extractYouTubeId(youtubeUrl) ? getYouTubeThumbnail(extractYouTubeId(youtubeUrl)) : null) ? (
                          <img
                            src={
                              thumbnailPreview || 
                              getYouTubeThumbnail(extractYouTubeId(youtubeUrl))
                            }
                            alt="Program thumbnail"
                            className="w-full h-32 object-cover rounded-lg border border-slate-700"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <FiImage className="w-8 h-8 mx-auto mb-2" />
                              <div className="text-sm font-medium">Program Thumbnail</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="btn-secondary cursor-pointer">
                          <FiUpload className="w-4 h-4 mr-2" />
                          Upload Thumbnail
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                          />
                        </label>
                        
                        <p className="text-xs text-slate-500">
                          {customThumbnail ? 'Custom thumbnail selected' : 
                           youtubeUrl && extractYouTubeId(youtubeUrl) ? 'Using YouTube thumbnail' : 
                           'Upload a custom thumbnail or add YouTube URL'}
                        </p>
                      </div>
                    </div>

                    {/* Additional Asset Upload Options */}
                    <div className="border-t border-slate-800 pt-4">
                      <h5 className="text-sm font-semibold text-slate-300 mb-3">Additional Images</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="w-full h-20 bg-slate-800 rounded border border-slate-700 flex items-center justify-center mb-2">
                            <span className="text-xs text-slate-500">Portrait</span>
                          </div>
                          <label className="btn-outline btn-sm cursor-pointer text-xs">
                            Upload
                            <input type="file" accept="image/*" className="hidden" />
                          </label>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-20 bg-slate-800 rounded border border-slate-700 flex items-center justify-center mb-2">
                            <span className="text-xs text-slate-500">Banner</span>
                          </div>
                          <label className="btn-outline btn-sm cursor-pointer text-xs">
                            Upload
                            <input type="file" accept="image/*" className="hidden" />
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Additional images can be uploaded after creating the program
                      </p>
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
                      {topicsLoading ? (
                        <div className="col-span-2 text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
                          <p className="text-slate-400 mt-2">Loading topics...</p>
                        </div>
                      ) : availableTopics.length === 0 ? (
                        <div className="col-span-2 text-center py-4">
                          <p className="text-slate-400">No topics available</p>
                        </div>
                      ) : (
                        availableTopics.map(topic => (
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
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Asset Upload */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-lg font-semibold text-slate-100">Program Assets</h4>
                  </div>
                  <div className="card-body">
                    <p className="text-sm text-slate-400 mb-4">
                      Upload additional assets after creating the program. Manage assets from the program details page.
                    </p>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                      <FiUpload className="mx-auto h-12 w-12 text-slate-600" />
                      <div className="mt-4">
                        <p className="text-sm text-slate-400">
                          Assets can be uploaded after program creation
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Portrait and landscape images required for publishing
                        </p>
                      </div>
                    </div>
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
                disabled={createProgramMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createProgramMutation.isLoading}
              >
                {createProgramMutation.isLoading ? (
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
                    Create Program
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

export default NewProgramModal;