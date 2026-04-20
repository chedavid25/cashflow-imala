import React, { useState, useEffect } from "react";
import { Transaction, transactionService } from "@/lib/services/transaction-service";
import { accountService, Account } from "@/lib/services/account-service";
import { categoryService, Category } from "@/lib/services/category-service";
import { clientService, Client } from "@/lib/services/client-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  X, 
  Coffee, 
  Fuel, 
  ShoppingCart, 
  Utensils, 
  MoreHorizontal, 
  Send,
  Users,
  Plus,
  Landmark,
  Settings2,
  Tag,
  CheckCircle2,
  Clock,
  Wallet
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { CreateClientModal } from "@/components/clients/create-client-modal";
import { CategoryManagerModal } from "./category-manager-modal";

interface QuickRegisterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialType?: 'income' | 'expense';
}

const ICON_MAP: Record<string, any> = {
  Coffee, Fuel, ShoppingCart, Utensils, MoreHorizontal, Users, Plus, Tag
};

export function QuickRegister({ isOpen, onClose, onSuccess, initialType = 'expense' }: QuickRegisterProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [isPending, setIsPending] = useState(false);
  const [includeContact, setIncludeContact] = useState(false);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const isUSD = selectedAccount?.currency === 'USD';

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const [accs, cls] = await Promise.all([
        accountService.getAccounts(user.uid),
        clientService.getClients(user.uid)
      ]);
      setAccounts(accs);
      setClients(cls);
      if (accs.length > 0 && !accountId) setAccountId(accs[0].id!);

      await categoryService.initializeDefaultCategories(user.uid);
      const cats = await categoryService.getCategories(user.uid);
      
      const sortedCats = [...cats].sort((a, b) => {
        if (a.name === "Otros") return 1;
        if (b.name === "Otros") return -1;
        return (a.order || 0) - (b.order || 0);
      });
      
      setCategories(sortedCats);
    } catch (error) {
      console.error("Error fetching quick register data:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setIncludeContact(initialType === 'income');
      fetchInitialData();
    }
  }, [isOpen, initialType, user]);

  const handleSubmit = async () => {
    if (!user || !amount || !category || !accountId) return;
    
    setLoading(true);
    const transactionData: any = {
      userId: user.uid,
      type,
      category,
      amount: Number(amount),
      currency: selectedAccount?.currency || 'ARS',
      status: isPending ? 'pending' : 'completed',
      date: Timestamp.now(),
      isRecurring: false,
      paidBy: 'David', 
      accountId,
    };

    if ((includeContact || type === 'income') && clientId) {
      transactionData.clientId = clientId;
    }

    try {
      await transactionService.createTransaction(transactionData);
      
      setAmount("");
      setCategory("");
      setClientId("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border-none bg-[#2a2a2a] text-white animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
          <div className="p-6 space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex bg-[#1a1a1a] rounded-xl p-1.5 border border-white/5">
                <button 
                  onClick={() => {
                    setType('expense');
                    setIncludeContact(false);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-xs font-bold transition-all", 
                    type === 'expense' 
                      ? "bg-[#333333] text-white shadow-lg ring-1 ring-white/10" 
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  Gasto
                </button>
                <button 
                  onClick={() => {
                    setType('income');
                    setIncludeContact(true);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-xs font-bold transition-all", 
                    type === 'income' 
                      ? "bg-[#333333] text-white shadow-lg ring-1 ring-white/10" 
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  Ingreso
                </button>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="relative inline-block">
                  <input
                    autoFocus
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(
                      "w-full bg-transparent text-6xl font-bold text-center focus:outline-none placeholder:text-white/10 selection:bg-primary/30 transition-colors",
                      isUSD ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "text-white"
                    )}
                  />
                  {isUSD && (
                    <span className="absolute -right-12 top-2 text-xs font-black bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md border border-cyan-500/20 animate-pulse">
                      USD
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                  {isUSD ? 'DÓLARES' : 'PESOS ARGENTINOS'} • MOVER CAPITAL
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Categoría</span>
                  <button 
                    onClick={() => setIsCatModalOpen(true)}
                    className="flex items-center text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                  >
                    <Settings2 className="mr-1.5 h-3 w-3" /> Editar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {categories
                    .filter(c => c.type === type)
                    .map((item) => {
                      const Icon = ICON_MAP[item.icon] || Tag;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCategory(item.name)}
                          className={cn(
                            "flex items-center space-x-2 px-3 py-2 rounded-xl transition-all border",
                            category === item.name 
                              ? "border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                              : "border-white/5 bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="text-[11px] font-bold whitespace-nowrap">{item.name}</span>
                        </button>
                      );
                  })}
                  <button
                    onClick={() => setIsCatModalOpen(true)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-all border border-dashed border-white/10 text-white/20 hover:text-primary hover:border-primary/50 bg-transparent"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selector de Estado (Segmentado Premium) */}
                <div className="bg-[#1a1a1a] p-1 rounded-2xl flex border border-white/5 shadow-inner">
                  <button 
                    onClick={() => setIsPending(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black transition-all",
                      !isPending 
                        ? "bg-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20" 
                        : "text-white/20 hover:text-white/40"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>REALIZADO</span>
                  </button>
                  <button 
                    onClick={() => setIsPending(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black transition-all",
                      isPending 
                        ? "bg-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)] border border-amber-500/20" 
                        : "text-white/20 hover:text-white/40"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    <span>PENDIENTE</span>
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Switch de Contacto Ultra-Compacto */}
                  {type === 'expense' && (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Asignar {type === 'income' ? 'Cliente' : 'Proveedor'}</span>
                      </div>
                      <button 
                        onClick={() => setIncludeContact(!includeContact)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all border",
                          includeContact ? "bg-primary border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "bg-white/5 border-white/5"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-md",
                          includeContact ? "right-0.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  )}

                  {/* Selector de Cliente / Proveedor a Etiquetas */}
                  {(includeContact || type === 'income') && (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex flex-wrap gap-2">
                        {clients.slice(0, 5).map(c => (
                          <button
                            key={c.id}
                            onClick={() => setClientId(c.id!)}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2 rounded-xl transition-all border text-[10px] font-bold",
                              clientId === c.id 
                                ? "bg-primary/20 text-primary border-primary/50 shadow-lg" 
                                : "bg-white/5 text-white/40 border-white/5 hover:text-white/60"
                            )}
                          >
                            <Users className="h-3 w-3" />
                            <span>{c.name.split(' ')[0]}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setIsClientModalOpen(true)}
                          className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/5 border border-dashed border-white/10 text-white/20 hover:text-primary hover:border-primary/50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de Cuenta en Botones (Pills de Colores Persistentes) */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center space-x-2 px-1">
                      <Landmark className="h-3 w-3 text-white/20" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Cuenta de origen</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {accounts.map(acc => {
                        const isSelected = accountId === acc.id;
                        // Mapeo cromático persistente
                        const getAccountColor = () => {
                          const name = acc.name.toLowerCase();
                          if (name.includes('frances')) return { base: "text-blue-500/60 bg-blue-500/5 border-blue-500/10", active: "bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" };
                          if (name.includes('efectivo')) return { base: "text-emerald-500/60 bg-emerald-500/5 border-emerald-500/10", active: "bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" };
                          if (name.includes('galicia')) return { base: "text-orange-500/60 bg-orange-500/5 border-orange-500/10", active: "bg-orange-600/20 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]" };
                          if (acc.currency === 'USD') return { base: "text-cyan-500/60 bg-cyan-500/5 border-cyan-500/10", active: "bg-cyan-600/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" };
                          return { base: "text-white/20 bg-white/5 border-white/5", active: "bg-primary/20 text-primary border-primary/50 shadow-lg" };
                        };
                        const styles = getAccountColor();

                        return (
                          <button
                            key={acc.id}
                            onClick={() => setAccountId(acc.id!)}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2.5 rounded-xl transition-all border text-[10px] font-black tracking-tight",
                              isSelected ? styles.active : styles.base
                            )}
                          >
                            <Wallet className="h-3 w-3" />
                            <span>{acc.name.toUpperCase()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full rounded-2xl h-16 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 transition-all active:scale-[0.98]"
              disabled={loading || !amount || !category || !accountId}
              onClick={handleSubmit}
            >
              {loading ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </div>
        </Card>
      </div>

      <CreateClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={fetchInitialData}
      />

      <CategoryManagerModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        categories={categories}
        onRefresh={fetchInitialData}
      />
    </>
  );
}
