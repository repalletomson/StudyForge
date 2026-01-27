/**
 * Edit Program Page Component
 * Dedicated page for editing programs (similar to create program page)
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiCheck, FiX, FiImage, FiBookOpen, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../services/programApi';
import * as topicApi from '../services/topicApi';
import AssetInput from '../components/ui/AssetInput';
import { useAuth } from '../contexts/AuthContext';

const EditProgramPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [languages, setLanguages] = useState(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [assets, setAssets] = useState({
    portrait: '',
    landscape: '',
    square: '',
    banner: ''
  });
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // Fetch program data
  const { data: program, isLoading: programLoading } = useQuery(
    ['program', id],
    () => programApi.getProgram(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        // Initialize form with program data
        setValue('title', data.title);
        setValue('description', data.description || '');
        setValue('youtubeUrl', data.youtubeUrl || '');
        setValue('difficulty', data.difficulty || 'beginner');
        setPrimaryLanguage(data.languagePrimary);
        setLanguages(data.languagesAvailable || ['en']);
        setSelectedTopics(data.topicIds?.map(topic => topic._id) || []);
        
        // Initialize assets
        if (data.assets?.posters?.[data.languagePrimary]) {
          const programAssets = data.assets.posters[data.languagePrimary];
          setAssets({
            portrait: programAssets.portrait || '',
            landscape: programAssets.landscape || '',
            square: programAssets.square || '',
            banner: programAssets.banner || ''
          });
        }
      }
    }
  );

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

  // Update program mutation
  const updateProgramMutation = useMutation(
    (data) => programApi.updateProgram(id, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('programs');
        queryClient.invalidateQueries(['program', id]);
        toast.success('Program updated successfully');
        navigate(`/dashboard/programs/${data._id || id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update program');
      }
    }
  );

  // Delete program mutation
  const deleteProgramMutation = useMutation(programApi.deleteProgram, {
    onSuccess: () => {
      queryClient.invalidateQueries('programs');
      toast.success('Program deleted successfully');
      navigate('/dashboard/programs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete program');
    }
  });

  // Handle asset changes
  const handleAssetChange = (variant, url) => {
    setAssets(prev => ({
      ...prev,
      [variant]: url
    }));
  };

  // Toggle topic selection
  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Language management
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

  // Handle delete program
  const handleDeleteProgram = () => {
    if (window.confirm(`Are you sure you want to delete "${program?.title}"? This action cannot be undone and will delete all terms, lessons, and assets associated with this program.`)) {
      deleteProgramMutation.mutate(id);
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    // Validate required assets
    if (!assets.portrait || !assets.portrait.trim()) {
      toast.error('Portrait poster is required');
      return;
    }
    
    if (!assets.landscape || !assets.landscape.trim()) {
      toast.error('Landscape poster is required');
      return;
    }
    
    const youtubeVideoId = extractYouTubeId(data.youtubeUrl);
    
    const programData = {
      ...data,
      youtubeVideoId,
      languagePrimary: primaryLanguage,
      languagesAvailable: languages,
      topicIds: selectedTopics,
      assets: {
        posters: {
          [primaryLanguage]: Object.entries(assets)
            .filter(([_, url]) => url.trim())
            .reduce((acc, [variant, url]) => {
              acc[variant] = url.trim();
              return acc;
            }, {})
        }
      }
    };
    
    updateProgramMutation.mutate(programData);
  };

  // Check if required assets are provided
  const hasRequiredAssets = assets.portrait && assets.portrait.trim() && 
                           assets.landscape && assets.landscape.trim();

  if (programLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Program not found</h1>
          <button
            onClick={() => navigate('/dashboard/programs')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/dashboard/programs/${id}`)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Program</h1>
              <p className="text-gray-400 mt-1">Update program information and settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/dashboard/programs/${id}`)}
              className="px-4 py-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {hasRole('admin') && (
              <button
                onClick={handleDeleteProgram}
                disabled={deleteProgramMutation.isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Delete Program
              </button>
            )}
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={updateProgramMutation.isLoading || !hasRequiredAssets}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {updateProgramMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  {hasRequiredAssets ? 'Update Program' : 'Add Required Assets'}
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <FiBookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Program Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        errors.title ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="Enter program title"
                      {...register('title', { 
                        required: 'Program title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' }
                      })}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      placeholder="Describe your program..."
                      {...register('description')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">YouTube Video URL</label>
                    <input
                      type="url"
                      className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        errors.youtubeUrl ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...register('youtubeUrl', {
                        pattern: {
                          value: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
                          message: 'Please enter a valid YouTube URL'
                        }
                      })}
                    />
                    {errors.youtubeUrl && (
                      <p className="text-red-400 text-sm mt-1">{errors.youtubeUrl.message}</p>
                    )}
                    {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                      <div className="mt-2 p-2 bg-green-900/20 border border-green-800 rounded-lg">
                        <p className="text-sm text-green-400">✓ Valid YouTube video detected</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
                    <select
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      {...register('difficulty')}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Program Assets */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <FiImage className="w-4 h-4 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Program Assets</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AssetInput
                    label="Portrait Poster"
                    value={assets.portrait}
                    onChange={(url) => handleAssetChange('portrait', url)}
                    placeholder="https://example.com/portrait-poster.jpg"
                    aspectRatio="3:4"
                    compact={true}
                    required={true}
                  />
                  <AssetInput
                    label="Landscape Poster"
                    value={assets.landscape}
                    onChange={(url) => handleAssetChange('landscape', url)}
                    placeholder="https://example.com/landscape-poster.jpg"
                    aspectRatio="4:3"
                    compact={true}
                    required={true}
                  />
                  <AssetInput
                    label="Square Poster"
                    value={assets.square}
                    onChange={(url) => handleAssetChange('square', url)}
                    placeholder="https://example.com/square-poster.jpg"
                    aspectRatio="1:1"
                    compact={true}
                  />
                  <AssetInput
                    label="Banner Poster"
                    value={assets.banner}
                    onChange={(url) => handleAssetChange('banner', url)}
                    placeholder="https://example.com/banner-poster.jpg"
                    aspectRatio="16:9"
                    compact={true}
                  />
                </div>
                
                <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-800">
                  <p className="text-sm text-amber-200">
                    <strong>Required:</strong> Portrait and landscape posters are mandatory.
                  </p>
                </div>
                    <strong>Note:</strong> Portrait and landscape posters are required for publishing. All images should be high-quality and represent your program content.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-8">
              {/* Topics Selection */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Topics & Categories</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Select Topics</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topicsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500 mx-auto"></div>
                        <p className="text-gray-400 mt-2 text-sm">Loading topics...</p>
                      </div>
                    ) : availableTopics.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">No topics available</p>
                      </div>
                    ) : (
                      availableTopics.map(topic => (
                        <label
                          key={topic._id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTopics.includes(topic._id)
                              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
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
                              : 'border-gray-600'
                          }`}>
                            {selectedTopics.includes(topic._id) && (
                              <FiCheck className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{topic.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Language Settings */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Language Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Language</label>
                    <select
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Available Languages</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {languages.map(langCode => {
                        const lang = availableLanguages.find(l => l.code === langCode);
                        return (
                          <span
                            key={langCode}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              langCode === primaryLanguage
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : 'bg-gray-700 text-gray-300 border border-gray-600'
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
                                className="ml-2 text-gray-400 hover:text-red-400"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    
                    <select
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProgramPage;