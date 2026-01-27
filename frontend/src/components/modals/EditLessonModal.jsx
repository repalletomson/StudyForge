/**
 * Edit Lesson Modal Component - Redesigned Layout
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { FiX, FiSave, FiPlay, FiBookOpen, FiCalendar, FiUpload, FiArchive, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as lessonApi from '../../services/lessonApi';
import AssetInput from '../ui/AssetInput';

const EditLessonModal = ({ isOpen, onClose, lesson }) => {
  const [contentType, setContentType] = useState('video');
  const [isPaid, setIsPaid] = useState(false);
  const [publishAction, setPublishAction] = useState('archive'); // Default to archive
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [assets, setAssets] = useState({
    portrait: '',
    landscape: '',
    banner: ''
  });
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();

  const watchedContentType = watch('contentType');

  // Initialize form with lesson data
  useEffect(() => {
    if (lesson && isOpen) {
      console.log('🔍 EditLessonModal: Initializing form with lesson data:', lesson);
      
      // Reset form first
      reset();
      
      // Set basic fields
      setValue('title', lesson.title || '');
      setValue('description', lesson.description || '');
      setValue('contentType', lesson.contentType || 'video');
      setValue('lessonNumber', lesson.lessonNumber || 1);
      
      // Set duration in minutes
      const durationMinutes = lesson.durationMs ? Math.floor(lesson.durationMs / 60000) : '';
      setValue('durationMs', durationMinutes);
      
      // Get primary language
      const primaryLang = lesson.contentLanguagePrimary || 'en';
      console.log('🌐 Primary language:', primaryLang);
      
      // Set content based on type
      if (lesson.contentType === 'video') {
        const youtubeUrl = lesson.contentUrlsByLanguage?.[primaryLang] || '';
        console.log('📺 Setting YouTube URL:', youtubeUrl);
        setValue('youtubeUrl', youtubeUrl);
        setValue('articleContent', ''); // Clear article content
      } else if (lesson.contentType === 'article') {
        const articleContent = lesson.articleContentByLanguage?.[primaryLang] || '';
        console.log('📝 Setting article content:', articleContent);
        setValue('articleContent', articleContent);
        setValue('youtubeUrl', ''); // Clear YouTube URL
      }
      
      // Set content type state
      setContentType(lesson.contentType || 'video');
      setIsPaid(lesson.isPaid || false);
      
      // Set publish action based on current status
      if (lesson.status === 'published') {
        setPublishAction('published'); // Show current published status
      } else if (lesson.status === 'scheduled') {
        setPublishAction('schedule');
        // Set schedule date/time if available
        if (lesson.publishAt) {
          const publishDate = new Date(lesson.publishAt);
          setScheduleDate(publishDate.toISOString().split('T')[0]);
          setScheduleTime(publishDate.toTimeString().slice(0, 5));
        }
      } else if (lesson.status === 'archived') {
        setPublishAction('archive'); // Show current archived status
      } else {
        setPublishAction('archive'); // Default for drafts (save as draft)
      }
      
      // Initialize assets from lesson data (if available)
      setAssets({
        portrait: lesson.assets?.thumbnails?.[primaryLang]?.portrait || '',
        landscape: lesson.assets?.thumbnails?.[primaryLang]?.landscape || '',
        banner: lesson.assets?.thumbnails?.[primaryLang]?.banner || ''
      });
      
      console.log('✅ Form initialized successfully');
    }
  }, [lesson, isOpen, setValue, reset]);

  const updateLessonMutation = useMutation(
    (data) => lessonApi.updateLesson(lesson._id, data),
    {
      onSuccess: async (updatedLesson) => {
        // Save assets if provided
        const hasAssets = assets.portrait || assets.landscape || assets.banner;
        if (hasAssets) {
          try {
            const assetData = {};
            if (assets.portrait) assetData.portrait = assets.portrait;
            if (assets.landscape) assetData.landscape = assets.landscape;
            if (assets.banner) assetData.banner = assets.banner;
            
            await lessonApi.updateLessonAssets(
              lesson._id,
              lesson.contentLanguagePrimary || 'en',
              'thumbnail',
              assetData
            );
          } catch (assetError) {
            console.error('Failed to save lesson assets:', assetError);
            toast.error('Lesson updated but failed to save assets');
          }
        }

        // Handle publishing actions after update
        if (publishAction === 'publish') {
          publishLessonMutation.mutate();
        } else if (publishAction === 'schedule') {
          if (scheduleDate && scheduleTime) {
            const publishAt = new Date(`${scheduleDate}T${scheduleTime}`);
            scheduleLessonMutation.mutate(publishAt.toISOString());
          }
        } else if (publishAction === 'archive' && lesson.status === 'published') {
          archiveLessonMutation.mutate();
        } else if (publishAction === 'published' || publishAction === 'scheduled' || publishAction === 'archived') {
          // Keep current status - just update without status change
          queryClient.invalidateQueries(['lessons']);
          queryClient.invalidateQueries(['lesson', lesson._id]);
          queryClient.invalidateQueries(['terms']);
          queryClient.invalidateQueries(['programs']);
          toast.success('Lesson updated successfully!');
          handleClose();
        } else {
          // Just update without status change (for drafts)
          queryClient.invalidateQueries(['lessons']);
          queryClient.invalidateQueries(['lesson', lesson._id]);
          queryClient.invalidateQueries(['terms']);
          queryClient.invalidateQueries(['programs']);
          toast.success('Lesson updated successfully!');
          handleClose();
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update lesson');
      }
    }
  );

  const publishLessonMutation = useMutation(
    () => lessonApi.publishLesson(lesson._id),
    {
      onSuccess: () => {
        // Invalidate multiple queries for real-time updates
        queryClient.invalidateQueries(['lessons']);
        queryClient.invalidateQueries(['lesson', lesson._id]);
        queryClient.invalidateQueries(['programs']); // Update programs list for status changes
        queryClient.invalidateQueries(['terms']); // Update terms for lesson counts
        toast.success('Lesson published successfully!');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to publish lesson');
      }
    }
  );

  const scheduleLessonMutation = useMutation(
    (publishAt) => lessonApi.scheduleLesson(lesson._id, publishAt),
    {
      onSuccess: () => {
        // Invalidate multiple queries for real-time updates
        queryClient.invalidateQueries(['lessons']);
        queryClient.invalidateQueries(['lesson', lesson._id]);
        queryClient.invalidateQueries(['programs']); // Update programs list
        toast.success('Lesson scheduled successfully!');
        setShowScheduleModal(false);
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to schedule lesson');
      }
    }
  );

  const archiveLessonMutation = useMutation(
    () => lessonApi.archiveLesson(lesson._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lessons']);
        queryClient.invalidateQueries(['lesson', lesson._id]);
        toast.success('Lesson archived successfully!');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to archive lesson');
      }
    }
  );

  const handleClose = () => {
    console.log('🔒 EditLessonModal: Closing modal');
    reset();
    setContentType('video');
    setIsPaid(false);
    setPublishAction('archive');
    setScheduleDate('');
    setScheduleTime('');
    setAssets({ portrait: '', landscape: '', banner: '' });
    onClose();
  };

  // Check if required assets are provided
  const hasRequiredAssets = assets.portrait && assets.portrait.trim() && 
                           assets.landscape && assets.landscape.trim();

  const onSubmit = (data) => {
    console.log('🚀 EditLessonModal: Submitting form data:', data);
    console.log('📊 Current contentType state:', contentType);
    
    // Validate required assets
    if (!assets.portrait || !assets.portrait.trim()) {
      toast.error('Portrait thumbnail is required');
      return;
    }
    
    if (!assets.landscape || !assets.landscape.trim()) {
      toast.error('Landscape thumbnail is required');
      return;
    }
    
    // Validate schedule if needed
    if (publishAction === 'schedule') {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Please select both date and time for scheduling');
        return;
      }
      const publishAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (publishAt <= new Date()) {
        toast.error('Schedule time must be in the future');
        return;
      }
    }
    
    const primaryLang = lesson.contentLanguagePrimary || 'en';
    
    const lessonData = {
      title: data.title,
      description: data.description || '',
      contentType,
      lessonNumber: parseInt(data.lessonNumber),
      isPaid,
      durationMs: data.durationMs ? parseInt(data.durationMs) * 60000 : null,
      contentLanguagePrimary: primaryLang,
      contentLanguagesAvailable: lesson.contentLanguagesAvailable || [primaryLang],
    };
    
    // Handle content based on type
    if (contentType === 'video') {
      lessonData.contentUrlsByLanguage = data.youtubeUrl ? 
        { [primaryLang]: data.youtubeUrl } : {};
      lessonData.articleContentByLanguage = {}; // Clear article content
      console.log('📺 Video lesson - YouTube URL:', data.youtubeUrl);
    } else if (contentType === 'article') {
      lessonData.articleContentByLanguage = data.articleContent ? 
        { [primaryLang]: data.articleContent } : {};
      lessonData.contentUrlsByLanguage = {}; // Clear video URLs
      console.log('📝 Article lesson - Content length:', data.articleContent?.length || 0);
    }
    
    console.log('📤 Final lesson data being sent:', lessonData);
    
    // First update the lesson
    updateLessonMutation.mutate(lessonData);
  };



  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    // Enhanced regex to handle more YouTube URL patterns
    const match = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-end min-h-screen">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Right-side Modal */}
        <div className="relative w-full max-w-2xl h-screen overflow-y-auto bg-black shadow-2xl border-l border-gray-800 animate-slide-in-right">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white font-display">
                  Edit Lesson
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Update lesson information and content
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Lesson Number *</label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${errors.lessonNumber ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="1"
                    {...register('lessonNumber', { 
                      required: 'Lesson number is required',
                      min: { value: 1, message: 'Lesson number must be at least 1' }
                    })}
                  />
                  {errors.lessonNumber && (
                    <p className="mt-1 text-sm text-red-400">{errors.lessonNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="30"
                    {...register('durationMs')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lesson Title *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="Enter lesson title"
                  {...register('title', { 
                    required: 'Lesson title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' }
                  })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  placeholder="Describe the lesson content..."
                  {...register('description')}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-gray-800 border-gray-700 rounded focus:ring-violet-500 focus:ring-2"
                />
                <label htmlFor="isPaid" className="ml-3 text-sm text-gray-300">
                  💰 This is a paid lesson
                </label>
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Content Type</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  contentType === 'video'
                    ? 'border-red-500 bg-red-900/20 text-red-400'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="contentType"
                    value="video"
                    checked={contentType === 'video'}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      setValue('contentType', e.target.value);
                    }}
                    className="sr-only"
                  />
                  <FiPlay className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Video</div>
                    <div className="text-xs opacity-75">YouTube video</div>
                  </div>
                </label>

                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  contentType === 'article'
                    ? 'border-violet-500 bg-violet-900/20 text-violet-400'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="contentType"
                    value="article"
                    checked={contentType === 'article'}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      setValue('contentType', e.target.value);
                    }}
                    className="sr-only"
                  />
                  <FiBookOpen className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Article</div>
                    <div className="text-xs opacity-75">Text content</div>
                  </div>
                </label>
              </div>

              {/* Content Input */}
              {watchedContentType === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiPlay className="inline w-4 h-4 mr-2" />
                    YouTube Video URL
                  </label>
                  <input
                    type="url"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${errors.youtubeUrl ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    {...register('youtubeUrl', {
                      pattern: {
                        value: /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                        message: 'Please enter a valid YouTube URL'
                      }
                    })}
                  />
                  {errors.youtubeUrl && (
                    <p className="mt-1 text-sm text-red-400">{errors.youtubeUrl.message}</p>
                  )}
                  {watch('youtubeUrl') && extractYouTubeId(watch('youtubeUrl')) && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <p className="text-sm text-green-400 mb-2">✓ Valid YouTube video detected</p>
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(watch('youtubeUrl'))}`}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="YouTube Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiBookOpen className="inline w-4 h-4 mr-2" />
                    Article Content
                  </label>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    placeholder="Write your article content here..."
                    {...register('articleContent')}
                  />
                </div>
              )}
            </div>

            {/* Media Assets */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                <FiImage className="inline w-5 h-5 mr-2" />
                Lesson Media
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Portrait Thumbnail <span className="text-red-400">*</span>
                  </label>
                  <AssetInput
                    value={assets.portrait}
                    onChange={(value) => setAssets(prev => ({ ...prev, portrait: value }))}
                    placeholder="https://example.com/portrait.jpg"
                    aspectRatio="3:4"
                    compact={true}
                    required={true}
                    className="w-full"
                  />
                  {assets.portrait && (
                    <div className="mt-1">
                      <img 
                        src={assets.portrait} 
                        alt="Portrait preview" 
                        className="w-6 h-8 object-cover rounded border border-gray-700"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Landscape Thumbnail <span className="text-red-400">*</span>
                  </label>
                  <AssetInput
                    value={assets.landscape}
                    onChange={(value) => setAssets(prev => ({ ...prev, landscape: value }))}
                    placeholder="https://example.com/landscape.jpg"
                    aspectRatio="16:9"
                    compact={true}
                    required={true}
                    className="w-full"
                  />
                  {assets.landscape && (
                    <div className="mt-1">
                      <img 
                        src={assets.landscape} 
                        alt="Landscape preview" 
                        className="w-8 h-5 object-cover rounded border border-gray-700"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                  <AssetInput
                    value={assets.banner}
                    onChange={(value) => setAssets(prev => ({ ...prev, banner: value }))}
                    placeholder="https://example.com/banner.jpg"
                    aspectRatio="16:9"
                    compact={true}
                    className="w-full"
                  />
                  {assets.banner && (
                    <div className="mt-1">
                      <img 
                        src={assets.banner} 
                        alt="Banner preview" 
                        className="w-8 h-5 object-cover rounded border border-gray-700"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800">
                <p className="text-sm text-amber-200">
                  <strong>Required:</strong> Portrait and landscape thumbnails are mandatory.
                </p>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Publishing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                <select
                  value={publishAction}
                  onChange={(e) => setPublishAction(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  {lesson?.status === 'published' && (
                    <option value="published">Keep Published</option>
                  )}
                  {lesson?.status === 'scheduled' && (
                    <option value="scheduled">Keep Scheduled</option>
                  )}
                  {lesson?.status === 'archived' && (
                    <option value="archived">Keep Archived</option>
                  )}
                  <option value="archive">
                    {lesson?.status === 'published' ? 'Archive (Unpublish)' : 'Archive (Save as draft)'}
                  </option>
                  <option value="publish">Publish Now</option>
                  <option value="schedule">Schedule for Later</option>
                </select>
              </div>

              {publishAction === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Current Status Display */}
              {lesson && (
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">
                    Current Status: <span className={`font-medium ${
                      lesson.status === 'published' ? 'text-green-400' :
                      lesson.status === 'scheduled' ? 'text-violet-400' :
                      lesson.status === 'archived' ? 'text-orange-400' :
                      'text-gray-300'
                    }`}>
                      {lesson.status === 'published' ? 'Published' :
                       lesson.status === 'scheduled' ? 'Scheduled' :
                       lesson.status === 'archived' ? 'Archived' :
                       'Draft'}
                    </span>
                  </p>
                  {lesson.status === 'scheduled' && lesson.publishAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Scheduled for: {new Date(lesson.publishAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-black border-t border-gray-800 pt-6 -mx-6 px-6 pb-6">
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                  disabled={updateLessonMutation.isLoading || publishLessonMutation.isLoading || scheduleLessonMutation.isLoading || archiveLessonMutation.isLoading || !hasRequiredAssets}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    publishAction === 'publish' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : publishAction === 'schedule'
                      ? 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'
                      : publishAction === 'published'
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : publishAction === 'scheduled'
                      ? 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'
                      : publishAction === 'archived'
                      ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                  disabled={updateLessonMutation.isLoading || publishLessonMutation.isLoading || scheduleLessonMutation.isLoading || archiveLessonMutation.isLoading || !hasRequiredAssets}
                >
                  {(updateLessonMutation.isLoading || publishLessonMutation.isLoading || scheduleLessonMutation.isLoading || archiveLessonMutation.isLoading) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {publishAction === 'publish' ? 'Publishing...' : 
                       publishAction === 'schedule' ? 'Scheduling...' : 
                       publishAction === 'published' ? 'Updating...' :
                       publishAction === 'scheduled' ? 'Updating...' :
                       publishAction === 'archived' ? 'Updating...' :
                       'Updating...'}
                    </>
                  ) : (
                    <>
                      {publishAction === 'publish' ? (
                        <>
                          <FiUpload className="w-4 h-4 mr-2" />
                          Update & Publish
                        </>
                      ) : publishAction === 'schedule' ? (
                        <>
                          <FiCalendar className="w-4 h-4 mr-2" />
                          Update & Schedule
                        </>
                      ) : publishAction === 'published' ? (
                        <>
                          <FiSave className="w-4 h-4 mr-2" />
                          Update Lesson
                        </>
                      ) : publishAction === 'scheduled' ? (
                        <>
                          <FiSave className="w-4 h-4 mr-2" />
                          Update Lesson
                        </>
                      ) : publishAction === 'archived' ? (
                        <>
                          <FiSave className="w-4 h-4 mr-2" />
                          Update Lesson
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4 mr-2" />
                          {lesson?.status === 'published' && publishAction === 'archive' ? 'Update & Archive' : 'Update Lesson'}
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLessonModal;