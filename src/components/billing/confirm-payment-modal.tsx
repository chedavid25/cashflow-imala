"use client";

import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
import { accountService, Account } from "@/lib/services/account-service";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Landmark, Calendar, RefreshCw, DollarSign, Calculator, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction | null;
}

export function ConfirmPaymentModal({ isOpen, onClose, onSuccess, transaction }: ConfirmPaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // States for confirmation
  const [amountReceived, setAmountReceived] = useState(0);
  const [currencyReceived, setCurrencyReceived] = useState<'ARS' | 'USD'>('ARS');
  const [isCurrencyChange, setIsCurrencyChange] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [exchangeDate, setExchangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (transaction && isOpen) {
      setAmountReceived(transaction.amount);
      setCurrencyReceived(transaction.currency);
      setAccountId(transaction.accountId);
      setIsCurrencyChange(false);
      setExchangeRate("");
    }
  }, [transaction, isOpen]);

  // Logic to calculate amount based on exchange rate
  useEffect(() => {
    if (isCurrencyChange && exchangeRate && transaction) {
      const rate = parseFloat(exchangeRate);
      if (rate > 0) {
        // If we bill USD and receive ARS: amount * rate
        // If we bill ARS and receive USD: amount / rate
        if (transaction.currency === 'USD' && currencyReceived === 'ARS') {
          setAmountReceived(transaction.amount * rate);
        } else if (transaction.currency === 'ARS' && currencyReceived === 'USD') {
          setAmountReceived(transaction.amount / rate);
        }
      }
    }
  }, [exchangeRate, currencyReceived, isCurrencyChange, transaction]);

  const handleConfirm = async () => {
    if (!transaction?.id || !accountId) return;

    setLoading(true);
    try {
      await transactionService.confirmTransaction(transaction.id, {
        amount: amountReceived,
        currency: currencyReceived,
        exchangeRate: isCurrencyChange ? (parseFloat(exchangeRate) || 1) : 1,
        exchangeDate: Timestamp.fromDate(new Date(exchangeDate)),
        accountId: accountId
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Cobro">
      <div className="space-y-6 pb-4">
        {/* Resumen de lo Facturado */}
        <div className="bg-muted p-4 rounded-2xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Facturado</span>
            <span className="text-xs font-bold text-foreground/70">
              {transaction.currency} {transaction.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Categoría</span>
            <span className="text-xs font-bold text-primary">{transaction.category}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Cambio de Moneda */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-xs font-black text-foreground/70 uppercase tracking-tight">¿Cambio de Divisa?</span>
            </div>
            <button
              onClick={() => {
                const newValue = !isCurrencyChange;
                setIsCurrencyChange(newValue);
                if (newValue) {
                  setCurrencyReceived(transaction.currency === 'ARS' ? 'USD' : 'ARS');
                } else {
                  setCurrencyReceived(transaction.currency);
                  setAmountReceived(transaction.amount);
                }
              }}
              className={cn(
                "w-12 h-6 rounded-full relative transition-all border",
                isCurrencyChange ? "bg-primary border-primary/20" : "bg-muted border-border"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                isCurrencyChange ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <AnimatePresence>
            {isCurrencyChange && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Monto Final y Cuenta */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Monto Final Recibido</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                {currencyReceived === 'USD' ? 'u$s' : '$'}
              </span>
              <input 
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                className="w-full bg-muted rounded-2xl h-14 pl-12 pr-4 border border-border focus:border-primary/50 focus:outline-none text-xl font-black transition-all"
              />
            </div>
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
                <option value="">Seleccionar cuenta...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency} {acc.balance.toLocaleString()})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            disabled={loading || !accountId || (isCurrencyChange && !exchangeRate)}
            onClick={handleConfirm}
            className="w-full h-16 rounded-2xl text-lg font-black bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="h-6 w-6" />
            <span>{loading ? "Registrando..." : "Registrar como Cobrado"}</span>
          </Button>
          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
            Esto actualizará el saldo de la cuenta automáticamente
          </p>
        </div>
      </div>
    </Modal>
  );
}
