"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { accountService, Account } from "@/lib/services/account-service";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Landmark, 
  Plus, 
  Wallet, 
  CreditCard, 
  Banknote,
  Search,
  MoreVertical,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAccounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await accountService.getAccounts(user.uid);
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return Landmark;
      case 'credit_card': return CreditCard;
      case 'cash': return Banknote;
      case 'investment': return Wallet;
      default: return Landmark;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'bank': return "text-blue-500 bg-blue-500/10";
      case 'credit_card': return "text-rose-500 bg-rose-500/10";
      case 'cash': return "text-emerald-500 bg-emerald-500/10";
      case 'investment': return "text-amber-500 bg-amber-500/10";
      default: return "text-primary bg-primary/10";
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mis Cuentas</h2>
            <p className="text-muted-foreground text-sm">
              Visualiza y gestiona el capital en tus bancos y billeteras.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl shadow-lg shadow-primary/20 h-12 px-6"
          >
            <Plus className="mr-2 h-5 w-5" /> Nueva Cuenta
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {accounts.map((account) => {
              const Icon = getIcon(account.type);
              const colorClasses = getColor(account.type);
              
              return (
                <motion.div key={account.id} variants={item}>
                  <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm group hover:shadow-xl hover:bg-card transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className={cn("p-2.5 rounded-2xl", colorClasses)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{account.name}</p>
                        <h3 className="text-2xl font-black tabular-nums">
                          {formatCurrency(account.balance, account.currency)}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 pt-2 border-t border-border">
                        <div className="flex items-center text-[10px] font-bold text-emerald-500">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          +12% este mes
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                          {account.currency} • {account.type}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-accent/20 rounded-3xl border-2 border-dashed border-border">
            <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center">
              <Landmark className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <div>
              <h3 className="font-bold text-2xl">No tienes cuentas registradas</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                Para empezar a registrar transacciones, necesitas añadir al menos una cuenta (banco, billetera o efectivo).
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl px-10 h-14 font-bold border-border hover:bg-muted transition-all"
            >
              Registrar mi primera cuenta
            </Button>
          </div>
        )}
      </div>

      <CreateAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAccounts}
      />
    </MainLayout>
  );
}
