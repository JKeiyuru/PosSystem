// client/src/hooks/useAuth.js - FIXED with automatic redirect on logout

import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.data.user);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Clear any cached data
    localStorage.clear();
    // Force navigate to login and reload
    navigate('/login');
    // Force a full page reload to clear all state
    window.location.reload();
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
};