import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { categoryService, Category } from "@/lib/services/category-service";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  Trash2, 
  Tag, 
  Settings2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X as CloseIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefresh: () => void;
}

export function CategoryManagerModal({ isOpen, onClose, categories, onRefresh }: CategoryManagerModalProps) {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  
  // New category state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Tag");
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName) return;

    setLoading(true);
    try {
      const typeCats = categories.filter(c => c.type === newType);
      await categoryService.createCategory({
        userId: user.uid,
        name: newName,
        icon: newIcon,
        type: newType,
        status: 'active',
        color: "bg-slate-500/10 text-slate-500",
        order: typeCats.length
      });
      setNewName("");
      setNewIcon("Tag");
      setIsAdding(false);
      onRefresh();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await categoryService.updateCategory(id, { name: editName });
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error("Error renaming category:", error);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const typeCats = categories.filter(c => c.type === newType).sort((a, b) => (a.order || 0) - (b.order || 0));
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
      onRefresh();
    } catch (error) {
      console.error("Error reordering category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de ocultar esta categoría? Tus registros anteriores no se verán afectados.")) return;
    try {
      await categoryService.archiveCategory(id);
      onRefresh();
    } catch (error) {
      console.error("Error archiving category:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías">
      <div className="space-y-6">
        <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => setNewType('expense')}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              newType === 'expense' ? "bg-[#333333] text-white shadow-lg" : "text-white/40"
            )}
          >
            Gastos
          </button>
          <button 
            onClick={() => setNewType('income')}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              newType === 'income' ? "bg-[#333333] text-white shadow-lg" : "text-white/40"
            )}
          >
            Ingresos
          </button>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {categories
            .filter(c => c.type === newType)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((cat, idx, arr) => (
            <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#1a1a1a] border border-white/5 group transition-all hover:border-white/10">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex flex-col space-y-1">
                  <button 
                    disabled={idx === 0}
                    onClick={() => handleMove(cat.id!, 'up')}
                    className="text-white/10 hover:text-primary transition-colors disabled:opacity-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={idx === arr.length - 1}
                    onClick={() => handleMove(cat.id!, 'down')}
                    className="text-white/10 hover:text-primary transition-colors disabled:opacity-0"
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
                      className="bg-[#222222] border border-primary/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none flex-1"
                    />
                    <button onClick={() => handleRename(cat.id!)} className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-white/5 text-white/40 rounded-lg hover:bg-white/10">
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 group/item">
                    <span className="text-sm font-bold text-white/80">{cat.name}</span>
                    <button 
                      onClick={() => {
                        setEditingId(cat.id!);
                        setEditName(cat.name);
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-white/20 hover:text-white transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(cat.id!)}
                className="h-9 w-9 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {!isAdding ? (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full h-14 rounded-2xl border-dashed border-white/10 text-white/40 hover:text-white hover:border-primary transition-all bg-transparent"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="p-4 rounded-3xl bg-[#1a1a1a] border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Nombre</label>
              <input 
                autoFocus
                required
                type="text"
                placeholder="Ej: Delivery, Gimnasio..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#222222] rounded-xl h-12 px-4 border border-white/5 focus:border-primary/50 focus:outline-none text-sm transition-all text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsAdding(false)}
                className="flex-1 h-12 rounded-xl text-white/40 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !newName}
                className="flex-[2] h-12 rounded-xl bg-primary text-primary-foreground font-bold"
              >
                {loading ? "Creando..." : "Guardar Categoría"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
