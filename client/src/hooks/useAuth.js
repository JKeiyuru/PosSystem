// client/src/hooks/useAuth.js - reads the stored session synchronously so the
// app does not flash a "Loading..." screen on every navigation.

import { useState } from 'react';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      return authService.getCurrentUser();
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

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
    navigate('/login');
    window.location.reload();
  };

  return {
    user,
    loading: false,
    login,
    logout,
    isAuthenticated: !!user
  };
};
