import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../services/programApi';
import * as topicApi from '../services/topicApi';
import { useAuth } from '../contexts/AuthContext';

const EditProgramPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [topics, setTopics] = useState([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner'
  });
  
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [assets, setAssets] = useState({
    portrait: '',
    landscape: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programData, topicsData] = await Promise.all([
        programApi.getProgram(id),
        topicApi.getTopics()
      ]);
      
      setProgram(programData);
      setTopics(topicsData.topics || []);
      
      setForm({
        title: programData.title,
        description: programData.description || '',
        difficulty: programData.difficulty || 'beginner'
      });
      
      setSelectedTopics(programData.topicIds?.map(topic => topic._id) || []);
      
      if (programData.assets?.posters?.[programData.languagePrimary]) {
        const programAssets = programData.assets.posters[programData.languagePrimary];
        setAssets({
          portrait: programAssets.portrait || '',
          landscape: programAssets.landscape || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  const updateProgram = async (data) => {
    try {
      setSaving(true);
      const result = await programApi.updateProgram(id, data);
      toast.success('Program updated successfully');
      navigate(`/dashboard/programs/${result._id || id}`);
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error(error.response?.data?.message || 'Failed to update program');
    } finally {
      setSaving(false);
    }
  };

  const deleteProgram = async () => {
    try {
      setDeleting(true);
      await programApi.deleteProgram(id);
      toast.success('Program deleted successfully');
      navigate('/dashboard/programs');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(error.response?.data?.message || 'Failed to delete program');
    } finally {
      setDeleting(false);
    }
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleDeleteProgram = () => {
    if (window.confirm(`Are you sure you want to delete "${program?.title}"? This action cannot be undone.`)) {
      deleteProgram();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!assets.portrait.trim()) {
      toast.error('Portrait poster is required');
      return;
    }
    
    if (!assets.landscape.trim()) {
      toast.error('Landscape poster is required');
      return;
    }
    
    const programData = {
      ...form,
      languagePrimary: program.languagePrimary || 'en',
      languagesAvailable: program.languagesAvailable || ['en'],
      topicIds: selectedTopics,
      assets: {
        posters: {
          [program.languagePrimary || 'en']: {
            portrait: assets.portrait.trim(),
            landscape: assets.landscape.trim()
          }
        }
      }
    };

    updateProgram(programData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Program not found</h1>
          <button
            onClick={() => navigate('/dashboard/programs')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/dashboard/programs/${id}`)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Program</h1>
              <p className="text-gray-400 text-sm">Update program information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/dashboard/programs/${id}`)}
              className="px-3 py-1 text-gray-400 border border-gray-700 rounded hover:bg-gray-800 text-sm"
            >
              Cancel
            </button>
            {hasRole('admin') && (
              <button
                onClick={handleDeleteProgram}
                disabled={deleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm disabled:opacity-50 flex items-center gap-1"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Program Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
              placeholder="Enter program title"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
              placeholder="Describe your program..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
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
                value={assets.portrait}
                onChange={(e) => setAssets(prev => ({ ...prev, portrait: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="https://example.com/portrait.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Landscape Poster * <span className="text-gray-500 text-xs">(4:3)</span>
              </label>
              <input
                type="url"
                value={assets.landscape}
                onChange={(e) => setAssets(prev => ({ ...prev, landscape: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="https://example.com/landscape.jpg"
                required
              />
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

          {/* Update Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving ? (
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
  );
};

export default EditProgramPage;