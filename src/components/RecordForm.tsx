import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TODAY } from '@/lib/time';
import { useAppStore } from '@/lib/store-context';
import type { NewRecord, TRecordType } from '@/lib/types';

export default function RecordForm({
  defaultValues,
  submitText = '保存',
  onSubmit,
}: {
  defaultValues?: NewRecord;
  submitText?: string;
  onSubmit: (v: NewRecord) => void;
}) {
  const { state } = useAppStore();
  const [type, setType] = useState<TRecordType>(defaultValues?.type ?? 'expense');
  const [amount, setAmount] = useState(defaultValues ? String(defaultValues.amount) : '');
  const [date, setDate] = useState(defaultValues?.date ?? TODAY);
  const [accountId, setAccountId] = useState(defaultValues?.accountId ?? state.accounts[0]?.id ?? '');
  const [merchant, setMerchant] = useState(defaultValues?.merchant ?? '');
  const [note, setNote] = useState(defaultValues?.note ?? '');

  const defCat = state.categories.find((c) => c.id === defaultValues?.categoryId);
  const defParentId = defCat ? (defCat.parentId ?? defCat.id) : '';
  const [parentId, setParentId] = useState<string>(defParentId);
  const [childId, setChildId] = useState<string>(defCat && defCat.parentId ? defCat.id : '');

  const parents = state.categories.filter((c) => c.type === type && c.parentId === null);
  const children = state.categories.filter((c) => c.type === type && c.parentId === (parentId || parents[0]?.id));

  const switchType = (v: string) => {
    const t = v as TRecordType;
    setType(t);
    setParentId('');
    setChildId('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(amount) * 100) / 100;
    const catId = childId || parentId || parents[0]?.id || '';
    if (!amt || amt <= 0) return;
    if (!catId) return;
    onSubmit({
      type,
      amount: amt,
      date,
      accountId: accountId || state.accounts[0]?.id || '',
      categoryId: catId,
      merchant: merchant.trim(),
      note: note.trim(),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === 'expense' ? 'default' : 'outline'}
          onClick={() => switchType('expense')}
        >
          支出
        </Button>
        <Button
          type="button"
          variant={type === 'income' ? 'default' : 'outline'}
          onClick={() => switchType('income')}
        >
          收入
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>金额（元）</Label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>日期</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>一级分类</Label>
        <Select value={parentId} onValueChange={(v) => { setParentId(v); setChildId(''); }}>
          <SelectTrigger>
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {parents.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {children.length > 0 && (
        <div className="space-y-1.5">
          <Label>二级分类</Label>
          <Select value={childId} onValueChange={setChildId}>
            <SelectTrigger>
              <SelectValue placeholder="不细分" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">不细分</SelectItem>
              {children.map((c2) => (
                <SelectItem key={c2.id} value={c2.id}>
                  {c2.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>账户</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger>
            <SelectValue placeholder="选择账户" />
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>商户</Label>
          <Input placeholder="如：淘宝、瑞幸" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>备注</Label>
          <Input placeholder="如：和朋友吃火锅" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {submitText}
      </Button>
    </form>
  );
}
