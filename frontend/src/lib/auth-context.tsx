'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type OtpVerifyResponse = {
  access_token?: string;
  user?: {
    id: number;
    userId: number;
    email: string;
    name?: string;
    role?: string;
    roles?: string[];
    onboardingStatus?: string;
    onboardingRequired?: boolean;
  };
  error?: string;
};

interface AuthContextType {
  token: string | null;
  user: OtpVerifyResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: OtpVerifyResponse) => void;
  logout: () => void;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => {},
  logout: () => {},
  markOnboardingComplete: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('healplace_token');
  });
  const [user, setUser] = useState<OtpVerifyResponse['user'] | null>(null);

  const login = (response: OtpVerifyResponse) => {
    const newToken = response.access_token || null;
    setToken(newToken);
    setUser(response.user || null);
    if (typeof window !== 'undefined' && newToken) {
      localStorage.setItem('healplace_token', newToken);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('healplace_token');
    }
  };

  const markOnboardingComplete = () => {
    setUser((prev) =>
      prev ? { ...prev, onboardingStatus: 'COMPLETE' } : prev,
    );
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading: false,
        login,
        logout,
        markOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
