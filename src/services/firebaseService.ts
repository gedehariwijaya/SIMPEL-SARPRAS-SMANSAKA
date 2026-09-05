import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
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
let connectionState: 'online' | 'offline' | 'connecting' = 'connecting';
const connectionListeners: Array<(state: 'online' | 'offline' | 'connecting') => void> = [];

function notifyConnection(state: 'online' | 'offline' | 'connecting') {
  if (connectionState !== state) {
    connectionState = state;
    connectionListeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.warn('Listener error:', err);
      }
    });
  }
}

// Helper to remove undefined properties which cause Firestore setDoc/updateDoc to throw
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  if (!obj) return clean;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export const FirebaseService = {
  getStoredConfig(): FirebaseConfig {
    return DEFAULT_FIREBASE_CONFIG;
  },

  isConfigured(): boolean {
    return true;
  },

  getConnectionState(): 'online' | 'offline' | 'connecting' {
    return connectionState;
  },

  onConnectionStateChange(listener: (state: 'online' | 'offline' | 'connecting') => void): () => void {
    connectionListeners.push(listener);
    listener(connectionState);
    return () => {
      const idx = connectionListeners.indexOf(listener);
      if (idx !== -1) connectionListeners.splice(idx, 1);
    };
  },

  getDb(): Firestore | null {
    if (cachedDb) return cachedDb;

    try {
      if (!getApps().length) {
        cachedApp = initializeApp(DEFAULT_FIREBASE_CONFIG);
      } else {
        cachedApp = getApp();
      }

      const targetDbId = DATABASE_ID && DATABASE_ID !== '(default)' ? DATABASE_ID : undefined;

      // Force HTTP long-polling instead of streaming WebChannel to prevent
      // code=unavailable connection drops behind iframe sandbox proxies
      try {
        cachedDb = initializeFirestore(
          cachedApp,
          {
            experimentalForceLongPolling: true,
          },
          targetDbId
        );
      } catch {
        cachedDb = getFirestore(cachedApp, targetDbId);
      }

      return cachedDb;
    } catch (e) {
      console.warn('Error initializing Firebase Firestore:', e);
      try {
        if (cachedApp) {
          cachedDb = getFirestore(cachedApp);
          return cachedDb;
        }
      } catch (err) {
        console.warn('Fallback firestore init error:', err);
      }
      return null;
    }
  },

  /**
   * Validate connection to Firestore backend as recommended by guidelines
   */
  async validateBackendConnection(): Promise<boolean> {
    try {
      const db = this.getDb();
      if (!db) return false;
      await getDocFromServer(doc(db, '_simpel_sarpras_meta', 'connection_ping'));
      notifyConnection('online');
      return true;
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('network')) {
        notifyConnection('offline');
      } else {
        // Any response from server (even not found) means connectivity is healthy
        notifyConnection('online');
        return true;
      }
      return false;
    }
  },

  /**
   * Test Firestore connection by pinging a test doc in _simpel_sarpras_meta
   */
  async testConnection(): Promise<{ success: boolean; message: string; projectId?: string }> {
    try {
      const db = this.getDb();
      if (!db) {
        notifyConnection('offline');
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

      notifyConnection('online');
      return {
        success: true,
        message: `Koneksi ke Firestore Berhasil Aktif! (Project ID: ${DEFAULT_FIREBASE_CONFIG.projectId})`,
        projectId: DEFAULT_FIREBASE_CONFIG.projectId,
      };
    } catch (e: any) {
      console.warn('Firestore connection test status:', e?.message || e);
      if (e?.code === 'unavailable' || e?.message?.includes('offline')) {
        notifyConnection('offline');
      }
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

      return onSnapshot(
        colRef,
        (snapshot) => {
          notifyConnection('online');
          const items: DamageReport[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as DamageReport;
            items.push({ ...data, id: data.id || docSnap.id });
          });
          // Sort by updatedAt or timestamp descending
          items.sort((a, b) => {
            const tB = new Date(b.updatedAt || b.timestamp || 0).getTime();
            const tA = new Date(a.updatedAt || a.timestamp || 0).getTime();
            return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
          });
          onUpdate(items);
        },
        (error) => {
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            notifyConnection('offline');
          } else {
            console.warn('Realtime status (damageReports):', error.message || error);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to damageReports', e);
      return null;
    }
  },

  subscribeLoans(onUpdate: (loans: ItemLoan[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;

    try {
      const colRef = collection(db, 'itemLoans');

      return onSnapshot(
        colRef,
        (snapshot) => {
          notifyConnection('online');
          const items: ItemLoan[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ItemLoan;
            items.push({ ...data, id: data.id || docSnap.id });
          });
          items.sort((a, b) => {
            const tB = new Date(b.updatedAt || b.timestamp || 0).getTime();
            const tA = new Date(a.updatedAt || a.timestamp || 0).getTime();
            return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
          });
          onUpdate(items);
        },
        (error) => {
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            notifyConnection('offline');
          } else {
            console.warn('Realtime status (itemLoans):', error.message || error);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to itemLoans', e);
      return null;
    }
  },

  subscribeReturns(onUpdate: (returns: ItemReturn[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;

    try {
      const colRef = collection(db, 'itemReturns');

      return onSnapshot(
        colRef,
        (snapshot) => {
          notifyConnection('online');
          const items: ItemReturn[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ItemReturn;
            items.push({ ...data, id: data.id || docSnap.id });
          });
          items.sort((a, b) => {
            const tB = new Date(b.timestamp || 0).getTime();
            const tA = new Date(a.timestamp || 0).getTime();
            return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
          });
          onUpdate(items);
        },
        (error) => {
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            notifyConnection('offline');
          } else {
            console.warn('Realtime status (itemReturns):', error.message || error);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to itemReturns', e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Firestore CRUD Operations
  // -------------------------------------------------------------

  async saveDamageReport(report: DamageReport): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'damageReports', report.id);
      const cleanData = sanitizeForFirestore(report);
      await setDoc(docRef, cleanData, { merge: true });
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore write (damageReports) offline fallback:', err?.message || err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        notifyConnection('offline');
      }
    }
  },

  async updateDamageReport(id: string, updates: Partial<DamageReport>): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'damageReports', id);
      const cleanData = sanitizeForFirestore(updates);
      await setDoc(docRef, cleanData, { merge: true });
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore update (damageReports) offline fallback:', err?.message || err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        notifyConnection('offline');
      }
    }
  },

  async deleteDamageReport(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'damageReports', id);
      await deleteDoc(docRef);
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore delete (damageReports) offline fallback:', err?.message || err);
    }
  },

  async saveLoan(loan: ItemLoan): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'itemLoans', loan.id);
      const cleanData = sanitizeForFirestore(loan);
      await setDoc(docRef, cleanData, { merge: true });
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore write (itemLoans) offline fallback:', err?.message || err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        notifyConnection('offline');
      }
    }
  },

  async updateLoan(id: string, updates: Partial<ItemLoan>): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'itemLoans', id);
      const cleanData = sanitizeForFirestore(updates);
      await setDoc(docRef, cleanData, { merge: true });
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore update (itemLoans) offline fallback:', err?.message || err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        notifyConnection('offline');
      }
    }
  },

  async deleteLoan(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'itemLoans', id);
      await deleteDoc(docRef);
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore delete (itemLoans) offline fallback:', err?.message || err);
    }
  },

  async saveReturn(returnItem: ItemReturn): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'itemReturns', returnItem.id);
      const cleanData = sanitizeForFirestore(returnItem);
      await setDoc(docRef, cleanData, { merge: true });
      notifyConnection('online');

      // If there is an associated loan, also update that loan's status in Firestore
      if (returnItem.idPeminjaman) {
        await this.updateLoan(returnItem.idPeminjaman, { status: 'SELESAI' });
      }
    } catch (err: any) {
      console.warn('Firestore write (itemReturns) offline fallback:', err?.message || err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        notifyConnection('offline');
      }
    }
  },

  async deleteReturn(id: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'itemReturns', id);
      await deleteDoc(docRef);
      notifyConnection('online');
    } catch (err: any) {
      console.warn('Firestore delete (itemReturns) offline fallback:', err?.message || err);
    }
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
