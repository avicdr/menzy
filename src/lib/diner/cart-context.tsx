'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceMinor: number;
}

export interface CartLineItem {
  cartLineId: string;
  menuItemId: string;
  name: string;
  imageUrl?: string;
  portionSize?: string;
  basePriceMinor: number;
  variantId?: string | null;
  variantName?: string | null;
  variantSupplementalMinor?: number;
  modifiers: CartModifier[];
  quantity: number;
  specialInstructions?: string;
}

export interface TableContextInfo {
  tableId: string;
  tableName: string;
  tableSection?: string;
  tableCapacity?: number;
  verifiedAt?: string;
  lastOrderAt?: string | null;
  expiresAt?: string;
}

interface ExpiredTableState {
  tableName: string | null;
  expiredAt: string;
}

interface CartContextType {
  items: CartLineItem[];
  tableInfo: TableContextInfo | null;
  setTableInfo: (info: TableContextInfo | null) => void;
  tableSessionExpired: boolean;
  expiredTableName: string | null;
  extendTableSession: (lastOrderAt: string, expiresAt: string) => void;
  expireTableSession: (tableName?: string | null) => void;
  clearExpiredNotice: () => void;
  isCartHydrated: boolean;
  addItem: (item: Omit<CartLineItem, 'cartLineId'>) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  removeItem: (cartLineId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalMinor: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function isTableInfoExpired(info: TableContextInfo | null | undefined): boolean {
  if (!info?.expiresAt) return true;
  const expiresMs = Date.parse(info.expiresAt);
  if (Number.isNaN(expiresMs)) return true;
  return Date.now() > expiresMs;
}

export function CartProvider({
  restaurantSlug,
  children,
}: {
  restaurantSlug: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [tableInfo, setTableInfoState] = useState<TableContextInfo | null>(null);
  const [tableSessionExpired, setTableSessionExpired] = useState(false);
  const [expiredTableName, setExpiredTableName] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `dishora_cart_${restaurantSlug}`;
  const tableStorageKey = `dishora_table_${restaurantSlug}`;
  const expiredStorageKey = `dishora_table_expired_${restaurantSlug}`;

  // Restore cart and table from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(storageKey);
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedTableRaw = localStorage.getItem(tableStorageKey);
      if (savedTableRaw) {
        const parsedTable: TableContextInfo = JSON.parse(savedTableRaw);
        if (parsedTable?.tableId && !isTableInfoExpired(parsedTable)) {
          setTableInfoState(parsedTable);
          setTableSessionExpired(false);
          setExpiredTableName(null);
        } else {
          // Persisted table scan lacked a valid future expiry or has already expired (>30 min)
          localStorage.removeItem(tableStorageKey);
          const expState: ExpiredTableState = {
            tableName: parsedTable?.tableName || null,
            expiredAt: new Date().toISOString(),
          };
          localStorage.setItem(expiredStorageKey, JSON.stringify(expState));
          setTableInfoState(null);
          setTableSessionExpired(true);
          setExpiredTableName(expState.tableName);
        }
      } else {
        const savedExpiredRaw = localStorage.getItem(expiredStorageKey);
        if (savedExpiredRaw) {
          const parsedExpired: ExpiredTableState = JSON.parse(savedExpiredRaw);
          setTableSessionExpired(true);
          setExpiredTableName(parsedExpired?.tableName || null);
        }
      }
    } catch {}
    setIsLoaded(true);
  }, [storageKey, tableStorageKey, expiredStorageKey]);

