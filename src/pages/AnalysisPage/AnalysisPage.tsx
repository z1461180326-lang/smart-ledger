import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, Repeat as RepeatIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/charts/TrendChart';
import { useAppStore } from '@/lib/store-context';
import { CURRENT_MONTH, monthLabel } from '@/lib/time';
import { fmtMoney, fmtPct } from '@/lib/format';
import { monthSummary, prevMonthCompare, buildInsights, optimizableSpend, nonNecessarySpend, monthlyTrend } from '@/lib/analysis';

const SECTION_META: Record<string, { icon: typeof Sparkles; badge: string; badgeClass: string }> = {
  big: { icon: AlertCircle, badge: '需关注', badgeClass: 'bg-red-50 text-red-700 hover:bg-red-50' },
  impulse: { icon: AlertTriangle, badge: '建议复盘', badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-50' },
  repeat: { icon: RepeatIcon, badge: '固定扣款', badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-50' },
  abnormal: { icon: AlertCircle, badge: '需关注', badgeClass: 'bg-red-50 text-red-700 hover:bg-red-50' },
  rising: { icon: AlertTriangle, badge: '上涨', badgeClass: 'bg-red-50 text-red-700 hover:bg-red-50' },
  spike: { icon: AlertTriangle, badge: '突增', badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-50' },
};

export default function AnalysisPage() {
  const { state } = useAppStore();
  const sum = monthSummary(state.records, CURRENT_MONTH);
  const cmp = prevMonthCompare(state.records, CURRENT_MONTH);
  const insights = buildInsights(state);
  const opt = optimizableSpend(state.records, state.categories, CURRENT_MONTH);
  const nonNecessary = nonNecessarySpend(state.records, state.categories, CURRENT_MONTH);
  const trend = monthlyTrend(state.records, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-base font-semibold">智能分析 · {monthLabel(CURRENT_MONTH)}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="本月支出" value={`¥${fmtMoney(sum.expense)}`} tone="expense" />
        <StatCard
          label="环比变化"
          value={fmtPct(Math.abs(cmp.expensePct))}
          tone={cmp.expensePct > 0 ? 'expense' : 'income'}
          sub={cmp.expensePct >= 0 ? `比上月多花 ¥${fmtMoney(sum.expense - cmp.prevExpense)}` : `比上月少花 ¥${fmtMoney(cmp.prevExpense - sum.expense)}`}
        />
        <StatCard label="非必要消费" value={`¥${fmtMoney(nonNecessary)}`} sub="非必要分类支出合计" />
        <StatCard label="本月可优化支出" value={`约 ¥${fmtMoney(opt)}`} sub="娱乐 / 非必要购物等可削减项" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((s) => {
          const meta = SECTION_META[s.key] ?? { icon: Sparkles, badge: '提示', badgeClass: '' };
          const Icon = meta.icon;
          return (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="size-4 text-muted-foreground" />
                  {s.title}
                  <Badge className={meta.badgeClass}>{meta.badge}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {s.items.length === 0 && (
                  <p className="flex items-center gap-1.5 py-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {s.emptyText}
                  </p>
                )}
                {s.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.amount !== undefined && (
                          <span className="text-sm font-semibold tabular-nums">¥{fmtMoney(item.amount)}</span>
                        )}
                        {item.date && <span className="text-xs text-muted-foreground tabular-nums">{item.date}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">近 6 月收支趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart labels={trend.map((t) => t.label)} income={trend.map((t) => t.income)} expense={trend.map((t) => t.expense)} />
        </CardContent>
      </Card>
    </div>
  );
}
