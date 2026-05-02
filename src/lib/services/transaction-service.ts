import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
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
  assetId?: string;
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
  toAccountId?: string; // Para transferencias entre cuentas
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

      // Update linked asset if it's an investment
      if (tData.assetId && tData.type === 'investment') {
        const assetRef = doc(db, "assets", tData.assetId);
        const assetSnap = await txn.get(assetRef);
        if (assetSnap.exists()) {
          const assetData = assetSnap.data();
          txn.update(assetRef, {
            initialCapital: (assetData.initialCapital || 0) + finalData.amount,
            currentValue: (assetData.currentValue || 0) + finalData.amount,
            paidInstallments: (assetData.paidInstallments || 0) + 1
          });
        }
      }
    });
  },

  async createTransfer(transfer: Omit<Transaction, 'id'> & { toAmount?: number }): Promise<string> {
    const fromAccountRef = doc(db, "accounts", transfer.accountId);
    const toAccountRef = doc(db, "accounts", transfer.toAccountId!);
    
    await runTransaction(db, async (txn) => {
      const fromSnap = await txn.get(fromAccountRef);
      const toSnap = await txn.get(toAccountRef);
      
      if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Cuentas no encontradas");
      
      // Update from account
      txn.update(fromAccountRef, {
        balance: fromSnap.data().balance - transfer.amount
      });
      
      // Update to account (incoming amount can be different if currency exchange happened)
      const incomingAmount = transfer.toAmount || transfer.amount;
      txn.update(toAccountRef, {
        balance: toSnap.data().balance + incomingAmount
      });
    });

    const docRef = await addDoc(collection(db, "transactions"), transfer);
    return docRef.id;
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const transactionRef = doc(db, "transactions", transactionId);
    
    await runTransaction(db, async (txn) => {
      const tSnap = await txn.get(transactionRef);
      if (!tSnap.exists()) return;
      
      const tData = tSnap.data() as Transaction;
      
      // If completed, reverse the balance impact
      if (tData.status === 'completed') {
        const accountRef = doc(db, "accounts", tData.accountId);
        const aSnap = await txn.get(accountRef);
        
        if (aSnap.exists()) {
          const balance = aSnap.data().balance;
          // Reverse logic: if it was income, subtract. If it was expense, add.
          const reverseModifier = tData.type === 'income' ? -tData.amount : tData.amount;
          
          txn.update(accountRef, {
            balance: balance + reverseModifier
          });
        }

        // If it was a transfer, also reverse the destination account
        if (tData.type === 'transfer' && tData.toAccountId) {
          const toAccountRef = doc(db, "accounts", tData.toAccountId);
          const toSnap = await txn.get(toAccountRef);
          if (toSnap.exists()) {
            const incomingAmount = (tData as any).toAmount || tData.amount;
            txn.update(toAccountRef, {
              balance: toSnap.data().balance - incomingAmount
            });
          }
        }
      }

      txn.delete(transactionRef);
    });
  }
};
