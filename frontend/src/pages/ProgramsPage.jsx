// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { useQuery } from 'react-query';
// import { FiPlus, FiSearch, FiEye, FiEdit3, FiBookOpen, FiClock, FiPlay } from 'react-icons/fi';
// import { useAuth } from '../contexts/AuthContext';
// import * as programApi from '../services/programApi';
// import * as topicApi from '../services/topicApi';
// import LoadingSpinner from '../components/ui/LoadingSpinner';
// import ResponsiveImage from '../components/ui/ResponsiveImage';
// const ProgramsPage = () => {
//   const { hasPermission } = useAuth();
//   const [filters, setFilters] = useState({
//     search: '',
//     status: '',
//     language: '',
//     topic: ''
//   });
//   const { data, isLoading, error } = useQuery(
//     ['programs', filters],
//     () => programApi.getPrograms(filters),
//     {
//       keepPreviousData: true,
//       refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
//       refetchOnWindowFocus: true,
//       staleTime: 5000 // Consider data stale after 5 seconds
//     }
//   );
//   // Fetch topics for filtering
//   const { data: topicsData, isLoading: topicsLoading } = useQuery(
//     'topics',
//     topicApi.getTopics,
//     {
//       onError: (error) => {
//         console.error('Failed to fetch topics:', error);
//       }
//     }
//   );
//   const availableTopics = topicsData?.topics || [];
//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };
//   const getStatusBadge = (status) => {
//     const badges = {
//       draft: 'bg-gray-800 text-gray-300',
//       scheduled: 'bg-yellow-900/50 text-yellow-400',
//       published: 'bg-green-900/50 text-green-400',
//       archived: 'bg-red-900/50 text-red-400'
//     };
//     return badges[status] || 'bg-gray-800 text-gray-300';
//   };
//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'published': return '🟢';
//       case 'scheduled': return '🟡';
//       case 'draft': return '⚪';
//       case 'archived': return '🔴';
//       default: return '⚪';
//     }
//   };
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }
//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <div className="mx-auto h-24 w-24 text-red-400 mb-4">
//           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         </div>
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading programs</h3>
//         <p className="text-gray-600">Please try again later.</p>
//       </div>
//     );
//   }
//   return (
//     <div className="space-y-8 animate-fade-in">
//       {}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-100 font-heading">Programs</h1>
//           <p className="mt-2 text-slate-400">
//             Manage your educational programs and curriculum
//           </p>
//         </div>
//         {hasPermission('write') && (
//           <div className="mt-4 sm:mt-0">
//             <Link 
//               to="/dashboard/programs/new"
//               className="btn-primary btn-lg"
//             >
//               <FiPlus className="h-5 w-5 mr-2" />
//               New Program
//             </Link>
//           </div>
//         )}
//       </div>
//       {}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <div className="card">
//           <div className="card-body">
//             <div>
//               <p className="text-sm font-medium text-slate-400">All Statuses</p>
//               <p className="text-2xl font-bold text-slate-100">{data?.programs?.length || 0}</p>
//             </div>
//           </div>
//         </div>
//         <div className="card">
//           <div className="card-body">
//             <div>
//               <p className="text-sm font-medium text-slate-400">Published</p>
//               <p className="text-2xl font-bold text-slate-100">
//                 {data?.programs?.filter(p => p.status === 'published').length || 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="card">
//           <div className="card-body">
//             <div>
//               <p className="text-sm font-medium text-slate-400">Draft</p>
//               <p className="text-2xl font-bold text-slate-100">
//                 {data?.programs?.filter(p => p.status === 'draft').length || 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="card">
//           <div className="card-body">
//             <div>
//               <p className="text-sm font-medium text-slate-400">Unique Topics</p>
//               <p className="text-2xl font-bold text-slate-100">
//                 {new Set(data?.programs?.flatMap(p => p.topicIds?.map(t => t.name) || []) || []).size}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//       {}
//       <div className="card">
//         <div className="card-body">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="form-label">Search Programs</label>
//               <div className="relative">
//                 <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
//                 <input
//                   type="text"
//                   className="form-input pl-10"
//                   placeholder="Search by title..."
//                   value={filters.search}
//                   onChange={(e) => handleFilterChange('search', e.target.value)}
//                 />
//               </div>
//             </div>
//             <div>
//               <label className="form-label">Status</label>
//               <select
//                 className="form-input"
//                 value={filters.status}
//                 onChange={(e) => handleFilterChange('status', e.target.value)}
//               >
//                 <option value="">All Statuses</option>
//                 <option value="draft">Draft</option>
//                 <option value="scheduled">Scheduled</option>
//                 <option value="published">Published</option>
//                 <option value="archived">Archived</option>
//               </select>
//             </div>
//             <div>
//               <label className="form-label">Language</label>
//               <select
//                 className="form-input"
//                 value={filters.language}
//                 onChange={(e) => handleFilterChange('language', e.target.value)}
//               >
//                 <option value="">All Languages</option>
//                 <option value="en">English</option>
//                 <option value="te">Telugu</option>
//                 <option value="hi">Hindi</option>
//                 <option value="ta">Tamil</option>
//               </select>
//             </div>
//             <div>
//               <label className="form-label">Topic</label>
//               <select
//                 className="form-input"
//                 value={filters.topic}
//                 onChange={(e) => handleFilterChange('topic', e.target.value)}
//                 disabled={topicsLoading}
//               >
//                 <option value="">All Topics</option>
//                 {availableTopics.map(topic => (
//                   <option key={topic._id} value={topic.name}>
//                     {topic.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>
//       {}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {data?.programs?.map((program) => (
//           <div key={program._id} className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm hover:shadow-lg hover:border-gray-700 transition-all duration-200 overflow-hidden">
//             {}
//             <div className="relative">
//               <ResponsiveImage
//                 assets={program.assets}
//                 alt={program.title}
//                 className="w-full h-48"
//                 fallbackIcon="📚"
//                 fallbackText={program.title.length > 20 ? program.title.substring(0, 20) + '...' : program.title}
//               />
//               <div className="absolute top-3 right-3">
//                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(program.status)}`}>
//                   {getStatusIcon(program.status)} {program.status}
//                 </span>
//               </div>
//             </div>
//             {}
//             <div className="p-6">
//               <div className="space-y-4">
//                 <div>
//                   <h3 className="text-lg font-semibold text-white line-clamp-2">
//                     {program.title}
//                   </h3>
//                   <p className="text-gray-400 line-clamp-2 mt-1 text-sm">
//                     {program.description || 'No description available'}
//                   </p>
//                 </div>
//                 <div className="flex items-center justify-between text-sm">
//                   <div className="flex items-center">
//                     <span className="text-gray-400">Language:</span>
//                     <span className="ml-2 px-2 py-1 bg-violet-900/50 text-violet-400 rounded text-xs font-medium">
//                       {program.languagePrimary.toUpperCase()}
//                     </span>
//                   </div>
//                   <span className="text-xs text-gray-500">
//                     {program.languagesAvailable.length} language{program.languagesAvailable.length !== 1 ? 's' : ''}
//                   </span>
//                 </div>
//                 {}
//                 <div className="flex items-center justify-between text-sm text-gray-400">
//                   <div className="flex items-center space-x-4">
//                     <span className="flex items-center">
//                       <FiBookOpen className="w-4 h-4 mr-1" />
//                       {program.lessonCount || 0} lesson{(program.lessonCount || 0) !== 1 ? 's' : ''}
//                     </span>
//                     {program.publishedLessonCount > 0 && (
//                       <span className="flex items-center text-green-400">
//                         <FiPlay className="w-4 h-4 mr-1" />
//                         {program.publishedLessonCount} published
//                       </span>
//                     )}
//                   </div>
//                   {program.totalDurationMs > 0 && (
//                     <span className="flex items-center text-xs">
//                       <FiClock className="w-3 h-3 mr-1" />
//                       {Math.round(program.totalDurationMs / 60000)}min
//                     </span>
//                   )}
//                 </div>
//                 {program.topicIds && program.topicIds.length > 0 && (
//                   <div className="flex flex-wrap gap-2">
//                     {program.topicIds.slice(0, 3).map((topic) => (
//                       <span key={topic._id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300">
//                         {topic.name}
//                       </span>
//                     ))}
//                     {program.topicIds.length > 3 && (
//                       <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-500">
//                         +{program.topicIds.length - 3} more
//                       </span>
//                     )}
//                   </div>
//                 )}
//                 <div className="flex items-center justify-between pt-4 border-t border-gray-800">
//                   <div className="flex items-center text-xs text-gray-500">
//                     <FiClock className="w-4 h-4 mr-1" />
//                     {new Date(program.createdAt).toLocaleDateString()}
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Link
//                       to={`/dashboard/programs/${program._id}`}
//                       className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
//                     >
//                       <FiEye className="h-3 w-3 mr-1" />
//                       View
//                     </Link>
//                     {hasPermission('write') && (
//                       <Link
//                         to={`/dashboard/programs/${program._id}/edit`}
//                         className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
//                       >
//                         <FiEdit3 className="h-3 w-3 mr-1" />
//                         Edit
//                       </Link>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//       {}
//       {data?.programs?.length === 0 && (
//         <div className="text-center py-16">
//           <div className="mx-auto h-24 w-24 text-slate-600 mb-6">
//             <FiBookOpen className="h-24 w-24" />
//           </div>
//           <h3 className="text-xl font-semibold text-slate-200 mb-2">No programs found</h3>
//           <p className="text-slate-400 mb-6">
//             {Object.values(filters).some(f => f) 
//               ? 'Try adjusting your search or filter criteria.'
//               : 'Get started by creating your first program.'
//             }
//           </p>
//           {hasPermission('write') && (
//             <Link 
//               to="/dashboard/programs/new"
//               className="btn-primary btn-lg"
//             >
//               <FiPlus className="h-5 w-5 mr-2" />
//               Create your first program
//             </Link>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };
// export default ProgramsPage;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as programApi from '../services/programApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ResponsiveImage from '../components/ui/ResponsiveImage';

