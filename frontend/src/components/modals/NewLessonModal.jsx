import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiPlus, FiCalendar } from 'react-icons/fi';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import * as lessonApi from '../../services/lessonApi';

const NewLessonModal = ({ isOpen, onClose, termId, onSuccess }) => {
  const [contentType, setContentType] = useState('video');
  const [publishOption, setPublishOption] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      lessonNumber: 1,
      title: '',
      description: '',
      durationMs: '',
      youtubeUrl: '',
      articleContent: '',
      portraitThumbnail: '',
      landscapeThumbnail: '',
      publishAt: ''
    }
  });

  const watchPublishAt = watch('publishAt');

  // Fetch existing lessons to calculate next lesson number
  useEffect(() => {
    if (isOpen && termId) {
      const fetchLessons = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const response = await fetch(`${apiUrl}/api/admin/terms/${termId}/lessons`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const maxLessonNumber = data.lessons.length > 0
              ? Math.max(...data.lessons.map(l => l.lessonNumber))
              : 0;
            const nextNumber = maxLessonNumber + 1;
            setValue('lessonNumber', nextNumber);
          }
        } catch (error) {
          console.error('Error fetching lessons:', error);
        }
      };
      fetchLessons();
    }
  }, [isOpen, termId, setValue]);

  const createLesson = async (data) => {
    try {
      setIsSubmitting(true);
      
      const lessonData = {
        title: data.title,
        description: data.description || '',
        contentType,
        lessonNumber: parseInt(data.lessonNumber),
        isPaid: false,
        durationMs: data.durationMs ? parseInt(data.durationMs) * 60000 : null,
        contentLanguagePrimary: 'en',
        contentLanguagesAvailable: ['en'],
      };

      // Handle content based on type
      if (contentType === 'video') {
        lessonData.contentUrlsByLanguage = data.youtubeUrl ? 
          { en: data.youtubeUrl } : {};
        lessonData.articleContentByLanguage = {};
      } else if (contentType === 'article') {
        lessonData.articleContentByLanguage = data.articleContent ? 
          { en: data.articleContent } : {};
        lessonData.contentUrlsByLanguage = {};
      }

      const newLesson = await lessonApi.createLesson(termId, lessonData);
      
      // Save thumbnails if provided
      const hasThumbnails = data.portraitThumbnail || data.landscapeThumbnail;
      if (hasThumbnails) {
        try {
          const assetData = {};
          if (data.portraitThumbnail) assetData.portrait = data.portraitThumbnail;
          if (data.landscapeThumbnail) assetData.landscape = data.landscapeThumbnail;
          
          await lessonApi.updateLessonAssets(
            newLesson._id,
            'en',
            'thumbnail',
            assetData
          );
        } catch (assetError) {
          console.error('Failed to save lesson assets:', assetError);
        }
      }

      // Handle publish option
      if (publishOption === 'publish') {
        await lessonApi.publishLesson(newLesson._id);
        showSuccessToast('Lesson created and published successfully!');
      } else if (publishOption === 'schedule') {
        if (!data.publishAt) {
          throw new Error('Publish date is required for scheduled lessons');
        }
        await lessonApi.scheduleLesson(newLesson._id, data.publishAt);
        showSuccessToast('Lesson created and scheduled successfully!');
      } else {
        showSuccessToast('Lesson created as draft successfully!');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to create lesson:', error);
      showErrorToast(error, 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data) => {
    if (!data.portraitThumbnail?.trim()) {
      showErrorToast(new Error('Portrait thumbnail is required'));
      return;
    }
    if (!data.landscapeThumbnail?.trim()) {
      showErrorToast(new Error('Landscape thumbnail is required'));
      return;
    }

    if (publishOption === 'schedule' && !data.publishAt) {
      showErrorToast(new Error('Publish date is required for scheduled lessons'));
      return;
    }

    if (publishOption === 'schedule' && new Date(data.publishAt) <= new Date()) {
      showErrorToast(new Error('Publish date must be in the future'));
      return;
    }

    createLesson(data);
  };

  const handleClose = () => {
    reset();
    setContentType('video');
    setPublishOption('draft');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-950 rounded-lg shadow-xl w-full max-w-2xl border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Create New Lesson</h2>
            <p className="text-sm text-gray-400">Add a new lesson to the term</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Lesson Number *</label>
              <input
                type="number"
                min="1"
                className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                  errors.lessonNumber ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="1"
                {...register('lessonNumber', { 
                  required: 'Lesson number is required',
                  min: { value: 1, message: 'Lesson number must be at least 1' }
                })}
              />
              {errors.lessonNumber && (
                <p className="text-red-400 text-xs mt-1">{errors.lessonNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="30"
                {...register('durationMs')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                errors.title ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="Enter lesson title"
              {...register('title', { required: 'Title is required' })}
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
              placeholder="Enter lesson description"
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Content Type</label>
            <div className="flex gap-4">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  value="video"
                  checked={contentType === 'video'}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mr-2 text-violet-600 focus:ring-violet-500"
                />
                Video
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  value="article"
                  checked={contentType === 'article'}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mr-2 text-violet-600 focus:ring-violet-500"
                />
                Article
              </label>
            </div>
          </div>

          {contentType === 'video' && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">YouTube URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register('youtubeUrl')}
              />
            </div>
          )}

          {contentType === 'article' && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Article Content *</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="Enter article content..."
                {...register('articleContent')}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Portrait Thumbnail * <span className="text-gray-500 text-xs">(3:4)</span>
              </label>
              <input
                type="url"
                className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                  errors.portraitThumbnail ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="https://example.com/portrait.jpg"
                {...register('portraitThumbnail', { required: 'Portrait thumbnail is required' })}
              />
              {errors.portraitThumbnail && (
                <p className="text-red-400 text-xs mt-1">{errors.portraitThumbnail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Landscape Thumbnail * <span className="text-gray-500 text-xs">(4:3)</span>
              </label>
              <input
                type="url"
                className={`w-full px-3 py-2 bg-black border rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                  errors.landscapeThumbnail ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="https://example.com/landscape.jpg"
                {...register('landscapeThumbnail', { required: 'Landscape thumbnail is required' })}
              />
              {errors.landscapeThumbnail && (
                <p className="text-red-400 text-xs mt-1">{errors.landscapeThumbnail.message}</p>
              )}
            </div>
          </div>

          {/* Publish Options */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Publish Option</label>
            <div className="space-y-2">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  value="draft"
                  checked={publishOption === 'draft'}
                  onChange={(e) => setPublishOption(e.target.value)}
                  className="mr-2 text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-2">
                  Save as Draft
                  <span className="text-xs text-gray-500">(can publish later)</span>
                </span>
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  value="publish"
                  checked={publishOption === 'publish'}
                  onChange={(e) => setPublishOption(e.target.value)}
                  className="mr-2 text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-2">
                  Publish Now
                  <span className="text-xs text-gray-500">(if first lesson, auto-publishes program)</span>
                </span>
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  value="schedule"
                  checked={publishOption === 'schedule'}
                  onChange={(e) => setPublishOption(e.target.value)}
                  className="mr-2 text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-2">
                  <FiCalendar className="w-3 h-3" />
                  Schedule for Later
                  <span className="text-xs text-gray-500">(set publish date)</span>
                </span>
              </label>
            </div>

            {publishOption === 'schedule' && (
              <div className="mt-3">
                <label className="block text-sm text-gray-300 mb-1">Publish Date & Time *</label>
                <input
                  type="datetime-local"
                  className={`w-full px-3 py-2 bg-black border rounded text-white focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm ${
                    errors.publishAt ? 'border-red-500' : 'border-gray-700'
                  }`}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // 1 minute from now
                  {...register('publishAt', { 
                    required: publishOption === 'schedule' ? 'Publish date is required' : false
                  })}
                />
                {errors.publishAt && (
                  <p className="text-red-400 text-xs mt-1">{errors.publishAt.message}</p>
                )}
                {watchPublishAt && new Date(watchPublishAt) <= new Date() && (
                  <p className="text-red-400 text-xs mt-1">Publish date must be in the future</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1 text-gray-400 border border-gray-700 rounded hover:bg-gray-800 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {publishOption === 'publish' ? 'Publishing...' : 
                   publishOption === 'schedule' ? 'Scheduling...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiPlus className="w-3 h-3" />
                  {publishOption === 'publish' ? 'Create & Publish' : 
                   publishOption === 'schedule' ? 'Create & Schedule' : 'Create Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLessonModal;