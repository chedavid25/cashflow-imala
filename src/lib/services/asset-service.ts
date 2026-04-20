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
}

export const assetService = {
  async getAssets(userId: string): Promise<Asset[]> {
    const q = query(collection(db, "assets"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Asset[];
  },

  async createAsset(asset: Omit<Asset, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "assets"), asset);
    return docRef.id;
  },

  async updateAssetValue(assetId: string, newValue: number): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await updateDoc(assetRef, { currentValue: newValue });
  }
};
