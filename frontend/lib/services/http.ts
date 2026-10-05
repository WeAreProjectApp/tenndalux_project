/**
 * HTTP service for API requests with JWT authentication.
 * 
 * This service centralizes all HTTP requests and handles:
 * - JWT token management (access + refresh)
 * - Automatic token refresh on 401 errors
 * - Custom headers (language, currency)
 * - Request/response interceptors
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { resolveApiBaseUrl } from '@/lib/apiConfig';

// API base URL
const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, process.env.NODE_ENV === 'production');

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REQUEST_TIMEOUT = 120000;

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshResponse = { access: string; refresh: string };

/**
 * Get JWT access token from cookies.
 */
export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

/**
 * Get JWT refresh token from cookies.
 */
export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

/**
 * Set JWT tokens in cookies.
 * 
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 1 }); // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 }); // 7 days
}

/**
 * Clear all authentication tokens.
 */
export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh must not run the response interceptor that it is recovering from.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});
let refreshInFlight: Promise<string> | null = null;

function endSession(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = refreshClient.post<RefreshResponse>('/auth/token/refresh/', {
      refresh: refreshToken,
    }).then(({ data }) => {
      if (typeof data?.access !== 'string' || !data.access.trim()
        || typeof data?.refresh !== 'string' || !data.refresh.trim()) {
        throw new Error('Invalid token refresh response');
      }
      setTokens(data.access, data.refresh);
      return data.access;
    }).catch((error) => {
      endSession();
      throw error;
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// Request interceptor to add auth token and custom headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add custom headers (language, currency)
    const locale = typeof window !== 'undefined' ? localStorage.getItem('locale') || 'en' : 'en';
    const currency = typeof window !== 'undefined' ? localStorage.getItem('currency') || 'USD' : 'USD';
    
    config.headers['Accept-Language'] = locale;
    config.headers['X-Currency'] = currency;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    
    // If 401 and we have a refresh token, try to refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // A concurrent request may have already replaced the rejected access token.
      const currentToken = getAccessToken();
      if (currentToken && originalRequest.headers.Authorization !== `Bearer ${currentToken}`) {
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
        return axiosInstance(originalRequest);
      }

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const access = await refreshAccessToken(refreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      } else {
        endSession();
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Make a GET request.
 */
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axiosInstance.get<T>(url, config);
}

/**
 * Make a POST request.
 */
export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axiosInstance.post<T>(url, data, config);
}

/**
 * Make a PUT request.
 */
export async function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axiosInstance.put<T>(url, data, config);
}

/**
 * Make a PATCH request.
 */
export async function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axiosInstance.patch<T>(url, data, config);
}

/**
 * Make a DELETE request.
 */
export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axiosInstance.delete<T>(url, config);
}

export default axiosInstance;
