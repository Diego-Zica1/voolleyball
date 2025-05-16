
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user data from profiles to check if admin
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: profileData.username,
              isAdmin: profileData.is_admin,
              created_at: profileData.created_at
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Only perform synchronous operations in the callback
          setIsLoading(true);
          
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileData) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  username: profileData.username,
                  isAdmin: profileData.is_admin,
                  created_at: profileData.created_at
                });
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      return {};
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error: { message: error.message || 'Falha no login' } };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });
      
      if (error) throw error;
      return {};
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error: { message: error.message || 'Falha no cadastro' } };
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
