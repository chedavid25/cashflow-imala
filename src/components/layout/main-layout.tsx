"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isCollapsed } = useSidebar();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-8 bg-background p-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-xl">
            CI
          </div>
          <h1 className="text-4xl font-bold tracking-tight">CashFlow Imalá</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Control total de tus finanzas personales y profesionales en un solo lugar.
          </p>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="rounded-2xl px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-primary/20 transition-all border-none"
        >
          Empezar con Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden relative">
      <Sidebar />
      <main className={cn(
        "w-full pb-20 md:pb-0 transition-all duration-300",
        isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
