"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { assetService, Asset } from "@/lib/services/asset-service";
import { accountService, Account } from "@/lib/services/account-service";
import { transactionService } from "@/lib/services/transaction-service";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Briefcase, Landmark, PieChart } from "lucide-react";
import { InvestmentCard } from "@/components/investments/investment-card";
import { CreateAssetModal } from "@/components/investments/create-asset-modal";
import { UpdateValueModal } from "@/components/investments/update-value-modal";
import { LiquidateAssetModal } from "@/components/investments/liquidate-asset-modal";
import { AddContributionModal } from "@/components/investments/add-contribution-modal";
import { ConfirmPaymentModal } from "@/components/billing/confirm-payment-modal";
import { cn } from "@/lib/utils";
import { useInstallmentManager } from "@/hooks/use-installment-manager";
import { Timestamp } from "firebase/firestore";

export default function InvestmentsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLiquidateModalOpen, setIsLiquidateModalOpen] = useState(false);
  const [isAddContributionModalOpen, setIsAddContributionModalOpen] = useState(false);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useInstallmentManager(user?.uid, assets, () => fetchData());

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [assetsData, accountsData] = await Promise.all([
        assetService.getAssets(user.uid),
        accountService.getAccounts(user.uid)
      ]);
      setAssets(assetsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await assetService.deleteAsset(id);
      fetchData();
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const handleUpdateValue = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsUpdateModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleLiquidate = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsLiquidateModalOpen(true);
  };

  const handleAddContribution = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAddContributionModalOpen(true);
  };

  const handlePayInstallment = async (asset: Asset) => {
    if (!user || !asset.id) return;
    
    try {
      const allTransactions = await transactionService.getTransactions(user.uid);
      const nextDate = asset.nextInstallmentDate.toDate();
      
      const alreadyExists = allTransactions.some(t => 
        t.status === 'pending' && 
        t.assetId === asset.id && 
        t.date.toDate().getMonth() === nextDate.getMonth() &&
        t.date.toDate().getFullYear() === nextDate.getFullYear()
      );

      if (alreadyExists) {
        alert("Ya existe un pago pendiente para esta cuota en el Inicio.");
        return;
      }

      const transId = await transactionService.createTransaction({
        userId: user.uid,
        accountId: "", 
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

      const nextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
      await assetService.updateAssetNextDate(asset.id!, Timestamp.fromDate(nextMonth));
      
      // Abrir modal de confirmación directamente
      setSelectedTransaction({
        id: transId,
        userId: user.uid,
        accountId: "",
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
      setIsConfirmPaymentModalOpen(true);
      fetchData();
    } catch (error) {
      console.error("Error generating manual installment:", error);
    }
  };

  const calcNetWorth = (currency: 'ARS' | 'USD') => {
    const liquid = accounts
      .filter(a => a.currency === currency)
      .reduce((acc, curr) => acc + curr.balance, 0);
    
    const invested = assets
      .filter(a => a.currency === currency)
      .reduce((acc, curr) => acc + curr.currentValue, 0);
    
    return { liquid, invested, total: liquid + invested };
  };

  const arsNet = calcNetWorth('ARS');
  const usdNet = calcNetWorth('USD');

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formatCurrency = (value: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inversiones</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona tu patrimonio y haz seguimiento de tus activos.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-2xl shadow-lg shadow-primary/20 h-12 px-6"
          >
            <Plus className="mr-2 h-5 w-5" /> Nueva Inversión
          </Button>
        </div>

        {/* Resumen de Patrimonio */}
        <div className="grid gap-6 md:grid-cols-2">
          <CardSummary 
            title="Patrimonio Neto ARS" 
            total={arsNet.total} 
            liquid={arsNet.liquid} 
            invested={arsNet.invested} 
            currency="ARS"
            icon={Landmark}
            color="text-blue-500"
          />
          <CardSummary 
            title="Patrimonio Neto USD" 
            total={usdNet.total} 
            liquid={usdNet.liquid} 
            invested={usdNet.invested} 
            currency="USD"
            icon={TrendingUp}
            color="text-emerald-500"
          />
        </div>

        {/* Listado de Activos */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Tus Activos
          </h3>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : assets.length > 0 ? (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {assets.map((asset) => (
                <motion.div key={asset.id} variants={item}>
                  <InvestmentCard 
                    asset={asset} 
                    onDelete={handleDelete}
                    onUpdateValue={handleUpdateValue}
                    onEdit={handleEdit}
                    onLiquidate={handleLiquidate}
                    onAddContribution={handleAddContribution}
                    onPayInstallment={handlePayInstallment}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-muted/30 rounded-3xl p-12 text-center space-y-4 border border-dashed border-border">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mx-auto">
                <PieChart className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="font-bold text-lg">Sin activos registrados</h4>
                <p className="text-muted-foreground text-sm">
                  Comienza registrando tu primera inversión para ver crecer tu patrimonio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateAssetModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchData} 
      />

      <CreateAssetModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAsset(null);
        }} 
        onSuccess={fetchData} 
        assetToEdit={selectedAsset}
      />

      <UpdateValueModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={fetchData}
        asset={selectedAsset}
      />

      <AddContributionModal 
        isOpen={isAddContributionModalOpen}
        onClose={() => {
          setIsAddContributionModalOpen(false);
          setSelectedAsset(null);
        }}
        onSuccess={fetchData}
        asset={selectedAsset}
      />

      <LiquidateAssetModal 
        isOpen={isLiquidateModalOpen}
        onClose={() => {
          setIsLiquidateModalOpen(false);
          setSelectedAsset(null);
        }}
        onSuccess={fetchData}
        asset={selectedAsset}
      />

      <ConfirmPaymentModal 
        isOpen={isConfirmPaymentModalOpen}
        onClose={() => {
          setIsConfirmPaymentModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={fetchData}
        transaction={selectedTransaction}
      />
    </MainLayout>
  );
}

function CardSummary({ title, total, liquid, invested, currency, icon: Icon, color }: any) {
  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: curr,
    }).format(value);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 shadow-xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Icon className={cn("h-24 w-24", color)} />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-4xl font-black tracking-tight">{formatCurrency(total, currency)}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Disponible</p>
            <p className="font-bold text-lg">{formatCurrency(liquid, currency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Invertido</p>
            <p className="font-bold text-lg text-primary">{formatCurrency(invested, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
