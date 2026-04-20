"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoryService, Category } from "@/lib/services/category-service";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  Trash2, 
  Settings2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X as CloseIcon,
  Tag,
  TrendingUp,
  TrendingDown,
  Briefcase,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'income' | 'expense'>('expense');
  
  // States for management
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await categoryService.getCategories(user.uid);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    setSaving(true);
    try {
      const typeCats = categories.filter(c => c.type === activeType);
      await categoryService.createCategory({
        userId: user.uid,
        name: newName,
        icon: activeType === 'income' ? 'TrendingUp' : 'Tag',
        type: activeType,
        status: 'active',
        color: activeType === 'income' ? "bg-primary/10 text-primary" : "bg-slate-500/10 text-slate-500",
        order: typeCats.length
      });
      setNewName("");
      setIsAdding(false);
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await categoryService.updateCategory(id, { name: editName });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Error renaming category:", error);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const typeCats = categories
      .filter(c => c.type === activeType)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const currentIndex = typeCats.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= typeCats.length) return;

    const currentCat = typeCats[currentIndex];
    const targetCat = typeCats[targetIndex];

    try {
      await Promise.all([
        categoryService.updateCategory(currentCat.id!, { order: targetIndex }),
        categoryService.updateCategory(targetCat.id!, { order: currentIndex })
      ]);
      fetchCategories();
    } catch (error) {
      console.error("Error reordering category:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de ocultar la categoría "${name}"? Los registros anteriores no se verán afectados.`)) return;
    try {
      await categoryService.archiveCategory(id);
      fetchCategories();
    } catch (error) {
      console.error("Error archiving category:", error);
    }
  };

  const currentCategories = categories
    .filter(c => c.type === activeType)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Ajustes</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Personaliza las opciones y categorías de tu flujo de caja.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-bold flex items-center">
              <Settings2 className="mr-2 h-5 w-5 text-primary" />
              Categorías
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Administra las etiquetas que usas para clasificar tus movimientos. Puedes reordenarlas para que las más usadas aparezcan primero en el registro rápido.
            </p>
            
            <div className="flex flex-col space-y-2 pt-4">
              <button
                onClick={() => setActiveType('expense')}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm border",
                  activeType === 'expense' 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                <span>Gastos / Egresos</span>
              </button>
              <button
                onClick={() => setActiveType('income')}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm border",
                  activeType === 'income' 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Ingresos</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">
                    Listado de {activeType === 'income' ? 'Ingresos' : 'Gastos'}
                  </CardTitle>
                  {!isAdding && (
                    <Button 
                      size="sm" 
                      onClick={() => setIsAdding(true)}
                      className="rounded-xl h-9 px-4 font-bold text-[10px]"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> AGREGAR
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {isAdding && (
                    <div className="p-4 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
                      <form onSubmit={handleAdd} className="flex items-center space-x-4">
                        <input 
                          autoFocus
                          placeholder="Nombre de la categoría..."
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 bg-background h-12 px-4 rounded-xl border border-primary/30 focus:border-primary focus:outline-none text-sm font-bold transition-all"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsAdding(false)}
                            className="rounded-xl font-bold text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            disabled={saving || !newName}
                            className="rounded-xl font-bold shadow-lg shadow-primary/10"
                          >
                            {saving ? "..." : "Guardar"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {loading ? (
                    <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                      Cargando categorías...
                    </div>
                  ) : currentCategories.length === 0 ? (
                    <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                      No hay categorías creadas
                    </div>
                  ) : (
                    currentCategories.map((cat, idx) => (
                      <div key={cat.id} className="group flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <button 
                              disabled={idx === 0}
                              onClick={() => handleMove(cat.id!, 'up')}
                              className="text-muted-foreground/30 hover:text-primary disabled:opacity-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button 
                              disabled={idx === currentCategories.length - 1}
                              onClick={() => handleMove(cat.id!, 'down')}
                              className="text-muted-foreground/30 hover:text-primary disabled:opacity-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {editingId === cat.id ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <input 
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id!)}
                                className="flex-1 bg-background border border-primary rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none min-w-[100px]"
                              />
                              <div className="flex items-center">
                                <button onClick={() => handleRename(cat.id!)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                                  <Check className="h-4 w-4" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                                  <CloseIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <span className="font-bold text-sm tracking-tight truncate max-w-[120px] sm:max-w-none">{cat.name}</span>
                              <button 
                                onClick={() => {
                                  setEditingId(cat.id!);
                                  setEditName(cat.name);
                                }}
                                className="md:opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-all"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(cat.id!, cat.name)}
                          className="md:opacity-0 group-hover:opacity-100 h-9 w-9 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
