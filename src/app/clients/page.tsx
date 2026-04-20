"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { clientService, Client } from "@/lib/services/client-service";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  ExternalLink,
  MoreVertical,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CreateClientModal } from "@/components/clients/create-client-modal";
import { EditClientModal } from "@/components/clients/edit-client-modal";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { 
  Archive, 
  Edit, 
  Trash2,
  AlertCircle
} from "lucide-react";

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await clientService.getClients(user.uid);
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!id) return;
    try {
      await clientService.archiveClient(id);
      fetchData();
    } catch (error) {
      console.error("Error archiving client:", error);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona tu cartera de clientes y su historial de pagos.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl shadow-lg shadow-primary/20 h-12 px-6"
          >
            <Plus className="mr-2 h-5 w-5" /> Nuevo Cliente
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] rounded-2xl h-14 pl-12 pr-4 focus:outline-none border border-white/5 focus:border-primary/50 text-sm transition-all shadow-inner"
          />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredClients.map((client) => (
              <motion.div key={client.id} variants={item}>
                <Card 
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="border-none shadow-md bg-card/50 backdrop-blur-sm group hover:shadow-xl hover:bg-card transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <Users className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg tracking-tight">{client.name}</h3>
                          <div className="flex flex-col space-y-1 mt-1">
                            {client.email && (
                              <div className="flex items-center text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                <Mail className="mr-2 h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                            <div className="flex items-center text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                              <DollarSign className="mr-1 h-3 w-3" />
                              {client.billingType === 'monthly_fee' ? 'Abono Mensual' : 'Proyecto Único'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu 
                        trigger={
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 transition-opacity">
                            <MoreVertical className="h-5 w-5 text-white/40" />
                          </Button>
                        }
                      >
                        <DropdownItem onClick={() => handleEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar Datos
                        </DropdownItem>
                        <div className="h-px bg-white/5 my-1" />
                        <DropdownItem 
                          variant="danger" 
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que quieres archivar a ${client.name}? El historial de transacciones se conservará.`)) {
                              handleArchive(client.id!);
                            }
                          }}
                        >
                          <Archive className="mr-2 h-4 w-4" /> Archivar Cliente
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center">
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Sin clientes aún</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                No se encontraron clientes. Comienza agregando uno nuevo a tu CRM profesional.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl px-8 h-12"
            >
              Agregar mi primer cliente
            </Button>
          </div>
        )}
      </div>

      <CreateClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      <EditClientModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
        client={selectedClient}
      />
    </MainLayout>
  );
}
