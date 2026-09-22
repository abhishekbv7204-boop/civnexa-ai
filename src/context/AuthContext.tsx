import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api, getAuthToken, setAuthToken } from '../services/api';
import {
  auth,
  signInWithGooglePopup,
  firebaseLogout,
  testFirestoreConnection,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<UserProfile>;
  loginWithGoogle: (role?: UserRole) => Promise<UserProfile>;
  register: (fullName: string, email: string, password: string, phoneNumber?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthority: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Validate connection to Firestore on boot
  useEffect(() => {
    testFirestoreConnection().catch((err) =>
      console.warn('Initial Firestore connection check notice:', err)
    );
  }, []);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);

      // Also ensure latest profile is stored in Firestore
      if (res.user?.id) {
        saveUserProfileToFirestore(res.user).catch((err) =>
          console.warn('Error syncing profile to Firestore:', err)
        );
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // If we don't have a backend token or user matches
          const firestoreProfile = await getUserProfileFromFirestore(fbUser.uid);
          const syncedUser = await api.syncGoogleUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || firestoreProfile?.full_name || 'Citizen',
            photoURL: fbUser.photoURL || undefined,
            role: firestoreProfile?.role || 'citizen',
          });
          setUser(syncedUser.user);
        } catch (err) {
          console.warn('Firebase user background sync error:', err);
        }
      }
      setLoading(false);
    });

    refreshUser();
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (role: UserRole = 'citizen'): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. Authenticate with Google via Firebase Popup
      const fbProfile = await signInWithGooglePopup(role);

      // 2. Synchronize with backend API session
      const res = await api.syncGoogleUser({
        uid: fbProfile.id,
        email: fbProfile.email,
        displayName: fbProfile.full_name,
        photoURL: fbProfile.avatar_url,
        role,
      });

      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role?: UserRole): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await api.login(email, password, role);
      setUser(res.user);
      // Mirror to Firestore
      saveUserProfileToFirestore(res.user).catch(() => {});
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phoneNumber?: string
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await api.register(fullName, email, password, phoneNumber);
      setUser(res.user);
      // Mirror to Firestore
      saveUserProfileToFirestore(res.user).catch(() => {});
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
    api.logout();
    setUser(null);
  };

  const isAuthority = user?.role === 'authority' || user?.role === 'admin';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        isAuthority,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
