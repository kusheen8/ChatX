import React, { createContext, useState, useEffect } from 'react';
import { register, login } from '../services/authService';
import { getData, storeData, removeData } from '../utils/storage';
import { setAuthToken } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await getData('token');
      const storedUser = await getData('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const result = await register(username, email, password);
      
      //  Check if the API call was successful
      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      //  Access data from result.data
      const { token: authToken, user: userData } = result.data;
      
      // Validate that we have token and user
      if (!authToken || !userData) {
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }

      setToken(authToken);
      setUser(userData);
      await storeData('token', authToken);
      await storeData('user', userData);
      setAuthToken(authToken);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const result = await login(email, password);
      
      // FIX: Check if the API call was successful
      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      // FIX: Access data from result.data
      const { token: authToken, user: userData } = result.data;
      
      // Validate that we have token and user
      if (!authToken || !userData) {
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }

      setToken(authToken);
      setUser(userData);
      await storeData('token', authToken);
      await storeData('user', userData);
      setAuthToken(authToken);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  };

  const handleLogout = async () => {
    setToken(null);
    setUser(null);
    await removeData('token');
    await removeData('user');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register: handleRegister,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
