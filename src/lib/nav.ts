import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  NotebookPen,
  ReceiptText,
  Wallet,
  Scale,
  Repeat,
  Target,
  Tags,
  CalendarDays,
  BarChart3,
  Sparkles,
  SlidersHorizontal,
  DatabaseBackup,
} from 'lucide-react';

export interface INavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface INavGroup {
  label: string;
  items: INavItem[];
}

export const NAV_GROUPS: INavGroup[] = [
  {
    label: '概览',
    items: [{ label: '首页总览', path: '/', icon: LayoutDashboard }],
  },
  {
    label: '记账',
    items: [
      { label: '记账输入区', path: '/entry', icon: NotebookPen },
      { label: '收支明细', path: '/records', icon: ReceiptText },
    ],
  },
  {
    label: '资产',
    items: [
      { label: '账户管理', path: '/accounts', icon: Wallet },
      { label: '资产负债表', path: '/balance', icon: Scale },
      { label: '订阅/固定支出', path: '/subscriptions', icon: Repeat },
    ],
  },
  {
    label: '计划',
    items: [
      { label: '预算管理', path: '/budgets', icon: Target },
      { label: '分类管理', path: '/categories', icon: Tags },
      { label: '自动化规则', path: '/rules', icon: SlidersHorizontal },
    ],
  },
  {
    label: '分析',
    items: [
      { label: '月度统计', path: '/monthly', icon: CalendarDays },
      { label: '年度统计', path: '/yearly', icon: BarChart3 },
      { label: '智能分析', path: '/analysis', icon: Sparkles },
    ],
  },
  {
    label: '系统',
    items: [{ label: '数据备份区', path: '/backup', icon: DatabaseBackup }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const pageTitleOf = (pathname: string) => {
  const hit = NAV_ITEMS.find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)));
  return hit?.label ?? '';
};
