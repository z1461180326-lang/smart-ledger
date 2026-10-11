// EXPORTS: IStoreValue, AppContext, useAppStore, uid
import { createContext, useContext } from 'react';
import type { IAppState, IAccount, IBudget, ICategory, IRule, IAppSettings, ISubscription, NewRecord } from './types';

export interface IStoreValue {
  state: IAppState;
  saveEntries: (entries: NewRecord[]) => void;
  saveRecord: (entry: NewRecord, id?: string) => void;
  deleteRecord: (id: string) => void;
  saveAccount: (account: IAccount) => void;
  deleteAccount: (id: string) => void;
  saveCategory: (category: ICategory) => void;
  deleteCategory: (id: string) => void;
  saveBudget: (budget: IBudget) => void;
  deleteBudget: (id: string) => void;
  saveSubscription: (sub: ISubscription) => void;
  deleteSubscription: (id: string) => void;
  saveRule: (rule: IRule) => void;
  deleteRule: (id: string) => void;
  updateSettings: (patch: Partial<IAppSettings>) => void;
  importState: (s: IAppState) => void;
  resetToDemo: () => void;
  clearAll: () => void;
}

export const AppContext = createContext<IStoreValue | null>(null);

export function useAppStore(): IStoreValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore 必须在 AppProvider 内使用');
  return ctx;
}

/** 事件回调里生成唯一 id（渲染期不要调用） */
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const newRecordId = () => uid('rec');
export const newAccountId = () => uid('acc');
export const newCategoryId = () => uid('cat');
export const newBudgetId = () => uid('bud');
export const newSubscriptionId = () => uid('sub');
export const newRuleId = () => uid('rule');
