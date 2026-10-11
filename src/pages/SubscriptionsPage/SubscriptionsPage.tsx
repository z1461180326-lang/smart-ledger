import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { newSubscriptionId } from '@/lib/store-context';
import { fmtMoney } from '@/lib/format';
import { catMeta } from '@/lib/analysis';
import { NOW } from '@/lib/time';
import type { ISubscription, TFrequency } from '@/lib/types';

const DAY_MS = 86400000;
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - NOW.getTime()) / DAY_MS);

export default function SubscriptionsPage() {
  const { state, saveSubscription, deleteSubscription } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ISubscription | null>(null);
  const [deleting, setDeleting] = useState<ISubscription | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<TFrequency>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [note, setNote] = useState('');

  const expenseParents = state.categories.filter((c) => c.type === 'expense' && c.parentId === null);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setCategoryId(expenseParents[0]?.id ?? '');
    setAccountId(state.accounts[0]?.id ?? '');
    setNextDate('');
    setNote('');
    setOpen(true);
  };

  const openEdit = (s: ISubscription) => {
    setEditing(s);
    setName(s.name);
    setAmount(String(s.amount));
    setFrequency(s.frequency);
    setCategoryId(s.categoryId);
    setAccountId(s.accountId);
    setNextDate(s.nextDate);
    setNote(s.note);
    setOpen(true);
  };

  const submit = () => {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!name.trim() || !amt || amt <= 0 || !nextDate) {
      toast.error('请填写名称、金额和下次扣款日');
      return;
    }
    saveSubscription({
      id: editing?.id ?? newSubscriptionId(),
      name: name.trim(),
      amount: amt,
      frequency,
      categoryId: categoryId || expenseParents[0]?.id || '',
      accountId: accountId || state.accounts[0]?.id || '',
      nextDate,
      note: note.trim(),
    });
    toast.success(editing ? '已更新' : '已添加');
    setOpen(false);
  };

  const monthlyTotal = state.subscriptions.reduce((s, x) => s + (x.frequency === 'monthly' ? x.amount : x.amount / 12), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Repeat className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">每月固定支出合计（年付按 1/12 折算）</p>
              <p className="text-2xl font-bold tabular-nums">¥{fmtMoney(monthlyTotal)}</p>
            </div>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            新增订阅
          </Button>
        </CardContent>
      </Card>

      {state.subscriptions.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            还没有订阅或固定支出，点击右上角新增（视频会员、话费套餐、房租、保险等）
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {state.subscriptions.map((s) => {
          const cat = catMeta(state.categories, s.categoryId);
          const acc = state.accounts.find((a) => a.id === s.accountId);
          const days = daysUntil(s.nextDate);
          return (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <CategoryIcon icon={cat.icon} className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.name} · {acc?.name ?? '—'} · {s.frequency === 'monthly' ? '每月' : '每年'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(s)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-red-600" onClick={() => setDeleting(s)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-semibold tabular-nums">¥{fmtMoney(s.amount)}</p>
                  <Badge variant={days >= 0 && days <= 7 ? 'default' : 'secondary'}>
                    {days < 0 ? `已过 ${Math.abs(days)} 天` : `${days} 天后扣款`} · {s.nextDate}
                  </Badge>
                </div>
                {s.note && <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑订阅' : '新增订阅 / 固定支出'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>名称</Label>
              <Input placeholder="如：腾讯视频会员、房租" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>金额（元）</Label>
                <Input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>频率</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as TFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">每月</SelectItem>
                    <SelectItem value="yearly">每年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseParents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>扣款账户</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>下次扣款日</Label>
              <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input placeholder="如：连续包月" value={note} onChange={(e) => setNote(e.target.value)} />
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
        title="删除这个订阅？"
        description={deleting ? `将删除「${deleting.name}」，之后不再提醒` : ''}
        onConfirm={() => {
          if (deleting) {
            deleteSubscription(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
