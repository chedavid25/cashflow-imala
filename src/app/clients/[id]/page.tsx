"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { clientService, Client } from "@/lib/services/client-service";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      // For simplicity in this demo, we fetch all clients and filter or use a getClientById if we had one
      // Since I'm an AI I'll implement getClientById in service later if needed, 
      // but for now let's assume we fetch them and find.
      const clients = await clientService.getClients(user.uid);
      const currentClient = clients.find(c => c.id === id);
      
      if (!currentClient) {
        router.push("/clients");
        return;
      }
      setClient(currentClient);

      const allTransactions = await transactionService.getTransactions(user.uid);
      const clientTransactions = allTransactions.filter(t => t.clientId === id);
      setTransactions(clientTransactions);
    } catch (error) {
      console.error("Error fetching client details:", error);
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

  const stats = {
    totalBilled: transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0),
    paid: transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((acc, curr) => acc + curr.amount, 0),
    pending: transactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((acc, curr) => acc + curr.amount, 0),
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-white/5 rounded-2xl" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
          </div>
          <div className="h-64 bg-white/5 rounded-3xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-sm font-bold text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a Clientes
        </button>

        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{client?.name}</h2>
              <p className="text-muted-foreground text-sm font-medium">
                {client?.razonSocial || "Sin razón social"} • CUIT: {client?.cuit || "---"}
              </p>
            </div>
          </div>
          <div className="flex bg-[#1a1a1a] rounded-2xl p-1.5 border border-white/5">
             <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 rounded-xl">
               {client?.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto Único'}
             </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Total Cobrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-500">
                {formatCurrency(stats.paid, client?.currency || 'ARS')}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Pendiente de Cobro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-500">
                {formatCurrency(stats.pending, client?.currency || 'ARS')}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Billing Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">
                {formatCurrency(client?.budget || 0, client?.currency || 'ARS')}
                <span className="text-xs text-white/20 ml-2 font-bold">/ mes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-card/20 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 px-8 py-6">
            <CardTitle className="text-lg font-bold flex items-center">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              Historial de Facturación y Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Fecha</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Concepto</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Estado</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white/80">{t.date.toDate().toLocaleDateString()}</span>
                            <span className="text-[10px] text-white/20 font-medium">{t.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-bold text-white/60">{t.category}</span>
                        </td>
                        <td className="px-8 py-5">
                          {t.status === 'completed' ? (
                            <div className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-500/10 w-fit px-3 py-1 rounded-full">
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Cobrado
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-500/10 w-fit px-3 py-1 rounded-full animate-pulse">
                              <Clock className="mr-1.5 h-3.5 w-3.5" />
                              Pendiente
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={cn(
                            "text-base font-black tabular-nums",
                            t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-white/10" />
                </div>
                <p className="text-white/40 font-bold text-sm">No hay registros de facturación para este cliente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
