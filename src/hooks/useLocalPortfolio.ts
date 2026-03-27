import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'portfolio_entries_v1';

export interface PortfolioEntry {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  buyPrice: number;
  qty: number;
}

export function useLocalPortfolio() {
  const [entries, setEntries] = useState<PortfolioEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  // Persist every time entries changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: PortfolioEntry) => {
    setEntries(prev => {
      if (prev.find(e => e.symbol === entry.symbol)) return prev;
      return [...prev, entry];
    });
  }, []);

  const editEntry = useCallback((symbol: string, patch: Partial<PortfolioEntry>) => {
    setEntries(prev => prev.map(e => e.symbol === symbol ? { ...e, ...patch } : e));
  }, []);

  const removeEntry = useCallback((symbol: string) => {
    setEntries(prev => prev.filter(e => e.symbol !== symbol));
  }, []);

  return { entries, addEntry, editEntry, removeEntry };
}
