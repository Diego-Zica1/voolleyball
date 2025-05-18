
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAllUsers, getAllPayments, updateUserAdmin, updatePaymentStatus } from "@/lib/supabase";
import { User, Payment } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BalanceWithdrawal } from "@/components/BalanceWithdrawal";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersData, paymentsData] = await Promise.all([
          getAllUsers(),
          getAllPayments()
        ]);
        setUsers(usersData);
        setPayments(paymentsData.filter(p => p.status === "pending"));
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os dados administrativos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateUserAdmin(userId, isAdmin);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin } : u
      ));
      toast({
        title: "Permissões atualizadas",
        description: `Usuário ${isAdmin ? 'promovido a administrador' : 'removido de administrador'}`,
      });
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: "Erro ao atualizar permissões",
        description: "Não foi possível atualizar as permissões do usuário",
        variant: "destructive",
      });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, "approved");
      setPayments(payments.filter(p => p.id !== paymentId));
      toast({
        title: "Pagamento aprovado",
        description: "O pagamento foi aprovado com sucesso",
      });
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Erro ao aprovar pagamento",
        description: "Não foi possível aprovar o pagamento",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    try {
      const [usersData, paymentsData] = await Promise.all([
        getAllUsers(),
        getAllPayments()
      ]);
      setUsers(usersData);
      setPayments(paymentsData.filter(p => p.status === "pending"));
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  if (!user?.isAdmin) {
    return (
      <PageContainer title="Acesso Negado">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Acesso Negado</h2>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Administração">
        <div className="text-center">Carregando dados administrativos...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Administração" 
      description="Gerencie usuários, pagamentos e configurações do sistema."
    >
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos Pendentes</TabsTrigger>
          <TabsTrigger value="finance">Finanças</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie as permissões dos usuários cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Membro Desde</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.username}
                          {u.isAdmin && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-volleyball-purple text-white rounded-full">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.id !== user.id && (
                            <Button
                              variant={u.isAdmin ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                            >
                              {u.isAdmin ? "Remover Admin" : "Tornar Admin"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>
                Aprove ou rejeite os pagamentos pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  Não há pagamentos pendentes para aprovação.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comprovante</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map(payment => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 whitespace-nowrap">{payment.username}</td>
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
                            {payment.receipt_url ? (
                              <a 
                                href={payment.receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-500 underline"
                              >
                                Ver comprovante
                              </a>
                            ) : (
                              "Sem comprovante"
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Button
                              variant="default"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              Aprovar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <BalanceWithdrawal onSuccess={refreshData} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
