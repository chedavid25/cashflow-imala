"use client";

import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
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
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await transactionService.getTransactions(user.uid);
      setPending(all.filter(t => t.status === "pending"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user]);

  if (loading) return <div>Cargando pendientes...</div>;
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
        {pending.map((t) => (
          <div 
            key={t.id} 
            className="flex items-center justify-between p-4 rounded-2xl bg-accent/30 border border-accent/50 transition-all hover:bg-accent/50"
          >
            <div className="flex items-center space-x-4">
              <div className={t.type === 'income' ? "text-emerald-500" : "text-rose-500"}>
                {t.type === 'income' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-semibold text-sm">{t.category}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(t.date.toDate(), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-bold text-sm">
                  {t.currency} {t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">{t.type === 'income' ? 'Ingreso' : 'Egreso'}</p>
              </div>
              
              <CollectionSwitch transaction={t} onConfirm={fetchPending} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
