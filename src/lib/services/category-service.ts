import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id?: string;
  userId: string;
  name: string;
  icon: string; // Icon name from Lucide
  type: 'income' | 'expense';
  status: 'active' | 'archived';
  color?: string;
  order?: number;
}

export const categoryService = {
  async getCategories(userId: string): Promise<Category[]> {
    const q = query(
      collection(db, "categories"), 
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "categories"), {
      ...category,
      status: 'active'
    });
    return docRef.id;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<void> {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, data);
  },

  async archiveCategory(id: string): Promise<void> {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, { status: 'archived' });
  },

  async initializeDefaultCategories(userId: string): Promise<void> {
    const existing = await this.getCategories(userId);
    if (existing.length > 0) return;

    const defaults: Omit<Category, 'id'>[] = [
      { userId, name: "Delivery", icon: "Utensils", type: "expense", status: "active", color: "bg-orange-500/10 text-orange-500" },
      { userId, name: "Nafta", icon: "Fuel", type: "expense", status: "active", color: "bg-blue-500/10 text-blue-500" },
      { userId, name: "Super", icon: "ShoppingCart", type: "expense", status: "active", color: "bg-emerald-500/10 text-emerald-500" },
      { userId, name: "Café", icon: "Coffee", type: "expense", status: "active", color: "bg-amber-500/10 text-amber-500" },
      { userId, name: "Alquiler", icon: "Home", type: "expense", status: "active", color: "bg-rose-500/10 text-rose-500" },
      { userId, name: "Honorarios", icon: "Briefcase", type: "income", status: "active", color: "bg-primary/10 text-primary" },
      { userId, name: "Venta", icon: "TrendingUp", type: "income", status: "active", color: "bg-emerald-500/10 text-emerald-500" },
      { userId, name: "Otros", icon: "MoreHorizontal", type: "expense", status: "active", color: "bg-slate-500/10 text-slate-500" },
    ];

    for (const cat of defaults) {
      await this.createCategory(cat);
    }
  }
};
