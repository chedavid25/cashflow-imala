"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { assetService, Asset } from "@/lib/services/asset-service";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { PlusCircle, Info, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export function AddContributionModal({ isOpen, onClose, onSuccess, asset }: AddContributionModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    accountId: "",
  });

  useEffect(() => {
    if (isOpen && user && asset) {
      accountService.getAccounts(user.uid).then(accs => {
        setAccounts(accs.filter(a => a.currency === asset.currency));
      });
      setFormData({ amount: "", accountId: "" });
    }
  }, [isOpen, user, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !asset || !formData.accountId) return;

    const contribution = parseFloat(formData.amount);
    if (isNaN(contribution) || contribution <= 0) return;

    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    if (selectedAccount && contribution > selectedAccount.balance) {
      alert("No tienes saldo suficiente en la cuenta seleccionada.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Investment Transaction
      await transactionService.createTransaction({
        userId: user.uid,
        accountId: formData.accountId,
        assetId: asset.id,
        type: 'investment',
        category: `Aporte a ${asset.name}`,
        amount: contribution,
        currency: asset.currency,
        status: 'completed',
        date: Timestamp.now(),
        isRecurring: false,
        paidBy: 'David',
      });

      // 2. Update Asset Capital and Value
      await assetService.updateAsset(asset.id!, {
        initialCapital: asset.initialCapital + contribution,
        currentValue: asset.currentValue + contribution,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding contribution:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aportar Capital: ${asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">¿Cuánto vas a sumar? ({asset.currency})</label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              placeholder="0.00"
              className="w-full bg-muted rounded-2xl h-16 px-5 focus:outline-none border border-border focus:border-primary transition-all font-black text-2xl"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cuenta de Origen</label>
            <select
              required
              className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold appearance-none"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            >
              <option value="">Seleccionar cuenta...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.balance.toLocaleString()} {acc.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
            Este monto se descontará de tu cuenta bancaria y se sumará al capital invertido de este activo.
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
            disabled={loading || !formData.accountId || !formData.amount}
            className="flex-[2] rounded-2xl h-14 font-bold shadow-lg shadow-primary/20"
          >
            {loading ? "Procesando..." : "Confirmar Aporte"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
