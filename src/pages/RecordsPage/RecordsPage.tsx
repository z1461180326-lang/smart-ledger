import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, SearchX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CategoryIcon from '@/components/CategoryIcon';
import ConfirmDialog from '@/components/ConfirmDialog';
import RecordForm from '@/components/RecordForm';
import { useAppStore } from '@/lib/store-context';
import { CURRENT_MONTH, monthOf } from '@/lib/time';
import { fmtMoney } from '@/lib/format';
import { catPathLabel, catMeta, parentOf } from '@/lib/analysis';
import type { IRecord, NewRecord } from '@/lib/types';

type TFilter = 'all' | 'income' | 'expense';

export default function RecordsPage() {
  const { state, saveRecord, deleteRecord } = useAppStore();
  const [month, setMonth] = useState<string>(CURRENT_MONTH);
  const [typeFilter, setTypeFilter] = useState<TFilter>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [accFilter, setAccFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<IRecord | null>(null);
  const [deleting, setDeleting] = useState<IRecord | null>(null);

  const months = useMemo(
    () => [...new Set(state.records.map((r) => monthOf(r.date)))].sort((a, b) => (a < b ? 1 : -1)),
    [state.records],
  );

  const filtered = useMemo(() => {
    return state.records
      .filter((r) => (month === 'all' ? true : monthOf(r.date) === month))
      .filter((r) => (typeFilter === 'all' ? true : r.type === typeFilter))
      .filter((r) => (catFilter === 'all' ? true : parentOf(state.categories, r.categoryId).id === catFilter))
      .filter((r) => (accFilter === 'all' ? true : r.accountId === accFilter))
      .filter((r) => {
        if (!keyword.trim()) return true;
        const cat = catPathLabel(state.categories, r.categoryId);
        return `${r.merchant}${r.note}${cat}`.toLowerCase().includes(keyword.trim().toLowerCase());
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
  }, [state.records, state.categories, month, typeFilter, catFilter, accFilter, keyword]);

  const income = filtered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const expense = filtered.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  const expenseParents = state.categories.filter((c) => c.type === 'expense' && c.parentId === null);
  const incomeParents = state.categories.filter((c) => c.type === 'income' && c.parentId === null);
  const catOptions = typeFilter === 'income' ? incomeParents : typeFilter === 'expense' ? expenseParents : [...expenseParents, ...incomeParents];

  const submitEdit = (v: NewRecord) => {
    if (!editing) return;
    saveRecord(v, editing.id);
    setEditing(null);
    toast.success('已更新');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">收支明细</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="tabular-nums">
                收入 <span className="font-semibold text-emerald-600">¥{fmtMoney(income)}</span>
              </span>
              <span className="tabular-nums">
                支出 <span className="font-semibold text-red-600">¥{fmtMoney(expense)}</span>
              </span>
              <span className="tabular-nums">
                结余 <span className="font-semibold">¥{fmtMoney(income - expense)}</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部月份</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TFilter)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">收入</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {catOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accFilter} onValueChange={setAccFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部账户</SelectItem>
                {state.accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="w-48"
              placeholder="搜索商户 / 备注 / 分类"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <SearchX className="size-6" />
              <p className="text-sm">没有符合条件的账单</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">日期</TableHead>
                    <TableHead className="whitespace-nowrap">类型</TableHead>
                    <TableHead className="whitespace-nowrap">分类</TableHead>
                    <TableHead className="whitespace-nowrap">商户 / 备注</TableHead>
                    <TableHead className="whitespace-nowrap">账户</TableHead>
                    <TableHead className="whitespace-nowrap text-right">金额</TableHead>
                    <TableHead className="whitespace-nowrap text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'income' ? 'secondary' : 'outline'} className={r.type === 'income' ? 'text-emerald-700' : ''}>
                          {r.type === 'income' ? '收入' : '支出'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <CategoryIcon icon={catMeta(state.categories, r.categoryId).icon} className="size-3.5 text-muted-foreground" />
                          {catPathLabel(state.categories, r.categoryId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[200px] truncate">
                          {r.merchant || r.note || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {state.accounts.find((a) => a.id === r.accountId)?.name ?? '—'}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap text-right font-semibold tabular-nums ${r.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                        {r.type === 'income' ? '+' : '-'}¥{fmtMoney(r.amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(r)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleting(r)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑账单</DialogTitle>
          </DialogHeader>
          {editing && (
            <RecordForm defaultValues={editing} submitText="保存修改" onSubmit={submitEdit} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="删除这笔账单？"
        description={deleting ? `${deleting.date} ${catPathLabel(state.categories, deleting.categoryId)} ${fmtMoney(deleting.amount)} 元，删除后不可恢复` : ''}
        onConfirm={() => {
          if (deleting) {
            deleteRecord(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
