
import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Payment, FinanceSettings } from "@/types";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFinanceSettings, getAllPayments, addPayment } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<'monthly' | 'weekly'>('monthly');
  const [receiptURL, setReceiptURL] = useState<string>('');
  
  // Calculate financial summary
  const calculateTotalApproved = () => {
    return payments
      .filter(payment => payment.status === 'approved')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
  };
  
  const calculateMonthProgress = () => {
    if (!settings) return 0;
    const total = calculateTotalApproved();
    return Math.min((total / settings.monthly_goal) * 100, 100);
  };

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        setIsLoading(true);
        
        // Load finance settings
        const financeSettings = await getFinanceSettings();
        setSettings(financeSettings);
        
        // Load payments
        const paymentsList = await getAllPayments();
        setPayments(paymentsList);
      } catch (error) {
        console.error("Error loading finance data:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados financeiros",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFinanceData();
  }, [toast]);

  const handleSubmitPayment = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare payment data
      const amount = paymentType === 'monthly' 
        ? (settings?.monthly_fee || 0)
        : (settings?.weekly_fee || 0);
        
      await addPayment({
        user_id: user.id,
        username: user.username || '',
        amount,
        payment_type: paymentType,
        receipt_url: receiptURL || null,
        status: 'pending'
      });
      
      // Update the local state
      const newPayment: Payment = {
        id: 'temp-' + Date.now().toString(),
        user_id: user.id,
        username: user.username || '',
        amount,
        payment_type: paymentType,
        receipt_url: receiptURL || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      setPayments([newPayment, ...payments]);
      
      toast({
        title: "Pagamento registrado",
        description: "Seu pagamento foi registrado e está aguardando aprovação",
      });
      
      // Reset form
      setPaymentType('monthly');
      setReceiptURL('');
      
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Erro",
        description: "Falha ao registrar o pagamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Contabilidade">
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-volleyball-purple" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Contabilidade" description="Gerenciamento financeiro do time">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Monthly Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meta Mensal</CardTitle>
              <CardDescription>
                Acompanhe o progresso financeiro do time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Progresso</span>
                  <span className="text-sm font-medium">
                    {calculateTotalApproved().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de {settings?.monthly_goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-volleyball-purple h-2.5 rounded-full"
                    style={{ width: `${calculateMonthProgress()}%` }}
                  ></div>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {calculateMonthProgress() < 100 
                      ? `Faltam ${(settings?.monthly_goal - calculateTotalApproved()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para atingir a meta mensal`
                      : "Meta mensal atingida!"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Realizar Novo Pagamento</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Realizar Pagamento</DialogTitle>
                    <DialogDescription>
                      Registre seu pagamento para contribuir com o time
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-type">Tipo de Pagamento</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="monthly" 
                            name="payment-type" 
                            value="monthly"
                            checked={paymentType === 'monthly'}
                            onChange={() => setPaymentType('monthly')}
                            className="mr-2"
                          />
                          <label htmlFor="monthly">
                            Mensal ({settings?.monthly_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="weekly" 
                            name="payment-type" 
                            value="weekly"
                            checked={paymentType === 'weekly'}
                            onChange={() => setPaymentType('weekly')}
                            className="mr-2"
                          />
                          <label htmlFor="weekly">
                            Semanal ({settings?.weekly_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="receipt-url">URL do Comprovante (opcional)</Label>
                      <Input 
                        id="receipt-url"
                        type="text"
                        placeholder="https://exemplo.com/comprovante.jpg"
                        value={receiptURL}
                        onChange={(e) => setReceiptURL(e.target.value)}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Informações para PIX</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm">
                        {/* Display QR code image if available */}
                        {settings?.pix_qrcode && (
                          <div className="flex justify-center mb-3">
                            <img 
                              src={settings.pix_qrcode} 
                              alt="QR Code PIX" 
                              className="max-h-40"
                            />
                          </div>
                        )}
                        <p>Após realizar o pagamento via PIX, envie o comprovante ao administrador ou adicione a URL do comprovante acima.</p>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={handleSubmitPayment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : "Registrar Pagamento"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right Column: Recent Payments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Meus Pagamentos</CardTitle>
              <CardDescription>
                Histórico dos seus pagamentos recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.filter(p => p.user_id === user?.id).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Você ainda não possui pagamentos registrados.
                  </p>
                ) : (
                  payments
                    .filter(p => p.user_id === user?.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((payment) => (
                      <div 
                        key={payment.id}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {payment.payment_type === 'monthly' ? 'Pagamento Mensal' : 'Pagamento Semanal'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className={`text-sm ${
                              payment.status === 'approved' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {payment.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
