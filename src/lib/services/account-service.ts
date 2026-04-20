import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Account {
  id?: string;
  userId: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'investment';
  balance: number;
  currency: 'ARS' | 'USD';
}

export const accountService = {
  async getAccounts(userId: string): Promise<Account[]> {
    const q = query(collection(db, "accounts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Account[];
  },

  async createAccount(account: Omit<Account, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "accounts"), account);
    return docRef.id;
  },

  async updateBalance(accountId: string, amount: number): Promise<void> {
    const accountRef = doc(db, "accounts", accountId);
    await updateDoc(accountRef, {
      balance: increment(amount)
    });
  }
};
