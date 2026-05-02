"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { assetService, Asset } from "@/lib/services/asset-service";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export function UpdateValueModal({ isOpen, onClose, onSuccess, asset }: UpdateValueModalProps) {
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      setNewValue(asset.currentValue.toString());
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    const val = parseFloat(newValue);
    if (isNaN(val) || val < 0) return;

    setLoading(true);
    try {
      await assetService.updateAssetValue(asset.id!, val);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating asset value:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  const currentVal = parseFloat(newValue) || 0;
  const diff = currentVal - asset.initialCapital;
  const isPositive = diff >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Actualizar Valor: ${asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/50 border border-border flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inversión Inicial</p>
              <p className="font-bold text-lg">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: asset.currency }).format(asset.initialCapital)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Diferencia Total</p>
              <p className={cn("font-black text-lg", isPositive ? "text-emerald-500" : "text-rose-500")}>
                {isPositive ? "+" : ""}{new Intl.NumberFormat("es-AR", { style: "currency", currency: asset.currency }).format(diff)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nuevo Valor de Mercado ({asset.currency})</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                autoFocus
                className="w-full bg-muted rounded-2xl h-16 px-5 focus:outline-none border border-border focus:border-primary transition-all font-black text-2xl"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                 <div className={cn(
                    "p-1.5 rounded-lg",
                    isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/5 rounded-2xl p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-500/80 font-medium leading-relaxed">
            Actualizar el valor del activo ajustará tu Patrimonio Total, pero no generará movimientos en tus cuentas bancarias.
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
            disabled={loading || !newValue}
            className="flex-[2] rounded-2xl h-14 font-bold shadow-lg shadow-primary/20"
          >
            {loading ? "Actualizando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
