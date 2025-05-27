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
  resetPassword: (email: string) => Promise<{ error?: { message: string } }>;
};

const AuthContext = createContext<AuthProviderState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            setUser(null);
            return;
          }

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
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeTestData = async () => {
      try {
        await populateTestData();
      } catch (error) {}
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setIsLoading(true);
          setTimeout(async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                setUser(null);
                return;
              }

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
            } catch (error) {
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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login bem-sucedido",
        description: "Você foi conectado com sucesso.",
      });

      return {};
    } catch (error: any) {
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
        toast({
          title: "Erro no login com Google",
          description: error.message || "Falha no login com Google",
          variant: "destructive",
        });
        throw error;
      }

      return {};
    } catch (error: any) {
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
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Cadastro bem-sucedido",
        description: "Sua conta foi criada com sucesso.",
      });

      return {};
    } catch (error: any) {
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
      toast({
        title: "Erro ao sair",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // NOVO MÉTODO: RESET PASSWORD
  const resetPassword = async (email: string) => {
    try {
      // Troque a URL abaixo para a página de reset de senha do seu app
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/resetpassword`
        : "https://voolleyball.lovable.app/resetpassword";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        variant: "default",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Erro ao solicitar recuperação de senha.",
        variant: "destructive",
      });
      return { error: { message: error.message || "Erro ao solicitar recuperação de senha." } };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, signInWithGoogle, resetPassword }}>
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
