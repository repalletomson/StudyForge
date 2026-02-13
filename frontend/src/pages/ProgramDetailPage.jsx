import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiTrash2, FiPlus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as programApi from '../services/programApi';
import * as termApi from '../services/termApi';
import * as lessonApi from '../services/lessonApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NewTermModal from '../components/modals/NewTermModal';
import NewLessonModal from '../components/modals/NewLessonModal';
import EditProgramModal from '../components/modals/EditProgramModal';
import EditLessonModal from '../components/modals/EditLessonModal';
import LessonViewerModal from '../components/modals/LessonViewerModal';
import { showErrorToast, extractErrorMessage } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const ProgramDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // State
  const [program, setProgram] = useState(null);
  const [terms, setTerms] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTermModalOpen, setIsNewTermModalOpen] = useState(false);
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isLessonViewerOpen, setIsLessonViewerOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [portraitPoster, setPortraitPoster] = useState('');
  const [landscapePoster, setLandscapePoster] = useState('');

  // Auto-update assets when URLs change
  const updateAssets = async (newPortrait, newLandscape) => {
    if (!program) return;
    
    try {
      const programData = {
        title: program.title,
        description: program.description,
        difficulty: program.difficulty,
        languagePrimary: program.languagePrimary || 'en',
        languagesAvailable: program.languagesAvailable || ['en'],
        topicIds: program.topicIds?.map(topic => topic._id) || [],
        assets: {
          posters: {
            [program.languagePrimary || 'en']: {
              portrait: newPortrait.trim(),
              landscape: newLandscape.trim()
            }
          }
        }
      };

      await programApi.updateProgram(program._id, programData);
      
      // Update program state without full reload
      setProgram(prev => ({
        ...prev,
        assets: {
          ...prev.assets,
          posters: {
            ...prev.assets?.posters,
            [prev.languagePrimary || 'en']: {
              portrait: newPortrait.trim(),
              landscape: newLandscape.trim()
            }
          }
        }
      }));
      
    } catch (error) {
      console.error('Failed to update assets:', error);
      toast.error('Failed to update assets');
    }
  };

  // Handle poster URL changes with debounce
  useEffect(() => {
    if (!program || !portraitPoster || !landscapePoster) return;
    
    const currentPosters = program.assets?.posters?.[program.languagePrimary];
    const currentPortrait = currentPosters?.portrait || '';
    const currentLandscape = currentPosters?.landscape || '';
    
    // Only update if values have actually changed
    if (portraitPoster === currentPortrait && landscapePoster === currentLandscape) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      if (portraitPoster.trim() && landscapePoster.trim()) {
        updateAssets(portraitPoster, landscapePoster);
      }
    }, 2000); // 2 second debounce to prevent excessive updates

    return () => clearTimeout(timeoutId);
  }, [portraitPoster, landscapePoster]); // Remove program from dependencies to prevent loops

  // Load all data at once to prevent inconsistent loading
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load program data first
      const programData = await programApi.getProgram(id);
      setProgram(programData);
      
      // Set poster URLs for auto-update
      const posters = programData.assets?.posters?.[programData.languagePrimary];
      setPortraitPoster(posters?.portrait || '');
      setLandscapePoster(posters?.landscape || '');
      
      // Load terms data
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const termsResponse = await fetch(`${apiUrl}/api/admin/programs/${id}/terms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: AbortSignal.timeout(30000)
      });
      
      if (!termsResponse.ok) {
        const errorData = await termsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch terms');
      }
      
      const termsData = await termsResponse.json();
      const termsArray = termsData.terms || [];
      setTerms(termsArray);
      
      // Load lessons for all terms
      const allLessons = [];
      if (termsArray.length > 0) {
        for (const term of termsArray) {
          try {
            const lessonsResponse = await fetch(`${apiUrl}/api/admin/terms/${term._id}/lessons`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              signal: AbortSignal.timeout(30000)
            });
            
            if (lessonsResponse.ok) {
              const termLessons = await lessonsResponse.json();
              allLessons.push(...(termLessons.lessons || []).map(lesson => ({
                ...lesson,
                termId: term._id,
                termTitle: term.title
              })));
            }
          } catch (error) {
            console.warn(`Error fetching lessons for term ${term._id}:`, error);
          }
        }
      }
      
      setLessons(allLessons);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error);
      showErrorToast(error, 'Failed to load program details');
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only run once when component mounts or ID changes
  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]); // Only depend on ID, not on other state variables

  // Delete program
  const [deletingProgram, setDeletingProgram] = useState(false);
  const handleDeleteProgram = async () => {
    if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingProgram(true);
      await programApi.deleteProgram(id);
      toast.success('Program deleted successfully');
      navigate('/dashboard/programs');
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast.error(error.response?.data?.message || 'Failed to delete program');
    } finally {
      setDeletingProgram(false);
    }
  };

  // Lesson operations
  const [deletingLesson, setDeletingLesson] = useState(null);
  
  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      return;
    }

    try {
      setDeletingLesson(lesson._id);
      await lessonApi.deleteLesson(lesson._id);
      toast.success('Lesson deleted successfully');
      loadAllData(); // Reload all data
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error(error.response?.data?.message || 'Failed to delete lesson');
    } finally {
      setDeletingLesson(null);
    }
  };

  const handlePublishLesson = async (lesson) => {
    if (!window.confirm(`Are you sure you want to publish "${lesson.title}"?`)) {
      return;
    }

    try {
      await lessonApi.publishLesson(lesson._id);
      toast.success('Lesson published successfully');
      loadAllData(); // Reload all data
    } catch (error) {
      console.error('Failed to publish lesson:', error);
      toast.error(error.response?.data?.message || 'Failed to publish lesson');
    }
  };

  const handleArchiveLesson = async (lesson) => {
    if (!window.confirm(`Are you sure you want to archive "${lesson.title}"? This will remove it from public view.`)) {
      return;
    }

    try {
      await lessonApi.archiveLesson(lesson._id);
      toast.success('Lesson archived successfully');
      loadAllData(); // Reload all data
    } catch (error) {
      console.error('Failed to archive lesson:', error);
      toast.error(error.response?.data?.message || 'Failed to archive lesson');
    }
  };

  const handleProgramUpdate = () => {
    loadAllData(); // Reload all data
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-700 text-gray-300',
      published: 'bg-green-600 text-white',
      scheduled: 'bg-yellow-600 text-white',
      archived: 'bg-red-600 text-white'
    };
    return badges[status] || badges.draft;
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hour0}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-white mb-2">
          {error ? 'Error loading program' : 'Program not found'}
        </h3>
        <p className="text-gray-400 mb-6">
          {error 
            ? extractErrorMessage(error) 
            : "The program you're looking for doesn't exist."
          }
        </p>
        <button 
          onClick={() => navigate('/dashboard/programs')}
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/programs')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-3">
            {hasPermission('write') && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDeleteProgram}
                  disabled={deletingProgram}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{program.title}</h1>
              <p className="text-gray-400 text-lg mb-4">{program.description}</p>
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Portrait Poster</label>
                <input
                  type="url"
                  value={portraitPoster}
                  onChange={(e) => setPortraitPoster(e.target.value)}
                  className="w-48 px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm"
                  placeholder="Portrait poster URL"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Landscape Poster</label>
                <input
                  type="url"
                  value={landscapePoster}
                  onChange={(e) => setLandscapePoster(e.target.value)}
                  className="w-48 px-3 py-2 bg-black border border-gray-700 rounded text-white text-sm"
                  placeholder="Landscape poster URL"
                />
              </div>
            </div>
          </div>
        </div>

        {hasPermission('write') && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsNewTermModalOpen(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Term
            </button>
          </div>
        )}

        <div className="space-y-4">
          {terms.map((term) => (
            <div key={term._id} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Term {term.termNumber}: {term.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{term.description}</p>
                </div>
                {hasPermission('write') && (
                  <button
                    onClick={() => {
                      setSelectedTermId(term._id);
                      setIsNewLessonModalOpen(true);
                    }}
                    className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center gap-2 text-sm"
                  >
                    <FiPlus className="w-3 h-3" />
                    Add Lesson
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {lessons
                  .filter(lesson => lesson.termId === term._id)
                  .sort((a, b) => a.lessonNumber - b.lessonNumber)
                  .map((lesson) => (
                    <div
                      key={lesson._id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-gray-700 rounded overflow-hidden">
                          {lesson.assets?.thumbnails?.[lesson.contentLanguagePrimary]?.portrait && (
                            <img
                              src={lesson.assets.thumbnails[lesson.contentLanguagePrimary].portrait}
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm font-mono w-8">
                            {lesson.lessonNumber.toString().padStart(2, '0')}
                          </span>
                          <div>
                            <h4 className="text-white font-medium">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>{lesson.contentType}</span>
                              <span>{formatDuration(lesson.durationMs)}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(lesson.status)}`}>
                                {lesson.status}
                                {lesson.status === 'scheduled' && lesson.publishAt && (
                                  <span className="ml-1">
                                    ({new Date(lesson.publishAt).toLocaleDateString()})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setIsLessonViewerOpen(true);
                          }}
                          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                        >
                          View
                        </button>
                        {hasPermission('write') && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setIsEditLessonModalOpen(true);
                              }}
                              className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                            >
                              Edit
                            </button>
                            {lesson.status === 'draft' && (
                              <button
                                onClick={() => handlePublishLesson(lesson)}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Publish
                              </button>
                            )}
                            {lesson.status === 'published' && (
                              <button
                                onClick={() => handleArchiveLesson(lesson)}
                                className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                              >
                                Archive
                              </button>
                            )}
                            {lesson.status === 'scheduled' && (
                              <button
                                onClick={() => handlePublishLesson(lesson)}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Publish Now
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteLesson(lesson)}
                              disabled={deletingLesson === lesson._id}
                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              {deletingLesson === lesson._id ? '...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                
                {lessons.filter(lesson => lesson.termId === term._id).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No lessons in this term yet</p>
                    {hasPermission('write') && (
                      <button
                        onClick={() => {
                          setSelectedTermId(term._id);
                          setIsNewLessonModalOpen(true);
                        }}
                        className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 mt-2 text-sm"
                      >
                        Add First Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {terms.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">No terms yet</h3>
              <p className="text-gray-400 mb-6">Start building your curriculum</p>
              {hasPermission('write') && (
                <button
                  onClick={() => setIsNewTermModalOpen(true)}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center gap-2 mx-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  Add First Term
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditProgramModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          program={program}
          onUpdate={handleProgramUpdate}
        />
      )}

      {isNewTermModalOpen && (
        <NewTermModal
          isOpen={isNewTermModalOpen}
          onClose={() => setIsNewTermModalOpen(false)}
          programId={id}
          onSuccess={() => {
            setIsNewTermModalOpen(false);
            loadAllData(); // Reload all data
          }}
        />
      )}

      {isNewLessonModalOpen && (
        <NewLessonModal
          isOpen={isNewLessonModalOpen}
          onClose={() => {
            setIsNewLessonModalOpen(false);
            setSelectedTermId(null);
          }}
          termId={selectedTermId}
          onSuccess={() => {
            setIsNewLessonModalOpen(false);
            setSelectedTermId(null);
            loadAllData(); // Reload all data
          }}
        />
      )}

      {isEditLessonModalOpen && selectedLesson && (
        <EditLessonModal
          isOpen={isEditLessonModalOpen}
          onClose={() => {
            setIsEditLessonModalOpen(false);
            setSelectedLesson(null);
          }}
          lesson={selectedLesson}
          onSuccess={() => {
            setIsEditLessonModalOpen(false);
            setSelectedLesson(null);
            loadAllData(); // Reload all data
          }}
        />
      )}

      {isLessonViewerOpen && selectedLesson && (
        <LessonViewerModal
          isOpen={isLessonViewerOpen}
          onClose={() => {
            setIsLessonViewerOpen(false);
            setSelectedLesson(null);
          }}
          lesson={selectedLesson}
        />
      )}
    </div>
  );
};

export default ProgramDetailPage;