"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoryService, Category } from "@/lib/services/category-service";
import { userService } from "@/lib/services/user-service";
import { useAuth } from "@/context/AuthContext";
import { auth, storage } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  User,
  Palette,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'income' | 'expense'>('expense');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: "",
    photoURL: ""
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Categories management state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        photoURL: user.photoURL || ""
      });
      fetchCategories();
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 5MB.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        await userService.updateProfile(user.uid, { photoURL: downloadURL });
      }
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    setProfileSaving(true);
    try {
      // Update Auth
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      
      // Update Firestore
      await userService.updateProfile(user.uid, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setProfileSaving(false);
    }
  };

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
    if (!confirm(`¿Estás seguro de ocultar la categoría "${name}"?`)) return;
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
      <div className="max-w-4xl mx-auto space-y-8 pb-32">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Ajustes</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Personaliza tu perfil y las categorías de tu flujo de caja.
            </p>
          </div>
          
          <div className="flex bg-muted p-1 rounded-xl border border-border w-fit">
            <button 
              onClick={() => setTheme('light')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                theme === 'light' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette className="h-3 w-3 mr-2 inline" /> CLARO
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                theme === 'dark' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette className="h-3 w-3 mr-2 inline" /> OSCURO
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Perfil Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Tu Perfil
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cambia cómo te ven otros usuarios y personaliza tu avatar.
              </p>
            </div>

            <Card className="border-none shadow-xl bg-card/50 overflow-hidden">
              <CardContent className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="flex flex-col items-center justify-center pb-4">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img 
                        src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName}&background=random`} 
                        alt="Avatar" 
                        className={cn(
                          "h-24 w-24 rounded-3xl object-cover border-4 border-muted shadow-2xl transition-all group-hover:scale-105",
                          uploading && "opacity-50 grayscale"
                        )}
                      />
                      <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg border-2 border-card">
                        {uploading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Público</label>
                    <input 
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      className="w-full bg-muted h-12 px-4 rounded-xl border border-border focus:border-primary focus:outline-none text-sm font-bold transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL de Foto</label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      value={profileData.photoURL}
                      onChange={(e) => setProfileData({...profileData, photoURL: e.target.value})}
                      className="w-full bg-muted h-12 px-4 rounded-xl border border-border focus:border-primary focus:outline-none text-sm font-medium transition-all"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={profileSaving}
                    className={cn(
                      "w-full rounded-xl h-12 font-bold transition-all",
                      profileSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary shadow-lg shadow-primary/20"
                    )}
                  >
                    {profileSaving ? "Guardando..." : profileSuccess ? (
                      <span className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4" /> Guardado</span>
                    ) : "Guardar Perfil"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Categorías Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-primary" />
                  Categorías
                </h3>
                <p className="text-xs text-muted-foreground">Administra las etiquetas de tus movimientos.</p>
              </div>

              <div className="flex bg-muted p-1 rounded-xl border border-border">
                <button
                  onClick={() => setActiveType('expense')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    activeType === 'expense' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Gastos
                </button>
                <button
                  onClick={() => setActiveType('income')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    activeType === 'income' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ingresos
                </button>
              </div>
            </div>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Gestionar {activeType === 'income' ? 'Ingresos' : 'Gastos'}
                  </CardTitle>
                  {!isAdding && (
                    <Button 
                      size="sm" 
                      onClick={() => setIsAdding(true)}
                      className="rounded-xl h-8 px-4 font-bold text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-none"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> NUEVA
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-border">
                  {isAdding && (
                    <div className="p-4 bg-primary/5 animate-in slide-in-from-top-2">
                      <form onSubmit={handleAdd} className="flex items-center space-x-3">
                        <input 
                          autoFocus
                          placeholder="Nombre de la categoría..."
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 bg-background h-11 px-4 rounded-xl border border-primary/30 focus:border-primary focus:outline-none text-sm font-bold"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsAdding(false)}
                          className="rounded-xl h-11 px-4 text-xs font-bold"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          disabled={saving || !newName}
                          className="rounded-xl h-11 px-6 font-bold"
                        >
                          {saving ? "..." : "Agregar"}
                        </Button>
                      </form>
                    </div>
                  )}

                  {loading ? (
                    <div className="p-10 text-center text-xs font-bold uppercase text-muted-foreground animate-pulse">Cargando...</div>
                  ) : currentCategories.map((cat, idx) => (
                    <div key={cat.id} className="group flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleMove(cat.id!, 'up')}
                            className="text-muted-foreground/30 hover:text-primary disabled:opacity-0 transition-all"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button 
                            disabled={idx === currentCategories.length - 1}
                            onClick={() => handleMove(cat.id!, 'down')}
                            className="text-muted-foreground/30 hover:text-primary disabled:opacity-0 transition-all"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        {editingId === cat.id ? (
                          <div className="flex items-center space-x-2">
                            <input 
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id!)}
                              className="bg-background border border-primary rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none"
                            />
                            <button onClick={() => handleRename(cat.id!)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                              <CloseIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-sm">{cat.name}</span>
                            <button 
                              onClick={() => {
                                setEditingId(cat.id!);
                                setEditName(cat.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-all"
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
                        className="opacity-0 group-hover:opacity-100 h-9 w-9 text-muted-foreground/30 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
