import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Client {
  id?: string;
  userId: string; // The user who owns this CRM entry
  name: string;
  email?: string;
  phone?: string;
  razonSocial: string;
  cuit: string;
  billingType: 'monthly_fee' | 'one_shot';
  budget: number;
  currency: 'ARS' | 'USD';
  billTo: 'David' | 'Lucre';
  defaultTargetAccount?: string;
  status?: 'active' | 'archived';
}

export const clientService = {
  async getClients(userId: string): Promise<Client[]> {
    const q = query(
      collection(db, "clients"), 
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Client[];
  },

  async createClient(client: Omit<Client, 'id' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, "clients"), {
      ...client,
      status: 'active'
    });
    return docRef.id;
  },

  async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    const clientRef = doc(db, "clients", clientId);
    await updateDoc(clientRef, data);
  },

  async archiveClient(clientId: string): Promise<void> {
    const clientRef = doc(db, "clients", clientId);
    await updateDoc(clientRef, { status: 'archived' });
  }
};
