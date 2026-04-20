"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { clientService, Client } from "@/lib/services/client-service";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { User, Briefcase, FileText, Globe, DollarSign, Wallet, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [billingType, setBillingType] = useState<'monthly_fee' | 'one_shot'>('monthly_fee');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [budget, setBudget] = useState("");
  const [defaultTargetAccount, setDefaultTargetAccount] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    try {
      await clientService.createClient({
        userId: user.uid,
        name,
        razonSocial,
        cuit,
        billingType,
        currency,
        budget: Number(budget) || 0,
        billTo: 'David', 
        defaultTargetAccount: defaultTargetAccount || ""
      });
      
      // Reset form
      setName("");
      setRazonSocial("");
      setCuit("");
      setBudget("");
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Cliente">
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nombre Comercial</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <input 
                required
                type="text"
                placeholder="Nombre del cliente o empresa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Razón Social</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <input 
                  type="text"
                  placeholder="Sociedad / Titular"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">CUIT</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <input 
                  type="text"
                  placeholder="20-XXXXXXXX-X"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Tipo de Facturación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingType('monthly_fee')}
                className={cn(
                  "h-14 rounded-2xl border text-sm font-bold transition-all",
                  billingType === 'monthly_fee' 
                    ? "bg-primary/10 border-primary text-foreground" 
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                Abono Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingType('one_shot')}
                className={cn(
                  "h-14 rounded-2xl border text-sm font-bold transition-all",
                  billingType === 'one_shot' 
                    ? "bg-primary/10 border-primary text-foreground" 
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                Proyecto Único
              </button>
            </div>
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
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Presupuesto / Fee</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-8 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Cuenta de Cobro Predeterminada</label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <select
                value={defaultTargetAccount}
                onChange={(e) => setDefaultTargetAccount(e.target.value)}
                className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all appearance-none text-foreground"
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground ml-1">Esta cuenta se usará por defecto al facturar abonos.</p>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={loading || !name}
          className="w-full h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {loading ? "Registrando..." : "Crear Cliente"}
        </Button>
      </form>
    </Modal>
  );
}
