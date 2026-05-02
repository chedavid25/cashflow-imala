"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { Landmark, CreditCard, Wallet, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const accountTypes = [
  { id: 'debit_card', label: 'T. Débito', icon: Landmark },
  { id: 'credit_card', label: 'T. Crédito', icon: CreditCard },
  { id: 'cash', label: 'Efectivo', icon: Banknote },
];

export function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<'debit_card' | 'cash' | 'credit_card'>('debit_card');
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    try {
      await accountService.createAccount({
        userId: user.uid,
        name,
        type,
        currency,
        balance: Number(balance) || 0,
      });
      
      // Reset form
      setName("");
      setBalance("");
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Cuenta">
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Tipo de Cuenta</label>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={cn(
                      "flex items-center space-x-3 h-14 rounded-2xl border px-4 transition-all",
                      type === item.id 
                        ? "bg-primary/10 border-primary text-foreground" 
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", type === item.id ? "text-primary" : "text-muted-foreground/50")} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nombre Identificador</label>
            <input 
              required
              type="text"
              placeholder="Ej: BBVA Personal, Galicia Empresa, Efectivo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted rounded-2xl h-14 px-5 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Moneda</label>
              <div className="flex bg-muted rounded-2xl p-1 border border-border h-14 items-center">
                <button
                  type="button"
                  onClick={() => setCurrency('ARS')}
                  className={cn(
                    "flex-1 h-full rounded-xl text-xs font-black transition-all",
                    currency === 'ARS' ? "bg-accent text-foreground" : "text-muted-foreground/50"
                  )}
                >
                  ARS
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={cn(
                    "flex-1 h-full rounded-xl text-xs font-black transition-all",
                    currency === 'USD' ? "bg-accent text-foreground" : "text-muted-foreground/50"
                  )}
                >
                  USD
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Saldo Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold">$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-8 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={loading || !name}
          className="w-full h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {loading ? "Creando..." : "Crear Cuenta"}
        </Button>
      </form>
    </Modal>
  );
}
