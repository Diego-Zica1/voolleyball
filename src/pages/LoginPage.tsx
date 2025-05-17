
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from 'react-icons/fc';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { VolleyballIcon } from "@/components/VolleyballIcon";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!signupUsername.trim()) {
        throw new Error("Nome de usuário é obrigatório");
      }
      
      if (signupPassword.length < 6) {
        throw new Error("Senha deve ter pelo menos 6 caracteres");
      }
      
      const result = await signUp(signupEmail, signupPassword, signupUsername);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast({
        title: "Cadastro realizado",
        description: "Conta criada com sucesso! Você já está logado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar sua conta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login com Google",
        description: error.message || "Não foi possível conectar com Google",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <VolleyballIcon size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex flex-col items-center mb-8">
        <VolleyballIcon size={64} />
        <h1 className="text-3xl font-bold mt-4">Desafinados da Quadra</h1>
      </div>
      
      <Card className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Cadastro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Entre na sua conta para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleGoogleLogin}
                className="w-full"
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Entrar com Google
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="signup">
            <CardHeader>
              <CardTitle>Cadastro</CardTitle>
              <CardDescription>
                Crie sua conta para participar dos jogos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Seu nome"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando conta..." : "Criar conta"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleGoogleLogin}
                className="w-full"
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Cadastrar com Google
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
