
import { useState, useEffect } from "react";
import { getCashWithdrawals } from "@/lib/supabase";
import { CashWithdrawal } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export function CashWithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setIsLoading(true);
        const data = await getCashWithdrawals();
        setWithdrawals(data);
      } catch (error) {
        console.error("Error fetching withdrawals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Carregando histórico de resgates...</div>;
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Resgates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Nenhum resgate realizado ainda.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Resgates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.map(withdrawal => (
                <tr key={withdrawal.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {withdrawal.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-red-500">
                    -R$ {withdrawal.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {withdrawal.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
