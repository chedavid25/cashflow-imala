"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { assetService, Asset } from "@/lib/services/asset-service";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { AlertCircle, Wallet, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetToEdit?: Asset | null;
}

export function CreateAssetModal({ isOpen, onClose, onSuccess, assetToEdit }: CreateAssetModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "", // Down payment o capital inicial
    accountId: "",
    category: "Other" as Asset['category'],
    isInstallmentPlan: false,
    totalInstallments: "",
    paidInstallments: "0",
    installmentAmount: "",
    installmentDay: "10",
    initialCapital: "", // Field for editing
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      accountService.getAccounts(user.uid).then(setAccounts);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name,
        amount: "", 
        accountId: "", 
        category: assetToEdit.category,
        isInstallmentPlan: assetToEdit.isInstallmentPlan || false,
        totalInstallments: assetToEdit.totalInstallments?.toString() || "",
        paidInstallments: assetToEdit.paidInstallments?.toString() || "0",
        installmentAmount: assetToEdit.installmentAmount?.toString() || "",
        installmentDay: assetToEdit.nextInstallmentDate 
          ? new Date(assetToEdit.nextInstallmentDate.seconds * 1000).getDate().toString() 
          : "10",
        initialCapital: assetToEdit.initialCapital.toString(),
      });
    } else {
      setFormData({ 
        name: "", amount: "", accountId: "", category: "Other", 
        isInstallmentPlan: false, totalInstallments: "", paidInstallments: "0", 
        installmentAmount: "", installmentDay: "10", initialCapital: "" 
      });
    }
  }, [assetToEdit, isOpen]);

  useEffect(() => {
    const acc = accounts.find(a => a.id === formData.accountId);
    setSelectedAccount(acc || null);
  }, [formData.accountId, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (assetToEdit) {
      // EDIT MODE
      setLoading(true);
      try {
        const updates: Partial<Asset> = {
          name: formData.name,
          category: formData.category,
          isInstallmentPlan: formData.isInstallmentPlan,
          totalInstallments: parseInt(formData.totalInstallments) || 0,
          paidInstallments: parseInt(formData.paidInstallments) || 0,
          installmentAmount: parseFloat(formData.installmentAmount) || 0,
          initialCapital: parseFloat(formData.initialCapital) || 0,
        };

        if (formData.isInstallmentPlan) {
          const now = new Date();
          const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, parseInt(formData.installmentDay));
          updates.nextInstallmentDate = Timestamp.fromDate(nextDate);
        }

        await assetService.updateAsset(assetToEdit.id!, updates);
        onSuccess();
        onClose();
      } catch (error) {
        console.error("Error updating asset:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // CREATE MODE
    if (!selectedAccount) return;
    const downPayment = parseFloat(formData.amount) || 0;
    const installmentAmount = parseFloat(formData.installmentAmount) || 0;
    const paidInstallments = parseInt(formData.paidInstallments) || 0;
    
    const initialCapital = downPayment + (paidInstallments * installmentAmount);

    if (downPayment > selectedAccount.balance) {
      alert("No tienes saldo suficiente en la cuenta seleccionada para el pago inicial.");
      return;
    }

    setLoading(true);
    try {
      let nextDate = null;
      if (formData.isInstallmentPlan) {
        const now = new Date();
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, parseInt(formData.installmentDay));
      }

      const assetId = await assetService.createAsset({
        userId: user.uid,
        name: formData.name,
        initialCapital: initialCapital,
        currentValue: initialCapital,
        currency: selectedAccount.currency,
        category: formData.category,
        status: 'active',
        isInstallmentPlan: formData.isInstallmentPlan,
        totalInstallments: parseInt(formData.totalInstallments) || 0,
        paidInstallments: paidInstallments,
        installmentAmount: installmentAmount,
        nextInstallmentDate: nextDate ? Timestamp.fromDate(nextDate) : null,
        createdAt: new Date()
      });

      if (downPayment > 0) {
        await transactionService.createTransaction({
          userId: user.uid,
          accountId: selectedAccount.id!,
          assetId: assetId,
          type: 'investment',
          category: 'Pago Inicial Inversión',
          amount: downPayment,
          currency: selectedAccount.currency,
          status: 'completed',
          date: Timestamp.now(),
          isRecurring: false,
          paidBy: 'David',
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating investment:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOverBalance = !assetToEdit && selectedAccount && (parseFloat(formData.amount) || 0) > selectedAccount.balance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assetToEdit ? "Editar Inversión" : "Nueva Inversión"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nombre del Activo</label>
              <input
                type="text"
                required
                placeholder="Ej: Depto al pozo..."
                className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Categoría</label>
              <select
                className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Asset['category'] })}
              >
                <option value="Real Estate">Inmuebles</option>
                <option value="Fixed Term">Plazo Fijo</option>
                <option value="Stocks">Acciones / CEDEARs</option>
                <option value="Crypto">Cripto</option>
                <option value="Cash Savings">Ahorros Cash</option>
                <option value="Business">Negocios</option>
                <option value="Other">Otros</option>
              </select>
            </div>
          </div>

          {assetToEdit && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Capital Invertido Acumulado ({assetToEdit.currency})
              </label>
              <input
                type="number"
                step="any"
                className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: e.target.value })}
              />
              <p className="text-[9px] text-muted-foreground ml-1">
                Ajustar este valor cambiará tu patrimonio invertido sin afectar tus cuentas bancarias.
              </p>
            </div>
          )}

          {!assetToEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cuenta de Origen</label>
                <select
                  required
                  className="w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border border-border focus:border-primary transition-all font-bold appearance-none"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Pago Inicial {selectedAccount ? `(${selectedAccount.currency})` : ""}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className={cn(
                    "w-full bg-muted rounded-2xl h-14 px-5 focus:outline-none border transition-all font-bold",
                    isOverBalance ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-primary"
                  )}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Sección de Plan de Cuotas */}
          <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Plan de Cuotas</span>
              </div>
              <input 
                type="checkbox" 
                className="h-5 w-5 rounded-lg accent-primary cursor-pointer"
                checked={formData.isInstallmentPlan}
                onChange={(e) => setFormData({ ...formData, isInstallmentPlan: e.target.checked })}
              />
            </div>

            {formData.isInstallmentPlan && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="grid grid-cols-2 gap-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cuotas Totales</label>
                  <input
                    type="number"
                    placeholder="Ej: 36"
                    className="w-full bg-background rounded-xl h-12 px-4 focus:outline-none border border-border focus:border-primary transition-all text-sm font-bold"
                    value={formData.totalInstallments}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cuotas Ya Pagadas</label>
                  <input
                    type="number"
                    placeholder="Ej: 12"
                    className="w-full bg-background rounded-xl h-12 px-4 focus:outline-none border border-border focus:border-primary transition-all text-sm font-bold"
                    value={formData.paidInstallments}
                    onChange={(e) => setFormData({ ...formData, paidInstallments: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Monto de la Cuota</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="w-full bg-background rounded-xl h-12 px-4 focus:outline-none border border-border focus:border-primary transition-all text-sm font-bold"
                    value={formData.installmentAmount}
                    onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Día de Vencimiento</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    className="w-full bg-background rounded-xl h-12 px-4 focus:outline-none border border-border focus:border-primary transition-all text-sm font-bold"
                    value={formData.installmentDay}
                    onChange={(e) => setFormData({ ...formData, installmentDay: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {!assetToEdit && (
          <div className="bg-primary/5 rounded-2xl p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
              {formData.isInstallmentPlan 
                ? "Se generarán gastos pendientes automáticamente cada mes. El capital invertido crecerá con cada cuota pagada."
                : "Al registrar esta inversión, el dinero se descontará de tu cuenta y se creará un activo fijo."}
            </p>
          </div>
        )}

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
            disabled={loading || isOverBalance || (!assetToEdit && !formData.accountId) || !formData.name}
            className="flex-[2] rounded-2xl h-14 font-bold shadow-lg shadow-primary/20"
          >
            {loading ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
