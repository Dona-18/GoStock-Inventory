import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { db, isFirebaseConfigured } from '../utils/firebase';

const AppContext = createContext(null);

const DEFAULT_STORE_INFO = {
  name: 'GoStock Store',
  phone: '+855 12 345 678',
  address: 'Phnom Penh, Cambodia',
  note: 'Thank you for shopping with us!',
};

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncActive, setIsSyncActive] = useState(false); // Active only when Firestore is successfully pinged

  // ─── 1. Load from local storage & perform initial sync migration ──────────
  useEffect(() => {
    (async () => {
      try {
        const [rawProducts, rawSales, rawStore] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
          AsyncStorage.getItem(STORAGE_KEYS.SALES),
          AsyncStorage.getItem(STORAGE_KEYS.STORE_INFO),
        ]);
        
        let localProds = [];
        let localSales = [];
        
        if (rawProducts) {
          localProds = JSON.parse(rawProducts);
          setProducts(localProds);
        }
        if (rawSales) {
          localSales = JSON.parse(rawSales);
          setSales(localSales);
        }
        if (rawStore) {
          try {
            setStoreInfo({ ...DEFAULT_STORE_INFO, ...JSON.parse(rawStore) });
          } catch (_) {}
        }

        // Migrate local offline data to the cloud if connecting to an empty Firebase database
        if (isFirebaseConfigured && db) {
          const { collection, getDocs, writeBatch, doc } = require('firebase/firestore');
          
          try {
            // Ping Firestore. If this succeeds, the database exists and we are online!
            const prodSnap = await getDocs(collection(db, 'products'));
            setIsSyncActive(true); // Enable live synchronization listeners

            if (prodSnap.empty && localProds.length > 0) {
              const batch = writeBatch(db);
              localProds.forEach((p) => {
                batch.set(doc(db, 'products', p.id), p);
              });
              await batch.commit();
            }

            // Migrate Sales
            const salesSnap = await getDocs(collection(db, 'sales'));
            if (salesSnap.empty && localSales.length > 0) {
              const batch = writeBatch(db);
              localSales.forEach((s) => {
                batch.set(doc(db, 'sales', s.saleId), s);
              });
              await batch.commit();
            }
          } catch (syncErr) {
            setIsSyncActive(false);
          }
        }
      } catch (e) {
        console.error('Storage load error:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── 2. Subscribe to real-time changes ONLY when Firestore is active ────────
  useEffect(() => {
    if (isLoading || !isFirebaseConfigured || !db || !isSyncActive) return;

    const { collection, onSnapshot, query, orderBy } = require('firebase/firestore');

    // Subscribe to products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setProducts(items);
      AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(items));
    }, (err) => {
      console.warn('Firestore products connection lost:', err);
    });

    // Subscribe to sales (try sorting by date, fallback to manual sort if no index created)
    let unsubSales = () => {};
    try {
      const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
      unsubSales = onSnapshot(salesQuery, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push(doc.data());
        });
        setSales(items);
        AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(items));
      }, () => {
        const unsubFallback = onSnapshot(collection(db, 'sales'), (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push(doc.data());
          });
          items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSales(items);
          AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(items));
        });
        unsubSales = unsubFallback;
      });
    } catch (_) {
      const unsubFallback = onSnapshot(collection(db, 'sales'), (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push(doc.data());
        });
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSales(items);
        AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(items));
      });
      unsubSales = unsubFallback;
    }

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [isLoading, isSyncActive]);

  // ─── 3. Local persistence fallbacks (used when offline/unconfigured) ────────
  const persistProducts = useCallback(async (list) => {
    setProducts(list);
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
  }, []);

  const persistSales = useCallback(async (list) => {
    setSales(list);
    await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(list));
  }, []);

  // ─── 4. Product CRUD mutations ─────────────────────────────────────────────
  const addProduct = useCallback(async (product) => {
    const newProduct = {
      id: Date.now().toString(),
      name: product.name.trim(),
      category: product.category?.trim() || 'General',
      price: parseFloat(product.price),
      stockQuantity: parseInt(product.stockQuantity, 10),
      lowStockThreshold: parseInt(product.lowStockThreshold, 10) || 5,
      imageUri: product.imageUri || null,
      createdAt: new Date().toISOString(),
    };

    // Instantly save locally so UI completes with zero lag
    const updated = [...products, newProduct];
    await persistProducts(updated);

    // Sync to Firestore in the background ONLY if sync is active
    if (isFirebaseConfigured && db && isSyncActive) {
      (async () => {
        const { doc, setDoc } = require('firebase/firestore');
        try {
          await setDoc(doc(db, 'products', newProduct.id), newProduct);
        } catch (e) {
          console.warn('Firestore write failed in background:', e);
        }
      })();
    }
    return newProduct;
  }, [products, persistProducts, isSyncActive]);

  const updateProduct = useCallback(async (id, changes) => {
    const original = products.find((p) => p.id === id);
    if (!original) return;

    const updatedProduct = {
      ...original,
      ...changes,
      price: parseFloat(changes.price ?? original.price),
      stockQuantity: parseInt(changes.stockQuantity ?? original.stockQuantity, 10),
      lowStockThreshold: parseInt(changes.lowStockThreshold ?? original.lowStockThreshold, 10),
    };

    // Instantly save locally
    const updated = products.map((p) => p.id === id ? updatedProduct : p);
    await persistProducts(updated);

    // Sync to Firestore in the background ONLY if sync is active
    if (isFirebaseConfigured && db && isSyncActive) {
      (async () => {
        const { doc, setDoc } = require('firebase/firestore');
        try {
          await setDoc(doc(db, 'products', id), updatedProduct);
        } catch (e) {
          console.warn('Firestore update failed in background:', e);
        }
      })();
    }
  }, [products, persistProducts, isSyncActive]);

  const deleteProduct = useCallback(async (id) => {
    // Instantly save locally
    const updated = products.filter((p) => p.id !== id);
    await persistProducts(updated);

    // Sync to Firestore in the background ONLY if sync is active
    if (isFirebaseConfigured && db && isSyncActive) {
      (async () => {
        const { doc, deleteDoc } = require('firebase/firestore');
        try {
          await deleteDoc(doc(db, 'products', id));
        } catch (e) {
          console.warn('Firestore delete failed in background:', e);
        }
      })();
    }
  }, [products, persistProducts, isSyncActive]);

  // ─── 5. Sales CRUD mutations ───────────────────────────────────────────────
  const recordSale = useCallback(async (saleInput) => {
    let rawItems = [];
    if (Array.isArray(saleInput.items) && saleInput.items.length > 0) {
      rawItems = saleInput.items;
    } else if (saleInput.productId) {
      rawItems = [{ productId: saleInput.productId, quantity: saleInput.quantity }];
    } else {
      return { success: false, error: 'No items provided for sale.' };
    }

    const formattedItems = [];
    const updatedProductsMap = new Map(products.map((p) => [p.id, { ...p }]));

    for (const item of rawItems) {
      const product = updatedProductsMap.get(item.productId);
      if (!product) {
        return { success: false, error: 'Product not found.' };
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for ${product.name}.` };
      }
      if (qty > product.stockQuantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Only ${product.stockQuantity} available.`,
        };
      }

      product.stockQuantity -= qty;
      updatedProductsMap.set(item.productId, product);

      formattedItems.push({
        productId: product.id,
        productName: product.name,
        imageUri: product.imageUri || null,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: product.price * qty,
      });
    }

    const totalQuantity = formattedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = formattedItems.reduce((sum, i) => sum + i.totalPrice, 0);

    const displayTitle = formattedItems
      .map((i) => `${i.productName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
      .join(', ');

    const sale = {
      saleId: Date.now().toString(),
      items: formattedItems,
      productId: formattedItems[0].productId,
      productName: displayTitle,
      imageUri: formattedItems[0].imageUri || null,
      paymentMethod: saleInput.paymentMethod || 'cash',
      quantity: totalQuantity,
      unitPrice: formattedItems[0].unitPrice,
      totalPrice,
      createdAt: new Date().toISOString(),
    };

    const updatedProductsList = Array.from(updatedProductsMap.values());
    const updatedSalesList = [sale, ...sales];

    await Promise.all([
      persistProducts(updatedProductsList),
      persistSales(updatedSalesList),
    ]);

    // Sync to Firestore in the background ONLY if sync is active
    if (isFirebaseConfigured && db && isSyncActive) {
      (async () => {
        const { doc, writeBatch } = require('firebase/firestore');
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, 'sales', sale.saleId), sale);
          updatedProductsList.forEach((prod) => {
            batch.set(doc(db, 'products', prod.id), prod);
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore sale record failed in background:', e);
        }
      })();
    }

    return { success: true, sale };
  }, [products, sales, persistProducts, persistSales, isSyncActive]);

  const deleteSale = useCallback(async (saleId) => {
    const sale = sales.find((s) => s.saleId === saleId);
    if (!sale) return;

    const updatedProductsMap = new Map(products.map((p) => [p.id, { ...p }]));
    const saleItems = Array.isArray(sale.items) && sale.items.length > 0
      ? sale.items
      : [{ productId: sale.productId, quantity: sale.quantity }];

    saleItems.forEach((item) => {
      if (item.productId && updatedProductsMap.has(item.productId)) {
        const prod = updatedProductsMap.get(item.productId);
        prod.stockQuantity += item.quantity;
        updatedProductsMap.set(item.productId, prod);
      }
    });

    const updatedProductsList = Array.from(updatedProductsMap.values());
    const updatedSalesList = sales.filter((s) => s.saleId !== saleId);

    await Promise.all([
      persistProducts(updatedProductsList),
      persistSales(updatedSalesList),
    ]);

    // Sync to Firestore in the background ONLY if sync is active
    if (isFirebaseConfigured && db && isSyncActive) {
      (async () => {
        const { doc, writeBatch } = require('firebase/firestore');
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'sales', saleId));
          updatedProductsList.forEach((prod) => {
            batch.set(doc(db, 'products', prod.id), prod);
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore sale deletion failed in background:', e);
        }
      })();
    }
  }, [products, sales, persistProducts, persistSales, isSyncActive]);



  // ─── 6. Clear Data ─────────────────────────────────────────────────────────
  const clearAllData = useCallback(async () => {
    if (isFirebaseConfigured && db) {
      const { collection, getDocs, writeBatch } = require('firebase/firestore');
      try {
        const batch = writeBatch(db);
        
        // Delete all products in cloud
        const prodSnap = await getDocs(collection(db, 'products'));
        prodSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete all sales in cloud
        const salesSnap = await getDocs(collection(db, 'sales'));
        salesSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      } catch (e) {
        console.warn('Firestore cloud clear failed, purging local only:', e);
      }
    }

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PRODUCTS),
      AsyncStorage.removeItem(STORAGE_KEYS.SALES),
    ]);
    setProducts([]);
    setSales([]);
  }, [products, sales]);

  const updateStoreInfo = useCallback(async (newInfo) => {
    const updated = { ...storeInfo, ...newInfo };
    setStoreInfo(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.STORE_INFO, JSON.stringify(updated));
  }, [storeInfo]);

  // ─── 7. Derived state ──────────────────────────────────────────────────────
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  );

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        storeInfo,
        updateStoreInfo,
        isLoading,
        lowStockProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        recordSale,
        deleteSale,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

