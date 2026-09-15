import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  loginWithGoogleRedirect, 
  checkRedirectResult,
  logout 
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signInRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signInRedirect: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for incoming redirect result from Google OAuth
    checkRedirectResult().catch(console.error);

    // 2. Listen to active auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const u = await loginWithGoogle();
      return u;
    } catch (err) {
      console.error('Failed to sign in (Popup):', err);
      throw err;
    }
  };

  const handleSignInRedirect = async () => {
    try {
      await loginWithGoogleRedirect();
    } catch (err) {
      console.error('Failed to sign in (Redirect):', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn: handleSignIn, 
      signInRedirect: handleSignInRedirect, 
      signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
