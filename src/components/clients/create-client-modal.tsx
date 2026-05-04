"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { clientService, Client } from "@/lib/services/client-service";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { User, Briefcase, FileText, Globe, DollarSign, Wallet, Landmark, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { ClientFee } from "@/lib/services/client-service";

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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Fees state
  const [fees, setFees] = useState<Omit<ClientFee, 'id'>[]>([
    { serviceName: "Servicio Mensual", amount: 0, currency: 'ARS', billingType: 'monthly_fee' }
  ]);

  useEffect(() => {
    if (user && isOpen) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [user, isOpen]);

  const addFee = () => {
    setFees([...fees, { serviceName: "", amount: 0, currency: 'ARS', billingType: 'monthly_fee' }]);
  };

  const removeFee = (index: number) => {
    if (fees.length <= 1) return;
    setFees(fees.filter((_, i) => i !== index));
  };

  const updateFee = (index: number, data: Partial<Omit<ClientFee, 'id'>>) => {
    const newFees = [...fees];
    newFees[index] = { ...newFees[index], ...data };
    setFees(newFees);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    try {
      // Generate IDs for fees
      const feesWithIds: ClientFee[] = fees.map(f => ({
        ...f,
        id: Math.random().toString(36).substring(2, 11)
      }));

      await clientService.createClient({
        userId: user.uid,
        name,
        email,
        phone,
        razonSocial,
        cuit,
        billTo: 'David', 
        fees: feesWithIds,
        // Legacy fields for backward compatibility
        budget: feesWithIds[0]?.amount || 0,
        currency: feesWithIds[0]?.currency || 'ARS',
        billingType: feesWithIds[0]?.billingType || 'monthly_fee',
        defaultTargetAccount: feesWithIds[0]?.defaultTargetAccount || ""
      });
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setRazonSocial("");
      setCuit("");
      setFees([{ serviceName: "Servicio Mensual", amount: 0, currency: 'ARS', billingType: 'monthly_fee' }]);
      
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
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <input 
                  type="email"
                  placeholder="ejemplo@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <input 
                  type="tel"
                  placeholder="+54 9..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                />
              </div>
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

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-black text-primary uppercase tracking-widest">Servicios / Abonos</label>
              <button 
                type="button"
                onClick={addFee}
                className="flex items-center space-x-1 text-[10px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>AGREGAR SERVICIO</span>
              </button>
            </div>

            <div className="space-y-6">
              {fees.map((fee, index) => (
                <div key={index} className="bg-muted/30 p-4 rounded-3xl border border-border relative space-y-4">
                  {fees.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeFee(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Descripción del Servicio</label>
                    <input 
                      type="text"
                      placeholder="Ej: Mantenimiento Web, Marketing..."
                      value={fee.serviceName}
                      onChange={(e) => updateFee(index, { serviceName: e.target.value })}
                      className="w-full bg-muted rounded-2xl h-12 px-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Tipo</label>
                      <select
                        value={fee.billingType}
                        onChange={(e) => updateFee(index, { billingType: e.target.value as any })}
                        className="w-full bg-muted rounded-2xl h-12 px-4 border border-border focus:border-primary/50 focus:outline-none text-xs transition-all appearance-none"
                      >
                        <option value="monthly_fee">Abono Mensual</option>
                        <option value="one_shot">Proyecto Único</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Moneda</label>
                      <div className="flex bg-muted rounded-2xl p-1 border border-border h-12 items-center">
                        <button
                          type="button"
                          onClick={() => updateFee(index, { currency: 'ARS' })}
                          className={cn(
                            "flex-1 h-full rounded-xl text-[10px] font-black transition-all",
                            fee.currency === 'ARS' ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground/50"
                          )}
                        >
                          ARS
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFee(index, { currency: 'USD' })}
                          className={cn(
                            "flex-1 h-full rounded-xl text-[10px] font-black transition-all",
                            fee.currency === 'USD' ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground/50"
                          )}
                        >
                          USD
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Monto / Fee</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">$</span>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={fee.amount || ""}
                          onChange={(e) => updateFee(index, { amount: Number(e.target.value) })}
                          className="w-full bg-muted rounded-2xl h-12 pl-8 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Cuenta Destino</label>
                      <select
                        value={fee.defaultTargetAccount || ""}
                        onChange={(e) => updateFee(index, { defaultTargetAccount: e.target.value })}
                        className="w-full bg-muted rounded-2xl h-12 px-4 border border-border focus:border-primary/50 focus:outline-none text-xs transition-all appearance-none"
                      >
                        <option value="">Por defecto...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={loading || !name || fees.some(f => !f.serviceName || !f.amount)}
          className="w-full h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {loading ? "Registrando..." : "Crear Cliente"}
        </Button>
      </form>
    </Modal>
  );
}
