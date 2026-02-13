import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiSave } from 'react-icons/fi';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import * as programApi from '../../services/programApi';
import * as topicApi from '../../services/topicApi';

const EditProgramModal = ({ isOpen, onClose, program, onUpdate }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsData = await topicApi.getTopics();
        setTopics(topicsData.topics || []);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      }
    };
    loadTopics();
  }, []);

  // Initialize form with program data
  useEffect(() => {
    if (program && isOpen) {
      setValue('title', program.title);
      setValue('description', program.description || '');
      setValue('difficulty', program.difficulty || 'beginner');
    
      const posters = program.assets?.posters?.[program.languagePrimary];
      setValue('portraitPoster', posters?.portrait || '');
      setValue('landscapePoster', posters?.landscape || '');
      
      const topicIds = program.topicIds?.map(topic => topic._id) || [];
      setSelectedTopics(topicIds);
    }
  }, [program, isOpen, setValue]);

  const updateProgram = async (data) => {
    try {
      setIsSubmitting(true);
      
      const programData = {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        languagePrimary: program.languagePrimary || 'en',
        languagesAvailable: program.languagesAvailable || ['en'],
        topicIds: selectedTopics,
        assets: {
          posters: {
            [program.languagePrimary || 'en']: {
              portrait: data.portraitPoster.trim(),
              landscape: data.landscapePoster.trim()
            }
          }
        }
      };

      await programApi.updateProgram(program._id, programData);
      showSuccessToast('Program updated successfully');
      
      if (onUpdate) {
        onUpdate();
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to update program:', error);
      showErrorToast(error, 'Failed to update program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTopics([]);
    setIsSubmitting(false);
    onClose();
  };

  const onSubmit = (data) => {
    if (!data.portraitPoster?.trim()) {
      showErrorToast('Portrait poster is required');
      return;
    }
    if (!data.landscapePoster?.trim()) {
      showErrorToast('Landscape poster is required');
      return;
    }
    updateProgram(data);
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900/75 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="inline-block w-full max-w-2xl p-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-950 shadow-2xl rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Edit Program</h3>
              <p className="text-sm text-gray-400">Update program information</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
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
                  placeholder="https://example.com/portrait.jpg"
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
                  placeholder="https://example.com/landscape.jpg"
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 text-gray-400 border border-gray-700 rounded hover:bg-gray-800 text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-3 h-3" />
                    Update Program
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

export default EditProgramModal;