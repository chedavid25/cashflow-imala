import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  themePreference: 'light' | 'dark' | 'system';
  currencyBase: 'ARS' | 'USD';
}

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async createUserProfile(profile: Partial<UserProfile>): Promise<void> {
    if (!profile.uid) throw new Error("UID is required to create a profile");
    
    const userRef = doc(db, "users", profile.uid);
    const defaultProfile: UserProfile = {
      uid: profile.uid,
      email: profile.email || "",
      displayName: profile.displayName || "",
      photoURL: profile.photoURL || "",
      themePreference: 'system',
      currencyBase: 'ARS',
      ...profile
    };

    await setDoc(userRef, defaultProfile);
  },

  async updateThemePreference(uid: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { themePreference: theme });
  },

  async updateCurrencyBase(uid: string, currency: 'ARS' | 'USD'): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { currencyBase: currency });
  },

  async updateProfile(uid: string, data: { displayName?: string; photoURL?: string }): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
  }
};
