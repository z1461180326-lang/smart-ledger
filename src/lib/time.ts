import { format, subDays, subMonths, parse } from 'date-fns';

// 模块级只读一次，避免在组件渲染期产生副作用
export const NOW = new Date();
export const TODAY = format(NOW, 'yyyy-MM-dd');
export const CURRENT_MONTH = format(NOW, 'yyyy-MM');
export const CURRENT_YEAR = format(NOW, 'yyyy');
export const YESTERDAY = format(subDays(NOW, 1), 'yyyy-MM-dd');
export const DAY_BEFORE_YESTERDAY = format(subDays(NOW, 2), 'yyyy-MM-dd');

/** 事件回调里取“现在”用这个（渲染期不要调用） */
export const nowIso = () => new Date().toISOString();
export const todayKey = () => format(new Date(), 'yyyy-MM-dd');

export const monthOf = (dateStr: string) => dateStr.slice(0, 7);
export const yearOf = (dateStr: string) => dateStr.slice(0, 4);

/** 'yyyy-MM' + n 个月 */
export const shiftMonth = (ym: string, n: number) =>
  format(parse(ym, 'yyyy-MM', new Date()), 'yyyy-MM');

export const prevMonth = (ym: string) => shiftMonth(ym, -1);

export const monthLabel = (ym: string) => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return `${y}年${m}月`;
};

export const shortDate = (dateStr: string) => {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}月${Number(d)}日`;
};

export const weekdayLabel = (dateStr: string) => {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return w;
};
