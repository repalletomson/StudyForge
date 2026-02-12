import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../services/programApi';
import * as topicApi from '../services/topicApi';

const NewProgramPage = () => {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsData = await topicApi.getTopics();
        setTopics(topicsData.topics || []);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        toast.error('Failed to load topics');
      }
    };
    loadTopics();
  }, []);

  // Toggle topic selection
  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Form submission
  const onSubmit = async (data) => {
    if (!data.portraitPoster?.trim()) {
      toast.error('Portrait poster is required');
      return;
    }
    if (!data.landscapePoster?.trim()) {
      toast.error('Landscape poster is required');
      return;
    }

    try {
      setCreating(true);
      
      const programData = {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        languagePrimary: 'en',
        languagesAvailable: ['en'],
        topicIds: selectedTopics,
        assets: {
          posters: {
            en: {
              portrait: data.portraitPoster.trim(),
              landscape: data.landscapePoster.trim()
            }
          }
        }
      };

      const result = await programApi.createProgram(programData);
      toast.success('Program created successfully');
      navigate(`/dashboard/programs/${result.program._id}`);
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(error.response?.data?.message || 'Failed to create program');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/programs')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              {/* <FiArrowLeft className="w-5 h-5" /> */}
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Create New Program</h1>
              <p className="text-gray-400 text-sm">Program will publish automatically after adding first lesson</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/programs')}
            className="px-3 py-1 text-gray-400 border border-gray-700 rounded hover:bg-gray-800 text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm  mb-1">
              Program Title *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                errors.title ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="Enter program title"
              {...register('title', { 
                required: 'Program title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' }
              })}
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
              placeholder="Describe your program..."
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
            <select
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
              {...register('difficulty')}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Portrait Poster * <span className="text-gray-500 text-xs">(3:4)</span>
              </label>
              <input
                type="url"
              className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                  errors.portraitPoster ? 'border-red-500' : 'border-gray-700'
                }`}
              {...register('portraitPoster', { required: 'Portrait poster is required' })}
              />
              {errors.portraitPoster && (
                <p className="text-red-400 text-xs mt-1">{errors.portraitPoster.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Landscape Poster * <span className="text-gray-500 text-xs">(4:3)</span>
              </label>
              <input
                type="url"
                className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                  errors.landscapePoster ? 'border-red-500' : 'border-gray-700'
                }`}
                {...register('landscapePoster', { required: 'Landscape poster is required' })}
              />
              {errors.landscapePoster && (
                <p className="text-red-400 text-xs mt-1">{errors.landscapePoster.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Topics</label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {topics.length === 0 ? (
                <p className="text-gray-500 text-xs col-span-3">No topics available</p>
              ) : (
                topics.map(topic => (
                  <label
                    key={topic._id}
                    className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-800 text-xs ${
                      selectedTopics.includes(topic._id) ? 'bg-violet-500/10 border border-violet-500/30' : 'border border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2 text-violet-600 focus:ring-violet-500 bg-gray-800 border-gray-600 scale-75"
                      checked={selectedTopics.includes(topic._id)}
                      onChange={() => toggleTopic(topic._id)}
                    />
                    <span className="text-gray-300 truncate">{topic.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {creating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave className="w-3 h-3" />
                  Create Program
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProgramPage;