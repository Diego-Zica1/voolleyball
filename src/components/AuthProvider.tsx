
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

type AuthProviderProps = {
  children: React.ReactNode;
};

type AuthProviderState = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthProviderState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // This is a mock function for now
        // In a real Supabase implementation, you would use supabase.auth.getSession()
        const currentUser = supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signIn({ email, password });
      
      if (error) throw error;
      if (data?.user) setUser(data.user as User);
      return {};
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error: { message: error.message || 'Failed to sign in' } };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, username });
      
      if (error) throw error;
      if (data?.user) setUser(data.user as User);
      return {};
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error: { message: error.message || 'Failed to sign up' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
