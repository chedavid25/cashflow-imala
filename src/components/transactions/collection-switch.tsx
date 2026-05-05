"use client";

import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
import { accountService, Account } from "@/lib/services/account-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, RefreshCw, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface CollectionSwitchProps {
  transaction: Transaction;
  onConfirm?: () => void;
}

export function CollectionSwitch({ transaction, onConfirm }: CollectionSwitchProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState(transaction.amount);
  const [currency, setCurrency] = useState(transaction.currency);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [accountId, setAccountId] = useState(transaction.accountId || "");

  useEffect(() => {
    if (isOpen && user) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [isOpen, user]);

  const handleConfirm = async () => {
    if (!transaction.id || !accountId) {
      console.error("Faltan datos requeridos: id o cuenta");
      return;
    }

    setLoading(true);
    try {
      await transactionService.confirmTransaction(transaction.id, {
        amount,
        currency,
        exchangeRate: exchangeRate || 1,
        exchangeDate: Timestamp.now(),
        accountId,
      });
      
      setIsOpen(false);
      if (onConfirm) onConfirm();
    } catch (error) {
      console.error("Error confirming collection:", error);
      alert("Hubo un error al registrar el ingreso. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (transaction.status === "completed") {
    return (
      <div className="flex items-center space-x-2 text-emerald-500 font-medium text-sm">
        <Check className="h-4 w-4" />
        <span>{transaction.type === 'income' ? 'Cobrado' : 'Pagado'}</span>
      </div>
    );
  }

  const isInflow = transaction.type === 'income';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-xl",
          isInflow 
            ? "border-amber-500/50 text-amber-600 hover:bg-amber-500/10" 
            : "border-rose-500/50 text-rose-600 hover:bg-rose-500/10"
        )}
      >
        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
        {isInflow ? "Confirmar Cobro" : "Confirmar Pago"}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-none">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{isInflow ? "Confirmar Cobranza" : "Confirmar Pago"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Monto Final Recibido</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                      className="w-full rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  
                  {currency !== transaction.currency && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="text-sm font-medium text-muted-foreground">Tipo de Cambio</label>
                      <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                        className="w-full rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Ej: 1100"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {isInflow ? "Cuenta de Destino" : "Cuenta de Origen"}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency} {acc.balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <Button 
                  className={cn(
                    "rounded-2xl h-14 text-lg",
                    !isInflow && "bg-rose-600 hover:bg-rose-500"
                  )} 
                  onClick={handleConfirm}
                  disabled={loading || !accountId}
                >
                  {loading ? "Procesando..." : isInflow ? "Registrar Ingreso Real" : "Registrar Pago Real"}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Al confirmar, el saldo de la cuenta se actualizará automáticamente.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
