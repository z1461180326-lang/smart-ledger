import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DonutChart from '@/components/charts/DonutChart';
import TrendChart from '@/components/charts/TrendChart';
import CategoryIcon from '@/components/CategoryIcon';
import { useAppStore } from '@/lib/store-context';
import { CURRENT_MONTH, TODAY, shortDate, weekdayLabel } from '@/lib/time';
import { fmtMoney, fmtPct, changePct } from '@/lib/format';
import {
  monthSummary,
  categoryTotals,
  prevMonthCompare,
  todayRecords,
  monthlyTrend,
  buildAlerts,
  totalAssets,
  catPathLabel,
  catMeta,
} from '@/lib/analysis';

const ALERT_DOT: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
};

export default function HomePage() {
  const { state } = useAppStore();
  const sum = monthSummary(state.records, CURRENT_MONTH);
  const cmp = prevMonthCompare(state.records, CURRENT_MONTH);
  const assets = totalAssets(state.accounts);
  const today = todayRecords(state.records);
  const cats = categoryTotals(state.records, state.categories, CURRENT_MONTH, 'expense');
  const trend = monthlyTrend(state.records, 6);
  const alerts = buildAlerts(state);
  const balance = Math.max(0, sum.income - sum.expense);
  const delta = changePct(cmp.curExpense, cmp.prevExpense);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* 本月财务总览 */}
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="size-4" />
                本月财务总览 · {CURRENT_MONTH}
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums md:text-4xl">¥{fmtMoney(assets)}</p>
              <p className="mt-1 text-xs text-muted-foreground">总资产（各账户余额之和）</p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">本月收入</p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-semibold tabular-nums text-emerald-600">
                    <ArrowUpRight className="size-4" />
                    ¥{fmtMoney(sum.income)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">本月支出</p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-semibold tabular-nums text-red-600">
                    <ArrowDownLeft className="size-4" />
                    ¥{fmtMoney(sum.expense)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">本月结余</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">¥{fmtMoney(sum.income - sum.expense)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">储蓄率</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{fmtPct(sum.savingsRate)}</p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-[220px]">
              <DonutChart
                height={190}
                centerText={fmtPct(sum.savingsRate)}
                centerSub="储蓄率"
                data={[
                  { name: '结余', value: balance },
                  { name: '已支出', value: sum.expense },
                ]}
                colors={['#0E7C5B', '#E8EEE9']}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 今日 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              今日 · {shortDate(TODAY)} {weekdayLabel(TODAY)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {today.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">今天还没有记账，去记一笔吧</p>}
            {today.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                <CategoryIcon icon={catMeta(state.categories, r.categoryId).icon} className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.note || r.merchant || catPathLabel(state.categories, r.categoryId)}</p>
                  <p className="text-xs text-muted-foreground">{catPathLabel(state.categories, r.categoryId)}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${r.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                  {r.type === 'income' ? '+' : '-'}¥{fmtMoney(r.amount)}
                </span>
              </div>
            ))}
            {today.length > 0 && (
              <Link to="/records" className="block pt-1 text-center text-xs text-primary hover:underline">
                查看全部明细
              </Link>
            )}
          </CardContent>
        </Card>

        {/* 本月支出分类 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">本月支出分类</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cats.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">本月暂无支出</p>}
            {cats.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <CategoryIcon icon={c.icon} className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{c.name}</span>
                    <span className="text-sm font-semibold tabular-nums">¥{fmtMoney(c.amount)}</span>
                  </div>
                  <Progress value={Math.min(100, c.pct)} className="mt-1 h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 智能提醒 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <PiggyBank className="size-4" />
              智能提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">暂无提醒</p>}
            {alerts.map((a, i) => (
              <div key={i} className="flex gap-2.5 rounded-lg border bg-card px-3 py-2">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${ALERT_DOT[a.level]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 近6月收支趋势 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-baseline justify-between text-sm">
            近 6 月收支趋势
            <span className="text-xs font-normal text-muted-foreground">
              本月支出 {fmtMoney(cmp.curExpense)} 元，比上月 {delta >= 0 ? '↑' : '↓'}
              {fmtPct(Math.abs(delta))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart labels={trend.map((t) => t.label)} income={trend.map((t) => t.income)} expense={trend.map((t) => t.expense)} />
        </CardContent>
      </Card>
    </div>
  );
}
