"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Moon,
  Sun,
  ReceiptText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/billing", label: "Facturación", icon: ReceiptText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r bg-card p-6 md:flex">
      <div className="mb-10 flex items-center space-x-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
          CI
        </div>
        <h1 className="text-xl font-bold tracking-tight">CashFlow Imalá</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-accent",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-6 last:border-t">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="rounded-xl text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        
        {user && (
          <div className="flex items-center space-x-3 rounded-2xl bg-accent/50 p-3">
            <img 
              src={user.photoURL || ""} 
              alt={user.displayName || ""} 
              className="h-8 w-8 rounded-full border border-primary/20"
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold truncate">{user.displayName}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
