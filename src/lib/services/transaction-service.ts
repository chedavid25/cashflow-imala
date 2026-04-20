import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  runTransaction,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { accountService } from "./account-service";

export interface Transaction {
  id?: string;
  userId: string;
  clientId?: string;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  category: string;
  amount: number;
  currency: 'ARS' | 'USD';
  exchangeRate?: number;
  exchangeDate?: Timestamp;
  status: 'pending' | 'completed';
  date: Timestamp;
  isRecurring: boolean;
  paidBy: 'David' | 'Lucre' | 'Shared';
  accountId: string;
}

export const transactionService = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, "transactions"), 
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    // If it's already completed, update the account balance
    if (transaction.status === 'completed') {
      const amountModifier = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      await accountService.updateBalance(transaction.accountId, amountModifier);
    }
    
    const docRef = await addDoc(collection(db, "transactions"), transaction);
    return docRef.id;
  },

  async confirmTransaction(
    transactionId: string, 
    finalData: { 
      amount: number, 
      currency: 'ARS' | 'USD', 
      exchangeRate?: number, 
      exchangeDate?: Timestamp,
      accountId: string 
    }
  ): Promise<void> {
    const transactionRef = doc(db, "transactions", transactionId);
    
    await runTransaction(db, async (txn) => {
      const tSnap = await txn.get(transactionRef);
      if (!tSnap.exists()) throw new Error("Transaction does not exist");
      
      const tData = tSnap.data() as Transaction;
      if (tData.status === 'completed') throw new Error("Transaction is already completed");

      const accountRef = doc(db, "accounts", finalData.accountId);
      const aSnap = await txn.get(accountRef);
      if (!aSnap.exists()) throw new Error("Account does not exist");

      // Update balance
      const amountModifier = tData.type === 'income' ? finalData.amount : -finalData.amount;
      
      txn.update(accountRef, {
        balance: aSnap.data().balance + amountModifier
      });

      // Update transaction status and details
      txn.update(transactionRef, {
        status: 'completed',
        amount: finalData.amount,
        currency: finalData.currency,
        exchangeRate: finalData.exchangeRate || 1,
        exchangeDate: finalData.exchangeDate || Timestamp.now(),
        accountId: finalData.accountId,
        date: Timestamp.now() 
      });
    });
  }
};
