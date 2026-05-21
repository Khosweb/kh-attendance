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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      console.log('AuthContext: Checking token:', token ? 'Found' : 'Not Found');
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('AuthContext: /me response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('AuthContext: User authenticated:', userData);
            setUser(userData);
          } else {
            console.warn('AuthContext: Token invalid or expired, removing');
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Auth check failed:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('AuthContext: Login successful', data);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
