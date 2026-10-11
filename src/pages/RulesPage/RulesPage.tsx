import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, SlidersHorizontal, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { newRuleId } from '@/lib/store-context';
import { catPathLabel } from '@/lib/analysis';
import type { IRule, TRecordType } from '@/lib/types';

export default function RulesPage() {
  const { state, saveRule, deleteRule, updateSettings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IRule | null>(null);
  const [deleting, setDeleting] = useState<IRule | null>(null);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<TRecordType>('expense');
  const [categoryId, setCategoryId] = useState('');

  const [bigThreshold, setBigThreshold] = useState(String(state.settings.bigAmountThreshold));
  const [riseThreshold, setRiseThreshold] = useState(String(state.settings.riseThresholdPct));
  const [impulseThreshold, setImpulseThreshold] = useState(String(state.settings.impulseThreshold));

  const catOptions = state.categories.filter((c) => c.type === type && c.parentId !== null);

  const openAdd = () => {
    setEditing(null);
    setKeyword('');
    setType('expense');
    setCategoryId(catOptions[0]?.id ?? '');
    setOpen(true);
  };

  const openEdit = (r: IRule) => {
    setEditing(r);
    setKeyword(r.keyword);
    setType(r.type);
    setCategoryId(r.categoryId);
    setOpen(true);
  };

  const submit = () => {
    if (!keyword.trim() || !categoryId) {
      toast.error('请填写关键词并选择分类');
      return;
    }
    saveRule({ id: editing?.id ?? newRuleId(), keyword: keyword.trim(), type, categoryId, enabled: editing?.enabled ?? true });
    toast.success(editing ? '已更新' : '已添加');
    setOpen(false);
  };

  const saveSettings = () => {
    const big = Math.round(Number(bigThreshold));
    const rise = Math.round(Number(riseThreshold));
    const imp = Math.round(Number(impulseThreshold));
    if (!big || big <= 0 || !rise || rise <= 0 || !imp || imp <= 0) {
      toast.error('阈值必须是大于 0 的数字');
      return;
    }
    updateSettings({ bigAmountThreshold: big, riseThresholdPct: rise, impulseThreshold: imp });
    toast.success('阈值已保存');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <SlidersHorizontal className="size-4" />
            识别阈值
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>大额消费阈值（元）</Label>
            <Input type="number" min={1} value={bigThreshold} onChange={(e) => setBigThreshold(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>消费上涨提醒（%）</Label>
            <Input type="number" min={1} value={riseThreshold} onChange={(e) => setRiseThreshold(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>冲动消费单笔阈值（元）</Label>
            <Input type="number" min={1} value={impulseThreshold} onChange={(e) => setImpulseThreshold(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={saveSettings} variant="outline" size="sm">
              <Save className="size-4" />
              保存阈值
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">自动分类规则</CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="size-4" />
              新增规则
            </Button>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            自然语言记账时，命中的关键词优先使用规则分类（优先于内置词典），可关闭或删除
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.rules.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">暂无规则</p>}
          {state.rules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
              <Badge variant="secondary">{r.keyword}</Badge>
              <Badge variant={r.type === 'income' ? 'secondary' : 'outline'} className={r.type === 'income' ? 'text-emerald-700' : ''}>
                {r.type === 'income' ? '收入' : '支出'}
              </Badge>
              <span className="flex items-center gap-1.5 text-sm">
                <CategoryIcon icon={state.categories.find((c) => c.id === r.categoryId)?.icon ?? 'package'} className="size-3.5 text-muted-foreground" />
                {catPathLabel(state.categories, r.categoryId)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) => saveRule({ ...r, enabled: v })}
                />
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(r)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-red-600" onClick={() => setDeleting(r)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑规则' : '新增规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>关键词</Label>
              <Input placeholder="如：火锅、淘宝、地铁" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as TRecordType);
                    setCategoryId(state.categories.filter((c) => c.type === v && c.parentId !== null)[0]?.id ?? '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {catPathLabel(state.categories, c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        title="删除这条规则？"
        description={deleting ? `删除关键词「${deleting.keyword}」的自动分类规则` : ''}
        onConfirm={() => {
          if (deleting) {
            deleteRule(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
