import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatCard from '@/components/StatCard';
import DonutChart from '@/components/charts/DonutChart';
import TrendChart from '@/components/charts/TrendChart';
import CategoryIcon from '@/components/CategoryIcon';
import { useAppStore } from '@/lib/store-context';
import { CURRENT_MONTH, monthOf, monthLabel, prevMonth } from '@/lib/time';
import { fmtMoney, fmtPct, changePct } from '@/lib/format';
import { CHART_COLORS } from '@/lib/theme';
import { monthSummary, categoryTotals, dailySeries, prevMonthCompare } from '@/lib/analysis';

export default function MonthlyStatsPage() {
  const { state } = useAppStore();
  const months = useMemo(
    () => [...new Set(state.records.map((r) => monthOf(r.date)))].sort((a, b) => (a < b ? 1 : -1)),
    [state.records],
  );
  const [month, setMonth] = useState<string>(CURRENT_MONTH);

  const sum = monthSummary(state.records, month);
  const prev = monthSummary(state.records, prevMonth(month));
  const cmp = prevMonthCompare(state.records, month);
  const expCats = categoryTotals(state.records, state.categories, month, 'expense');
  const incCats = categoryTotals(state.records, state.categories, month, 'income');
  const daily = dailySeries(state.records, month);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">月度统计</h2>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="本月收入"
          value={`¥${fmtMoney(sum.income)}`}
          tone="income"
          icon={ArrowUpRight}
          sub={`上月 ¥${fmtMoney(prev.income)} · ${cmp.incomePct >= 0 ? '↑' : '↓'}${fmtPct(Math.abs(cmp.incomePct))}`}
        />
        <StatCard
          label="本月支出"
          value={`¥${fmtMoney(sum.expense)}`}
          tone="expense"
          icon={ArrowDownLeft}
          sub={`上月 ¥${fmtMoney(prev.expense)} · ${cmp.expensePct >= 0 ? '↑' : '↓'}${fmtPct(Math.abs(cmp.expensePct))}`}
        />
        <StatCard label="本月结余" value={`¥${fmtMoney(sum.income - sum.expense)}`} icon={Scale} />
        <StatCard label="储蓄率" value={fmtPct(sum.savingsRate)} sub={`记账 ${sum.count} 笔`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{monthLabel(month)} 每日收支</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            labels={daily.map((d) => `${d.day}日`)}
            income={daily.map((d) => d.income)}
            expense={daily.map((d) => d.expense)}
            smooth={false}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">支出分类占比</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={expCats.map((c) => ({ name: c.name, value: c.amount }))}
              colors={CHART_COLORS}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">支出排行</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {expCats.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">本月暂无支出</p>}
            {expCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
                <CategoryIcon icon={c.icon} className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} 笔</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">¥{fmtMoney(c.amount)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{fmtPct(c.pct)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {incCats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">收入构成</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {incCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <CategoryIcon icon={c.icon} className="size-4 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} 笔</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-emerald-600">¥{fmtMoney(c.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
