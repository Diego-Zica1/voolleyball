import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { VolleyballIcon } from "@/components/VolleyballIcon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetar-senha`,
    }); // O link do email vai apontar para /resetar-senha

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para o link de redefinição.",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center mb-6">
            <VolleyballIcon className="h-16 w-16 text-volleyball-purple mb-4 animate-bounce " size={64} />
            <h1 className="text-2xl font-bold">Vôolleyball</h1>          
        </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recuperar senha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="submit"
            className="w-full bg-volleyball-purple hover:bg-volleyball-purple/90"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar link de recuperação"}
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
