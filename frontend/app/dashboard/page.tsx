'use client';

/**
 * Dashboard page component (protected route).
 * 
 * Displays user profile information and provides logout functionality.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, initializeAuth, isInitialized, isLoading } = useAuthStore();
  
  useEffect(() => { void initializeAuth(); }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.replace('/auth/login');
  }, [isInitialized, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };
  
  if (!isInitialized || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="min-h-11 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 break-words">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user.full_name || user.email}!</h2>
          
          <div className="space-y-3">
            <div data-testid="profile-email">
              <span className="font-semibold">Email:</span> {user.email}
            </div>
            <div data-testid="profile-name">
              <span className="font-semibold">Full Name:</span> {user.full_name || 'Not set'}
            </div>
            <div data-testid="profile-phone">
              <span className="font-semibold">Phone:</span> {user.phone || 'Not set'}
            </div>
            <div data-testid="profile-status">
              <span className="font-semibold">Account Status:</span>{' '}
              <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div data-testid="profile-since">
              <span className="font-semibold">Member since:</span>{' '}
              {new Date(user.date_joined).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🎉 Backend + Frontend Connected!</h3>
          <p className="text-gray-700">
            Your Django REST backend is successfully communicating with your Next.js frontend.
            The authentication flow is working with JWT tokens.
          </p>
        </div>
      </main>
    </div>
  );
}
