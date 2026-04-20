"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { clientService, Client } from "@/lib/services/client-service";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ReceiptText, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Wallet,
  ArrowRightLeft,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

export default function BillingPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [clientsData, accountsData, transData] = await Promise.all([
        clientService.getClients(user.uid),
        accountService.getAccounts(user.uid),
        transactionService.getTransactions(user.uid)
      ]);
      
      setClients(clientsData);
      setAccounts(accountsData);
      
      // Filter transactions for the current month
      const currentMonth = new Date();
      const thisMonthTrans = transData.filter(t => 
        t.type === 'income' && 
        t.clientId && 
        isSameMonth(t.date.toDate(), currentMonth)
      );
      setMonthlyTransactions(thisMonthTrans);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const isBilled = (clientId: string) => {
    return monthlyTransactions.some(t => t.clientId === clientId);
  };

  const handleToggleBilling = async (client: Client) => {
    if (!user || processingId || isBilled(client.id!)) return;

    setProcessingId(client.id!);
    try {
      // Logic to "bill": Create an income transaction
      const defaultAccount = accounts.find(a => a.id === client.defaultTargetAccount) || accounts[0];
      
      if (!defaultAccount) {
        alert("Debes tener al menos una cuenta configurada para facturar.");
        return;
      }

      await transactionService.createTransaction({
        userId: user.uid,
        clientId: client.id!,
        type: 'income',
        category: 'Honorarios', // Default category for billing
        amount: client.budget,
        currency: client.currency || 'ARS',
        status: 'completed',
        date: Timestamp.now(),
        isRecurring: false,
        paidBy: 'David',
        accountId: defaultAccount.id!
      });

      await fetchData(); // Refresh to show the new state
    } catch (error) {
      console.error("Error processing billing:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const activeClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Control de Facturación</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Gestiona los cobros recurrentes del mes de {format(new Date(), "MMMM", { locale: es })}.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl border border-emerald-500/20">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Ciclo Actual</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] rounded-2xl h-14 pl-12 pr-4 focus:outline-none border border-white/5 focus:border-primary/50 text-sm transition-all shadow-inner"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {activeClients.map((client) => {
                const billed = isBilled(client.id!);
                const isProcessing = processingId === client.id;
                
                return (
                  <motion.div
                    key={client.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className={cn(
                      "group border-none transition-all duration-300 overflow-hidden relative",
                      billed 
                        ? "bg-emerald-500/5 ring-1 ring-emerald-500/20" 
                        : "bg-card/40 backdrop-blur-md hover:bg-card/60 ring-1 ring-white/5"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                              billed ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-white/20"
                            )}>
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm truncate w-32">{client.name}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                {client.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={cn(
                              "text-sm font-black flex items-center justify-end",
                              client.currency === 'USD' ? "text-cyan-400" : "text-white"
                            )}>
                              {client.currency === 'USD' ? 'u$s' : '$'} {client.budget.toLocaleString()}
                            </div>
                            <p className="text-[9px] text-white/20 font-bold">MONTO ACORDADO</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center space-x-2">
                            {billed ? (
                              <div className="flex items-center text-emerald-500 space-x-1.5 animate-in fade-in zoom-in-95">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cobrado</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-white/20 space-y-1.5">
                                <Clock className="h-3 w-3 mr-1.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Pendiente</span>
                              </div>
                            )}
                          </div>

                          <button
                            disabled={billed || isProcessing}
                            onClick={() => handleToggleBilling(client)}
                            className={cn(
                              "relative w-14 h-7 rounded-full transition-all duration-500 flex items-center px-1",
                              billed 
                                ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                                : "bg-[#1a1a1a] border border-white/5",
                              isProcessing && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <motion.div 
                              animate={{ x: billed ? 28 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center shadow-lg transition-colors",
                                billed ? "bg-white text-emerald-500" : "bg-white/10 text-white/20"
                              )}
                            >
                              {isProcessing ? (
                                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : billed ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-current" />
                              )}
                            </motion.div>
                          </button>
                        </div>
                      </CardContent>
                      
                      {/* Sub-capa de progreso o status */}
                      <AnimatePresence>
                        {billed && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className="absolute bottom-0 left-0 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          />
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {activeClients.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ReceiptText className="h-10 w-10 text-white/10" />
            </div>
            <h3 className="font-bold text-xl">Sin clientes para facturar</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              No se encontraron clientes activos que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
