"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { 
  TrendingUp, 
  Users, 
  ReceiptText, 
  Settings, 
  ChevronRight,
  User,
  Palette
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const menuItems = [
    { href: "/investments", label: "Inversiones", icon: TrendingUp, desc: "Gestiona tus activos y plazos fijos" },
    { href: "/clients", label: "Clientes", icon: Users, desc: "Directorio de proveedores y clientes" },
    { href: "/billing", label: "Facturación", icon: ReceiptText, desc: "Control de facturas y pagos" },
    { href: "/settings", label: "Ajustes y Perfil", icon: Settings, desc: "Personalización y cuenta" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explorar Secciones">
      <div className="space-y-4 pb-4">
        <div className="grid gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:bg-accent hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Atajo de Apariencia</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground italic">Cámbiado en Ajustes</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
