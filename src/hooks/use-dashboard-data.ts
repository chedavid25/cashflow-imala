"use client";

import { useState, useEffect } from "react";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { startOfMonth, endOfMonth } from "date-fns";

export function useDashboardData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    ars: { balance: 0, income: 0, expense: 0, projected: 0 },
    usd: { balance: 0, income: 0, expense: 0, projected: 0 }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [accounts, transactions] = await Promise.all([
        accountService.getAccounts(user.uid),
        transactionService.getTransactions(user.uid),
      ]);

      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      const currentMonth = transactions.filter(t => {
        const tDate = t.date.toDate();
        return tDate >= start && tDate <= end;
      });

      const calc = (currency: 'ARS' | 'USD') => {
        const balance = accounts
          .filter(a => a.currency === currency)
          .reduce((acc, curr) => acc + curr.balance, 0);

        const income = currentMonth
          .filter(t => t.currency === currency && t.type === "income" && t.status === "completed")
          .reduce((acc, curr) => acc + curr.amount, 0);

        const expense = currentMonth
          .filter(t => t.currency === currency && t.type === "expense" && t.status === "completed")
          .reduce((acc, curr) => acc + curr.amount, 0);

        const pendingIncome = transactions
          .filter(t => t.currency === currency && t.type === "income" && t.status === "pending")
          .reduce((acc, curr) => acc + curr.amount, 0);

        const pendingExpense = transactions
          .filter(t => t.currency === currency && t.type === "expense" && t.status === "pending")
          .reduce((acc, curr) => acc + curr.amount, 0);

        return {
          balance,
          income,
          expense,
          projected: (income + pendingIncome) - (expense + pendingExpense)
        };
      };

      setMetrics({
        ars: calc('ARS'),
        usd: calc('USD')
      });
      setTransactions(transactions);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { metrics, transactions, loading, refreshData: fetchData };
}
