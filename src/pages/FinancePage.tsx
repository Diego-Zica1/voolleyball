
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { getFinanceSettings, addPayment, getAllPayments, getCurrentMonthBalance, getMonthlyBalance, getCashWithdrawals, addCashWithdrawal } from "@/lib/supabase";
import { FinanceSettings, Payment, MonthlyBalance, CashWithdrawal } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [cashWithdrawals, setCashWithdrawals] = useState<CashWithdrawal[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [paymentType, setPaymentType] = useState<"monthly" | "weekly">("monthly");
  const [receiptUrl, setReceiptUrl] = useState("");
  
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "payment", label: "Realizar Pagamento" }
  ];
  
  // Add withdrawal tab only for admin users
  if (user?.isAdmin) {
    tabs.push({ id: "withdrawal", label: "Resgate de Caixa" });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const financeSettings = await getFinanceSettings();
        setSettings(financeSettings);
        
        const allPayments = await getAllPayments();
        setPayments(allPayments);
        
        const balances = await getMonthlyBalance();
        setMonthlyBalances(balances);
        
        const balance = await getCurrentMonthBalance();
        setCurrentBalance(balance);
        
        const withdrawals = await getCashWithdrawals();
        setCashWithdrawals(withdrawals);
      } catch (error) {
        console.error("Error fetching finance data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar as informações financeiras",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar pagamentos",
        variant: "destructive",
      });
      return;
    }

    if (!settings) {
      toast({
        title: "Erro",
        description: "Não foi possível determinar o valor do pagamento",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const amount = paymentType === "monthly" ? settings.monthly_fee : settings.weekly_fee;
      
      await addPayment({
        user_id: user.id,
        username: user.username,
        amount,
        payment_type: paymentType,
        receipt_url: receiptUrl || null,
        status: "pending"
      });
      
      toast({
        title: "Pagamento registrado",
        description: "Seu pagamento foi registrado e está aguardando aprovação",
      });
      
      // Reset form
      setReceiptUrl("");
      
      // Refresh payments list
      const updatedPayments = await getAllPayments();
      setPayments(updatedPayments);
      
      // Switch to overview tab
      setActiveTab("overview");
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: "Não foi possível registrar seu pagamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCashWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar resgates",
        variant: "destructive",
      });
      return;
    }
    
    if (!user.isAdmin) {
      toast({
        title: "Erro",
        description: "Apenas administradores podem realizar resgates",
        variant: "destructive",
      });
      return;
    }
    
    if (withdrawalAmount <= 0) {
      toast({
        title: "Erro",
        description: "O valor do resgate deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }
    
    if (withdrawalAmount > currentBalance) {
      toast({
        title: "Erro",
        description: "O valor do resgate não pode ser maior que o saldo disponível",
        variant: "destructive",
      });
      return;
    }
    
    if (!withdrawalReason.trim()) {
      toast({
        title: "Erro",
        description: "É obrigatório fornecer uma justificativa para o resgate",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsWithdrawing(true);
      
      await addCashWithdrawal({
        user_id: user.id,
        username: user.username,
        amount: withdrawalAmount,
        reason: withdrawalReason
      });
      
      toast({
        title: "Resgate realizado",
        description: "O resgate foi registrado com sucesso",
      });
      
      // Reset form
      setWithdrawalAmount(0);
      setWithdrawalReason("");
      
      // Refresh data
      const newBalance = await getCurrentMonthBalance();
      setCurrentBalance(newBalance);
      
      const withdrawals = await getCashWithdrawals();
      setCashWithdrawals(withdrawals);
      
      // Switch to overview tab
      setActiveTab("overview");
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Erro ao registrar resgate",
        description: "Não foi possível registrar o resgate",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Contabilidade">
        <div className="text-center">Carregando dados financeiros...</div>
      </PageContainer>
    );
  }

  const calculateTotalCollected = () => {
    return payments
      .filter(p => p.status === "approved")
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculatePending = () => {
    return payments
      .filter(p => p.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculateProgress = () => {
    if (!settings) return 0;
    const total = calculateTotalCollected();
    return Math.floor((total / settings.monthly_goal) * 100);
  };
  
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };
  
  const getCashBalanceColorClass = () => {
    if (currentBalance > 0) return "border-green-500 text-green-500";
    if (currentBalance < 0) return "border-red-500 text-red-500";
    return "border-gray-500 text-gray-500";
  };

  const userPayments = payments.filter(p => p.user_id === user?.id);

  return (
    <PageContainer 
      title="Contabilidade"
      description="Gerencie pagamentos e acompanhe a contabilidade do vôlei."
    >
      <div className="mb-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Total Arrecadado</h3>
              <p className="text-3xl font-bold text-green-500">
                {formatCurrency(calculateTotalCollected())}
              </p>
              {settings && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Meta mensal: {formatCurrency(settings.monthly_goal)}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Pendente</h3>
              <p className="text-3xl font-bold text-orange-500">
                {formatCurrency(calculatePending())}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {payments.filter(p => p.status === "pending").length} pagamentos aguardando aprovação
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-volleyball-purple">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Status do Mês</h3>
              <p className="text-3xl font-bold text-volleyball-purple">
                {calculateProgress()}%
              </p>
              {settings && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Faltam {formatCurrency(settings.monthly_goal - calculateTotalCollected())}
                </p>
              )}
            </div>
            
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${getCashBalanceColorClass()}`}>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Dinheiro em Caixa</h3>
              <p className={`text-3xl font-bold ${currentBalance > 0 ? 'text-green-500' : currentBalance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {formatCurrency(currentBalance)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Saldo acumulado dos meses
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Seus Pagamentos</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Histórico dos seus pagamentos recentes
            </p>

            {userPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Você ainda não realizou nenhum pagamento.</p>
                <Button 
                  className="mt-4 volleyball-button-primary"
                  onClick={() => setActiveTab("payment")}
                >
                  Realizar Pagamento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {userPayments.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap capitalize">
                          {payment.payment_type === "monthly" ? "Mensalista" : "Avulso"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === "approved" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {payment.status === "approved" ? "Aprovado" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-right mt-4">
              <Button
                className="volleyball-button-primary"
                onClick={() => setActiveTab("payment")}
              >
                Realizar Novo Pagamento
              </Button>
            </div>
          </div>
        </div>
      ) : activeTab === "payment" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Realizar Pagamento</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Escolha o tipo de pagamento e anexe o comprovante
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium mb-1">
                  Tipo de Pagamento
                </label>
                <Select 
                  value={paymentType} 
                  onValueChange={(val) => setPaymentType(val as "monthly" | "weekly")}
                >
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Selecione o tipo de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensalista (R$ {settings?.monthly_fee.toFixed(2)})</SelectItem>
                    <SelectItem value="weekly">Avulso (R$ {settings?.weekly_fee.toFixed(2)})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="receiptUrl" className="block text-sm font-medium mb-1">
                  Link do Comprovante (Opcional)
                </label>
                <Input
                  id="receiptUrl"
                  type="text"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="Cole o link da imagem do comprovante"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você pode fazer upload da imagem em um serviço como Imgur e colar o link aqui.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full volleyball-button-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirmando Pagamento..." : "Confirmar Pagamento"}
              </Button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">QR Code PIX</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Escaneie o QR Code para realizar o pagamento
            </p>

            <div className="flex justify-center mb-4">
              {settings?.pix_qrcode ? (
                <img 
                  src={settings.pix_qrcode} 
                  alt="QR Code PIX" 
                  className="max-w-full h-auto border p-2 bg-white" 
                  style={{ maxHeight: "240px" }}
                />
              ) : (
                <div className="border border-dashed border-gray-300 p-6 rounded-lg flex items-center justify-center text-gray-500">
                  QR Code não disponível
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Após o pagamento, registre-o no formulário ao lado.
            </p>
          </div>
        </div>
      ) : activeTab === "withdrawal" && user?.isAdmin ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resgate de Caixa</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Realize um resgate do saldo acumulado em caixa
            </p>
            
            <div className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
              <p className="text-lg font-semibold">Saldo disponível: {formatCurrency(currentBalance)}</p>
            </div>

            <form onSubmit={handleCashWithdrawalSubmit} className="space-y-4">
              <div>
                <label htmlFor="withdrawalAmount" className="block text-sm font-medium mb-1">
                  Valor do Resgate
                </label>
                <Input
                  id="withdrawalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={currentBalance}
                  value={withdrawalAmount || ''}
                  onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="withdrawalReason" className="block text-sm font-medium mb-1">
                  Justificativa (obrigatória)
                </label>
                <Textarea
                  id="withdrawalReason"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  placeholder="Descreva a razão para este resgate"
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full volleyball-button-primary" 
                disabled={isWithdrawing || withdrawalAmount <= 0 || withdrawalAmount > currentBalance || !withdrawalReason.trim()}
              >
                {isWithdrawing ? "Processando Resgate..." : "Realizar Resgate"}
              </Button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Resgates</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Resgates realizados recentemente
            </p>

            {cashWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum resgate foi realizado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Justificativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cashWithdrawals.map(withdrawal => (
                      <tr key={withdrawal.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {withdrawal.username}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrency(withdrawal.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="truncate max-w-[200px]" title={withdrawal.reason}>
                            {withdrawal.reason}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
