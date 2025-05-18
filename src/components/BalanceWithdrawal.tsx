
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createWithdrawal, getFinanceSettings, getAllWithdrawals } from "@/lib/supabase";
import { Wallet } from "lucide-react";
import { Withdrawal } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

interface BalanceWithdrawalProps {
  onSuccess?: () => void;
}

export function BalanceWithdrawal({ onSuccess }: BalanceWithdrawalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Get current balance
        const settings = await getFinanceSettings();
        setCurrentBalance(settings.accumulated_balance || 0);
        
        // Get withdrawal history
        const withdrawalsList = await getAllWithdrawals();
        setWithdrawals(withdrawalsList);
      } catch (error) {
        console.error("Error loading balance data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar o saldo atual",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [toast]);

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
    
    if (!user.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem realizar saques",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o saque",
        variant: "destructive",
      });
      return;
    }
    
    if (!reason.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Por favor, forneça uma justificativa para o saque",
        variant: "destructive",
      });
      return;
    }
    
    if (amountValue > currentBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor do saque não pode ser maior que o saldo disponível",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      await createWithdrawal({
        amount: amountValue,
        reason,
        created_by: user.username
      });
      
      // Update the local state
      const settings = await getFinanceSettings();
      setCurrentBalance(settings.accumulated_balance || 0);
      
      const withdrawalsList = await getAllWithdrawals();
      setWithdrawals(withdrawalsList);
      
      // Reset form
      setAmount("");
      setReason("");
      
      toast({
        title: "Saque registrado",
        description: `Saque de R$ ${amountValue.toFixed(2)} realizado com sucesso`,
      });
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      toast({
        title: "Erro ao realizar saque",
        description: error instanceof Error ? error.message : "Não foi possível realizar o saque",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Saldo</CardTitle>
          <CardDescription>Carregando dados do saldo...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Gerenciar Saldo em Caixa
          </CardTitle>
          <CardDescription>
            Realize saques do saldo acumulado fornecendo uma justificativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Saldo Atual</h3>
            <p className="text-3xl font-bold text-blue-500">
              R$ {currentBalance.toFixed(2)}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Valor do Saque
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  R$
                </span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={currentBalance}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Justificativa
              </label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique o motivo do saque"
                required
                rows={3}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full volleyball-button-primary" 
              disabled={isLoading}
            >
              {isLoading ? "Processando..." : "Realizar Saque"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
          <CardDescription>
            Registro de todos os saques realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              Nenhum saque registrado até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Por</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Justificativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {withdrawals.map(withdrawal => (
                    <tr key={withdrawal.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        R$ {withdrawal.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {withdrawal.created_by}
                      </td>
                      <td className="px-4 py-3">
                        {withdrawal.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
