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
import { TransactionsTab } from "@/components/TransactionsTab";
import { useSearchParams } from "react-router-dom";
import { DollarSign } from "lucide-react";

export default function FinancePage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [cashWithdrawals, setCashWithdrawals] = useState<CashWithdrawal[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [paymentType, setPaymentType] = useState<"monthly" | "weekly" | "custom">("monthly");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  const tabs = [
    { id: "overview", label: "Finanças" },
    { id: "payment", label: "Realizar Pagamento" },
    { id: "extract", label: "Extrato" }
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

      const amount = paymentType === "monthly"
        ? settings.monthly_fee
        : paymentType === "weekly"
          ? settings.weekly_fee
          : Number(customAmount) || 0;

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

      setReceiptUrl("");

      const updatedPayments = await getAllPayments();
      setPayments(updatedPayments);

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

      setWithdrawalAmount(0);
      setWithdrawalReason("");

      const newBalance = await getCurrentMonthBalance();
      setCurrentBalance(newBalance);

      const withdrawals = await getCashWithdrawals();
      setCashWithdrawals(withdrawals);

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

  // Função alterada para mostrar o percentual do dinheiro em caixa em relação ao total arrecadado
  const calculateCashStatusPercent = () => {
    const total = calculateTotalCollected();
    if (total === 0) return 0;
    return Math.floor((currentBalance / total) * 100);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText("06114573692");
    toast({
      title: "Chave Pix copiada!",
      description: "A chave Pix foi copiada para a área de transferência.",
    });
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

            {/* BOX ALTERADO */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-volleyball-purple">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Status do Mês</h3>
              <p className="text-3xl font-bold text-volleyball-purple">
                {calculateCashStatusPercent()}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">                
                Faltam {formatCurrency(settings.monthly_goal - currentBalance)} para atingir a meta mensal
              </p>
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
                    {userPayments
                      .slice()
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(payment => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap capitalize">
                        {payment.payment_type === "monthly" ? "Mensalidade" : payment.payment_type === "weekly" ? "Diária" : payment.payment_type === "custom" ? "Esporádico" : payment.payment_type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {payment.status === "approved"
                            ? "Aprovado"
                            : payment.status === "pending"
                              ? "Pendente"
                              : "Reprovado"}
                        </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex text-center mt-4">
              <Button
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-800 dark:bg-green-400 dark:text-gray-800 dark:hover:bg-green-600 px-4 py-2 mt-4 cursor-pointer"
                onClick={() => setActiveTab("payment")}
              >
                <DollarSign className="w-4 h-4 mr-1" />
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
                  onValueChange={(val) => setPaymentType(val as "monthly" | "weekly" | "custom")}
                >
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Selecione o tipo de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensalidade (R$ {settings?.monthly_fee.toFixed(2)})</SelectItem>
                    <SelectItem value="weekly">Diária (R$ {settings?.weekly_fee.toFixed(2)})</SelectItem>
                    <SelectItem value="custom">Outro Valor</SelectItem>
                  </SelectContent>
                </Select>
                {paymentType === "custom" && (
                  <div>
                    <label htmlFor="customAmount" className="block text-sm font-medium mb-1 mt-4">
                      Digite o valor desejado
                    </label>
                    <Input
                      id="customAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      placeholder="Ex: 50.00"
                      required
                    />
                  </div>
                )}
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
                  Você pode fazer upload da imagem em um serviço como Google Drive e colar o link aqui.
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
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-center">QR Code PIX</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center">
              Escaneie o QR Code para realizar o pagamento
            </p>
            <div className="flex justify-center mb-4">
              {settings?.pix_qrcode ? (
                <img 
                  src="lovable-uploads/qrcodezica.jpeg" 
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

            <div className="flex items-center justify-center mt-4 mb-4">
              <span className="text-green-600 font-semibold mr-2">Copiar Chave Pix</span>
              <svg
                className="w-5 h-5 text-green-600 cursor-pointer"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                onClick={handleCopyPixKey}
                tabIndex={0}
                role="button"
              >
                <title>Copiar chave Pix</title>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15V5a2 2 0 012-2h10" />
              </svg>
              <span className="sr-only">06114573692</span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Após confirmar o pagamento, o Admin irá confirmar o recebimento.
            </p>
          </div>
        </div>
      ) : activeTab === "extract" ? (
        <TransactionsTab />
      ) : activeTab === "withdrawal" && user?.isAdmin ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resgate de Caixa</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Realize um resgate do saldo acumulado em caixa
            </p>

            <div className="p-4 mb-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
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
