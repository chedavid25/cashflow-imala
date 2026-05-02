"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { 
  Wallet,
  CalendarDays,
  Filter,
  Landmark,
  CreditCard,
  Banknote,
  ArrowLeft,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export default function AccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("all"); // "YYYY-MM" or "all"

  const fetchData = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const accounts = await accountService.getAccounts(user.uid);
      const currentAccount = accounts.find(a => a.id === id);
      
      if (!currentAccount) {
        router.push("/accounts");
        return;
      }
      setAccount(currentAccount);

      const transactions = await transactionService.getTransactions(user.uid);
      const accountTransactions = transactions.filter(t => 
        t.accountId === id || t.toAccountId === id
      );
      setAllTransactions(accountTransactions);
    } catch (error) {
      console.error("Error fetching account details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, id]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'debit_card': return Landmark;
      case 'credit_card': return CreditCard;
      case 'cash': return Banknote;
      default: return Landmark;
    }
  };

  const filteredTransactions = React.useMemo(() => {
    if (filterMonth === "all") return allTransactions;
    
    const [year, month] = filterMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(start);
    
    return allTransactions.filter(t => {
      const date = t.date.toDate();
      return isWithinInterval(date, { start, end });
    });
  }, [allTransactions, filterMonth]);

  const months = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      list.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy", { locale: es })
      });
    }
    return list;
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-muted rounded-2xl" />
          <div className="h-32 bg-muted rounded-3xl" />
          <div className="h-64 bg-muted rounded-3xl" />
        </div>
      </MainLayout>
    );
  }

  const Icon = getIcon(account?.type || 'bank');

  return (
    <MainLayout>
      <div className="space-y-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a Cuentas
        </button>

        <div className="flex flex-col space-y-6 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
              <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{account?.name}</h2>
              <p className="text-muted-foreground text-[10px] sm:text-sm font-medium uppercase tracking-widest truncate">
                {account?.type === 'debit_card' ? 'T. Débito' : 
                 account?.type === 'credit_card' ? 'T. Crédito' : 'Efectivo'} • {account?.currency}
              </p>
            </div>
          </div>
          <div className="flex bg-muted rounded-2xl p-1.5 border border-border self-start md:self-auto">
             <div className="px-4 py-2 sm:px-6 sm:py-3 text-lg sm:text-xl font-black tabular-nums text-primary">
               {formatCurrency(account?.balance || 0, account?.currency || 'ARS')}
             </div>
          </div>
        </div>

        <Card className="border-none bg-card shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border px-4 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              Resumen de Movimientos
            </CardTitle>
            
            <div className="flex items-center space-x-2 sm:space-x-3 bg-muted/50 p-1 rounded-2xl border border-border/50">
              <div className="flex items-center px-2 sm:px-3 text-muted-foreground">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Período:</span>
              </div>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-background text-[10px] sm:text-xs font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl border-none focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none transition-all hover:bg-muted"
              >
                <option value="all">Todo el historial</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</th>
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Categoría</th>
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo</th>
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-4 sm:px-8 py-4 sm:py-5">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-foreground/90">{t.date.toDate().toLocaleDateString()}</span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{t.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5">
                          <span className="text-xs sm:text-sm font-bold text-foreground/70">{t.category}</span>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5">
                          <div className={cn(
                            "text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full w-fit",
                            t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" :
                            t.type === 'expense' ? "bg-rose-500/10 text-rose-500" :
                            "bg-blue-500/10 text-blue-500"
                          )}>
                            {t.type}
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                          <span className={cn(
                            "text-sm sm:text-base font-black tabular-nums",
                            t.type === 'income' ? "text-emerald-500" : 
                            t.type === 'expense' ? "text-rose-500" : "text-blue-500"
                          )}>
                            {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount, t.currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold text-sm">No hay movimientos registrados en esta cuenta.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
