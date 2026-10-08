import { useAuthStore } from '../authStore';
import * as http from '@/lib/services/http';

jest.mock('@/lib/services/http', () => ({
  post: jest.fn(), get: jest.fn(), patch: jest.fn(),
  isAuthenticated: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn(),
}));

const user = {
  id: 11, email: 'viewer@example.test', first_name: 'Ana', last_name: 'Luz',
  full_name: 'Ana Luz', phone: '3001234567', avatar: null,
  is_active: true, date_joined: '2026-01-02', last_login: null,
};
const tokens = { access: 'access-fixture', refresh: 'refresh-fixture' };
const login = { email: user.email, password: 'LocalPassword17!' };
const register = { ...login, password_confirm: login.password };

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: null, error: null, isLoading: false, isInitialized: false, isAuthenticated: false });
  jest.mocked(http.isAuthenticated).mockReturnValue(false);
});

describe('authentication session', () => {
  // Catches the non-reactive getter leaving a successful login unauthenticated.
  it('authenticates after login', async () => {
    jest.mocked(http.post).mockResolvedValue({ data: { user, tokens } });
    await useAuthStore.getState().login(login);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(user.email);
    expect(http.setTokens).toHaveBeenCalledWith(tokens.access, tokens.refresh);
  });

  it('authenticates after registration', async () => {
    jest.mocked(http.post).mockResolvedValue({ data: { user, tokens } });
    await useAuthStore.getState().register(register);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(http.setTokens).toHaveBeenCalledWith(tokens.access, tokens.refresh);
  });

  it('discards a persisted profile without an access cookie', async () => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user }, version: 0 }));
    await useAuthStore.getState().initializeAuth();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('restores a session from its cookies', async () => {
    jest.mocked(http.isAuthenticated).mockReturnValue(true);
    jest.mocked(http.get).mockResolvedValue({ data: { user } });
    await useAuthStore.getState().initializeAuth();
    expect(http.get).toHaveBeenCalledWith('/auth/profile/');
    expect(useAuthStore.getState().user?.full_name).toBe('Ana Luz');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shares profile initialization between concurrent mounts', async () => {
    jest.mocked(http.isAuthenticated).mockReturnValue(true);
    jest.mocked(http.get).mockResolvedValue({ data: { user } });
    await Promise.all([useAuthStore.getState().initializeAuth(), useAuthStore.getState().initializeAuth()]);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('clears the persisted session on logout', () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    useAuthStore.getState().logout();
    expect(http.clearTokens).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(JSON.parse(localStorage.getItem('auth-storage')!).state.user).toBeNull();
  });
});

describe('authentication failures', () => {
  // Catches password details being replaced by the generic registration error.
  it.each([
    ['password', ['This password is too common.']],
    ['password_confirm', ['Passwords do not match']],
    ['email', ['A user with this email already exists.']],
  ])('shows registration validation for %s', async (field, messages) => {
    jest.mocked(http.post).mockRejectedValue({ response: { data: { error: 'Registration failed', details: { [field]: messages } } } });
    await useAuthStore.getState().register(register);
    expect(useAuthStore.getState().error).toBe(messages[0]);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('recovers from a login transport failure', async () => {
    jest.mocked(http.post).mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({ data: { user, tokens } });
    await useAuthStore.getState().login(login);
    expect(useAuthStore.getState().error).toBe('Login failed');
    await useAuthStore.getState().login(login);
    expect(useAuthStore.getState().error).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
