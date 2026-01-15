/**
 * Program detail page with full CRUD functionality
 */
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FiArrowLeft, FiEdit3, FiTrash2, FiPlus, FiUsers, FiBookOpen, 
  FiClock, FiGlobe, FiTag, FiPlay, FiPause, FiCalendar, FiEye, FiEyeOff 
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as programApi from '../services/programApi';
import * as termApi from '../services/termApi';
import * as lessonApi from '../services/lessonApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ResponsiveImage from '../components/ui/ResponsiveImage';
import ProgramBanner from '../components/program/ProgramBanner';
import NewTermModal from '../components/modals/NewTermModal';
import NewLessonModal from '../components/modals/NewLessonModal';
import EditProgramModal from '../components/modals/EditProgramModal';
import EditLessonModal from '../components/modals/EditLessonModal';
import LessonViewerModal from '../components/modals/LessonViewerModal';
import ProgramMediaSection from '../components/program/ProgramMediaSection';
import toast from 'react-hot-toast';

const ProgramDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTermModalOpen, setIsNewTermModalOpen] = useState(false);
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isLessonViewerOpen, setIsLessonViewerOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum');

  // Fetch program details with more frequent updates
  const { data: program, isLoading, error, refetch: refetchProgram } = useQuery(
    ['program', id],
    () => programApi.getProgram(id),
    {
      enabled: !!id,
      refetchInterval: 30000, // Refetch every 30 seconds for worker updates
      refetchOnWindowFocus: true
    }
  );

  // Fetch terms for this program with real-time updates
  const { data: termsData, refetch: refetchTerms } = useQuery(
    ['terms', id],
    async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/programs/${id}/terms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch terms');
      return response.json();
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Auto-refresh for real-time updates
      staleTime: 0 // Always refetch
    }
  );

  // Fetch lessons for each term with real-time updates
  const { data: lessonsData, refetch: refetchLessons } = useQuery(
    ['lessons', termsData?.terms],
    async () => {
      if (!termsData?.terms?.length) return { lessons: [] };
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const allLessons = [];
      
      for (const term of termsData.terms) {
        try {
          const response = await fetch(`${apiUrl}/api/admin/terms/${term._id}/lessons`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const termLessons = await response.json();
            allLessons.push(...termLessons.lessons);
          } else {
            console.warn(`Failed to fetch lessons for term ${term._id}:`, response.status);
          }
        } catch (error) {
          console.warn(`Error fetching lessons for term ${term._id}:`, error);
        }
      }
      
      return { lessons: allLessons };
    },
    {
      enabled: !!termsData?.terms?.length,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Auto-refresh for real-time updates
      staleTime: 0 // Always refetch
    }
  );

  const terms = termsData?.terms || [];
  const lessons = lessonsData?.lessons || [];

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

  // Term close/open mutations
  const closeTermMutation = useMutation(termApi.closeTerm, {
    onSuccess: () => {
      queryClient.invalidateQueries(['terms', id]);
      toast.success('Term closed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to close term');
    }
  });

  const openTermMutation = useMutation(termApi.openTerm, {
    onSuccess: () => {
      queryClient.invalidateQueries(['terms', id]);
      toast.success('Term opened successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to open term');
    }
  });

  // Lesson delete mutation
  const deleteLessonMutation = useMutation(lessonApi.deleteLesson, {
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['terms', id]);
      toast.success('Lesson deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete lesson');
    }
  });

  const handleDeleteProgram = () => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      deleteProgramMutation.mutate(id);
    }
  };

  const handleCloseTerm = (termId) => {
    closeTermMutation.mutate(termId);
  };

  const handleOpenTerm = (termId) => {
    openTermMutation.mutate(termId);
  };

  const handleToggleTerm = (term) => {
    if (term.status === 'closed') {
      handleOpenTerm(term._id);
    } else {
      handleCloseTerm(term._id);
    }
  };

  const handleDeleteLesson = (lesson) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.title}"? This will permanently delete the lesson and all its data including assets. This action cannot be undone.`)) {
      deleteLessonMutation.mutate(lesson._id);
    }
  };

  const handleProgramUpdate = () => {
    // Refresh program data when it's updated (including assets)
    refetchProgram();
    // Also refresh programs list for real-time updates
    queryClient.invalidateQueries(['programs']);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-800 text-gray-300',
      published: 'bg-green-900/50 text-green-400',
      scheduled: 'bg-yellow-900/50 text-yellow-400',
      archived: 'bg-red-900/50 text-red-400'
    };
    return badges[status] || badges.draft;
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Program not found</h3>
        <p className="text-slate-400 mb-4">The program you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/dashboard/programs')}
          className="btn-primary"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Program Banner - Desktop Only */}
      <ProgramBanner program={program} />

      {/* Header with back button and program info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/programs')}
            className="btn-outline btn-sm"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white font-heading lg:hidden">{program.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(program.status)}`}>
                {program.status}
              </span>
              <span className="text-sm text-gray-400">
                ID: {program._id?.slice(-12) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasPermission('write') && (
            <Link
              to={`/programs/${id}/edit`}
              className="btn-primary btn-sm"
            >
              <FiEdit3 className="w-4 h-4 mr-2" />
              Edit Program
            </Link>
          )}
          {hasPermission('admin') && (
            <button
              onClick={handleDeleteProgram}
              disabled={deleteProgramMutation.isLoading}
              className="btn-outline btn-sm text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete Program
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-violet-500 text-violet-400 font-medium' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            Details
          </button>
          <button 
            onClick={() => setActiveTab('media')}
            className={`py-2 px-1 border-b-2 transition-colors ${
              activeTab === 'media' 
                ? 'border-violet-500 text-violet-400 font-medium' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            Assets & Media
          </button>
          <button 
            onClick={() => setActiveTab('curriculum')}
            className={`py-2 px-1 border-b-2 transition-colors ${
              activeTab === 'curriculum' 
                ? 'border-violet-500 text-violet-400 font-medium' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            Curriculum
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Program Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
                  <p className="text-slate-200">{program.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(program.status)}`}>
                    {program.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                  <p className="text-slate-200">{program.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Primary Language</label>
                  <p className="text-slate-200">{program.languagePrimary?.toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Available Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {program.languagesAvailable?.map(lang => (
                      <span key={lang} className="px-2 py-1 bg-violet-900/50 text-violet-400 rounded text-xs font-medium">
                        {lang.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6">
          <ProgramMediaSection 
            program={program} 
            onAssetsUpdate={handleProgramUpdate}
          />
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100 font-heading">Terms & Lessons</h2>
            {hasPermission('write') && (
              <button
                onClick={() => setIsNewTermModalOpen(true)}
                className="btn-primary btn-sm"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Term
              </button>
            )}
          </div>

          {terms.length === 0 ? (
            <div className="text-center py-16">
              <FiBookOpen className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">No terms yet</h3>
              <p className="text-slate-400 mb-6">Start organizing your program by adding terms.</p>
              {hasPermission('write') && (
                <button
                  onClick={() => setIsNewTermModalOpen(true)}
                  className="btn-primary"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add First Term
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {terms.map((term, termIndex) => {
                const termLessons = lessons.filter(lesson => lesson.termId === term._id);
                return (
                  <div key={term._id} className="card border-slate-800/50">
                    {/* Term Header */}
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-sm">{termIndex + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-100 font-heading">
                              {term.title || `Term ${term.termNumber}`}
                              {term.status === 'closed' && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
                                  Closed
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {termLessons.length} Lessons • {formatDuration(termLessons.reduce((acc, lesson) => acc + (lesson.durationMs || 0), 0))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-all duration-200"
                            onClick={() => handleToggleTerm(term)}
                            disabled={closeTermMutation.isLoading || openTermMutation.isLoading}
                            title={term.status === 'closed' ? 'Open term (show lessons)' : 'Close term (hide lessons)'}
                          >
                            <svg 
                              className={`w-5 h-5 transition-transform duration-200 ${
                                term.status === 'closed' ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Lessons List */}
                      {term.status !== 'closed' && (
                        <div className="space-y-3">
                          {termLessons.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                              <p className="text-slate-500 text-sm mb-4">No lessons yet</p>
                              {hasPermission('write') && (
                                <button
                                  onClick={() => {
                                    setSelectedTermId(term._id);
                                    setIsNewLessonModalOpen(true);
                                  }}
                                  className="btn-outline btn-sm"
                                >
                                  <FiPlus className="w-4 h-4 mr-2" />
                                  Add Lesson
                                </button>
                              )}
                            </div>
                          ) : (
                          termLessons.map((lesson, lessonIndex) => (
                            <div key={lesson._id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group cursor-pointer">
                              <div 
                                className="flex items-center space-x-4 flex-1"
                                onClick={() => {
                                  setSelectedLesson(lesson);
                                  setIsLessonViewerOpen(true);
                                }}
                              >
                                {/* Lesson Thumbnail */}
                                <div className="flex-shrink-0">
                                  <ResponsiveImage
                                    assets={lesson.assets}
                                    alt={lesson.title}
                                    className="w-12 h-12 rounded-lg border border-gray-700"
                                    fallbackIcon={lessonIndex + 1}
                                    fallbackText=""
                                  />
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                    lesson.contentType === 'video' 
                                      ? 'bg-red-900/50 text-red-400' 
                                      : 'bg-violet-900/50 text-violet-400'
                                  }`}>
                                    {lesson.contentType === 'video' ? 
                                      <FiPlay className="w-3 h-3" /> : 
                                      <FiBookOpen className="w-3 h-3" />
                                    }
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-white group-hover:text-gray-300 transition-colors">
                                      {lesson.title}
                                    </h4>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lesson.status)}`}>
                                        {lesson.status}
                                      </span>
                                      {lesson.durationMs && <span>{formatDuration(lesson.durationMs)}</span>}
                                      {lesson.isPaid && <span className="text-amber-400">💰</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {hasPermission('write') && (
                                  <>
                                    <button 
                                      className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLesson(lesson);
                                        setIsEditLessonModalOpen(true);
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLesson(lesson);
                                      }}
                                      title="Delete lesson"
                                      disabled={deleteLessonMutation.isLoading}
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* Add Lesson Button */}
                        {hasPermission('write') && termLessons.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedTermId(term._id);
                              setIsNewLessonModalOpen(true);
                            }}
                            className="w-full p-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
                          >
                            <FiPlus className="w-4 h-4 mr-2 inline" />
                            Add Lesson
                          </button>
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EditProgramModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        program={program}
        onProgramUpdate={handleProgramUpdate}
      />
      
      <NewTermModal 
        isOpen={isNewTermModalOpen}
        onClose={() => setIsNewTermModalOpen(false)}
        programId={id}
      />
      
      <NewLessonModal 
        isOpen={isNewLessonModalOpen}
        onClose={() => {
          setIsNewLessonModalOpen(false);
          setSelectedTermId(null);
        }}
        termId={selectedTermId}
      />
      
      <EditLessonModal 
        isOpen={isEditLessonModalOpen}
        onClose={() => {
          setIsEditLessonModalOpen(false);
          setSelectedLesson(null);
        }}
        lesson={selectedLesson}
      />

      {/* Lesson Viewer Modal */}
      <LessonViewerModal
        isOpen={isLessonViewerOpen}
        onClose={() => {
          setIsLessonViewerOpen(false);
          setSelectedLesson(null);
        }}
        lesson={selectedLesson}
      />
    </div>
  );
};

export default ProgramDetailPage;