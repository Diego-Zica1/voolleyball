
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VolleyballIcon } from "../components/VolleyballIcon";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser, createRegularUser } from "@/utils/createTestUsers";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTestUsers, setIsCreatingTestUsers] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
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
        } else {
          toast({
            title: "Login bem-sucedido!",
            description: "Bem-vindo de volta!",
          });
          navigate("/");
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
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Você já pode acessar a plataforma.",
          });
          navigate("/");
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
          <VolleyballIcon className="h-16 w-16 text-volleyball-purple mb-2" />
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
