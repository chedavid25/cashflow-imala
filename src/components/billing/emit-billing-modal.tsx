"use client";

import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
import { accountService, Account } from "@/lib/services/account-service";
import { Client } from "@/lib/services/client-service";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Landmark, ReceiptText, DollarSign, CheckCircle2, RefreshCw, Calculator, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

interface EmitBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client | null;
}

export function EmitBillingModal({ isOpen, onClose, onSuccess, client }: EmitBillingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // States for emission
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("Honorarios");

  // Currency exchange states
  const [isCurrencyChange, setIsCurrencyChange] = useState(false);
  const [currencyReceived, setCurrencyReceived] = useState<'ARS' | 'USD'>('ARS');
  const [amountReceived, setAmountReceived] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [exchangeDate, setExchangeDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && isOpen) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (client && isOpen) {
      setAmount(client.budget);
      setCurrency(client.currency);
      setCurrencyReceived(client.currency);
      setAmountReceived(client.budget);
      setAccountId(client.defaultTargetAccount || "");
      setIsCurrencyChange(false);
      setExchangeRate("");
    }
  }, [client, isOpen]);

  // Logic to calculate amount based on exchange rate
  useEffect(() => {
    if (isCurrencyChange && exchangeRate) {
      const rate = parseFloat(exchangeRate);
      if (rate > 0) {
        if (currency === 'USD' && currencyReceived === 'ARS') {
          setAmountReceived(amount * rate);
        } else if (currency === 'ARS' && currencyReceived === 'USD') {
          setAmountReceived(amount / rate);
        }
      }
    } else {
      setAmountReceived(amount);
    }
  }, [exchangeRate, currencyReceived, isCurrencyChange, amount, currency]);

  const handleEmit = async () => {
    if (!user || !client?.id || !accountId) return;

    setLoading(true);
    try {
      const transactionData: any = {
        userId: user.uid,
        clientId: client.id,
        type: 'income',
        category: category,
        amount: isCurrencyChange ? amountReceived : amount,
        currency: isCurrencyChange ? currencyReceived : currency,
        status: 'pending',
        date: Timestamp.now(),
        isRecurring: client.billingType === 'monthly_fee',
        paidBy: 'David',
        accountId: accountId,
      };

      if (isCurrencyChange) {
        transactionData.exchangeRate = parseFloat(exchangeRate) || 1;
        transactionData.exchangeDate = Timestamp.fromDate(new Date(exchangeDate));
      }

      await transactionService.createTransaction(transactionData);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error emitting billing:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Emitir Factura / Honorarios">
      <div className="space-y-6 pb-4">
        {/* Resumen del Cliente */}
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">{client.name}</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {client.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto Único'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Monto y Moneda Facturada */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Monto de la Factura (Venta)</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  {currency === 'USD' ? 'u$s' : '$'}
                </span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-xl font-black transition-all"
                />
              </div>
              <div className="flex bg-muted rounded-2xl p-1 border border-border">
                {(['ARS', 'USD'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setCurrency(curr);
                      if (!isCurrencyChange) setCurrencyReceived(curr);
                    }}
                    className={cn(
                      "px-4 rounded-xl text-xs font-black transition-all",
                      currency === curr ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Categoría</label>
            <input 
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-muted rounded-2xl h-12 px-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
              placeholder="Ej: Honorarios, Adelanto..."
            />
          </div>

          <div className="border-t border-border pt-4 mt-2">
            {/* Cambio de Moneda Toggles */}
            <div 
              onClick={() => {
                const newValue = !isCurrencyChange;
                setIsCurrencyChange(newValue);
                if (newValue) {
                  setCurrencyReceived(currency === 'ARS' ? 'USD' : 'ARS');
                } else {
                  setCurrencyReceived(currency);
                  setAmountReceived(amount);
                }
              }}
              className="flex items-center justify-between px-1 mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-2">
                <RefreshCw className={cn("h-4 w-4", isCurrencyChange ? "text-primary" : "text-muted-foreground")} />
                <span className="text-[10px] font-black text-foreground/70 uppercase tracking-tight">¿Se cobra en otra moneda?</span>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full relative transition-all border",
                  isCurrencyChange ? "bg-primary border-primary/20" : "bg-muted border-border"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm",
                  isCurrencyChange ? "right-1" : "left-1"
                )} />
              </div>
            </div>

            {isCurrencyChange && (
              <div className="space-y-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Tipo de Cambio</label>
                    <div className="relative">
                      <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="number"
                        placeholder="Ej: 1150"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-full bg-muted rounded-2xl h-12 pl-10 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Fecha de Cambio</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="date"
                        value={exchangeDate}
                        onChange={(e) => setExchangeDate(e.target.value)}
                        className="w-full bg-muted rounded-2xl h-12 pl-10 pr-4 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all text-foreground/70"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Monto Final a Recibir</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      {currencyReceived === 'USD' ? 'u$s' : '$'}
                    </span>
                    <input 
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      className="w-full bg-primary/5 rounded-2xl h-14 pl-12 pr-4 border border-primary/20 focus:border-primary/50 focus:outline-none text-xl font-black transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Cuenta de Destino</label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-muted rounded-2xl h-14 pl-12 pr-10 border border-border focus:border-primary/50 focus:outline-none text-sm transition-all appearance-none text-foreground"
              >
                <option value="">Seleccionar cuenta destino...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            disabled={loading || !accountId || !amount || (isCurrencyChange && !exchangeRate)}
            onClick={handleEmit}
            className="w-full h-16 rounded-2xl text-lg font-black bg-primary text-primary-foreground shadow-xl shadow-primary/10 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="h-6 w-6" />
            <span>{loading ? "Emitiendo..." : "Generar Cuenta por Cobrar"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
