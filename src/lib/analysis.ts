// EXPORTS: parentOf, catMeta, catPathLabel, monthSummary, categoryTotals, prevMonthCompare,
//          categoryChanges, budgetStatus, dailySeries, monthlyTrend, yearlySummary,
//          todayRecords, recentRecords, totalAssets, savingsRate, optimizableSpend,
//          nonNecessarySpend, buildAlerts, buildInsights
import { CURRENT_MONTH, CURRENT_YEAR, TODAY, monthOf, prevMonth, monthLabel } from './time';
import { changePct, fmtMoney, fmtPct } from './format';
import type { IAppState, IAccount, IBudget, ICategory, IRecord } from './types';

export const parentOf = (categories: ICategory[], catId: string): ICategory => {
  const self = categories.find((c) => c.id === catId);
  if (!self) return categories.find((c) => c.id === 'exp_other') ?? categories[0];
  if (!self.parentId) return self;
  return categories.find((c) => c.id === self.parentId) ?? self;
};

export const catMeta = (categories: ICategory[], catId: string): ICategory =>
  categories.find((c) => c.id === catId) ?? categories.find((c) => c.id === 'exp_other') ?? categories[0];

export const catPathLabel = (categories: ICategory[], catId: string) => {
  const leaf = categories.find((c) => c.id === catId);
  if (!leaf) return '未分类';
  if (!leaf.parentId) return leaf.name;
  const p = categories.find((c) => c.id === leaf.parentId);
  return p ? `${p.name} / ${leaf.name}` : leaf.name;
};

export interface IMonthSummary {
  income: number;
  expense: number;
  count: number;
  savingsRate: number;
}

export const monthRecords = (records: IRecord[], ym: string) =>
  records.filter((r) => monthOf(r.date) === ym);

export const monthSummary = (records: IRecord[], ym: string): IMonthSummary => {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const r of records) {
    if (monthOf(r.date) !== ym) continue;
    count += 1;
    if (r.type === 'income') income += r.amount;
    else expense += r.amount;
  }
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    count,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0,
  };
};

export interface ICategoryTotal {
  id: string;
  name: string;
  icon: string;
  amount: number;
  count: number;
  pct: number;
}

export const categoryTotals = (records: IRecord[], categories: ICategory[], ym: string, type: 'income' | 'expense'): ICategoryTotal[] => {
  const map = new Map<string, ICategoryTotal>();
  let total = 0;
  for (const r of records) {
    if (monthOf(r.date) !== ym || r.type !== type) continue;
    const parent = parentOf(categories, r.categoryId);
    const cur = map.get(parent.id) ?? { id: parent.id, name: parent.name, icon: parent.icon, amount: 0, count: 0, pct: 0 };
    cur.amount = Math.round((cur.amount + r.amount) * 100) / 100;
    cur.count += 1;
    map.set(parent.id, cur);
    total += r.amount;
  }
  return [...map.values()]
    .map((t) => ({ ...t, pct: total > 0 ? Math.round((t.amount / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.amount - a.amount);
};

export const prevMonthCompare = (records: IRecord[], ym: string) => {
  const cur = monthSummary(records, ym);
  const prev = monthSummary(records, prevMonth(ym));
  return {
    curExpense: cur.expense,
    prevExpense: prev.expense,
    expensePct: changePct(cur.expense, prev.expense),
    curIncome: cur.income,
    prevIncome: prev.income,
    incomePct: changePct(cur.income, prev.income),
  };
};

export interface ICategoryChange {
  id: string;
  name: string;
  cur: number;
  prev: number;
  pct: number;
}

export const categoryChanges = (records: IRecord[], categories: ICategory[], curYm: string): ICategoryChange[] => {
  const cur = categoryTotals(records, categories, curYm, 'expense');
  const prev = categoryTotals(records, categories, prevMonth(curYm), 'expense');
  return cur.map((c) => {
    const p = prev.find((x) => x.id === c.id);
    return { id: c.id, name: c.name, cur: c.amount, prev: p?.amount ?? 0, pct: changePct(c.amount, p?.amount ?? 0) };
  });
};

export interface IBudgetStatus {
  categoryId: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  pct: number;
  remaining: number;
  projected: number;
  overshoot: number;
  hasBudget: boolean;
}

export const budgetStatus = (records: IRecord[], budgets: IBudget[], categories: ICategory[], ym: string): IBudgetStatus[] => {
  const totals = categoryTotals(records, categories, ym, 'expense');
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  return budgets
    .filter((b) => b.month === ym)
    .map((b) => {
      const cat = catMeta(categories, b.categoryId);
      const spent = totals.find((t) => t.id === b.categoryId)?.amount ?? 0;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 1000) / 10 : 0;
      const remaining = Math.round((b.amount - spent) * 100) / 100;
      const projected = dayOfMonth > 0 ? Math.round((spent / dayOfMonth) * daysInMonth * 100) / 100 : spent;
      const overshoot = Math.max(0, Math.round((projected - b.amount) * 100) / 100);
      return { categoryId: b.categoryId, name: cat.name, icon: cat.icon, budget: b.amount, spent, pct, remaining, projected, overshoot, hasBudget: true };
    });
};

export interface IDayPoint {
  day: number;
  date: string;
  income: number;
  expense: number;
}

export const dailySeries = (records: IRecord[], ym: string): IDayPoint[] => {
  const map = new Map<number, IDayPoint>();
  for (const r of records) {
    if (monthOf(r.date) !== ym) continue;
    const d = Number(r.date.slice(8, 10));
    const cur = map.get(d) ?? { day: d, date: r.date, income: 0, expense: 0 };
    if (r.type === 'income') cur.income = Math.round((cur.income + r.amount) * 100) / 100;
    else cur.expense = Math.round((cur.expense + r.amount) * 100) / 100;
    map.set(d, cur);
  }
  return [...map.values()].sort((a, b) => a.day - b.day);
};

export interface ITrendPoint {
  ym: string;
  label: string;
  income: number;
  expense: number;
}

export const monthlyTrend = (records: IRecord[], n: number): ITrendPoint[] => {
  const out: ITrendPoint[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const s = monthSummary(records, ym);
    out.push({ ym, label: `${d.getMonth() + 1}月`, income: s.income, expense: s.expense });
  }
  return out;
};

export const yearlySummary = (records: IRecord[], year: string) => {
  const byMonth: Array<{ month: number; income: number; expense: number }> = [];
  let income = 0;
  let expense = 0;
  for (let m = 1; m <= 12; m += 1) {
    const ym = `${year}-${String(m).padStart(2, '0')}`;
    const s = monthSummary(records, ym);
    byMonth.push({ month: m, income: s.income, expense: s.expense });
    income += s.income;
    expense += s.expense;
  }
  return { year, income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100, byMonth };
};

export const todayRecords = (records: IRecord[]) =>
  records.filter((r) => r.date === TODAY).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const recentRecords = (records: IRecord[], n: number) =>
  [...records].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt))).slice(0, n);

