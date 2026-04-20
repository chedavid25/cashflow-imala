"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { clientService, Client } from "@/lib/services/client-service";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { User, Briefcase, FileText, Globe, DollarSign, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client | null;
}

export function EditClientModal({ isOpen, onClose, onSuccess, client }: EditClientModalProps) {
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

  useEffect(() => {
    if (client && isOpen) {
      setName(client.name);
      setRazonSocial(client.razonSocial || "");
      setCuit(client.cuit || "");
      setBillingType(client.billingType);
      setCurrency(client.currency);
      setBudget(String(client.budget));
      setDefaultTargetAccount(client.defaultTargetAccount || "");
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !client?.id) return;

    setLoading(true);
    try {
      await clientService.updateClient(client.id, {
        name,
        razonSocial,
        cuit,
        billingType,
        currency,
        budget: Number(budget) || 0,
        defaultTargetAccount: defaultTargetAccount || ""
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <div className="space-y-4">
          {/* Nombre Comercial */}
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

          {/* Razón Social y CUIT */}
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

          {/* Tipo de Facturación */}
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

          {/* Moneda y Presupuesto */}
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

          {/* Cuenta Predeterminada */}
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
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col space-y-3">
          <Button 
            type="submit"
            disabled={loading || !name}
            className="w-full h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button 
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full h-12 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
