"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingConfirmations } from "@/components/transactions/pending-confirmations";
import { QuickRegister } from "@/components/transactions/quick-register";
import { TransferModal } from "@/components/transactions/transfer-modal";
import { TransactionHistory } from "@/components/transactions/transaction-history";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { exportTransactionsToCSV } from "@/lib/utils/export-utils";

export default function DashboardPage() {
  const { metrics, transactions, loading, refreshData } = useDashboardData();
  const { user } = useAuth();
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [registerType, setRegisterType] = useState<'income' | 'expense'>('expense');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formatCurrency = (value: number, currency: 'ARS' | 'USD' = 'ARS') => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const handleQuickAction = (type: 'income' | 'expense') => {
    setRegisterType(type);
    setIsQuickRegisterOpen(true);
  };

  const cards = [
    {
      title: "Balance Total",
      ars: metrics.ars.balance,
      usd: metrics.usd.balance,
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Disponible en todas las cuentas",
    },
    {
      title: "Ingresos del Mes",
      ars: metrics.ars.income,
      usd: metrics.usd.income,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Cobrado este mes",
    },
    {
      title: "Egresos del Mes",
      ars: metrics.ars.expense,
      usd: metrics.usd.expense,
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      description: "Pagado este mes",
    },
    {
      title: "Ganancia Proyectada",
      ars: metrics.ars.projected,
      usd: metrics.usd.projected,
      icon: PieChart,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Incluye cobros y gastos pendientes",
    },
  ];
  
  return (
    <MainLayout>
      <motion.div 
        initial="hidden"
        animate="show"
        variants={container}
        className="space-y-8"
      >
        <motion.div variants={item} className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Hola, {user?.displayName?.split(' ')[0] || 'David'}</h2>
            <p className="text-muted-foreground text-sm">
              Aquí está el resumen financiero de Imalá para este mes.
            </p>
          </div>
          <Button 
            className="rounded-2xl shadow-lg shadow-primary/20 h-12 px-6"
            onClick={() => handleQuickAction('expense')}
          >
            <Plus className="mr-2 h-5 w-5" /> Registro Rápido
          </Button>
        </motion.div>

        <motion.div variants={container} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div key={index} variants={item}>
                <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm group hover:bg-card transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </CardTitle>
                    <div className={`${card.bg} ${card.color} p-2 rounded-xl ring-1 ring-border transition-transform group-hover:scale-110`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-lg sm:text-xl font-black tracking-tight flex flex-col sm:flex-row sm:items-baseline sm:justify-between leading-tight">
                        {loading ? (
                          <div className="h-7 w-24 animate-pulse rounded bg-white/5" />
                        ) : (
                          <>
                            <span className="truncate">{formatCurrency(card.ars, 'ARS')}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground sm:ml-2">ARS</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold tracking-tight flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-foreground/70 leading-tight">
                        {loading ? (
                          <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
                        ) : (
                          <>
                            <span className="truncate">{formatCurrency(card.usd, 'USD')}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/50 sm:ml-2">USD</span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2 border-t border-border">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <PendingConfirmations key={loading ? 'loading' : 'ready'} />
            <TransactionHistory transactions={transactions} loading={loading} />
          </div>
          
          <div className="space-y-6">
            <Card className="p-6 space-y-4 border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Acciones Rápidas</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[10px]"
                  onClick={async () => {
                    if (!user) return;
                    const t = await transactionService.getTransactions(user.uid);
                    exportTransactionsToCSV(t);
                  }}
                >
                  Exportar CSV
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-xl h-20 flex-col space-y-2 bg-background/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
                  onClick={() => handleQuickAction('income')}
                >
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  <span className="text-[10px]">Nuevo Ingreso</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-20 flex-col space-y-2 bg-background/50 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all"
                  onClick={() => handleQuickAction('expense')}
                >
                  <ArrowDownRight className="h-5 w-5 text-rose-500" />
                  <span className="text-[10px]">Nuevo Gasto</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-20 flex-col space-y-2 bg-background/50 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all col-span-2"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                  <span className="text-[10px]">Transferir entre Cuentas</span>
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      <QuickRegister 
        isOpen={isQuickRegisterOpen} 
        initialType={registerType}
        onClose={() => setIsQuickRegisterOpen(false)}
        onSuccess={() => {
          refreshData(); 
        }}
      />

      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />
    </MainLayout>
  );
}
