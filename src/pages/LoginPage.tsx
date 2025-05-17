
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VolleyballIcon } from "../components/VolleyballIcon";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser, createRegularUser } from "@/utils/createTestUsers";
import { Loader2 } from "lucide-react";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCreatingTestUsers, setIsCreatingTestUsers] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Erro ao entrar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        if (!username) {
          toast({
            title: "Nome de usuário obrigatório",
            description: "Por favor, informe um nome de usuário",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro durante a autenticação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled in the signInWithGoogle function
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCreateTestUsers = async () => {
    setIsCreatingTestUsers(true);
    try {
      await createAdminUser();
      await createRegularUser();
      toast({
        title: "Usuários de teste criados",
        description: "Admin: admin@example.com (senha: admin123456) e Jogador: jogador@example.com (senha: jogador123456)",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuários de teste",
        description: error.message || "Ocorreu um erro ao criar os usuários",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestUsers(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <VolleyballIcon className="h-16 w-16 text-volleyball-purple mb-2" size={64} />
          <h1 className="text-2xl font-bold">Desafinados da Quadra</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isLogin ? "Entre para gerenciar seus jogos de vôlei" : "Crie uma conta para participar"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 text-center ${
                isLogin
                  ? "border-b-2 border-volleyball-purple text-volleyball-purple"
                  : "text-gray-500 border-b border-gray-300"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-2 text-center ${
                !isLogin
                  ? "border-b-2 border-volleyball-purple text-volleyball-purple"
                  : "text-gray-500 border-b border-gray-300"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome de Usuário
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                  required={!isLogin}
                  className="w-full"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-volleyball-purple hover:bg-volleyball-purple/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                isLogin ? "Entrar" : "Cadastrar"
              )}
            </Button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                Ou continue com
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4 flex items-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </>
            )}
          </Button>

          {/* Botão para criar usuários de teste (visível apenas em desenvolvimento) */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
              Ambiente de desenvolvimento
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleCreateTestUsers}
              disabled={isCreatingTestUsers}
            >
              {isCreatingTestUsers ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando usuários de teste...
                </>
              ) : (
                "Criar usuários de teste (admin e jogador)"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
