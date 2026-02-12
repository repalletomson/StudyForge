// import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from 'react-query';
// import { FiCalendar, FiClock, FiGlobe, FiEye, FiEdit3, FiPlay, FiPause, FiBook, FiFileText } from 'react-icons/fi';
// import LoadingSpinner from '../components/ui/LoadingSpinner';
// import PublishModal from '../components/modals/PublishModal';
// import * as programApi from '../services/programApi';
// import * as lessonApi from '../services/lessonApi';
// import toast from 'react-hot-toast';
// const PublishingPage = () => {
//   const [selectedTab, setSelectedTab] = useState('scheduled'); // 'scheduled', 'draft-programs', 'draft-lessons'
//   const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
//   const [selectedEntity, setSelectedEntity] = useState(null);
//   const queryClient = useQueryClient();
//   // Fetch programs data
//   const { data: programsData, isLoading: programsLoading } = useQuery(
//     'programs-all',
//     () => programApi.getPrograms({}),
//     {
//       onError: () => {
//         toast.error('Failed to load programs');
//       }
//     }
//   );
//   // Fetch all lessons data
//   const { data: allLessonsData, isLoading: lessonsLoading } = useQuery(
//     'all-lessons',
//     async () => {
//       const programs = programsData?.programs || [];
//       const allLessons = [];
//       for (const program of programs) {
//         try {
//           const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
//           const termsResponse = await fetch(`${apiUrl}/api/admin/programs/${program._id}/terms`, {
//             headers: {
//               'Authorization': `Bearer ${localStorage.getItem('token')}`
//             }
//           });
//           if (termsResponse.ok) {
//             const termsData = await termsResponse.json();
//             for (const term of termsData.terms) {
//               const lessonsResponse = await fetch(`${apiUrl}/api/admin/terms/${term._id}/lessons`, {
//                 headers: {
//                   'Authorization': `Bearer ${localStorage.getItem('token')}`
//                 }
//               });
//               if (lessonsResponse.ok) {
//                 const lessonsData = await lessonsResponse.json();
//                 const lessonsWithProgram = lessonsData.lessons.map(lesson => ({
//                   ...lesson,
//                   programTitle: program.title,
//                   termTitle: term.title,
//                   programId: program._id,
//                   termId: term._id
//                 }));
//                 allLessons.push(...lessonsWithProgram);
//               }
//             }
//           }
//         } catch (error) {
//           console.warn(`Failed to fetch lessons for program ${program._id}:`, error);
//         }
//       }
//       return { lessons: allLessons };
//     },
//     {
//       enabled: !!programsData?.programs?.length,
//       onError: () => {
//         toast.error('Failed to load lessons');
//       }
//     }
//   );
//   const programs = programsData?.programs || [];
//   const allLessons = allLessonsData?.lessons || [];
//   // Filter data by status and type
//   const scheduledLessons = allLessons.filter(lesson => lesson.status === 'scheduled');
//   const draftPrograms = programs.filter(program => program.status === 'draft');
//   const draftLessons = allLessons.filter(lesson => lesson.status === 'draft');
//   // Mutations for lesson actions
//   const publishLessonMutation = useMutation(
//     (lessonId) => lessonApi.publishLesson(lessonId),
//     {
//       onSuccess: () => {
//         queryClient.invalidateQueries('all-lessons');
//         queryClient.invalidateQueries('programs-all');
//         toast.success('Lesson published successfully!');
//       },
//       onError: () => {
//         toast.error('Failed to publish lesson');
//       }
//     }
//   );
//   const archiveLessonMutation = useMutation(
//     (lessonId) => lessonApi.archiveLesson(lessonId),
//     {
//       onSuccess: () => {
//         queryClient.invalidateQueries('all-lessons');
//         toast.success('Lesson archived successfully!');
//       },
//       onError: () => {
//         toast.error('Failed to archive lesson');
//       }
//     }
//   );
//   // Mutations for program actions
//   const publishProgramMutation = useMutation(
//     (programId) => programApi.publishProgram(programId, { languages: [] }),
//     {
//       onSuccess: () => {
//         queryClient.invalidateQueries('programs-all');
//         toast.success('Program published successfully!');
//       },
//       onError: () => {
//         toast.error('Failed to publish program');
//       }
//     }
//   );
//   const handlePublishLesson = (lesson) => {
//     if (window.confirm(`Publish lesson "${lesson.title}" immediately?`)) {
//       publishLessonMutation.mutate(lesson._id);
//     }
//   };
//   const handleCancelScheduledLesson = (lesson) => {
//     if (window.confirm(`Cancel scheduled publishing for lesson "${lesson.title}"?`)) {
//       archiveLessonMutation.mutate(lesson._id);
//     }
//   };
//   const handlePublishProgram = (program) => {
//     setSelectedEntity({ ...program, type: 'program' });
//     setIsPublishModalOpen(true);
//   };
//   const getStatusBadge = (status) => {
//     const badges = {
//       scheduled: 'bg-yellow-100 text-yellow-800',
//       published: 'bg-green-100 text-green-800',
//       draft: 'bg-gray-100 text-gray-800'
//     };
//     return badges[status] || 'bg-gray-100 text-gray-800';
//   };
//   const formatDateTime = (date) => {
//     if (!date) return 'Not set';
//     const dateObj = new Date(date);
//     if (isNaN(dateObj.getTime())) return 'Invalid date';
//     return new Intl.DateTimeFormat('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     }).format(dateObj);
//   };
//   const tabs = [
//     { id: 'scheduled', label: 'Scheduled Lessons', count: scheduledLessons.length, icon: FiClock },
//     { id: 'draft-programs', label: 'Draft Programs', count: draftPrograms.length, icon: FiBook },
//     { id: 'draft-lessons', label: 'Draft Lessons', count: draftLessons.length, icon: FiFileText }
//   ];
//   const getCurrentItems = () => {
//     switch (selectedTab) {
//       case 'scheduled': return scheduledLessons.map(lesson => ({ ...lesson, type: 'lesson' }));
//       case 'draft-programs': return draftPrograms.map(program => ({ ...program, type: 'program' }));
//       case 'draft-lessons': return draftLessons.map(lesson => ({ ...lesson, type: 'lesson' }));
//       default: return [];
//     }
//   };
//   const isLoading = programsLoading || lessonsLoading;
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }
//   return (
//     <div className="space-y-8 animate-fade-in">
//       {}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-white font-display">Publishing Dashboard</h1>
//           <p className="mt-2 text-gray-400">
//             Manage scheduled lessons and draft content
//           </p>
//         </div>
//       </div>
//       {}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
//                 <FiClock className="w-5 h-5 text-yellow-400" />
//               </div>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-400">Scheduled Lessons</p>
//               <p className="text-2xl font-bold text-white">{scheduledLessons.length}</p>
//             </div>
//           </div>
//         </div>
//         <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
//                 <FiBook className="w-5 h-5 text-purple-400" />
//               </div>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-400">Draft Programs</p>
//               <p className="text-2xl font-bold text-white">{draftPrograms.length}</p>
//             </div>
//           </div>
//         </div>
//         <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
//                 <FiFileText className="w-5 h-5 text-violet-400" />
//               </div>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-400">Draft Lessons</p>
//               <p className="text-2xl font-bold text-white">{draftLessons.length}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//       {}
//       <div className="bg-gray-900 rounded-lg border border-gray-800">
//         <div className="px-6 py-4 border-b border-gray-800">
//           <div className="flex space-x-8">
//             {tabs.map(tab => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setSelectedTab(tab.id)}
//                   className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
//                     selectedTab === tab.id
//                       ? 'border-purple-500 text-purple-400'
//                       : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
//                   }`}
//                 >
//                   <Icon className="w-4 h-4" />
//                   <span>{tab.label}</span>
//                   <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-800 text-gray-300">
//                     {tab.count}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//         <div className="p-6">
//           {getCurrentItems().length === 0 ? (
//             <div className="text-center py-12">
//               <div className="mx-auto h-12 w-12 text-gray-500 mb-4">
//                 {selectedTab === 'scheduled' && <FiClock className="h-12 w-12" />}
//                 {selectedTab === 'draft-programs' && <FiBook className="h-12 w-12" />}
//                 {selectedTab === 'draft-lessons' && <FiFileText className="h-12 w-12" />}
//               </div>
//               <h3 className="text-lg font-medium text-white mb-2">
//                 No {selectedTab.replace('-', ' ')} content
//               </h3>
//               <p className="text-gray-400">
//                 {selectedTab === 'scheduled' && 'No lessons are scheduled for publishing.'}
//                 {selectedTab === 'draft-programs' && 'No draft programs available.'}
//                 {selectedTab === 'draft-lessons' && 'No draft lessons available.'}
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {getCurrentItems().map(item => (
//                 <div key={item._id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <div className="text-2xl">
//                         {item.type === 'program' ? '📚' : '📄'}
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-semibold text-white">
//                           {item.title}
//                         </h3>
//                         <div className="flex items-center space-x-4 mt-1">
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
//                             {item.status}
//                           </span>
//                           <span className="text-sm text-gray-400 capitalize">
//                             {item.type}
//                           </span>
//                           {item.type === 'lesson' && item.programTitle && (
//                             <span className="text-sm text-gray-500">
//                               {item.programTitle} → {item.termTitle}
//                             </span>
//                           )}
//                           {item.contentLanguagePrimary && (
//                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-900/50 text-violet-300">
//                               {item.contentLanguagePrimary.toUpperCase()}
//                             </span>
//                           )}
//                           {item.languagePrimary && (
//                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-900/50 text-violet-300">
//                               {item.languagePrimary.toUpperCase()}
//                             </span>
//                           )}
//                         </div>
//                         <div className="mt-2 text-sm text-gray-400">
//                           {selectedTab === 'scheduled' && (
//                             <div className="flex items-center">
//                               <FiCalendar className="w-4 h-4 mr-1" />
//                               Scheduled for {formatDateTime(item.publishAt)}
//                             </div>
//                           )}
//                           {(selectedTab === 'draft-programs' || selectedTab === 'draft-lessons') && (
//                             <div className="flex items-center space-x-4">
//                               <div className="flex items-center">
//                                 <FiEdit3 className="w-4 h-4 mr-1" />
//                                 Last updated {formatDateTime(item.updatedAt)}
//                               </div>
//                               {item.type === 'lesson' && item.durationMs && (
//                                 <div className="flex items-center">
//                                   <FiClock className="w-4 h-4 mr-1" />
//                                   {Math.floor(item.durationMs / 60000)} min
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       {selectedTab === 'scheduled' && item.type === 'lesson' && (
//                         <>
//                           <button
//                             onClick={() => handlePublishLesson(item)}
//                             className="text-green-400 hover:text-green-300 p-2 rounded hover:bg-green-900/20 transition-colors"
//                             title="Publish now"
//                             disabled={publishLessonMutation.isLoading}
//                           >
//                             <FiPlay className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleCancelScheduledLesson(item)}
//                             className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 transition-colors"
//                             title="Cancel scheduled publishing"
//                             disabled={archiveLessonMutation.isLoading}
//                           >
//                             <FiPause className="w-4 h-4" />
//                           </button>
//                         </>
//                       )}
//                       {selectedTab === 'draft-programs' && item.type === 'program' && (
//                         <button
//                           onClick={() => handlePublishProgram(item)}
//                           className="text-green-400 hover:text-green-300 p-2 rounded hover:bg-green-900/20 transition-colors"
//                           title="Publish program"
//                         >
//                           <FiGlobe className="w-4 h-4" />
//                         </button>
//                       )}
//                       {selectedTab === 'draft-lessons' && item.type === 'lesson' && (
//                         <button
//                           onClick={() => handlePublishLesson(item)}
//                           className="text-green-400 hover:text-green-300 p-2 rounded hover:bg-green-900/20 transition-colors"
//                           title="Publish lesson"
//                           disabled={publishLessonMutation.isLoading}
//                         >
//                           <FiGlobe className="w-4 h-4" />
//                         </button>
//                       )}
//                       <button
//                         className="text-violet-400 hover:text-violet-300 p-2 rounded hover:bg-violet-900/20 transition-colors"
//                         title="Edit"
//                         onClick={() => {
//                           if (item.type === 'program') {
//                             window.location.href = `/programs/${item._id}`;
//                           } else {
//                             window.location.href = `/programs/${item.programId}`;
//                           }
//                         }}
//                       >
//                         <FiEdit3 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//       {}
//       <PublishModal
//         isOpen={isPublishModalOpen}
//         onClose={() => setIsPublishModalOpen(false)}
//         entity={selectedEntity}
//         entityType="program"
//       />
//     </div>
//   );
// };
// export default PublishingPage;
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
      const programsData = await programApi.getPrograms({});
      const programs = programsData.programs || [];
      setPrograms(programs);

      const lessons = [];
      for (const program of programs) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const termsResponse = await fetch(`${apiUrl}/api/admin/programs/${program._id}/terms`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (termsResponse.ok) {
            const termsData = await termsResponse.json();
            for (const term of termsData.terms) {
              const lessonsResponse = await fetch(`${apiUrl}/api/admin/terms/${term._id}/lessons`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              });
              
              if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                lessons.push(...lessonsData.lessons.map(l => ({
                  ...l,
                  programTitle: program.title,
                  termTitle: term.title,
                  programId: program._id,
                  termId: term._id
                })));
              }
            }
          }
        } catch (error) {
          console.error(`Error loading lessons for program ${program._id}:`, error);
        }
      }
      setAllLessons(lessons);
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