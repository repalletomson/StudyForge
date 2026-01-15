/**
 * Public Catalog API Service
 * Consumer-facing API endpoints for published content only
 * No authentication required - returns published-only data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class CatalogApiService {
  /**
   * Get published programs with ≥1 published lessons
   * Sorted by most recently published
   * @param {Object} params - Query parameters
   * @param {string} params.language - Language filter (2-letter code)
   * @param {string} params.topic - Topic filter
   * @param {string} params.cursor - Pagination cursor
   * @param {number} params.limit - Results limit (max 100)
   */
  async getPrograms(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.language) queryParams.append('language', params.language);
    if (params.topic) queryParams.append('topic', params.topic);
    if (params.limit) queryParams.append('limit', Math.min(params.limit, 100));
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const response = await fetch(`${API_BASE_URL}/catalog/programs?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch programs: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get single published program by ID
   * Includes terms + published lessons only
   * Includes multi-language fields and assets
   * @param {string} id - Program ID
   */
  async getProgram(id) {
    const response = await fetch(`${API_BASE_URL}/catalog/programs/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(error.message || 'Program not found or not published');
      }
      throw new Error(error.message || `Failed to fetch program: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get single published lesson by ID
   * @param {string} id - Lesson ID
   */
  async getLesson(id) {
    const response = await fetch(`${API_BASE_URL}/catalog/lessons/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(error.message || 'Lesson not found or not published');
      }
      throw new Error(error.message || `Failed to fetch lesson: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get program lessons (convenience method)
   * @param {string} programId - Program ID
   * @param {Object} params - Additional parameters
   */
  async getProgramLessons(programId, params = {}) {
    const program = await this.getProgram(programId);
    
    // Extract all lessons from all terms
    const lessons = [];
    program.terms?.forEach(term => {
      term.lessons?.forEach(lesson => {
        lessons.push({
          ...lesson,
          term_id: term.id,
          term_title: term.title,
          term_number: term.term_number
        });
      });
    });

    return {
      lessons,
      program: {
        id: program.id,
        title: program.title,
        description: program.description
      },
      pagination: {
        total: lessons.length,
        hasMore: false
      }
    };
  }

  /**
   * Get content by topic (convenience method)
   * @param {string} topicName - Topic name
   * @param {Object} params - Additional parameters
   */
  async getContentByTopic(topicName, params = {}) {
    const programs = await this.getPrograms({ ...params, topic: topicName });

    return {
      programs: programs.programs || [],
      topic: topicName,
      pagination: programs.pagination
    };
  }

  /**
   * Get featured content (convenience method)
   * Returns recently published programs
   * @param {Object} params - Parameters
   */
  async getFeaturedContent(params = {}) {
    const limit = params.limit || 6;
    
    const programs = await this.getPrograms({ ...params, limit });

    return {
      programs: programs.programs || [],
      pagination: programs.pagination
    };
  }

  /**
   * Get available languages from programs
   * @param {Object} params - Parameters
   */
  async getAvailableLanguages(params = {}) {
    const programs = await this.getPrograms({ ...params, limit: 100 });
    
    const languages = new Set();
    programs.programs?.forEach(program => {
      if (program.language_primary) languages.add(program.language_primary);
      program.languages_available?.forEach(lang => languages.add(lang));
    });

    return Array.from(languages).sort();
  }

  /**
   * Get available topics with program counts
   * @param {Object} params - Parameters
   */
  async getTopics(params = {}) {
    const response = await fetch(`${API_BASE_URL}/catalog/topics`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch topics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get available topics from programs (legacy method)
   * @param {Object} params - Parameters
   */
  async getAvailableTopics(params = {}) {
    const programs = await this.getPrograms({ ...params, limit: 100 });
    
    const topics = new Set();
    programs.programs?.forEach(program => {
      program.topics?.forEach(topic => topics.add(topic));
    });

    return Array.from(topics).sort();
  }

  /**
   * Search programs by title or description
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   */
  async searchPrograms(query, params = {}) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    // For now, get all programs and filter client-side
    // In production, this should be implemented server-side
    const programs = await this.getPrograms(params);
    
    const searchTerm = query.toLowerCase();
    const filteredPrograms = programs.programs?.filter(program => 
      program.title?.toLowerCase().includes(searchTerm) ||
      program.description?.toLowerCase().includes(searchTerm) ||
      program.topics?.some(topic => topic.toLowerCase().includes(searchTerm))
    ) || [];

    return {
      programs: filteredPrograms,
      query,
      pagination: {
        ...programs.pagination,
        total: filteredPrograms.length
      }
    };
  }

  /**
   * Get program statistics
   * @param {Object} params - Parameters
   */
  async getStatistics(params = {}) {
    const programs = await this.getPrograms({ ...params, limit: 100 });
    
    const stats = {
      total_programs: programs.programs?.length || 0,
      total_published_lessons: 0,
      languages: new Set(),
      topics: new Set()
    };

    programs.programs?.forEach(program => {
      stats.total_published_lessons += program.published_lessons_count || 0;
      if (program.language_primary) stats.languages.add(program.language_primary);
      program.languages_available?.forEach(lang => stats.languages.add(lang));
      program.topics?.forEach(topic => stats.topics.add(topic));
    });

    return {
      ...stats,
      languages: Array.from(stats.languages),
      topics: Array.from(stats.topics)
    };
  }
}

// Create singleton instance
const catalogApi = new CatalogApiService();

export default catalogApi;

// Export individual methods for convenience
export const {
  getPrograms,
  getProgram,
  getLesson,
  getTopics,
  getProgramLessons,
  getContentByTopic,
  getFeaturedContent,
  getAvailableLanguages,
  getAvailableTopics,
  searchPrograms,
  getStatistics
} = catalogApi;