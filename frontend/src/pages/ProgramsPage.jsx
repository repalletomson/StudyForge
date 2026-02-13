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