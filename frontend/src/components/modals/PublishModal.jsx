import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiGlobe, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as programApi from '../../services/programApi';
import * as lessonApi from '../../services/lessonApi';
const PublishModal = ({ isOpen, onClose, entity, entityType }) => {
  const [publishType, setPublishType] = useState('now'); // 'now' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [errors, setErrors] = useState({});
  const [publishing, setPublishing] = useState(false);
  // Set default selected languages to primary language
  useEffect(() => {
    if (entity && selectedLanguages.length === 0) {
      setSelectedLanguages([entity.languagePrimary || 'en']);
    }
  }, [entity, selectedLanguages.length]);
  const handlePublish = async (publishData) => {
    try {
      setPublishing(true);
      
      if (publishData.publishType === 'now') {
        if (entityType === 'program') {
          await programApi.publishProgram(entity._id, { languages: publishData.languages });
        } else {
          await lessonApi.publishLesson(entity._id, { languages: publishData.languages });
        }
      } else {
        if (entityType === 'program') {
          await programApi.scheduleProgram(entity._id, {
            scheduledPublishAt: publishData.scheduledDateTime,
            languages: publishData.languages
          });
        } else {
          await lessonApi.scheduleLesson(entity._id, {
            scheduledPublishAt: publishData.scheduledDateTime,
            languages: publishData.languages
          });
        }
      }
      
      if (publishType === 'now') {
        toast.success(`${entityType} published successfully!`);
      } else {
        toast.success(`${entityType} scheduled for publishing!`);
      }
      handleClose();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(error.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (selectedLanguages.length === 0) {
      newErrors.languages = 'Select at least one language to publish';
    }
    if (publishType === 'scheduled') {
      if (!scheduledDate) {
        newErrors.scheduledDate = 'Scheduled date is required';
      }
      if (!scheduledTime) {
        newErrors.scheduledTime = 'Scheduled time is required';
      }
      if (scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
          newErrors.scheduledDateTime = 'Scheduled time must be in the future';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const publishData = {
      publishType,
      languages: selectedLanguages,
      scheduledDateTime: publishType === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : null
    };
    handlePublish(publishData);
  };
  const handleClose = () => {
    setPublishType('now');
    setScheduledDate('');
    setScheduledTime('');
    setSelectedLanguages([]);
    setErrors({});
    onClose();
  };
  const handleLanguageToggle = (language) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(lang => lang !== language)
        : [...prev, language]
    );
  };
  // Check if entity has required assets for publishing
  const checkAssetRequirements = () => {
    const missingAssets = [];
    const requiredVariants = ['portrait', 'landscape'];
    selectedLanguages.forEach(language => {
      requiredVariants.forEach(variant => {
        const hasAsset = entity?.assets?.[entityType === 'program' ? 'posters' : 'thumbnails']?.[language]?.[variant];
        if (!hasAsset) {
          missingAssets.push(`${language.toUpperCase()} ${variant}`);
        }
      });
    });
    return missingAssets;
  };
  if (!isOpen || !entity) return null;
  const availableLanguages = entity.languagesAvailable || ['en'];
  const missingAssets = checkAssetRequirements();
  const canPublish = missingAssets.length === 0 && selectedLanguages.length > 0;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <FiGlobe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-display">
                  Publish {entityType}
                </h3>
                <p className="text-sm text-gray-500">
                  "{entity.title}"
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <div>
              <label className="form-label">Publishing Options</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publishType"
                    value="now"
                    checked={publishType === 'now'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="form-radio"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <FiCheck className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Publish Now</span>
                    </div>
                    <p className="text-xs text-gray-500">Make content available immediately</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publishType"
                    value="scheduled"
                    checked={publishType === 'scheduled'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="form-radio"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Schedule Publishing</span>
                    </div>
                    <p className="text-xs text-gray-500">Set a future date and time for publishing</p>
                  </div>
                </label>
              </div>
            </div>
            {}
            {publishType === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    <FiCalendar className="inline w-4 h-4 mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`form-input ${errors.scheduledDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={publishing}
                  />
                  {errors.scheduledDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    <FiClock className="inline w-4 h-4 mr-2" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className={`form-input ${errors.scheduledTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={publishing}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>
                  )}
                </div>
                {errors.scheduledDateTime && (
                  <div className="col-span-2">
                    <p className="text-sm text-red-600">{errors.scheduledDateTime}</p>
                  </div>
                )}
              </div>
            )}
            {}
            <div>
              <label className="form-label">Languages to Publish</label>
              <div className="space-y-2">
                {availableLanguages.map(language => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="form-checkbox"
                      disabled={publishing}
                    />
                    <span className="ml-3 text-sm text-gray-900">
                      {language.toUpperCase()}
                      {language === entity.languagePrimary && (
                        <span className="ml-1 text-xs text-gray-500">(Primary)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {errors.languages && (
                <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
              )}
            </div>
            {}
            {selectedLanguages.length > 0 && (
              <div className={`p-4 rounded-lg border ${
                missingAssets.length > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-start">
                  {missingAssets.length > 0 ? (
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <FiCheck className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      missingAssets.length > 0 ? 'text-yellow-900' : 'text-green-900'
                    } mb-1`}>
                      Asset Requirements
                    </h4>
                    {missingAssets.length > 0 ? (
                      <div>
                        <p className="text-xs text-yellow-800 mb-2">
                          Missing required assets for publishing:
                        </p>
                        <ul className="text-xs text-yellow-800 space-y-1">
                          {missingAssets.map(asset => (
                            <li key={asset}>• {asset}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-yellow-800 mt-2">
                          Upload missing assets before publishing.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-green-800">
                        All required assets are available for the selected languages.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={publishing || !canPublish}
              >
                {publishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {publishType === 'now' ? 'Publishing...' : 'Scheduling...'}
                  </>
                ) : (
                  publishType === 'now' ? 'Publish Now' : 'Schedule Publishing'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default PublishModal;
