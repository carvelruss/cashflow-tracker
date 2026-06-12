import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import type { BudgetPeriod } from '../types';

interface BudgetPeriodContextValue {
  periods: BudgetPeriod[];
  activePeriod: BudgetPeriod | null;
  setActivePeriod: (period: BudgetPeriod) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BudgetPeriodContext = createContext<BudgetPeriodContextValue | null>(null);

export function BudgetPeriodProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<BudgetPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.budgetPeriods.getAll();
      setPeriods(data);
      // Auto-select: prefer active period, fallback to most recent
      if (data.length > 0 && !activePeriod) {
        const active = data.find(p => p.status === 'active') ?? data[0];
        setActivePeriod(active);
      } else if (activePeriod) {
        // Refresh the active period data
        const updated = data.find(p => p.id === activePeriod.id);
        if (updated) setActivePeriod(updated);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BudgetPeriodContext.Provider value={{ periods, activePeriod, setActivePeriod, loading, refresh }}>
      {children}
    </BudgetPeriodContext.Provider>
  );
}

export function useBudgetPeriod(): BudgetPeriodContextValue {
  const ctx = useContext(BudgetPeriodContext);
  if (!ctx) throw new Error('useBudgetPeriod must be used within BudgetPeriodProvider');
  return ctx;
}
