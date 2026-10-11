const nf = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const fmtMoney = (n: number) => nf.format(Math.abs(Math.round(n * 100) / 100));

/** 带符号金额，用于收入/支出展示：+1,500 / -268 */
export const fmtSigned = (n: number) => `${n >= 0 ? '+' : '-'}${fmtMoney(n)}`;

/** 百分比（保留 1 位） */
export const fmtPct = (n: number) => `${Math.round(n * 10) / 10}%`;

/** 环比变化百分比：本期 vs 上期 */
export const changePct = (cur: number, prev: number) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};
