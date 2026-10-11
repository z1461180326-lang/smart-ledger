import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CategoryIcon from '@/components/CategoryIcon';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppStore } from '@/lib/store-context';
import { newBudgetId } from '@/lib/store-context';
import { CURRENT_MONTH, monthLabel } from '@/lib/time';
import { fmtMoney, fmtPct } from '@/lib/format';
import { budgetStatus } from '@/lib/analysis';
import type { IBudget } from '@/lib/types';

export default function BudgetsPage() {
  const { state, saveBudget, deleteBudget } = useAppStore();
  const [month, setMonth] = useState<string>(CURRENT_MONTH);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IBudget | null>(null);
  const [deleting, setDeleting] = useState<IBudget | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const expenseParents = state.categories.filter((c) => c.type === 'expense' && c.parentId === null);
  const statuses = budgetStatus(state.records, state.budgets, state.categories, month);
  const totalBudget = statuses.reduce((s, b) => s + b.budget, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);

  const openAdd = () => {
    setEditing(null);
    const used = new Set(statuses.map((s) => s.categoryId));
    const first = expenseParents.find((c) => !used.has(c.id));
    setCategoryId(first?.id ?? expenseParents[0]?.id ?? '');
    setAmount('');
    setOpen(true);
  };

  const openEdit = (b: IBudget) => {
    setEditing(b);
    setCategoryId(b.categoryId);
    setAmount(String(b.amount));
    setOpen(true);
  };

  const submit = () => {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!categoryId || !amt || amt <= 0) {
      toast.error('请选择分类并填写预算金额');
      return;
    }
    saveBudget({ id: editing?.id ?? newBudgetId(), categoryId, month, amount: amt });
    toast.success(editing ? '已更新' : '已设置');
    setOpen(false);
  };

  const usedIds = new Set(statuses.map((s) => s.categoryId));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">月度预算汇总 · {monthLabel(month)}</p>
              <p className="text-2xl font-bold tabular-nums">
                ¥{fmtMoney(totalSpent)}
                <span className="text-base font-normal text-muted-foreground"> / ¥{fmtMoney(totalBudget)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="month" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)} />
            <Button onClick={openAdd}>
              <Plus className="size-4" />
              设置预算
            </Button>
          </div>
        </CardContent>
      </Card>

      {statuses.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {month} 还没有设置预算，点击右上角「设置预算」为分类设定月度上限
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {statuses.map((b) => (
          <Card key={b.categoryId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon icon={b.icon} className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{b.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(state.budgets.find((x) => x.categoryId === b.categoryId && x.month === month)!)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-red-600" onClick={() => setDeleting(state.budgets.find((x) => x.categoryId === b.categoryId && x.month === month)!)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-semibold tabular-nums">¥{fmtMoney(b.spent)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">/ ¥{fmtMoney(b.budget)} · {fmtPct(b.pct)}</span>
              </div>
              <Progress
                value={Math.min(100, b.pct)}
                className={`mt-2 h-2 ${b.overshoot > 0 ? 'bg-red-100 [&>div]:bg-red-500' : b.pct >= 70 ? '[&>div]:bg-amber-500' : ''}`}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>剩余 ¥{fmtMoney(b.remaining)}</span>
                <span>预计月底 ¥{fmtMoney(b.projected)}</span>
                {b.overshoot > 0 ? (
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50">预计超支 ¥{fmtMoney(b.overshoot)}</Badge>
                ) : (
                  <Badge variant="secondary">预算内</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑预算' : '设置月度预算'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>支出分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={!!editing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseParents
                    .filter((c) => editing || !usedIds.has(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>月度预算（元）</Label>
              <Input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="如：2000" />
            </div>
            <Button className="w-full" onClick={submit}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="删除这条预算？"
        description={deleting ? `删除「${state.categories.find((c) => c.id === deleting.categoryId)?.name}」在 ${deleting.month} 的预算` : ''}
        onConfirm={() => {
          if (deleting) {
            deleteBudget(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
