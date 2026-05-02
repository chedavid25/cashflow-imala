"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { ArrowRightLeft, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    exchangeRate: "1",
    description: "",
  });

  useEffect(() => {
    if (isOpen && user) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [isOpen, user]);

  const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
  const toAccount = accounts.find(a => a.id === formData.toAccountId);
  
  const isExchange = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;
  
  const amount = parseFloat(formData.amount) || 0;
  const rate = parseFloat(formData.exchangeRate) || 1;
  
  // Calculate incoming amount based on direction
  let incomingAmount = amount;
  if (isExchange) {
    if (fromAccount.currency === 'ARS' && toAccount.currency === 'USD') {
      incomingAmount = amount / rate;
    } else {
      incomingAmount = amount * rate;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fromAccount || !toAccount || amount <= 0) return;

    if (amount > fromAccount.balance) {
      alert("No tienes saldo suficiente en la cuenta de origen.");
      return;
    }

    setLoading(true);
    try {
      await transactionService.createTransfer({
        userId: user.uid,
        accountId: fromAccount.id!,
        toAccountId: toAccount.id!,
        type: 'transfer',
        category: formData.description || 'Transferencia entre cuentas',
        amount: amount,
        toAmount: incomingAmount,
        currency: fromAccount.currency,
        exchangeRate: rate,
        status: 'completed',
        date: Timestamp.now(),
        isRecurring: false,
        paidBy: 'David', // Se podría dinamizar
      });

      onSuccess();
      onClose();
      setFormData({ fromAccountId: "", toAccountId: "", amount: "", exchangeRate: "1", description: "" });
    } catch (error) {
      console.error("Error creating transfer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferencia entre Cuentas">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Origen (Sale)</label>
              <select
                required
                className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold"
                value={formData.fromAccountId}
                onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Destino (Entra)</label>
              <select
                required
                className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold"
                value={formData.toAccountId}
                onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {accounts.filter(a => a.id !== formData.fromAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Monto a Enviar {fromAccount ? `(${fromAccount.currency})` : ""}
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              className="w-full bg-muted rounded-2xl h-16 px-5 focus:outline-none border border-border focus:border-primary transition-all font-black text-2xl"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {isExchange && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2 text-primary">
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cambio de Divisa</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tipo de Cambio</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-background rounded-xl h-12 px-4 focus:outline-none border border-border focus:border-primary transition-all font-bold"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Recibís Est. ({toAccount?.currency})</label>
                  <div className="w-full bg-background/50 rounded-xl h-12 px-4 flex items-center font-bold text-primary">
                    {incomingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Descripción (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Cambio a USD para ahorros..."
              className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
            Esta operación moverá fondos entre tus cuentas de forma instantánea y quedará registrada en tu historial.
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 rounded-2xl h-14 font-bold"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.fromAccountId || !formData.toAccountId || !formData.amount}
            className="flex-[2] rounded-2xl h-14 font-bold shadow-lg shadow-primary/20"
          >
            {loading ? "Procesando..." : "Confirmar Transferencia"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
