
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllUsers, 
  getAllPayments, 
  updatePaymentStatus, 
  updateUserAdmin, 
  getScoreboardSettings,
  updateScoreboardSettings 
} from "@/lib/supabase";
import { User, Payment } from "@/types";
import { CashWithdrawalForm } from "@/components/admin/CashWithdrawalForm";
import { CashWithdrawalsList } from "@/components/admin/CashWithdrawalsList";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [teamAColor, setTeamAColor] = useState("#8B5CF6"); // Purple
  const [teamBColor, setTeamBColor] = useState("#10B981"); // Green
  const [isSavingColors, setIsSavingColors] = useState(false);
  
  // For cash withdrawals
  const [refreshCashData, setRefreshCashData] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

  const tabs = [
    { id: "users", label: "Usuários" },
    { id: "payments", label: "Pagamentos" },
    { id: "scoreboard", label: "Placar" },
    { id: "cash", label: "Caixa" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (activeTab === "users") {
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } 
        else if (activeTab === "payments") {
          const allPayments = await getAllPayments();
          setPayments(allPayments);
        }
        else if (activeTab === "scoreboard") {
          const settings = await getScoreboardSettings();
          if (settings) {
            setTeamAColor(settings.team_a_color);
            setTeamBColor(settings.team_b_color);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
        toast({
          title: "Erro ao carregar dados",
          description: `Não foi possível buscar os dados de ${activeTab}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, toast]);

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      await updateUserAdmin(userId, !isCurrentlyAdmin);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isAdmin: !isCurrentlyAdmin } : u
        )
      );
      
      toast({
        title: "Status de administrador atualizado",
        description: `O usuário foi ${!isCurrentlyAdmin ? "promovido a" : "removido de"} administrador`,
      });
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de administrador",
        variant: "destructive",
      });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, "approved");
      
      // Update local state
      setPayments(prevPayments => 
        prevPayments.map(p => 
          p.id === paymentId ? { ...p, status: "approved" } : p
        )
      );
      
      toast({
        title: "Pagamento aprovado",
        description: "O pagamento foi aprovado com sucesso",
      });
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o pagamento",
        variant: "destructive",
      });
    }
  };

  const handleSaveScoreboardColors = async () => {
    try {
      setIsSavingColors(true);
      
      await updateScoreboardSettings({
        team_a_color: teamAColor,
        team_b_color: teamBColor
      });
      
      toast({
        title: "Cores salvas",
        description: "As cores do placar foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error saving scoreboard colors:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as cores do placar",
        variant: "destructive",
      });
    } finally {
      setIsSavingColors(false);
    }
  };

  const handleCashWithdrawalComplete = () => {
    // Trigger refresh of cash withdrawal data
    setRefreshCashData(prev => prev + 1);
  };

  if (!user?.isAdmin) {
    return (
      <PageContainer title="Acesso Restrito">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta área é restrita para administradores.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Administração">
        <div className="text-center">Carregando dados...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Administração"
      description="Painel de controle para administradores."
    >
      <div className="mb-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "users" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Visualize e gerencie todos os usuários cadastrados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome de Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isAdmin 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.isAdmin ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      >
                        {user.isAdmin ? "Remover Admin" : "Tornar Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Pagamentos</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aprove ou rejeite pagamentos pendentes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comprovante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {payment.payment_type === "monthly" ? "Mensalista" : "Avulso"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        R$ {payment.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "approved" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {payment.status === "approved" ? "Aprovado" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receipt_url ? (
                        <a 
                          href={payment.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver comprovante
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Sem comprovante</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payment.status === "pending" && (
                        <Button 
                          variant="outline" 
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900"
                          onClick={() => handleApprovePayment(payment.id)}
                        >
                          Aprovar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "scoreboard" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configurações do Placar</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Personalize as cores dos times no placar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="teamAColor" className="block text-sm font-medium mb-2">
                Cor do Time A
              </label>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: teamAColor }}
                ></div>
                <Input
                  id="teamAColor"
                  type="text"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="teamBColor" className="block text-sm font-medium mb-2">
                Cor do Time B
              </label>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: teamBColor }}
                ></div>
                <Input
                  id="teamBColor"
                  type="text"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleSaveScoreboardColors} 
              disabled={isSavingColors}
            >
              {isSavingColors ? "Salvando..." : "Salvar Cores"}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "cash" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CashWithdrawalForm onWithdrawalComplete={handleCashWithdrawalComplete} />
            <CashWithdrawalsList key={refreshCashData} />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
