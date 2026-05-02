"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Asset } from "@/lib/services/asset-service";
import { TrendingUp, TrendingDown, Trash2, Edit2, RefreshCw, HandCoins, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InvestmentCardProps {
  asset: Asset;
  onUpdateValue: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  onLiquidate: (asset: Asset) => void;
  onAddContribution: (asset: Asset) => void;
}

export function InvestmentCard({ asset, onUpdateValue, onDelete, onEdit, onLiquidate, onAddContribution }: InvestmentCardProps) {
  const roi = ((asset.currentValue - asset.initialCapital) / asset.initialCapital) * 100;
  const isPositive = roi >= 0;
  const isLiquidated = asset.status === 'liquidated';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: asset.currency,
    }).format(value);
  };

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm group hover:bg-card transition-all duration-300",
      isLiquidated && "opacity-80"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                {asset.category}
              </span>
              {isLiquidated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                  Liquidado
                </span>
              )}
            </div>
            <h3 className="text-xl font-black tracking-tight">{asset.name}</h3>
          </div>
          
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isLiquidated && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:text-primary"
                  title="Aportar Capital"
                  onClick={() => onAddContribution(asset)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:text-emerald-500"
                  title="Liquidar / Vender"
                  onClick={() => onLiquidate(asset)}
                >
                  <HandCoins className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onEdit(asset)}
                >
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onUpdateValue(asset)}
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg hover:text-destructive"
              onClick={() => {
                if (confirm(`¿Estás seguro de que deseas eliminar la inversión "${asset.name}"?`)) {
                  onDelete(asset.id!);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Invertido</p>
            <p className="font-bold">{formatCurrency(asset.initialCapital)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valor Actual</p>
            <p className={cn("font-black text-lg", isPositive ? "text-emerald-500" : "text-rose-500")}>
              {formatCurrency(asset.currentValue)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {asset.isInstallmentPlan && asset.totalInstallments && (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso de Cuotas</p>
                <p className="text-xs font-bold">{asset.paidInstallments} / {asset.totalInstallments}</p>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(asset.paidInstallments! / asset.totalInstallments!) * 100}%` }}
                  className="h-full bg-primary"
                />
              </div>
              {asset.nextInstallmentDate && (
                 <p className="text-[9px] font-medium text-muted-foreground italic">
                  Próximo vencimiento: {new Date(asset.nextInstallmentDate.seconds * 1000).toLocaleDateString()}
                 </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "p-1.5 rounded-lg",
                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Rendimiento</p>
                <p className={cn("text-sm font-bold", isPositive ? "text-emerald-500" : "text-rose-500")}>
                  {isPositive ? "+" : ""}{roi.toFixed(2)}%
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Ganancia/Pérdida</p>
              <p className={cn("text-sm font-bold", isPositive ? "text-emerald-500" : "text-rose-500")}>
                  {formatCurrency(asset.currentValue - asset.initialCapital)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