const ProgramsPage = () => {
  const { hasPermission } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const programsData = await programApi.getPrograms({});
      setPrograms(programsData.programs || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-800 text-gray-300',
      scheduled: 'bg-yellow-900/50 text-yellow-400',
      published: 'bg-green-900/50 text-green-400',
      archived: 'bg-red-900/50 text-red-400'
    };
    return badges[status] || 'bg-gray-800 text-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      published: '🟢',
      scheduled: '🟡',
      draft: '⚪',
      archived: '🔴'
    };
    return icons[status] || '⚪';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Programs</h1>
          <p className="mt-2 text-slate-400">Manage your educational programs and curriculum</p>
        </div>
        {hasPermission('write') && (
          <div className="mt-4 sm:mt-0">
            <Link to="/dashboard/programs/new" className="btn-primary btn-lg">
              <FiPlus className="h-5 w-5 mr-2" />
              New Program
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map(program => (
          <div key={program._id} className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm hover:shadow-lg hover:border-gray-700 transition-all overflow-hidden">
            <div className="relative">
              <ResponsiveImage
                assets={program.assets}
                alt={program.title}
                className="w-full h-48"
                fallbackIcon="📚"
                fallbackText={program.title.substring(0, 20)}
              />
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(program.status)}`}>
                  {program.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white line-clamp-2">{program.title}</h3>
                  <p className="text-gray-400 line-clamp-2 mt-1 text-sm">{program.description || 'No description'}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Language: {program.languagePrimary.toUpperCase()}</span>
                  <span className="text-xs text-gray-500">
                    {program.languagesAvailable.length} language{program.languagesAvailable.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{program.lessonCount || 0} lesson{(program.lessonCount || 0) !== 1 ? 's' : ''}</span>
                  {program.publishedLessonCount > 0 && (
                    <span className="text-green-400">{program.publishedLessonCount} published</span>
                  )}
                  {program.totalDurationMs > 0 && (
                    <span className="text-xs">{Math.round(program.totalDurationMs / 60000)}min</span>
                  )}
                </div>

                {program.topicIds && program.topicIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {program.topicIds.slice(0, 3).map(topic => (
                      <span key={topic._id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300">
                        {topic.name}
                      </span>
                    ))}
                    {program.topicIds.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-500">
                        +{program.topicIds.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-500">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link to={`/dashboard/programs/${program._id}`} className="btn-outline btn-sm">
                      View
                    </Link>
                    {hasPermission('write') && (
                      <Link to={`/dashboard/programs/${program._id}/edit`} className="btn-primary btn-sm">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-slate-200 mb-2">No programs found</h3>
          <p className="text-slate-400 mb-6">Get started by creating your first program.</p>
          {hasPermission('write') && (
            <Link to="/dashboard/programs/new" className="btn-primary btn-lg">
              <FiPlus className="h-5 w-5 mr-2" />
              Create your first program
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;