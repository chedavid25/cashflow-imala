"use client";

import React from "react";
import { Transaction } from "@/lib/services/transaction-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  TrendingUp,
  Clock,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
  onDelete?: () => void;
}

export function TransactionHistory({ transactions, loading, onDelete }: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const { transactionService } = require("@/lib/services/transaction-service");
  const itemsPerPage = 5;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
      case 'expense': return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'investment': return <TrendingUp className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBgColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return "bg-emerald-500/10";
      case 'expense': return "bg-rose-500/10";
      case 'transfer': return "bg-blue-500/10";
      case 'investment': return "bg-primary/10";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Historial Reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Historial Reciente</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <ArrowUpRight className="h-4 w-4 rotate-[225deg]" />
          </Button>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            <ArrowUpRight className="h-4 w-4 rotate-45" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {currentTransactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No hay movimientos registrados.</p>
            </div>
          ) : (
            currentTransactions.map((t) => (
              <div 
                key={t.id} 
                className="flex items-center justify-between p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                  <div className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    getBgColor(t.type)
                  )}>
                    {getIcon(t.type)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold leading-tight mb-0.5 text-foreground/90">{t.category}</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                      {format(t.date.toDate(), "d 'de' MMM", { locale: es })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0 ml-2">
                  <span className={cn(
                    "text-xs sm:text-sm font-black tracking-tight whitespace-nowrap",
                    t.type === 'income' ? "text-emerald-500" : 
                    t.type === 'expense' ? "text-rose-500" : "text-foreground"
                  )}>
                    {t.type === 'expense' || t.type === 'investment' ? "-" : t.type === 'income' ? "+" : ""}
                    {formatCurrency(t.amount, t.currency)}
                  </span>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    {t.type === 'transfer' && (
                      <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest hidden sm:inline">
                        Transferencia
                      </span>
                    )}
                    
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!t.id || !confirm("¿Estás seguro de eliminar este registro? El saldo se revertirá automáticamente.")) return;
                        
                        setDeletingId(t.id);
                        try {
                          await transactionService.deleteTransaction(t.id);
                          if (onDelete) onDelete();
                        } catch (error) {
                          console.error("Error al eliminar:", error);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === t.id}
                      className="p-1 sm:p-1.5 rounded-lg text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
