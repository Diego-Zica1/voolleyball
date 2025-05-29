import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth  } from "@/components/AuthProvider";
import { VolleyballIcon } from "@/components/VolleyballIcon";
import { Eye, EyeOff } from "lucide-react"; // Certifique-se de instalar lucide-react

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {    
    if (!user) {
      toast({
        title: "Link inválido",
        description: "O link de recuperação é inválido ou expirou.",
        variant: "destructive",
      });
    }
  }, [location, toast, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi redefinida com sucesso. Faça login novamente.",
      });
      navigate("/login");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex flex-col items-center mb-6">
        <VolleyballIcon className="h-16 w-16 text-volleyball-purple mb-4 animate-bounce" size={64} />
        <h1 className="text-2xl font-bold">Vôolleyball</h1>          
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Redefinir senha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
                className="w-full pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                required
                className="w-full pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-volleyball-purple hover:bg-volleyball-purple/90"
            disabled={isLoading}
          >
            {isLoading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
          <div className="mt-2 text-right">
            <a
              href="/login"
              className="text-volleyball-purple hover:underline text-sm"
            >
              Voltar para Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
