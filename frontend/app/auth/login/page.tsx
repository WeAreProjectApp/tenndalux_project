'use client';

/**
 * Login page component.
 * 
 * Provides a form for user authentication with email and password.
 * Redirects to dashboard after successful login.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated, isInitialized, initializeAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  useEffect(() => { void initializeAuth(); }, [initializeAuth]);

  // Redirect after persisted session initialization
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await login(formData);
    
    if (result.success) {
      router.push('/dashboard');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        
        {error && (
          <div id="auth-error" role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              aria-describedby={error ? "auth-error" : undefined}
              className="min-h-11 text-base w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              aria-describedby={error ? "auth-error" : undefined}
              className="min-h-11 text-base w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !isInitialized}
            className="min-h-11 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="inline-flex min-h-11 items-center text-blue-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
