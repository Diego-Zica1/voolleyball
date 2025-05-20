
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addCashWithdrawal, getCurrentCashBalance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface CashWithdrawalFormProps {
  onWithdrawalComplete: () => void;
}

export function CashWithdrawalForm({ onWithdrawalComplete }: CashWithdrawalFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch current balance when the component mounts
  useState(() => {
    const fetchBalance = async () => {
      const balance = await getCurrentCashBalance();
      setCurrentBalance(balance);
    };
    
    fetchBalance();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar saques",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!reason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça uma justificativa para o saque",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    // Check if we have enough balance
    if (currentBalance !== null && amountValue > currentBalance) {
      toast({
        title: "Erro",
        description: "Saldo insuficiente para realizar o saque",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      await addCashWithdrawal(amountValue, reason, user.id, user.username);
      
      toast({
        title: "Saque registrado",
        description: "O saque foi registrado com sucesso",
      });
      
      // Reset form
      setAmount("");
      setReason("");
      
      // Notify parent component
      onWithdrawalComplete();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erro ao registrar saque",
        description: "Não foi possível registrar o saque",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resgate de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Valor (R$)
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
            {currentBalance !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Saldo disponível: R$ {currentBalance.toFixed(2)}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">
              Justificativa
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Informe o motivo do saque"
              required
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full volleyball-button-primary" 
            disabled={isLoading || currentBalance === null}
          >
            {isLoading ? "Processando..." : "Confirmar Resgate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
