"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { assetService, Asset } from "@/lib/services/asset-service";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { HandCoins, Info, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiquidateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export function LiquidateAssetModal({ isOpen, onClose, onSuccess, asset }: LiquidateAssetModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salePrice: "",
    accountId: "",
  });

  useEffect(() => {
    if (isOpen && user && asset) {
      accountService.getAccounts(user.uid).then(accs => {
        // Only show accounts with the same currency as the asset
        setAccounts(accs.filter(a => a.currency === asset.currency));
      });
      setFormData({
        salePrice: asset.currentValue.toString(),
        accountId: "",
      });
    }
  }, [isOpen, user, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !asset || !formData.accountId) return;

    const salePrice = parseFloat(formData.salePrice);
    if (isNaN(salePrice) || salePrice < 0) return;

    setLoading(true);
    try {
      // 1. Create the Income Transaction
      await transactionService.createTransaction({
        userId: user.uid,
        accountId: formData.accountId,
        assetId: asset.id,
        type: 'income',
        category: 'Venta de Activo',
        amount: salePrice,
        currency: asset.currency,
        status: 'completed',
        date: Timestamp.now(),
        isRecurring: false,
        paidBy: 'David',
      });

      // 2. Mark Asset as Liquidated
      await assetService.liquidateAsset(asset.id!);
      
      // 3. Update final value to the sale price for history
      await assetService.updateAssetValue(asset.id!, salePrice);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error liquidating asset:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  const salePrice = parseFloat(formData.salePrice) || 0;
  const profit = salePrice - asset.initialCapital;
  const isPositive = profit >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Liquidar Inversión: ${asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/50 border border-border grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inversión Total</p>
              <p className="font-bold text-lg">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: asset.currency }).format(asset.initialCapital)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ganancia Final Est.</p>
              <p className={cn("font-black text-lg", isPositive ? "text-emerald-500" : "text-rose-500")}>
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: asset.currency }).format(profit)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Monto de Venta Final ({asset.currency})</label>
            <input
              type="number"
              step="any"
              required
              className="w-full bg-muted rounded-2xl h-16 px-5 focus:outline-none border border-border focus:border-primary transition-all font-black text-2xl"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cuenta de Destino (Para el Ingreso)</label>
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

        <div className="bg-emerald-500/5 rounded-2xl p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-emerald-500/80 font-medium leading-relaxed">
            Al confirmar la liquidación, se creará un ingreso en la cuenta seleccionada y el activo pasará a estado "Liquidado".
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
            disabled={loading || !formData.accountId || !formData.salePrice}
            className="flex-[2] rounded-2xl h-14 font-bold shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            {loading ? "Liquidando..." : "Confirmar Venta e Ingreso"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
