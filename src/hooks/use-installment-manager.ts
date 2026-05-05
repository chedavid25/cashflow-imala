"use client";

import { useEffect } from "react";
import { assetService, Asset } from "@/lib/services/asset-service";
import { transactionService } from "@/lib/services/transaction-service";
import { Timestamp } from "firebase/firestore";

export function useInstallmentManager(userId: string | undefined, assets: Asset[], onUpdate: () => void) {
  useEffect(() => {
    if (!userId || assets.length === 0) return;

    const checkInstallments = async () => {
      const now = new Date();
      let updated = false;

      // Obtenemos todas las transacciones pendientes para evitar duplicados
      const allTransactions = await transactionService.getTransactions(userId);
      const pendingInvestmentTrans = allTransactions.filter(t => t.status === 'pending' && t.type === 'investment');

      for (const asset of assets) {
        if (asset.isInstallmentPlan && asset.nextInstallmentDate) {
          const nextDate = asset.nextInstallmentDate.toDate();
          
          // CONDICIÓN: Si estamos en el mismo mes del vencimiento (o después)
          // y aún no llegamos al total de cuotas
          const isSameMonthOrPast = 
            (now.getFullYear() > nextDate.getFullYear()) || 
            (now.getFullYear() === nextDate.getFullYear() && now.getMonth() >= nextDate.getMonth());

          if (isSameMonthOrPast && asset.paidInstallments! < asset.totalInstallments!) {
            
            // EVITAR DUPLICADOS: Verificar si ya existe una transacción pendiente para este assetId en este mes
            const alreadyExists = pendingInvestmentTrans.some(t => 
              t.assetId === asset.id && 
              t.date.toDate().getMonth() === nextDate.getMonth() &&
              t.date.toDate().getFullYear() === nextDate.getFullYear()
            );

            if (!alreadyExists) {
              try {
                // 1. Create a PENDING transaction for this installment
                await transactionService.createTransaction({
                  userId: userId,
                  accountId: "", // User will have to select account when confirming
                  assetId: asset.id,
                  type: 'investment',
                  category: `Cuota ${asset.paidInstallments! + 1} - ${asset.name}`,
                  amount: asset.installmentAmount!,
                  currency: asset.currency,
                  status: 'pending',
                  date: Timestamp.fromDate(nextDate),
                  isRecurring: false,
                  paidBy: 'David',
                });

                // 2. Update the asset's next installment date (+1 month)
                const nextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
                await assetService.updateAssetNextDate(asset.id!, Timestamp.fromDate(nextMonth));
                
                updated = true;
              } catch (error) {
                console.error("Error processing installment for asset:", asset.name, error);
              }
            }
          }
        }
      }

      if (updated) {
        onUpdate();
      }
    };

    checkInstallments();
  }, [userId, assets, onUpdate]);
}
