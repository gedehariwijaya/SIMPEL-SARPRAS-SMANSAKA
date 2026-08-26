import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { FirebaseConfig, DamageReport, ItemLoan, ItemReturn } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId || undefined,
};

const DATABASE_ID = firebaseConfigData.firestoreDatabaseId || '(default)';

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export const FirebaseService = {
  getStoredConfig(): FirebaseConfig {
    return DEFAULT_FIREBASE_CONFIG;
  },

  isConfigured(): boolean {
    return true;
  },

  getDb(): Firestore | null {
    if (cachedDb) return cachedDb;

    try {
      if (!getApps().length) {
        cachedApp = initializeApp(DEFAULT_FIREBASE_CONFIG);
      } else {
        cachedApp = getApp();
      }

      if (DATABASE_ID && DATABASE_ID !== '(default)') {
        cachedDb = getFirestore(cachedApp, DATABASE_ID);
      } else {
        cachedDb = getFirestore(cachedApp);
      }

      return cachedDb;
    } catch (e) {
      console.error('Error initializing Firebase Firestore:', e);
      try {
        // Fallback to default firestore instance if named database fails
        if (cachedApp) {
          cachedDb = getFirestore(cachedApp);
          return cachedDb;
        }
      } catch (err) {
        console.error('Fallback firestore init error:', err);
      }
      return null;
    }
  },

  /**
   * Test Firestore connection by pinging a test doc in _simpel_sarpras_meta
   */
  async testConnection(): Promise<{ success: boolean; message: string; projectId?: string }> {
    try {
      const db = this.getDb();
      if (!db) {
        return {
          success: false,
          message: 'Gagal menginisialisasi database Firebase.',
        };
      }

      // Write test document
      const testDocRef = doc(db, '_simpel_sarpras_meta', 'connection_ping');
      await setDoc(testDocRef, {
        lastPing: new Date().toISOString(),
        appName: 'SIMPEL SARPRAS SMA Negeri 1 Tejakula',
        version: '1.0.0',
      });

      return {
        success: true,
        message: `Koneksi ke Firestore Berhasil Aktif! (Project ID: ${DEFAULT_FIREBASE_CONFIG.projectId})`,
        projectId: DEFAULT_FIREBASE_CONFIG.projectId,
      };
    } catch (e: any) {
      console.error('Firestore connection test failed:', e);
      return {
        success: false,
        message: `Koneksi Firestore: ${e.message || String(e)}`,
      };
    }
  },

  // -------------------------------------------------------------
  // Real-time Subscriptions
  // -------------------------------------------------------------

  subscribeDamageReports(onUpdate: (reports: DamageReport[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;

    try {
      const colRef = collection(db, 'damageReports');
      const q = query(colRef, orderBy('timestamp', 'desc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const items: DamageReport[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as DamageReport);
          });
          onUpdate(items);
        },
        (error) => {
          console.error('Error on damageReports snapshot:', error);
        }
      );
    } catch (e) {
      console.error('Failed to subscribe to damageReports', e);
      return null;
    }
  },

  subscribeLoans(onUpdate: (loans: ItemLoan[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;

    try {
      const colRef = collection(db, 'itemLoans');
      const q = query(colRef, orderBy('timestamp', 'desc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const items: ItemLoan[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as ItemLoan);
          });
          onUpdate(items);
        },
        (error) => {
          console.error('Error on itemLoans snapshot:', error);
        }
      );
    } catch (e) {
      console.error('Failed to subscribe to itemLoans', e);
      return null;
    }
  },

  subscribeReturns(onUpdate: (returns: ItemReturn[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;

    try {
      const colRef = collection(db, 'itemReturns');
      const q = query(colRef, orderBy('timestamp', 'desc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const items: ItemReturn[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as ItemReturn);
          });
          onUpdate(items);
        },
        (error) => {
          console.error('Error on itemReturns snapshot:', error);
        }
      );
    } catch (e) {
      console.error('Failed to subscribe to itemReturns', e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Firestore CRUD Operations
  // -------------------------------------------------------------

  async saveDamageReport(report: DamageReport): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'damageReports', report.id);
    await setDoc(docRef, report, { merge: true });
  },

  async updateDamageReport(id: string, updates: Partial<DamageReport>): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'damageReports', id);
    await setDoc(docRef, updates, { merge: true });
  },

  async deleteDamageReport(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'damageReports', id);
    await deleteDoc(docRef);
  },

  async saveLoan(loan: ItemLoan): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'itemLoans', loan.id);
    await setDoc(docRef, loan, { merge: true });
  },

  async updateLoan(id: string, updates: Partial<ItemLoan>): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'itemLoans', id);
    await setDoc(docRef, updates, { merge: true });
  },

  async deleteLoan(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'itemLoans', id);
    await deleteDoc(docRef);
  },

  async saveReturn(returnItem: ItemReturn): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'itemReturns', returnItem.id);
    await setDoc(docRef, returnItem, { merge: true });

    // If there is an associated loan, also update that loan's status in Firestore
    if (returnItem.idPeminjaman) {
      await this.updateLoan(returnItem.idPeminjaman, { status: 'SELESAI' });
    }
  },

  async deleteReturn(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const docRef = doc(db, 'itemReturns', id);
    await deleteDoc(docRef);
  },

  /**
   * Clears all documents in Firestore collections (Fresh clean database)
   */
  async clearAllFirestoreData(): Promise<{ success: boolean; message: string }> {
    const db = this.getDb();
    if (!db) {
      return { success: false, message: 'Database Firebase belum terhubung.' };
    }

    try {
      const collections = ['damageReports', 'itemLoans', 'itemReturns'];
      for (const colName of collections) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      return {
        success: true,
        message: 'Seluruh data di Firestore berhasil dibersihkan (database bersih).',
      };
    } catch (e: any) {
      console.error('Error clearing firestore data:', e);
      return {
        success: false,
        message: `Gagal membersihkan data Firestore: ${e.message || String(e)}`,
      };
    }
  },
};
