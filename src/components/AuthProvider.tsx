import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';
import { useToast } from '@/hooks/use-toast';
import { populateTestData } from '@/utils/createTestUsers';

type AuthProviderProps = {
  children: React.ReactNode;
};

type AuthProviderState = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: { message: string } }>;
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
          console.log("Session found, fetching user profile...");
          // Fetch user data from profiles to check if admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            setUser(null);
            return;
          }

          if (profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: profileData.username,
              isAdmin: profileData.is_admin,
              created_at: profileData.created_at,
              is_approved: profileData.is_approved || false // Use the is_approved from the profile or default to false
            });
            console.log("User profile fetched successfully:", profileData);
          } else {
            console.error("No profile found for user:", session.user.id);
            setUser(null);
          }
        } else {
          console.log("No active session found");
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Populate test data if needed
    const initializeTestData = async () => {
      try {
        await populateTestData();
      } catch (error) {
        console.error("Error initializing test data:", error);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          // Only perform synchronous operations in the callback
          setIsLoading(true);
          
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error("Error fetching profile on auth change:", profileError);
                setUser(null);
                return;
              }

              if (profileData) {
                console.log("Profile fetched on auth change:", profileData);
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  username: profileData.username,
                  isAdmin: profileData.is_admin,
                  created_at: profileData.created_at,
                  is_approved: profileData.is_approved || false // Use the is_approved from the profile or default to false
                });
              } else {
                console.error("No profile found on auth change");
                setUser(null);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              setUser(null);
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
    initializeTestData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      console.log("Sign in successful:", data);
      toast({
        title: "Login bem-sucedido",
        description: "Você foi conectado com sucesso.",
      });
      
      return {};
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Falha no login",
        variant: "destructive",
      });
      return { error: { message: error.message || 'Falha no login' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Google sign in error:", error);
        toast({
          title: "Erro no login com Google",
          description: error.message || "Falha no login com Google",
          variant: "destructive",
        });
        throw error;
      }
      
      return {};
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Erro no login com Google",
        description: error.message || "Falha no login com Google",
        variant: "destructive",
      });
      return { error: { message: error.message || 'Falha no login com Google' } };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log("Attempting to sign up:", email, username);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });
      
      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      console.log("Sign up successful:", data);
      toast({
        title: "Cadastro bem-sucedido",
        description: "Sua conta foi criada com sucesso.",
      });
      
      return {};
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Falha no cadastro",
        variant: "destructive",
      });
      return { error: { message: error.message || 'Falha no cadastro' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, signInWithGoogle }}>
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
