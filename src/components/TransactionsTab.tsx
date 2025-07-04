import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { getTransactions, getAvailableMonths } from "@/lib/supabase";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ListFilter } from "lucide-react";

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [userFilter, setUserFilter] = useState<string>("");
  const [descriptionFilter, setDescriptionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadMonths = async () => {
      const months = await getAvailableMonths();
      setAvailableMonths(months);
      // Se houver meses disponíveis, seleciona o mais recente
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
    };
    loadMonths();
  }, []);
  
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      const { data, count } = await getTransactions(currentPage, itemsPerPage, selectedMonth);
      
      // Apply client-side filters
      let filteredData = data;
      
      if (userFilter.trim()) {
        filteredData = filteredData.filter(transaction => 
          transaction.username.toLowerCase().includes(userFilter.toLowerCase())
        );
      }
      
      if (descriptionFilter.trim()) {
        filteredData = filteredData.filter(transaction => {
          const description = transaction.description?.includes("monthly")
            ? "Mensalidade"
            : transaction.description?.includes("weekly")
            ? "Diária"
            : transaction.description?.includes("custom")
            ? "Esporádico"
            : transaction.description || "";
          
          return description.toLowerCase().includes(descriptionFilter.toLowerCase());
        });
      }
      
      setTransactions(filteredData);
      setTotalPages(Math.ceil(count / itemsPerPage));
      setIsLoading(false);
    };
    loadTransactions();
  }, [currentPage, selectedMonth, userFilter, descriptionFilter]);
  
  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2)}`;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  };

  const clearFilters = () => {
    setUserFilter("");
    setDescriptionFilter("");
    setSelectedMonth(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Extrato de Transações</h2>
        
        <div className="w-64">
          <Select
            value={selectedMonth ?? "all"}
            onValueChange={value => setSelectedMonth(value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder="Selecione um mês"
                // Exibe "Todos os meses" quando for o valor "all"
                children={
                  selectedMonth === undefined
                    ? "Todos os meses"
                    : availableMonths.includes(selectedMonth)
                    ? getMonthName(selectedMonth)
                    : "Selecione um mês"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {getMonthName(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListFilter className="w-4 h-4" />
          <h3 className="text-lg font-medium">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="userFilter" className="block text-sm font-medium mb-1">
              Filtrar por Usuário
            </label>
            <Input
              id="userFilter"
              type="text"
              placeholder="Nome do usuário..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="descriptionFilter" className="block text-sm font-medium mb-1">
              Filtrar por Tipo de Pagamento
            </label>
            <Input
              id="descriptionFilter"
              type="text"
              placeholder="Mensalidade, Diária, Esporádico..."
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-volleyball-purple mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando transações...</p>
        </div>
      ) : (
        <>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">Nenhuma transação encontrada.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.description?.includes("monthly")
                                ? "bg-green-100 text-green-800 dark:bg-black/80 dark:text-green-400  px-1 py-1"
                                : transaction.description?.includes("weekly")
                                ? "bg-blue-100 text-blue-800 dark:bg-black/80 dark:text-blue-400 px-1 py-1"
                                : transaction.description?.includes("custom")
                                ? "bg-orange-100 text-orange-800 dark:bg-black/80 dark:text-orange-400 px-1 py-1"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {transaction.description?.includes("monthly")
                              ? "Mensalidade"
                              : transaction.description?.includes("weekly")
                              ? "Diária"
                              : transaction.description?.includes("custom")
                              ? "Esporádico"
                              : transaction.description}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.username}</TableCell>
                        <TableCell className={`text-right ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'payment' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {transaction.type === 'payment' ? 'Pagamento' : 'Resgate'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={handlePreviousPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={handleNextPage}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
