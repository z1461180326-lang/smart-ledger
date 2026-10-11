// EXPORTS: TRecordType, TAccountType, TFrequency, IAccount, ICategory, IRecord, IBudget, ISubscription, IRule, IAppSettings, IAppState, NewRecord
export type TRecordType = 'income' | 'expense';
export type TAccountType = 'wechat' | 'alipay' | 'bank' | 'credit' | 'cash' | 'other';
export type TFrequency = 'monthly' | 'yearly';

export interface IAccount {
  id: string;
  name: string;
  type: TAccountType;
  balance: number;
}

export interface ICategory {
  id: string;
  name: string;
  icon: string;
  type: TRecordType;
  parentId: string | null;
  /** 是否为必要支出（用于非必要消费统计） */
  necessary: boolean;
  /** 是否可优化（用于可优化支出统计） */
  optimizable: boolean;
}

export interface IRecord {
  id: string;
  type: TRecordType;
  amount: number;
  categoryId: string;
  /** YYYY-MM-DD */
  date: string;
  accountId: string;
  merchant: string;
  note: string;
  /** ISO 时间 */
  createdAt: string;
}

export type NewRecord = Omit<IRecord, 'id' | 'createdAt'>;

export interface IBudget {
  id: string;
  /** 一级分类 id */
  categoryId: string;
  /** YYYY-MM */
  month: string;
  amount: number;
}

export interface ISubscription {
  id: string;
  name: string;
  amount: number;
  frequency: TFrequency;
  categoryId: string;
  accountId: string;
  /** 下次扣款日 YYYY-MM-DD */
  nextDate: string;
  note: string;
}

export interface IRule {
  id: string;
  keyword: string;
  type: TRecordType;
  categoryId: string;
  enabled: boolean;
}

export interface IAppSettings {
  /** 大额消费判定阈值（元） */
  bigAmountThreshold: number;
  /** 分类支出上涨提醒阈值（%） */
  riseThresholdPct: number;
  /** 冲动消费单笔阈值（元） */
  impulseThreshold: number;
}

export interface IAppState {
  accounts: IAccount[];
  categories: ICategory[];
  records: IRecord[];
  budgets: IBudget[];
  subscriptions: ISubscription[];
  rules: IRule[];
  settings: IAppSettings;
}
