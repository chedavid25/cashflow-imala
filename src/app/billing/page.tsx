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
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { EditClientModal } from "@/components/clients/edit-client-modal";
import { ConfirmPaymentModal } from "@/components/billing/confirm-payment-modal";

export default function BillingPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Tab and Modal states
  const [activeTab, setActiveTab] = useState<'emit' | 'collect'>('emit');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
      setTransactions(transData);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const currentMonthTransactions = transactions.filter(t => 
    isSameMonth(t.date.toDate(), new Date())
  );

  const isBilled = (clientId: string) => {
    return currentMonthTransactions.some(t => t.clientId === clientId && t.type === 'income');
  };

  const handleToggleBilling = async (client: Client) => {
    if (!user || processingId || isBilled(client.id!)) return;

    setProcessingId(client.id!);
    try {
      const defaultAccount = accounts.find(a => a.id === client.defaultTargetAccount) || accounts[0];
      
      await transactionService.createTransaction({
        userId: user.uid,
        clientId: client.id!,
        type: 'income',
        category: 'Honorarios', 
        amount: client.budget,
        currency: client.currency || 'ARS',
        status: 'pending', 
        date: Timestamp.now(),
        isRecurring: false,
        paidBy: 'David',
        accountId: defaultAccount?.id || ""
      });

      await fetchData();
    } catch (error) {
      console.error("Error emitting billing:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const pendingCollections = transactions.filter(t => 
    t.status === 'pending' && t.type === 'income' && t.clientId
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pendingCollections.filter(t => {
    const client = clients.find(c => c.id === t.clientId);
    return client?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="space-y-8 pb-32">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Tablero de Facturación</h2>
            <p className="text-muted-foreground text-sm font-medium">Control cíclico de ingresos y cuentas por cobrar.</p>
          </div>
          
          <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/5 shadow-inner w-full md:w-auto">
            <button 
              onClick={() => { setActiveTab('emit'); setSearch(""); }}
              className={cn(
                "flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all",
                activeTab === 'emit' ? "bg-primary text-white shadow-lg" : "text-white/20 hover:text-white/40"
              )}
            >
              CONTROL DE CICLO
            </button>
            <button 
              onClick={() => { setActiveTab('collect'); setSearch(""); }}
              className={cn(
                "flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all relative",
                activeTab === 'collect' ? "bg-primary text-white shadow-lg" : "text-white/20 hover:text-white/40"
              )}
            >
              CUENTAS POR COBRAR
              {pendingCollections.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-500 text-[10px] flex items-center justify-center text-white ring-4 ring-[#0a0a0a] font-black">
                  {pendingCollections.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
          <input 
            type="text" 
            placeholder={activeTab === 'emit' ? "Buscar cliente en este ciclo..." : "Buscar cobranza pendiente..."}
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
            <AnimatePresence mode="wait">
              {activeTab === 'emit' ? (
                <motion.div 
                  key="emit-grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="contents"
                >
                  {filteredClients.map((client) => {
                    const billed = isBilled(client.id!);
                    const isProcessing = processingId === client.id;
                    
                    return (
                      <Card key={client.id} className={cn(
                        "group border-none transition-all duration-300 overflow-hidden relative",
                        billed ? "bg-emerald-500/5 ring-1 ring-emerald-500/20" : "bg-card/40 backdrop-blur-md ring-1 ring-white/5"
                      )}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", billed ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-white/20")}>
                                <Users className="h-5 w-5" />
                              </div>
                              <div onClick={() => handleEditClient(client)} className="cursor-pointer hover:opacity-80">
                                <h3 className="font-bold text-sm truncate w-32">{client.name}</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{client.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("text-sm font-black", client.currency === 'USD' ? "text-cyan-400" : "text-white")}>
                                {client.currency === 'USD' ? 'u$s' : '$'} {client.budget.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center space-x-2">
                              {billed ? (
                                <div className="flex items-center text-emerald-500 space-x-1.5 animate-in fade-in zoom-in-95">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Facturado</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-white/20 space-x-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">A Facturar</span>
                                </div>
                              )}
                            </div>

                            <button
                              disabled={billed || isProcessing}
                              onClick={() => handleToggleBilling(client)}
                              className={cn(
                                "relative w-14 h-7 rounded-full transition-all duration-500 flex items-center px-1",
                                billed ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-[#1a1a1a] border border-white/5",
                                isProcessing && "opacity-50"
                              )}
                            >
                              <motion.div 
                                animate={{ x: billed ? 28 : 0 }}
                                className={cn("h-5 w-5 rounded-full flex items-center justify-center shadow-lg", billed ? "bg-white text-emerald-500" : "bg-white/5 text-white/20")}
                              >
                                {isProcessing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              </motion.div>
                            </button>
                          </div>
                          {billed && (
                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute bottom-0 left-0 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="collect-grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="contents"
                >
                  {filteredPending.map((t) => {
                    const client = clients.find(c => c.id === t.clientId);
                    return (
                      <Card key={t.id} className="border-none bg-amber-500/5 ring-1 ring-amber-500/20 shadow-xl shadow-amber-500/5 transition-all overflow-hidden relative group">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 text-left">
                              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                <ReceiptText className="h-5 w-5" />
                              </div>
                              <div onClick={() => client && handleEditClient(client)} className="cursor-pointer hover:opacity-80">
                                 <h3 className="font-bold text-sm truncate w-24 md:w-32">{client?.name || 'Cliente'}</h3>
                                 <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Emitido: {format(t.date.toDate(), "dd MMM", { locale: es })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("text-sm font-black", t.currency === 'USD' ? "text-cyan-400" : "text-amber-500")}>
                                 {t.currency} {t.amount.toLocaleString()}
                              </div>
                              <p className="text-[9px] text-white/20 font-bold uppercase">X COBRAR</p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsConfirmModalOpen(true);
                            }}
                            className="w-full rounded-xl h-10 bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all"
                          >
                            Confirmar / Ajustar Cobro
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredPending.length === 0 && (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 opacity-40">
                      <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500" />
                      <p className="font-black text-sm uppercase tracking-widest">¡Todo al día!</p>
                      <p className="text-xs font-bold text-white/40">No hay cobranzas pendientes en este filtro.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <EditClientModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
        client={selectedClient}
      />

      <ConfirmPaymentModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={fetchData}
        transaction={selectedTransaction}
      />
    </MainLayout>
  );
}