  // Keep cart and table expiry synchronized across tabs on the same device
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === storageKey) {
          setItems(e.newValue ? JSON.parse(e.newValue) : []);
        } else if (e.key === tableStorageKey) {
          if (e.newValue) {
            const parsed: TableContextInfo = JSON.parse(e.newValue);
            if (!isTableInfoExpired(parsed)) {
              setTableInfoState(parsed);
              setTableSessionExpired(false);
              setExpiredTableName(null);
            }
          } else {
            setTableInfoState(null);
          }
        } else if (e.key === expiredStorageKey) {
          if (e.newValue) {
            const parsed: ExpiredTableState = JSON.parse(e.newValue);
            setTableInfoState(null);
            setTableSessionExpired(true);
            setExpiredTableName(parsed?.tableName || null);
          } else {
            setTableSessionExpired(false);
            setExpiredTableName(null);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey, tableStorageKey, expiredStorageKey]);

  // Persist cart to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, isLoaded, storageKey]);

  // Persist table to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (tableInfo) localStorage.setItem(tableStorageKey, JSON.stringify(tableInfo));
      else localStorage.removeItem(tableStorageKey);
    } catch {}
  }, [tableInfo, isLoaded, tableStorageKey]);

  const setTableInfo = useCallback(
    (info: TableContextInfo | null) => {
      setTableInfoState(info);
      if (info) {
        setTableSessionExpired(false);
        setExpiredTableName(null);
        try {
          localStorage.setItem(tableStorageKey, JSON.stringify(info));
          localStorage.removeItem(expiredStorageKey);
        } catch {}
      } else {
        try {
          localStorage.removeItem(tableStorageKey);
        } catch {}
      }
    },
    [tableStorageKey, expiredStorageKey]
  );

  const extendTableSession = useCallback(
    (lastOrderAt: string, expiresAt: string) => {
      setTableInfoState((prev) => {
        if (!prev) return prev;
        const next: TableContextInfo = {
          ...prev,
          lastOrderAt,
          expiresAt,
        };
        try {
          localStorage.setItem(tableStorageKey, JSON.stringify(next));
          localStorage.removeItem(expiredStorageKey);
        } catch {}
        return next;
      });
      setTableSessionExpired(false);
      setExpiredTableName(null);
    },
    [tableStorageKey, expiredStorageKey]
  );

  const expireTableSession = useCallback(
    (tableName?: string | null) => {
      setTableInfoState((prev) => {
        const resolvedName = tableName ?? prev?.tableName ?? null;
        setExpiredTableName(resolvedName);
        try {
          localStorage.removeItem(tableStorageKey);
          localStorage.setItem(
            expiredStorageKey,
            JSON.stringify({
              tableName: resolvedName,
              expiredAt: new Date().toISOString(),
            } satisfies ExpiredTableState)
          );
        } catch {}
        return null;
      });
      setTableSessionExpired(true);
    },
    [tableStorageKey, expiredStorageKey]
  );

  const clearExpiredNotice = useCallback(() => {
    setTableSessionExpired(false);
    setExpiredTableName(null);
    try {
      localStorage.removeItem(expiredStorageKey);
    } catch {}
  }, [expiredStorageKey]);

  const addItem = (item: Omit<CartLineItem, 'cartLineId'>) => {
    const modKey = (item.modifiers || [])
      .map((m) => m.optionId)
      .sort()
      .join('-');
    const cartLineId = `${item.menuItemId}_${item.variantId || 'base'}_${modKey}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartLineId === cartLineId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += item.quantity || 1;
        if (item.specialInstructions) {
          next[existingIndex].specialInstructions = item.specialInstructions;
        }
        return next;
      }
      return [...prev, { ...item, cartLineId, quantity: item.quantity || 1 }];
    });
  };

  const updateQuantity = (cartLineId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.cartLineId !== cartLineId);
      }
      return prev.map((i) => (i.cartLineId === cartLineId ? { ...i, quantity } : i));
    });
  };

  const removeItem = (cartLineId: string) => {
    setItems((prev) => prev.filter((i) => i.cartLineId !== cartLineId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalMinor = items.reduce((sum, item) => {
    const unitPrice = item.basePriceMinor + (item.variantSupplementalMinor || 0);
    const modTotal = (item.modifiers || []).reduce((mSum, m) => mSum + m.priceMinor, 0);
    return sum + (unitPrice + modTotal) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        tableInfo,
        setTableInfo,
        tableSessionExpired,
        expiredTableName,
        extendTableSession,
        expireTableSession,
        clearExpiredNotice,
        isCartHydrated: isLoaded,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotalMinor,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
