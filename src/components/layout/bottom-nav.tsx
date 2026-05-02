"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart3, 
  Plus, 
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreMenu } from "./more-menu";
import { QuickRegister } from "@/components/transactions/quick-register";

export function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);

  const mainNavItems = [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/accounts", label: "Cuentas", icon: Wallet },
  ];

  const secondaryNavItems = [
    { href: "/reports", label: "Reportes", icon: BarChart3 },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 pb-[env(safe-area-inset-bottom)] items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl md:hidden px-2 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Left Items */}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-14 transition-all",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* Central Plus Button */}
        <div className="relative -top-6">
          <button
            onClick={() => setIsQuickRegisterOpen(true)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 active:scale-90 transition-all border-4 border-background"
          >
            <Plus className="h-8 w-8 stroke-[3]" />
          </button>
        </div>

        {/* Right Items */}
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-14 transition-all",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 w-14 transition-all",
            isMoreOpen ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-[10px] font-bold">Más</span>
        </button>
      </nav>

      {/* Modals */}
      <MoreMenu 
        isOpen={isMoreOpen} 
        onClose={() => setIsMoreOpen(false)} 
      />
      
      <QuickRegister 
        isOpen={isQuickRegisterOpen} 
        onClose={() => setIsQuickRegisterOpen(false)} 
      />
    </>
  );
}
