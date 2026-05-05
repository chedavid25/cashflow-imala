"use client";

import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
import { clientService, Client } from "@/lib/services/client-service";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { CollectionSwitch } from "./collection-switch";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PendingConfirmations() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allTransactions, allClients] = await Promise.all([
        transactionService.getTransactions(user.uid),
        clientService.getClients(user.uid)
      ]);
      setPending(allTransactions.filter(t => t.status === "pending"));
      setClients(allClients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId)?.name;
  };

  if (loading) return <div className="p-8 text-center text-xs font-black uppercase tracking-widest opacity-50">Cargando pendientes...</div>;
  if (pending.length === 0) return null;

  return (
    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-amber-500" />
            Pendientes de Confirmación
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Gastos y cobros que requieren tu validación manual.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.map((t) => {
          const clientName = getClientName(t.clientId);
          return (
            <div 
              key={t.id} 
              className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border transition-all hover:bg-accent"
            >
              <div className="flex items-center space-x-4">
                <div className={t.type === 'income' ? "text-emerald-500" : "text-rose-500"}>
                  {t.type === 'income' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex flex-col">
                    <p className="font-bold text-sm leading-tight">{clientName || t.category}</p>
                    {clientName && <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{t.category}</p>}
                    <p className="text-[10px] text-muted-foreground flex items-center">
                      <Clock className="h-2 w-2 mr-1" />
                      {t.status === 'pending' && t.type === 'investment' ? 'Vencimiento: ' : 'Emitido: '}
                      {format(t.date.toDate(), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="font-bold text-sm">
                    {t.currency} {t.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">{t.type === 'income' ? 'Ingreso' : 'Egreso'}</p>
                </div>
                
                <CollectionSwitch transaction={t} onConfirm={fetchData} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
