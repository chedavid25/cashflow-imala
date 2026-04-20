"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { transactionService, Transaction } from "@/lib/services/transaction-service";
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
  BarChart3
} from "lucide-react";
import { format, startOfMonth, subMonths, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await transactionService.getTransactions(user.uid);
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions for reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Process data for charts
  const getMonthlyData = () => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    
    return months.map(month => {
      const monthTransactions = transactions.filter(t => 
        t.currency === currency && 
        t.status === 'completed' &&
        isSameMonth(t.date.toDate(), month)
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

      return {
        name: format(month, "MMM", { locale: es }),
        ingresos: income,
        egresos: expense,
      };
    });
  };

  const getCategoryData = () => {
    const categories: Record<string, number> = {};
    const filtered = transactions.filter(t => t.currency === currency && t.type === 'expense' && t.status === 'completed');
    
    filtered.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Métricas y Reportes</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Analiza el rendimiento y distribución de tu flujo de caja.
            </p>
          </div>
          <div className="flex bg-[#1a1a1a] rounded-2xl p-1 border border-white/5 h-12 w-48">
            <button
              onClick={() => setCurrency('ARS')}
              className={cn(
                "flex-1 rounded-xl text-xs font-black transition-all",
                currency === 'ARS' ? "bg-[#333333] text-white shadow-lg" : "text-white/20"
              )}
            >
              ARS
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={cn(
                "flex-1 rounded-xl text-xs font-black transition-all",
                currency === 'USD' ? "bg-[#333333] text-white shadow-lg" : "text-white/20"
              )}
            >
              USD
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Main Bar Chart: Income vs Expense */}
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden p-6">
            <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Ingresos vs Egresos</CardTitle>
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Últimos 6 meses</p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickFormatter={(v) => `$${v > 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#2a2a2a', 
                      border: 'none', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart: Expenses by Category */}
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden p-6">
            <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Gastos por Categoría</CardTitle>
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Total histórico</p>
              </div>
              <Filter className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2a2a2a', 
                      border: 'none', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/3 space-y-2">
                {categoryData.map((item, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black text-white/40 uppercase truncate w-20">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Trends: Historical Balance Progression */}
          <Card className="border-none bg-card/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden p-6 lg:col-span-2">
            <CardHeader className="px-0 pb-8 space-y-1">
              <CardTitle className="text-lg font-bold">Evolución Trimestral</CardTitle>
              <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Saldo acumulado al cierre de mes</p>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Tooltip 
                     contentStyle={{ 
                      backgroundColor: '#2a2a2a', 
                      border: 'none', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ fill: '#10b981', r: 6, strokeWidth: 0 }}
                    activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
