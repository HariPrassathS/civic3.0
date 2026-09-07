'use client';

// =============================================================================
// CivicConnect TN — Client Auth Provider Context
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOutFromFirebase } from '@/lib/auth/firebase-client';
import { UserRole } from '@/types/enums';
import { getRoleHomePath } from '@/config/roles';
import type { AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  devLogin: (role: UserRole, secretCode?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.data?.user) {
              setUser(data.data.user);
            } else {
              setUser(null);
            }
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        let data: any = {};
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // 1. Google OAuth popup via Firebase SDK
      const { idToken } = await signInWithGoogle();

      // 2. Token exchange with Next.js backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_token: idToken }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, error: `Authentication server returned status ${res.status}.` };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Login failed (Status ${res.status})`);
      }

      const loggedInUser: AuthUser = data.data.user;
      setUser(loggedInUser);

      // Redirect to role home path
      const destination = getRoleHomePath(loggedInUser.role);
      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error('[Google Sign-In Error]:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const devLogin = async (selectedRole: UserRole, secretCode?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secretCode ? { 'x-official-secret': secretCode } : {}),
        },
        body: JSON.stringify({ role: selectedRole, secretCode }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, error: `Authentication server returned status ${res.status}.` };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Login failed (Status ${res.status})`);
      }

      const loggedInUser: AuthUser = data.data.user;
      setUser(loggedInUser);

      const destination = getRoleHomePath(loggedInUser.role);
      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error('[Dev Login Error]:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOutFromFirebase();
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('[Logout Error]:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        devLogin,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
