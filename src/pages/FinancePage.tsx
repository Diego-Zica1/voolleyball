
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { getFinanceSettings, addPayment, getAllPayments } from "@/lib/supabase";
import { FinanceSettings, Payment } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentType, setPaymentType] = useState<"monthly" | "weekly">("monthly");
  const [receiptUrl, setReceiptUrl] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "payment", label: "Realizar Pagamento" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const financeSettings = await getFinanceSettings();
        setSettings(financeSettings);
        
        const allPayments = await getAllPayments();
        setPayments(allPayments);
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

  if (isLoading) {
    return (
      <PageContainer title="Contabilidade">
        <div className="text-center">Carregando dados financeiros...</div>
      </PageContainer>
    );
  }

  const calculateTotalCollected = () => {
    // Get the first day of the current month
    const currentDate = new Date();
    const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    return payments
      .filter(p => p.status === "approved" && new Date(p.created_at) >= firstDayCurrentMonth)
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
                R$ {calculateTotalCollected().toFixed(2)}
              </p>
              {settings && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Meta mensal: R$ {settings.monthly_goal.toFixed(2)}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Pendente</h3>
              <p className="text-3xl font-bold text-orange-500">
                R$ {calculatePending().toFixed(2)}
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
                  Faltam R$ {(settings.monthly_goal - calculateTotalCollected()).toFixed(2)}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Saldo em Caixa</h3>
              <div className="flex items-center">
                <Wallet className="text-blue-500 mr-2" />
                <p className="text-3xl font-bold text-blue-500">
                  R$ {settings?.accumulated_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Saldo acumulado de todos os meses
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
                          R$ {payment.amount.toFixed(2)}
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
      ) : (
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
      )}
    </PageContainer>
  );
}
