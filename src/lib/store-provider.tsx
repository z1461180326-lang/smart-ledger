import { useEffect, useState } from 'react';
import { AppContext, type IStoreValue } from './store-context';
import { SEED } from './seed';
import type { IAppState, IAccount, IBudget, ICategory, IRecord, IRule, IAppSettings, ISubscription, NewRecord } from './types';
import { newAccountId, newBudgetId, newCategoryId, newRecordId, newRuleId, newSubscriptionId } from './store-context';

const NS = 'smart-ledger';
const KEY = `${NS}:state`;

// 空账本初始状态：保留账户/分类/设置等记账基础设施，账户余额归零，不带任何收支、预算、订阅与规则数据
const EMPTY_STATE: IAppState = {
  ...SEED,
  accounts: SEED.accounts.map((a) => ({ ...a, balance: 0 })),
  records: [],
  budgets: [],
  subscriptions: [],
  rules: [],
};

function loadInitial(): IAppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as IAppState;
      if (Array.isArray(parsed.accounts) && Array.isArray(parsed.records) && Array.isArray(parsed.categories)) {
        return { ...SEED, ...parsed };
      }
    }
  } catch {
    /* 隐私模式等场景静默回退到空账本 */
  }
  return EMPTY_STATE;
}

function clone(state: IAppState): IAppState {
  return {
    accounts: [...state.accounts],
    categories: [...state.categories],
    records: [...state.records],
    budgets: [...state.budgets],
    subscriptions: [...state.subscriptions],
    rules: [...state.rules],
    settings: { ...state.settings },
  };
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IAppState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* 隐私模式静默降级 */
    }
  }, [state]);

  const value: IStoreValue = {
    state,
    saveEntries(entries: NewRecord[]) {
      if (entries.length === 0) return;
      setState((prev) => {
        const next = clone(prev);
        const now = new Date().toISOString();
        for (const e of entries) {
          next.records.push({ ...e, id: newRecordId(), createdAt: now });
        }
        next.records.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return next;
      });
    },
    saveRecord(entry: NewRecord, id?: string) {
      setState((prev) => {
        const next = clone(prev);
        if (id) {
          const idx = next.records.findIndex((r) => r.id === id);
          if (idx >= 0) next.records[idx] = { ...entry, id, createdAt: next.records[idx].createdAt };
        } else {
          next.records.push({ ...entry, id: newRecordId(), createdAt: new Date().toISOString() });
        }
        next.records.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return next;
      });
    },
    deleteRecord(id: string) {
      setState((prev) => ({ ...clone(prev), records: prev.records.filter((r) => r.id !== id) }));
    },
    saveAccount(account: IAccount) {
      setState((prev) => {
        const next = clone(prev);
        const idx = next.accounts.findIndex((a) => a.id === account.id);
        if (idx >= 0) next.accounts[idx] = account;
        else next.accounts.push({ ...account, id: account.id || newAccountId() });
        return next;
      });
    },
    deleteAccount(id: string) {
      setState((prev) => ({ ...clone(prev), accounts: prev.accounts.filter((a) => a.id !== id) }));
    },
    saveCategory(category: ICategory) {
      setState((prev) => {
        const next = clone(prev);
        const idx = next.categories.findIndex((c) => c.id === category.id);
        if (idx >= 0) next.categories[idx] = category;
        else next.categories.push({ ...category, id: category.id || newCategoryId() });
        return next;
      });
    },
    deleteCategory(id: string) {
      setState((prev) => ({ ...clone(prev), categories: prev.categories.filter((c) => c.id !== id) }));
    },
    saveBudget(budget: IBudget) {
      setState((prev) => {
        const next = clone(prev);
        const idx = next.budgets.findIndex((b) => b.id === budget.id);
        if (idx >= 0) next.budgets[idx] = budget;
        else next.budgets.push({ ...budget, id: budget.id || newBudgetId() });
        return next;
      });
    },
    deleteBudget(id: string) {
      setState((prev) => ({ ...clone(prev), budgets: prev.budgets.filter((b) => b.id !== id) }));
    },
    saveSubscription(sub: ISubscription) {
      setState((prev) => {
        const next = clone(prev);
        const idx = next.subscriptions.findIndex((s) => s.id === sub.id);
        if (idx >= 0) next.subscriptions[idx] = sub;
        else next.subscriptions.push({ ...sub, id: sub.id || newSubscriptionId() });
        return next;
      });
    },
    deleteSubscription(id: string) {
      setState((prev) => ({ ...clone(prev), subscriptions: prev.subscriptions.filter((s) => s.id !== id) }));
    },
    saveRule(rule: IRule) {
      setState((prev) => {
        const next = clone(prev);
        const idx = next.rules.findIndex((r) => r.id === rule.id);
        if (idx >= 0) next.rules[idx] = rule;
        else next.rules.push({ ...rule, id: rule.id || newRuleId() });
        return next;
      });
    },
    deleteRule(id: string) {
      setState((prev) => ({ ...clone(prev), rules: prev.rules.filter((r) => r.id !== id) }));
    },
    updateSettings(patch: Partial<IAppSettings>) {
      setState((prev) => ({ ...clone(prev), settings: { ...prev.settings, ...patch } }));
    },
    importState(s: IAppState) {
      setState(s);
    },
    resetToDemo() {
      setState(SEED);
    },
    clearAll() {
      setState(EMPTY_STATE);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
