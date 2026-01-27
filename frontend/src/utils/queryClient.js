/**
 * Optimized React Query Client Configuration
 */
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'development',
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
      // Use background refetching for better UX
      refetchInterval: false,
      // Suspense mode for better loading states
      suspense: false
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Show error notifications
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// Prefetch commonly used data
export const prefetchCommonData = async () => {
  // Prefetch topics for program creation
  await queryClient.prefetchQuery('topics', () => 
    fetch('/api/admin/topics').then(res => res.json())
  );
  
  // Prefetch user data if authenticated
  const token = localStorage.getItem('token');
  if (token) {
    await queryClient.prefetchQuery('user', () =>
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json())
    );
  }
};