export const totalAssets = (accounts: IAccount[]) =>
  Math.round(accounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;

export const savingsRate = (records: IRecord[], ym: string) => monthSummary(records, ym).savingsRate;

export const optimizableSpend = (records: IRecord[], categories: ICategory[], ym: string) =>
  Math.round(
    records
      .filter((r) => monthOf(r.date) === ym && r.type === 'expense' && catMeta(categories, r.categoryId).optimizable)
      .reduce((s, r) => s + r.amount, 0) * 100,
  ) / 100;

export const nonNecessarySpend = (records: IRecord[], categories: ICategory[], ym: string) =>
  Math.round(
    records
      .filter((r) => monthOf(r.date) === ym && r.type === 'expense' && !catMeta(categories, r.categoryId).necessary)
      .reduce((s, r) => s + r.amount, 0) * 100,
  ) / 100;

export interface IAlertItem {
  level: 'red' | 'yellow' | 'green';
  title: string;
  detail: string;
}

export function buildAlerts(state: IAppState, ym = CURRENT_MONTH): IAlertItem[] {
  const { records, budgets, categories, subscriptions, settings } = state;
  const alerts: IAlertItem[] = [];
  const cmp = prevMonthCompare(records, ym);
  const changes = categoryChanges(records, categories, ym);
  const budgetsStatus = budgetStatus(records, budgets, categories, ym);

  for (const c of changes) {
    if (c.cur >= 100 && c.pct >= settings.riseThresholdPct) {
      alerts.push({ level: 'red', title: `${c.name}支出比上月增加 ${fmtPct(c.pct)}`, detail: `本月 ${c.name} ${fmtMoney(c.cur)} 元，上月 ${fmtMoney(c.prev)} 元` });
    }
  }
  for (const b of budgetsStatus) {
    if (b.overshoot > 0) {
      alerts.push({ level: 'red', title: `${b.name}预算预计超支 ${fmtMoney(b.overshoot)}`, detail: `本月已用 ${fmtMoney(b.spent)} / ${fmtMoney(b.budget)}，按当前速度月底将超支` });
    } else if (b.pct >= 70) {
      alerts.push({ level: 'yellow', title: `本月${b.name}预算剩余 ${fmtMoney(b.remaining)}`, detail: `已使用 ${fmtPct(b.pct)}（${fmtMoney(b.spent)} / ${fmtMoney(b.budget)}）` });
    }
  }
  const insights = buildInsights(state, ym);
  const big = insights.find((s) => s.key === 'big');
  if (big && big.items.length > 0) {
    alerts.push({ level: 'red', title: `发现 ${big.items.length} 笔大额消费`, detail: `单笔 ≥ ${fmtMoney(settings.bigAmountThreshold)} 元，共 ${fmtMoney(big.items.reduce((s, i) => s + (i.amount ?? 0), 0))} 元` });
  }
  const abnormal = insights.find((s) => s.key === 'abnormal');
  if (abnormal && abnormal.items.length > 0) {
    alerts.push({ level: 'red', title: `发现 ${abnormal.items.length} 笔异常消费`, detail: '金额明显高于同类支出平均水平' });
  }
  const impulse = insights.find((s) => s.key === 'impulse');
  if (impulse && impulse.items.length > 0) {
    alerts.push({ level: 'yellow', title: `识别到 ${impulse.items.length} 笔冲动消费`, detail: '集中在娱乐 / 非必要购物等可优化分类' });
  }
  const dueSoon = subscriptions.filter((s) => {
    const diff = (new Date(s.nextDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  });
  for (const s of dueSoon) {
    alerts.push({ level: 'yellow', title: `${s.name}将于 ${s.nextDate.slice(5)} 扣款`, detail: `${fmtMoney(s.amount)} 元 / ${s.frequency === 'monthly' ? '月' : '年'}` });
  }
  if (cmp.curIncome > 0) {
    const rate = monthSummary(records, ym).savingsRate;
    if (rate >= 30) alerts.push({ level: 'green', title: `本月储蓄率达到 ${fmtPct(rate)}`, detail: `收入 ${fmtMoney(cmp.curIncome)}，支出 ${fmtMoney(cmp.curExpense)}，结余 ${fmtMoney(cmp.curIncome - cmp.curExpense)}` });
    else if (rate >= 0) alerts.push({ level: 'yellow', title: `本月储蓄率 ${fmtPct(rate)}`, detail: '建议结余保持在收入 30% 以上' });
  }
  if (cmp.prevExpense > 0 && cmp.expensePct < 0) {
    alerts.push({ level: 'green', title: `本月支出比上月下降 ${fmtPct(Math.abs(cmp.expensePct))}`, detail: `上月 ${fmtMoney(cmp.prevExpense)} → 本月 ${fmtMoney(cmp.curExpense)}` });
  }
  return alerts.slice(0, 7);
}

export interface IInsightItem {
  title: string;
  amount?: number;
  date?: string;
  detail: string;
}

export interface IInsightSection {
  key: string;
  title: string;
  level: 'red' | 'yellow' | 'green' | 'info';
  emptyText: string;
  items: IInsightItem[];
}

export function buildInsights(state: IAppState, ym = CURRENT_MONTH): IInsightSection[] {
  const { records, categories, settings } = state;
  const inMonth = monthRecords(records, ym);

  // 大额消费
  const bigItems: IInsightItem[] = inMonth
    .filter((r) => r.type === 'expense' && r.amount >= settings.bigAmountThreshold)
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      title: `${catPathLabel(categories, r.categoryId)} · ${r.merchant || r.note || '支出'}`,
      amount: r.amount,
      date: r.date,
      detail: `单笔 ${fmtMoney(r.amount)} 元，超过大额阈值 ${fmtMoney(settings.bigAmountThreshold)} 元`,
    }));

  // 冲动消费：可优化分类中单笔超过冲动阈值的支出
  const impulseItems: IInsightItem[] = inMonth
    .filter((r) => r.type === 'expense' && r.amount >= settings.impulseThreshold && catMeta(categories, r.categoryId).optimizable)
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      title: `${catPathLabel(categories, r.categoryId)} · ${r.merchant || r.note || '支出'}`,
      amount: r.amount,
      date: r.date,
      detail: '属于可优化分类（娱乐 / 非必要购物 / 餐饮小项），建议复盘必要性',
    }));

  // 重复订阅：同商户同金额 ≥3 次，或备注含订阅特征词
  const subNotes = /会员|套餐|订阅|包月|月卡|续费/;
  const group = new Map<string, IRecord[]>();
  for (const r of records) {
    if (r.type !== 'expense') continue;
    const key = r.merchant || (subNotes.test(r.note) ? r.note : '');
    if (!key) continue;
    const arr = group.get(key) ?? [];
    arr.push(r);
    group.set(key, arr);
  }
  const repeatItems: IInsightItem[] = [];
  for (const [key, arr] of group) {
    const sameAmount = new Map<number, IRecord[]>();
    for (const r of arr) {
      const list = sameAmount.get(r.amount) ?? [];
      list.push(r);
      sameAmount.set(r.amount, list);
    }
    for (const [amt, list] of sameAmount) {
      if (list.length >= 3 && amt >= 10) {
        repeatItems.push({
          title: `${key} ${fmtMoney(amt)} 元`,
          amount: amt * list.length,
          date: list[list.length - 1].date,
          detail: `近 12 个月出现 ${list.length} 次相同金额，疑似固定扣款/订阅`,
        });
      }
    }
  }
  repeatItems.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  // 异常消费：本月金额 > 近 3 个月同类平均的 3 倍（且 ≥150）
  const meanMap = new Map<string, number>();
  for (let i = 1; i <= 3; i += 1) {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const pm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    for (const r of monthRecords(records, pm)) {
      if (r.type !== 'expense') continue;
      const parent = parentOf(categories, r.categoryId).id;
      meanMap.set(parent, (meanMap.get(parent) ?? 0) + r.amount);
    }
  }
  const abnormalItems: IInsightItem[] = [];
  for (const r of inMonth) {
    if (r.type !== 'expense') continue;
    const parent = parentOf(categories, r.categoryId).id;
    const mean = (meanMap.get(parent) ?? 0) / 3;
    if (mean > 0 && r.amount >= 150 && r.amount > mean * 3) {
      abnormalItems.push({
        title: `${catPathLabel(categories, r.categoryId)} · ${r.merchant || r.note || '支出'}`,
        amount: r.amount,
        date: r.date,
        detail: `近 3 个月该类平均约 ${fmtMoney(mean)} 元，本笔为平均的 ${(r.amount / mean).toFixed(1)} 倍`,
      });
    }
  }

  // 消费上涨
  const changes = categoryChanges(records, categories, ym);
  const risingItems: IInsightItem[] = changes
    .filter((c) => c.cur >= 100 && c.pct >= settings.riseThresholdPct)
    .map((c) => ({
      title: c.name,
      amount: c.cur,
      detail: `本月 ${fmtMoney(c.cur)} 元，上月 ${fmtMoney(c.prev)} 元，上涨 ${fmtPct(c.pct)}`,
    }));

  // 支出突增：最近 7 天 vs 前 7 天
  const seg = (from: string, to: string) => {
    const map = new Map<string, number>();
    for (const r of records) {
      if (r.type !== 'expense') continue;
      if (r.date >= from && r.date <= to) {
        const p = parentOf(categories, r.categoryId).id;
        map.set(p, (map.get(p) ?? 0) + r.amount);
      }
    }
    return map;
  };
  const d = new Date();
  const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromA = new Date(d.getTime() - 6 * 86400000);
  const fromB = new Date(d.getTime() - 13 * 86400000);
  const f = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const cur7 = seg(f(fromA), to);
  const prev7 = seg(f(fromB), f(new Date(d.getTime() - 7 * 86400000)));
  const spikeItems: IInsightItem[] = [];
  for (const [pid, cur] of cur7) {
    const prev = prev7.get(pid) ?? 0;
    if (cur >= 100 && cur >= prev * 2 && prev >= 0) {
      const cat = catMeta(categories, pid);
      spikeItems.push({
        title: cat.name,
        amount: cur,
        detail: `最近 7 天 ${fmtMoney(cur)} 元${prev > 0 ? `，前 7 天 ${fmtMoney(prev)} 元` : '（前 7 天无同类支出）'}`,
      });
    }
  }
  spikeItems.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  return [
    { key: 'big', title: '大额消费', level: 'red', emptyText: '本月暂无大额消费', items: bigItems.slice(0, 6) },
    { key: 'impulse', title: '冲动消费', level: 'yellow', emptyText: '本月未发现明显冲动消费', items: impulseItems.slice(0, 6) },
    { key: 'repeat', title: '重复订阅 / 固定扣款', level: 'yellow', emptyText: '未发现重复订阅', items: repeatItems.slice(0, 6) },
    { key: 'abnormal', title: '异常消费', level: 'red', emptyText: '本月未发现异常消费', items: abnormalItems.slice(0, 6) },
    { key: 'rising', title: '消费上涨', level: 'red', emptyText: '暂无上涨超过阈值的分类', items: risingItems.slice(0, 6) },
    { key: 'spike', title: '支出突增', level: 'yellow', emptyText: '最近一周支出平稳', items: spikeItems.slice(0, 6) },
  ];
}
