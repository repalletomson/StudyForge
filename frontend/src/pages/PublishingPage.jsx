import { useState, useEffect } from 'react';
import { FiEdit3, FiCalendar } from 'react-icons/fi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as programApi from '../services/programApi';
import * as lessonApi from '../services/lessonApi';
import toast from 'react-hot-toast';

const PublishingPage = () => {
  const [programs, setPrograms] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/programs/publishing-data`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
        setAllLessons(data.lessons || []);
      } else {
        throw new Error('Failed to load publishing data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePublishLesson = async (lesson) => {
    if (window.confirm(`Publish "${lesson.title}" now?`)) {
      try {
        await lessonApi.publishLesson(lesson._id);
        toast.success('Lesson published');
        loadData();
      } catch (error) {
        toast.error('Failed to publish lesson');
      }
    }
  };

  const handleArchiveLesson = async (lesson) => {
    if (window.confirm(`Archive "${lesson.title}"?`)) {
      try {
        await lessonApi.archiveLesson(lesson._id);
        toast.success('Lesson archived');
        loadData();
      } catch (error) {
        toast.error('Failed to archive lesson');
      }
    }
  };

  const scheduledLessons = allLessons.filter(l => l.status === 'scheduled');
  const draftPrograms = programs.filter(p => p.status === 'draft');
  const draftLessons = allLessons.filter(l => l.status === 'draft');

  const allItems = [
    ...scheduledLessons.map(l => ({ ...l, type: 'lesson', category: 'Scheduled Lesson' })),
    ...draftPrograms.map(p => ({ ...p, type: 'program', category: 'Draft Program' })),
    ...draftLessons.map(l => ({ ...l, type: 'lesson', category: 'Draft Lesson' }))
  ];

  const formatDateTime = (date) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Publishing Dashboard</h1>
        <p className="mt-2 text-gray-400">Manage scheduled lessons and draft content</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-6">All Content</h2>
        <div className="space-y-4">
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
              <p className="text-gray-400">No scheduled lessons or draft content available.</p>
            </div>
          ) : (
            allItems.map(item => (
              <div key={`${item.type}-${item._id}`} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <span className="text-sm text-gray-400">{item.category}</span>
                    </div>
                    
                    {item.type === 'lesson' && item.programTitle && (
                      <p className="text-sm text-gray-500 mb-2">
                        {item.programTitle} → {item.termTitle}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-400">
                      {item.status === 'scheduled' && item.publishAt && (
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          Scheduled for {formatDateTime(item.publishAt)}
                        </div>
                      )}
                      {item.status === 'draft' && (
                        <div className="flex items-center">
                          <FiEdit3 className="w-4 h-4 mr-1" />
                          Last updated {formatDateTime(item.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.status === 'scheduled' && item.type === 'lesson' && (
                      <>
                        <button
                          onClick={() => handlePublishLesson(item)}
                          className="text-green-400 hover:text-green-300 px-3 py-1 rounded hover:bg-green-900/20 transition-colors text-sm"
                        >
                          Publish Now
                        </button>
                        <button
                          onClick={() => handleArchiveLesson(item)}
                          className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-900/20 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {item.status === 'draft' && item.type === 'lesson' && (
                      <button
                        onClick={() => handlePublishLesson(item)}
                        className="text-green-400 hover:text-green-300 px-3 py-1 rounded hover:bg-green-900/20 transition-colors text-sm"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishingPage;