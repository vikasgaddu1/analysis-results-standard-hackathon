import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  it('provides authentication context', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.login).toBeInstanceOf(Function);
    expect(result.current.logout).toBeInstanceOf(Function);
  });

  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.login('testuser', 'testpassword');

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
        })
      );
    });
  });

  it('handles login failure', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.login('testuser', 'wrongpassword')
    ).rejects.toThrow('Incorrect username or password');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logs out user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // First login
    await result.current.login('testuser', 'testpassword');
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Then logout
    result.current.logout();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('registers a new user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    const newUser = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      full_name: 'New User',
    };

    const registered = await result.current.register(newUser);

    expect(registered).toEqual(
      expect.objectContaining({
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.full_name,
      })
    );
  });

  it('handles registration failure', async () => {
    // Mock a registration failure
    server.use(
      http.post('http://localhost:8000/api/v1/auth/register', () => {
        return HttpResponse.json(
          { detail: 'Email already registered' },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.register({
        email: 'existing@example.com',
        username: 'existing',
        password: 'password123',
        full_name: 'Existing User',
      })
    ).rejects.toThrow('Email already registered');
  });

  it('refreshes user data', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Login first
    await result.current.login('testuser', 'testpassword');

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    // Refresh user data
    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.user).toEqual(
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
        })
      );
    });
  });

  it('handles token expiration', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Login successfully
    await result.current.login('testuser', 'testpassword');

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Mock an unauthorized response
    server.use(
      http.get('http://localhost:8000/api/v1/auth/me', () => {
        return HttpResponse.json(
          { detail: 'Token expired' },
          { status: 401 }
        );
      })
    );

    // Try to refresh user data
    await result.current.refreshUser();

    // Should be logged out
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it('persists authentication across page reloads', async () => {
    // Set token in localStorage
    localStorage.setItem('token', 'mock-jwt-token');

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Should attempt to fetch user data on mount
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
        })
      );
    });
  });
});