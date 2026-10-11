import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Wallet } from 'lucide-react';
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
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppStore } from '@/lib/store-context';
import { newAccountId } from '@/lib/store-context';
import { fmtMoney } from '@/lib/format';
import { totalAssets } from '@/lib/analysis';
import { ACCOUNT_ICONS } from '@/lib/icons';
import type { IAccount, TAccountType } from '@/lib/types';

const TYPE_LABEL: Record<TAccountType, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行卡',
  credit: '信用卡',
  cash: '现金',
  other: '其他',
};

const TYPE_OPTIONS: TAccountType[] = ['wechat', 'alipay', 'bank', 'credit', 'cash', 'other'];

export default function AccountsPage() {
  const { state, saveAccount, deleteAccount } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IAccount | null>(null);
  const [deleting, setDeleting] = useState<IAccount | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TAccountType>('wechat');
  const [balance, setBalance] = useState('');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('wechat');
    setBalance('');
    setOpen(true);
  };

  const openEdit = (a: IAccount) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setBalance(String(a.balance));
    setOpen(true);
  };

  const submit = () => {
    const bal = Math.round(Number(balance) * 100) / 100;
    if (!name.trim() || Number.isNaN(bal)) {
      toast.error('请填写账户名称和余额');
      return;
    }
    if (editing) {
      saveAccount({ ...editing, name: name.trim(), type, balance: bal });
      toast.success('已更新');
    } else {
      saveAccount({ id: newAccountId(), name: name.trim(), type, balance: bal });
      toast.success('已添加账户');
    }
    setOpen(false);
  };

  const assets = totalAssets(state.accounts);
  const liabilities = state.accounts.filter((a) => a.type === 'credit' && a.balance > 0).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总资产（各账户余额之和）</p>
              <p className="text-2xl font-bold tabular-nums">¥{fmtMoney(assets)}</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>账户 {state.accounts.length} 个</p>
            <p>其中信用卡负债 {fmtMoney(liabilities)} 元</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            添加账户
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.accounts.map((a) => {
          const Icon = ACCOUNT_ICONS[a.type];
          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <Badge variant="secondary" className="mt-0.5">
                        {TYPE_LABEL[a.type]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(a)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-red-600" onClick={() => setDeleting(a)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className={`mt-3 text-lg font-bold tabular-nums ${a.balance < 0 ? 'text-red-600' : ''}`}>
                  ¥{fmtMoney(a.balance)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑账户' : '添加账户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>账户名称</Label>
              <Input placeholder="如：微信、招商银行卡" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>账户类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as TAccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>余额（元，信用卡可填负数）</Label>
              <Input type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
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
        title="删除这个账户？"
        description={deleting ? `将删除账户「${deleting.name}」，历史账单仍保留但不再关联账户` : ''}
        confirmText="删除账户"
        onConfirm={() => {
          if (deleting) {
            deleteAccount(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
