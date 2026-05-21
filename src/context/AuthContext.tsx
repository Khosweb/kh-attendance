import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../utils/constant';

interface User {
  id: string;
  name: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const isValid = token && token !== "undefined" && token !== "null" && token.trim() !== "";
      
      console.log('[Auth] checkAuth: token found:', !!token, 'isValid:', isValid);
      
      if (isValid) {
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            setUser(await response.json());
          } else {
            console.warn('[Auth] checkAuth: /me failed, clearing token');
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('[Auth] checkAuth: Error calling /me:', error);
        }
      } else {
        console.log('[Auth] checkAuth: No valid token to check');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const isValid = token && token !== "undefined" && token !== "null" && token.trim() !== "";
    
    const headers = { 
        ...options.headers, 
        'Content-Type': 'application/json',
        ...(isValid ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    console.log('[AuthFetch] Requesting URL:', url);
    console.log('[AuthFetch] Headers sent:', headers);
    
    return await fetch(url, { ...options, headers });
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    console.log('[Auth] Login successful, token:', data.accessToken);
    localStorage.setItem('auth_token', data.accessToken);
    console.log('[Auth] Token stored:', localStorage.getItem('auth_token'));
    
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');

    localStorage.setItem('auth_token', data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, authenticatedFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
