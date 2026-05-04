"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
import { clientService, Client } from "@/lib/services/client-service";
import { useAuth } from "@/context/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  subMonths, 
  addMonths,
  isSameMonth, 
  startOfQuarter, 
  subQuarters,
  addQuarters,
  getQuarter,
  startOfYear, 
  subYears,
  addYears,
  isSameYear, 
  isAfter,
  endOfMonth,
  endOfQuarter,
  endOfYear
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detail'>('dashboard');
  const [viewType, setViewType] = useState<'income' | 'expense'>('income');
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'semester' | 'year' | 'all'>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [transData, clientsData] = await Promise.all([
          transactionService.getTransactions(user.uid),
          clientService.getClients(user.uid)
        ]);
        setTransactions(transData);
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching data for reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getMonthlyData = () => {
    const months = Array.from({ length: 12 }).map((_, i) => subMonths(new Date(), i)).reverse();
    
    return months.map(month => {
      const monthTransactions = transactions.filter(t => 
        t.currency === currency && 
        isSameMonth(t.date.toDate(), month)
      );

      const incomeConfirmed = monthTransactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const incomePending = monthTransactions
        .filter(t => t.type === 'income' && t.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const expenseConfirmed = monthTransactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const expensePending = monthTransactions
        .filter(t => t.type === 'expense' && t.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);

      return {
        name: format(month, "MMM", { locale: es }),
        ingresos_cobrados: incomeConfirmed,
        ingresos_pendientes: incomePending,
        egresos_pagados: expenseConfirmed,
        egresos_pendientes: expensePending,
        // Totals for the line chart
        total_ingresos: incomeConfirmed + incomePending,
        total_egresos: expenseConfirmed + expensePending
      };
    });
  };

  const getCategoryData = (type: 'income' | 'expense') => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (timeFilter) {
      case 'month': 
        startDate = startOfMonth(referenceDate); 
        endDate = endOfMonth(referenceDate);
        break;
      case 'quarter': 
        startDate = startOfQuarter(referenceDate); 
        endDate = endOfQuarter(referenceDate);
        break;
      case 'semester': 
        startDate = subMonths(referenceDate, 6); 
        endDate = referenceDate;
        break;
      case 'year': 
        startDate = startOfYear(referenceDate); 
        endDate = endOfYear(referenceDate);
        break;
      case 'all': 
        startDate = null; 
        endDate = null;
        break;
    }

    const categories: Record<string, number> = {};
    const filtered = transactions.filter(t => 
      t.currency === currency && 
      t.type === type && 
      t.status === 'completed' &&
      (!startDate || (t.date.toDate() >= startDate && t.date.toDate() <= endDate!))
    );
    
    filtered.forEach(t => {
      const catName = t.category || (type === 'income' ? 'Servicios' : 'Otros');
      categories[catName] = (categories[catName] || 0) + t.amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const monthlyData = getMonthlyData();
  const incomeCategoryData = getCategoryData('income');
  const expenseCategoryData = getCategoryData('expense');

  const getFilteredTransactions = () => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (timeFilter) {
      case 'month': 
        startDate = startOfMonth(referenceDate); 
        endDate = endOfMonth(referenceDate);
        break;
      case 'quarter': 
        startDate = startOfQuarter(referenceDate); 
        endDate = endOfQuarter(referenceDate);
        break;
      case 'semester': 
        startDate = subMonths(referenceDate, 6); 
        endDate = referenceDate;
        break;
      case 'year': 
        startDate = startOfYear(referenceDate); 
        endDate = endOfYear(referenceDate);
        break;
      case 'all': 
        startDate = null; 
        endDate = null;
        break;
    }

    return transactions
      .filter(t => t.currency === currency && t.type === viewType && t.status === 'completed')
      .filter(t => {
        if (!startDate) return true;
        const tDate = t.date.toDate();
        return tDate >= startDate && (!endDate || tDate <= endDate);
      })
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  };

  const tableTransactions = getFilteredTransactions();

  const handleNavigate = (direction: 'prev' | 'next') => {
    switch (timeFilter) {
      case 'month':
        setReferenceDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'quarter':
        setReferenceDate(prev => direction === 'prev' ? subQuarters(prev, 1) : addQuarters(prev, 1));
        break;
      case 'year':
        setReferenceDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
        break;
      case 'semester':
        setReferenceDate(prev => direction === 'prev' ? subMonths(prev, 6) : addMonths(prev, 6));
        break;
    }
  };

  const getPeriodLabel = () => {
    switch (timeFilter) {
      case 'month':
        return format(referenceDate, "MMMM yyyy", { locale: es });
      case 'quarter':
        return `${getQuarter(referenceDate)}º Trimestre ${format(referenceDate, "yyyy")}`;
      case 'semester':
        return `Semestre hasta ${format(referenceDate, "MMM yyyy", { locale: es })}`;
      case 'year':
        return format(referenceDate, "yyyy");
      default:
        return "Todo el historial";
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return "-";
    return clients.find(c => c.id === clientId)?.name || "Cliente Desconocido";
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col space-y-6 md:flex-row md:items-end md:justify-between md:space-y-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Métricas y Reportes</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Analiza el rendimiento y distribución de tu flujo de caja.
              </p>
            </div>
            
            <div className="flex bg-muted p-1 border border-border shadow-inner rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
                  activeTab === 'dashboard' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                TABLERO
              </button>
              <button 
                onClick={() => setActiveTab('detail')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
                  activeTab === 'detail' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                DETALLE
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 w-full sm:w-auto sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="flex bg-muted rounded-2xl p-1 border border-border h-12 w-full sm:w-48">
              <button
                onClick={() => setCurrency('ARS')}
                className={cn(
                  "flex-1 rounded-xl text-xs font-black transition-all",
                  currency === 'ARS' ? "bg-accent text-foreground shadow-lg" : "text-muted-foreground"
                )}
              >
                ARS
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={cn(
                  "flex-1 rounded-xl text-xs font-black transition-all",
                  currency === 'USD' ? "bg-accent text-foreground shadow-lg" : "text-muted-foreground"
                )}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-muted/30 p-4 rounded-3xl border border-border/50">
          <div className="flex bg-muted p-1 border border-border shadow-inner rounded-2xl w-fit overflow-x-auto max-w-full">
            {(['month', 'quarter', 'semester', 'year', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTimeFilter(f);
                  setReferenceDate(new Date()); 
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  timeFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === 'month' ? 'Mes' : f === 'quarter' ? 'Trimestre' : f === 'semester' ? 'Semestre' : f === 'year' ? 'Año' : 'Acumulado'}
              </button>
            ))}
          </div>

          {timeFilter !== 'all' && (
            <div className="flex items-center space-x-2 bg-card border border-border rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => handleNavigate('prev')}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="px-4 text-center min-w-[120px]">
                <p className="text-[10px] font-black uppercase tracking-tighter text-primary">Viendo Período</p>
                <p className="text-xs font-bold capitalize">{getPeriodLabel()}</p>
              </div>

              <button 
                onClick={() => handleNavigate('next')}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="w-px h-4 bg-border mx-1" />

              <button 
                onClick={() => setReferenceDate(new Date())}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-amber-500"
                title="Hoy"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {activeTab === 'dashboard' ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Fila 1: Comparativa General - Full Width */}
            <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden p-6 lg:col-span-2">
              <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Ingresos vs Egresos</CardTitle>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Últimos 12 meses</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </CardHeader>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      tickFormatter={(v) => `$${v > 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.1 }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '16px', 
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="ingresos_cobrados" stackId="income" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} name="Ingresos Cobrados" />
                    <Bar dataKey="ingresos_pendientes" stackId="income" fill="#10b981" fillOpacity={0.3} radius={[4, 4, 0, 0]} barSize={40} name="Ingresos Pendientes" />
                    <Bar dataKey="egresos_pagados" stackId="expense" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={40} name="Egresos Pagados" />
                    <Bar dataKey="egresos_pendientes" stackId="expense" fill="#ef4444" fillOpacity={0.3} radius={[4, 4, 0, 0]} barSize={40} name="Egresos Pendientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Fila 2: Tendencia de Ingresos - Full Width */}
            <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden p-6 lg:col-span-2">
              <CardHeader className="px-0 pb-8 space-y-1">
                <CardTitle className="text-lg font-bold">Tendencia de Flujo</CardTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Evolución en los últimos 12 meses</p>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '16px', 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_ingresos" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      name="Total Ingresos"
                      dot={{ fill: '#10b981', r: 6, strokeWidth: 0 }}
                      activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_egresos" 
                      stroke="#ef4444" 
                      strokeWidth={4} 
                      name="Total Egresos"
                      dot={{ fill: '#ef4444', r: 6, strokeWidth: 0 }}
                      activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Fila 3: Tortas de Categorías */}
            {/* Torta Ingresos */}
            <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden p-6">
              <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Ingresos por Categoría</CardTitle>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Distribución de entradas</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '16px', 
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-full px-2">
                  {incomeCategoryData.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground font-bold text-center">Sin datos</p>
                  ) : (
                    incomeCategoryData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] font-black text-muted-foreground uppercase truncate">{item.name}</span>
                        </div>
                        <span className="text-[9px] font-bold shrink-0">${item.value.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Torta Egresos */}
            <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden p-6">
              <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Gastos por Categoría</CardTitle>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Distribución de salidas</p>
                </div>
                <TrendingDown className="h-5 w-5 text-rose-500" />
              </CardHeader>
              <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '16px', 
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-full px-2">
                  {expenseCategoryData.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground font-bold text-center">Sin datos</p>
                  ) : (
                    expenseCategoryData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] font-black text-muted-foreground uppercase truncate">{item.name}</span>
                        </div>
                        <span className="text-[9px] font-bold shrink-0">${item.value.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex bg-muted rounded-2xl p-1 border border-border h-12 w-fit">
              <button
                onClick={() => setViewType('income')}
                className={cn(
                  "px-6 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                  viewType === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground"
                )}
              >
                Ingresos
              </button>
              <button
                onClick={() => setViewType('expense')}
                className={cn(
                  "px-6 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                  viewType === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground"
                )}
              >
                Gastos
              </button>
            </div>

            <Card className="border border-border bg-card shadow-xl rounded-3xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[600px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalle</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {tableTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold">{format(t.date.toDate(), "dd/MM/yyyy")}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black">{getClientName(t.clientId)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-widest border border-border">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={cn(
                            "text-sm font-black",
                            viewType === 'income' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {t.currency} {t.amount.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {tableTransactions.length === 0 && (
                  <div className="py-20 text-center space-y-3 opacity-30">
                    <Filter className="h-12 w-12 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest">No hay datos</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
