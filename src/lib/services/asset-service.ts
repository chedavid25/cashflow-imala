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

export interface Asset {
  id?: string;
  userId: string;
  name: string;
  initialCapital: number;
  currentValue: number;
  currency: 'ARS' | 'USD';
  category: 'Real Estate' | 'Stocks' | 'Crypto' | 'Cash Savings' | 'Fixed Term' | 'Business' | 'Other';
  status: 'active' | 'liquidated';
  isInstallmentPlan?: boolean;
  totalInstallments?: number;
  paidInstallments?: number;
  installmentAmount?: number;
  nextInstallmentDate?: any;
  createdAt: any;
}

export const assetService = {
  async getAssets(userId: string): Promise<Asset[]> {
    const q = query(
      collection(db, "assets"), 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Asset[];
  },

  async createAsset(asset: Omit<Asset, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "assets"), {
      ...asset,
      createdAt: new Date()
    });
    return docRef.id;
  },

  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await updateDoc(assetRef, updates);
  },

  async updateAssetValue(assetId: string, newValue: number): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await updateDoc(assetRef, { currentValue: newValue });
  },

  async updateAssetNextDate(assetId: string, nextDate: any, paidInstallments?: number): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    const updates: any = { nextInstallmentDate: nextDate };
    if (paidInstallments !== undefined) {
      updates.paidInstallments = paidInstallments;
    }
    await updateDoc(assetRef, updates);
  },

  async liquidateAsset(assetId: string): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await updateDoc(assetRef, { 
      status: 'liquidated',
      nextInstallmentDate: null 
    });
  },

  async deleteAsset(assetId: string): Promise<void> {
    const { deleteDoc } = await import("firebase/firestore");
    const assetRef = doc(db, "assets", assetId);
    await deleteDoc(assetRef);
  }
};
