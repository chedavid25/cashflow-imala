"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { clientService, Client, ClientFee } from "@/lib/services/client-service";
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
import { EmitBillingModal } from "@/components/billing/emit-billing-modal";

export default function BillingPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Tab and Modal states
  const [activeTab, setActiveTab] = useState<'emit' | 'collect' | 'overdue'>('emit');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedFee, setSelectedFee] = useState<ClientFee | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
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

  const isBilled = (clientId: string, feeId?: string) => {
    return currentMonthTransactions.some(t => 
      t.clientId === clientId && 
      (feeId && feeId !== 'legacy' ? t.feeId === feeId : (!t.feeId || t.feeId === 'legacy')) &&
      t.type === 'income'
    );
  };

  const handleToggleBilling = async (client: Client, fee?: any) => {
    if (isBilled(client.id!, fee?.id)) return;
    setSelectedClient(client);
    setSelectedFee(fee);
    setIsEmitModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const pendingCollections = transactions.filter(t => 
    t.status === 'pending' && t.type === 'income' && t.clientId
  );

  const currentMonthPending = pendingCollections.filter(t => 
    isSameMonth(t.date.toDate(), new Date())
  );

  const overduePending = pendingCollections.filter(t => 
    t.date.toDate() < startOfMonth(new Date())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Flat list of all fees for all filtered clients
  const clientFeesList = filteredClients.flatMap(client => {
    if (client.fees && client.fees.length > 0) {
      return client.fees.map(fee => ({ client, fee }));
    }
    // Legacy support: treat legacy budget/currency as a single fee
    return [{
      client,
      fee: {
        id: 'legacy',
        serviceName: client.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto',
        amount: client.budget || 0,
        currency: client.currency || 'ARS',
        billingType: client.billingType || 'monthly_fee',
        defaultTargetAccount: client.defaultTargetAccount
      }
    }];
  });

  const filteredPending = currentMonthPending.filter(t => {
    const client = clients.find(c => c.id === t.clientId);
    return client?.name?.toLowerCase().includes(search.toLowerCase()) || false;
  });

  const filteredOverdue = overduePending.filter(t => {
    const client = clients.find(c => c.id === t.clientId);
    return client?.name?.toLowerCase().includes(search.toLowerCase()) || false;
  });

  const getClientOverdueCount = (clientId: string, feeId?: string) => {
    return overduePending.filter(t => 
      t.clientId === clientId && 
      (feeId && feeId !== 'legacy' ? t.feeId === feeId : (!t.feeId || t.feeId === 'legacy'))
    ).length;
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-32">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Tablero de Facturación</h2>
            <p className="text-muted-foreground text-sm font-medium">Control cíclico de ingresos y cuentas por cobrar.</p>
          </div>
          
          <div className="bg-muted p-1 border border-border shadow-inner w-full md:w-auto rounded-3xl overflow-hidden">
            <div className="flex md:grid md:grid-cols-3 gap-1 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => { setActiveTab('emit'); setSearch(""); }}
                className={cn(
                  "flex-1 md:flex-none min-w-[100px] sm:min-w-[120px] px-3 sm:px-6 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'emit' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                CONTROL DE CICLO
              </button>
              <button 
                onClick={() => { setActiveTab('collect'); setSearch(""); }}
                className={cn(
                  "flex-1 md:flex-none min-w-[100px] sm:min-w-[120px] px-3 sm:px-6 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all relative whitespace-nowrap",
                  activeTab === 'collect' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                COBRANZAS DEL MES
                {currentMonthPending.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[8px] flex items-center justify-center text-primary-foreground ring-2 ring-muted font-black">
                    {currentMonthPending.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('overdue'); setSearch(""); }}
                className={cn(
                  "flex-1 md:flex-none min-w-[100px] sm:min-w-[120px] px-3 sm:px-6 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all relative whitespace-nowrap",
                  activeTab === 'overdue' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                ATRASADOS
                {overduePending.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[8px] flex items-center justify-center text-white ring-2 ring-muted font-black animate-pulse">
                    {overduePending.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={
              activeTab === 'emit' ? "Buscar cliente o servicio..." : 
              activeTab === 'collect' ? "Buscar cobranza del mes..." :
              "Buscar cobranzas vencidas..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 focus:outline-none border border-border focus:border-primary/50 text-sm transition-all shadow-inner"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />
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
                  {clientFeesList.map(({ client, fee }, idx) => {
                    const billed = isBilled(client.id!, fee.id);
                    const overdueCount = getClientOverdueCount(client.id!, fee.id);
                    
                    return (
                      <Card key={`${client.id}-${fee.id || idx}`} className={cn(
                        "group border-none transition-all duration-300 overflow-hidden relative",
                        billed ? "bg-emerald-500/5 ring-1 ring-emerald-500/20" : "bg-card backdrop-blur-md ring-1 ring-border"
                      )}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", billed ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground")}>
                                <Users className="h-5 w-5" />
                              </div>
                              <div onClick={() => handleEditClient(client)} className="cursor-pointer hover:opacity-80 overflow-hidden">
                                <h3 className="font-bold text-sm truncate max-w-[140px] sm:max-w-none">{client.name}</h3>
                                <div className="flex items-center space-x-2">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[100px]">
                                    {fee.serviceName}
                                  </p>
                                  {overdueCount > 0 && (
                                    <span className="text-[8px] font-black bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                      Debe {overdueCount} {overdueCount === 1 ? 'mes' : 'meses'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("text-sm font-black", fee.currency === 'USD' ? "text-cyan-400" : "text-foreground")}>
                                {fee.currency === 'USD' ? 'u$s' : '$'} {fee.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center space-x-2">
                              {billed ? (
                                <div className="flex items-center text-emerald-500 space-x-1.5 animate-in fade-in zoom-in-95">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Facturado</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-muted-foreground space-x-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">A Facturar</span>
                                </div>
                              )}
                            </div>

                            <button
                              disabled={billed}
                              onClick={() => handleToggleBilling(client, fee)}
                              className={cn(
                                "relative w-14 h-7 rounded-full transition-all duration-500 flex items-center px-1",
                                billed ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-muted border border-border"
                              )}
                            >
                              <motion.div 
                                animate={{ x: billed ? 28 : 0 }}
                                className={cn("h-5 w-5 rounded-full flex items-center justify-center shadow-lg", billed ? "bg-white text-emerald-500" : "bg-muted text-muted-foreground")}
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-current" />
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
              ) : activeTab === 'collect' ? (
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
                              <div onClick={() => client && handleEditClient(client)} className="cursor-pointer hover:opacity-80 overflow-hidden">
                                 <h3 className="font-bold text-sm truncate w-24 md:w-32">{client?.name || 'Cliente'}</h3>
                                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[150px]">
                                   {t.feeId && client?.fees ? 
                                     `${client.fees.find(f => f.id === t.feeId)?.serviceName || ''} • ` : ''}
                                   Emitido: {format(t.date.toDate(), "dd MMM", { locale: es })}
                                 </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("text-sm font-black", t.currency === 'USD' ? "text-cyan-400" : "text-amber-500")}>
                                 {t.currency} {t.amount.toLocaleString()}
                              </div>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase">X COBRAR</p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsConfirmModalOpen(true);
                            }}
                            className="w-full rounded-xl h-10 bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all"
                          >
                            Confirmar Cobro
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredPending.length === 0 && (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 opacity-40">
                      <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500" />
                      <p className="font-black text-sm uppercase tracking-widest">¡Todo al día este mes!</p>
                      <p className="text-xs font-bold text-muted-foreground">No hay cobranzas pendientes del mes actual.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="overdue-grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="contents"
                >
                  {filteredOverdue.map((t) => {
                    const client = clients.find(c => c.id === t.clientId);
                    return (
                      <Card key={t.id} className="border-none bg-rose-500/5 ring-1 ring-rose-500/20 shadow-xl shadow-rose-500/5 transition-all overflow-hidden relative group">
                         <div className="absolute top-0 right-0 p-2">
                           <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />
                         </div>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 text-left">
                              <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                                <Clock className="h-5 w-5" />
                              </div>
                              <div onClick={() => client && handleEditClient(client)} className="cursor-pointer hover:opacity-80 overflow-hidden">
                                 <h3 className="font-bold text-sm truncate w-24 md:w-32">{client?.name || 'Cliente'}</h3>
                                 <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest truncate max-w-[150px]">
                                   {t.feeId && client?.fees ? 
                                     `${client.fees.find(f => f.id === t.feeId)?.serviceName || ''} • ` : ''}
                                   VENCIDO: {format(t.date.toDate(), "MMMM yyyy", { locale: es })}
                                 </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("text-sm font-black", t.currency === 'USD' ? "text-cyan-400" : "text-rose-500")}>
                                 {t.currency} {t.amount.toLocaleString()}
                              </div>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase">ATRASADO</p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsConfirmModalOpen(true);
                            }}
                            className="w-full rounded-xl h-10 bg-rose-600 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all"
                          >
                            Cobrar Atrasado
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredOverdue.length === 0 && (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 opacity-40">
                      <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500" />
                      <p className="font-black text-sm uppercase tracking-widest">¡Excelente!</p>
                      <p className="text-xs font-bold text-muted-foreground">No tienes deudas de meses anteriores.</p>
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

      <EmitBillingModal 
        isOpen={isEmitModalOpen}
        onClose={() => setIsEmitModalOpen(false)}
        onSuccess={fetchData}
        client={selectedClient}
        fee={selectedFee}
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
