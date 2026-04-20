"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Client } from "@/lib/services/client-service";
import { Users, Search, User, Mail, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelect: (id: string) => void;
  type: 'income' | 'expense';
}

export function ClientSelectionModal({ isOpen, onClose, clients, onSelect, type }: ClientSelectionModalProps) {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Seleccionar ${type === 'income' ? 'Cliente' : 'Proveedor'}`}>
      <div className="space-y-4 py-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            autoFocus
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted h-12 pl-12 pr-10 rounded-xl border border-border focus:border-primary/50 focus:outline-none text-sm transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => {
                onSelect(client.id!);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">{client.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{client.email || 'Sin email'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-muted border border-border group-hover:border-primary/30">
                  {client.billingType === 'monthly_fee' ? 'Abono' : 'Proyecto'}
                </span>
                {client.currency === 'USD' && (
                  <p className="text-[8px] font-black text-cyan-500 mt-1 uppercase">Socio USD</p>
                )}
              </div>
            </button>
          ))}

          {filteredClients.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <Users className="h-12 w-12 mx-auto mb-3" />
              <p className="text-xs font-black uppercase tracking-widest">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
