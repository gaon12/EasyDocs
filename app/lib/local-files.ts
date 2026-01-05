"use client";

const fileStore = new Map<string, File>();
const DB_NAME = "easydocs-local-files";
const STORE_NAME = "files";
const DB_VERSION = 1;
const DB_TIMEOUT_MS = 5000;

let dbPromise: Promise<IDBDatabase | null> | null = null;
let dbFailureCount = 0;
const MAX_DB_FAILURES = 3;

const openDb = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  if (dbFailureCount >= MAX_DB_FAILURES) {
    console.warn("IndexedDB has failed too many times, using in-memory storage only");
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const safeResolve = (value: IDBDatabase | null) => {
      if (resolved) return;
      resolved = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (value === null) {
        dbFailureCount++;
        if (dbFailureCount >= MAX_DB_FAILURES) {
          dbPromise = null;
        }
      } else {
        dbFailureCount = 0;
      }
      resolve(value);
    };

    timeoutId = setTimeout(() => {
      console.warn("IndexedDB open timeout");
      safeResolve(null);
    }, DB_TIMEOUT_MS);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch (error) {
          console.error("IndexedDB upgrade error:", error);
        }
      };

      request.onsuccess = () => {
        try {
          safeResolve(request.result);
        } catch (error) {
          console.error("IndexedDB success handler error:", error);
          safeResolve(null);
        }
      };

      request.onerror = () => {
        console.error("IndexedDB open error:", request.error);
        safeResolve(null);
      };

      request.onblocked = () => {
        console.warn("IndexedDB blocked");
        safeResolve(null);
      };
    } catch (error) {
      console.error("IndexedDB initialization error:", error);
      safeResolve(null);
    }
  });

  return dbPromise;
};

const persistLocalFile = async (id: string, file: File): Promise<boolean> => {
  try {
    const db = await openDb();
    if (!db) return false;

    return await new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn("IndexedDB persist timeout");
        resolve(false);
      }, DB_TIMEOUT_MS);

      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(file, id);

        request.onsuccess = () => {
          clearTimeout(timeoutId);
          resolve(true);
        };

        request.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB put error:", request.error);
          resolve(false);
        };

        tx.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB transaction error:", tx.error);
          resolve(false);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("IndexedDB persist error:", error);
        resolve(false);
      }
    });
  } catch (error) {
    console.error("IndexedDB persistLocalFile error:", error);
    return false;
  }
};

const readLocalFile = async (id: string): Promise<File | null> => {
  try {
    const db = await openDb();
    if (!db) return null;

    return await new Promise<File | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn("IndexedDB read timeout");
        resolve(null);
      }, DB_TIMEOUT_MS);

      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          clearTimeout(timeoutId);
          resolve((request.result as File | undefined) ?? null);
        };

        request.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB get error:", request.error);
          resolve(null);
        };

        tx.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB transaction error:", tx.error);
          resolve(null);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("IndexedDB read error:", error);
        resolve(null);
      }
    });
  } catch (error) {
    console.error("IndexedDB readLocalFile error:", error);
    return null;
  }
};

const removeStoredFile = async (id: string): Promise<boolean> => {
  try {
    const db = await openDb();
    if (!db) return false;

    return await new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn("IndexedDB remove timeout");
        resolve(false);
      }, DB_TIMEOUT_MS);

      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          clearTimeout(timeoutId);
          resolve(true);
        };

        request.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB delete error:", request.error);
          resolve(false);
        };

        tx.onerror = () => {
          clearTimeout(timeoutId);
          console.error("IndexedDB transaction error:", tx.error);
          resolve(false);
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("IndexedDB remove error:", error);
        resolve(false);
      }
    });
  } catch (error) {
    console.error("IndexedDB removeStoredFile error:", error);
    return false;
  }
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const registerLocalFile = (file: File) => {
  const id = createId();
  fileStore.set(id, file);
  void persistLocalFile(id, file);
  return id;
};

export const getLocalFile = async (id: string) => {
  const inMemory = fileStore.get(id);
  if (inMemory) return inMemory;
  const stored = await readLocalFile(id);
  if (stored) {
    fileStore.set(id, stored);
  }
  return stored ?? null;
};

export const hasLocalFile = async (id: string) => {
  if (fileStore.has(id)) return true;
  const stored = await readLocalFile(id);
  if (stored) {
    fileStore.set(id, stored);
    return true;
  }
  return false;
};

export const removeLocalFile = (id: string) => {
  const removed = fileStore.delete(id);
  void removeStoredFile(id);
  return removed;
};
