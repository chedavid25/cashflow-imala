"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Category } from "@/lib/services/category-service";
import { Tag, TrendingUp, TrendingDown, Coffee, Fuel, ShoppingCart, Utensils, MoreHorizontal, Users, Briefcase, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelect: (name: string) => void;
  type: 'income' | 'expense';
}

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee, Fuel, ShoppingCart, Utensils, MoreHorizontal, Users, Tag, TrendingUp, TrendingDown, Briefcase
};

export function CategorySelectionModal({ isOpen, onClose, categories, onSelect, type }: CategorySelectionModalProps) {
  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Seleccionar Categoría de ${type === 'income' ? 'Ingreso' : 'Gasto'}`}>
      <div className="grid grid-cols-2 gap-3 py-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
        {filteredCategories.map((item) => {
          const Icon = ICON_MAP[item.icon] || Tag;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.name);
                onClose();
              }}
              className="flex items-center space-x-3 p-4 rounded-2xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold tracking-tight">{item.name}</span>
            </button>
          );
        })}
        {filteredCategories.length === 0 && (
          <div className="col-span-2 py-10 text-center opacity-30">
            <Tag className="h-10 w-10 mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No hay categorías configuradas</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
