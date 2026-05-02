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
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/sidebar-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/investments", label: "Inversiones", icon: TrendingUp },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/billing", label: "Facturación", icon: ReceiptText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside className={cn(
      "fixed left-0 top-0 hidden h-screen flex-col border-r bg-card transition-all duration-300 md:flex z-50",
      isCollapsed ? "w-20 p-4" : "w-64 p-6"
    )}>
      <div className={cn(
        "mb-10 flex items-center justify-between",
        isCollapsed && "flex-col space-y-4"
      )}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-lg">
            CI
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
              CashFlow <span className="text-primary/70">Imalá</span>
            </h1>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 rounded-lg hover:bg-accent transition-all",
            isCollapsed && "mt-2"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
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
                "flex items-center rounded-xl p-3 text-sm font-medium transition-all group relative",
                isCollapsed ? "justify-center" : "space-x-3 px-4",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "scale-110" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && (
                <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                  {item.label}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-4 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-md group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap font-bold">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "mt-auto space-y-4 pt-6 border-t",
        isCollapsed && "flex flex-col items-center"
      )}>
        <div className={cn(
          "flex items-center justify-between w-full",
          isCollapsed && "flex-col space-y-2"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl hover:bg-accent"
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
          <div className={cn(
            "flex items-center rounded-2xl bg-muted transition-all duration-300",
            isCollapsed ? "p-1.5 justify-center" : "p-3 space-x-3"
          )}>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
              alt={user.displayName || ""} 
              className="h-8 w-8 rounded-full border border-primary/20 bg-muted shrink-0 object-cover"
            />
            {!isCollapsed && (
              <div className="flex flex-col truncate animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xs font-semibold truncate">{user.displayName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
