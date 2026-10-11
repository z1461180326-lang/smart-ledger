import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarRange } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/charts/TrendChart';
import HBarChart from '@/components/charts/HBarChart';
import { useAppStore } from '@/lib/store-context';
import { CURRENT_YEAR, yearOf } from '@/lib/time';
import { fmtMoney } from '@/lib/format';
import { yearlySummary } from '@/lib/analysis';

export default function YearlyStatsPage() {
  const { state } = useAppStore();
  const years = useMemo(
    () => [...new Set(state.records.map((r) => yearOf(r.date)))].sort((a, b) => (a < b ? -1 : 1)),
    [state.records],
  );
  const [year, setYear] = useState<string>(CURRENT_YEAR);

  const ys = yearlySummary(state.records, year);
  const fullRanking = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    for (const r of state.records) {
      if (yearOf(r.date) !== year || r.type !== 'expense') continue;
      const p = state.categories.find((c) => c.id === r.categoryId && !c.parentId) ?? state.categories.find((c) => c.id === r.categoryId);
      const pid = p?.parentId ?? p?.id ?? r.categoryId;
      const parent = state.categories.find((c) => c.id === pid);
      const name = parent?.name ?? '未分类';
      const cur = map.get(pid) ?? { name, amount: 0 };
      cur.amount = Math.round((cur.amount + r.amount) * 100) / 100;
      map.set(pid, cur);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [state.records, state.categories, year]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">年度统计</h2>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y} 年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="年收入" value={`¥${fmtMoney(ys.income)}`} tone="income" icon={ArrowUpRight} />
        <StatCard label="年支出" value={`¥${fmtMoney(ys.expense)}`} tone="expense" icon={ArrowDownLeft} />
        <StatCard label="年结余" value={`¥${fmtMoney(ys.income - ys.expense)}`} icon={CalendarRange} />
        <StatCard label="月均支出" value={`¥${fmtMoney(ys.expense / 12)}`} sub={`共 ${state.records.filter((r) => yearOf(r.date) === year).length} 笔`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{year} 年每月收支</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            labels={ys.byMonth.map((m) => `${m.month}月`)}
            income={ys.byMonth.map((m) => m.income)}
            expense={ys.byMonth.map((m) => m.expense)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">年度支出排行（一级分类）</CardTitle>
          </CardHeader>
          <CardContent>
            <HBarChart data={fullRanking.map((r) => ({ name: r.name, value: r.amount }))} height={Math.max(220, fullRanking.length * 36)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">本年度 {year} 明细</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {year} 年共收入 <span className="font-semibold text-emerald-600">¥{fmtMoney(ys.income)}</span>，支出{' '}
              <span className="font-semibold text-red-600">¥{fmtMoney(ys.expense)}</span>。
            </p>
            <div className="mt-3 space-y-1.5">
              {fullRanking.slice(0, 5).map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">¥{fmtMoney(c.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
