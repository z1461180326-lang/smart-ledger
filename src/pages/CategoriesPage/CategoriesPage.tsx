import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CategoryIcon from '@/components/CategoryIcon';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppStore } from '@/lib/store-context';
import { newCategoryId } from '@/lib/store-context';
import { CATEGORY_ICONS } from '@/lib/icons';
import type { ICategory, TRecordType } from '@/lib/types';

const ICON_KEYS = Object.keys(CATEGORY_ICONS);

export default function CategoriesPage() {
  const { state, saveCategory, deleteCategory } = useAppStore();
  const [tab, setTab] = useState<TRecordType>('expense');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ICategory | null>(null);
  const [deleting, setDeleting] = useState<ICategory | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('utensils');
  const [parent, setParent] = useState<string>('__none');
  const [necessary, setNecessary] = useState(true);
  const [optimizable, setOptimizable] = useState(false);

  const parents = state.categories.filter((c) => c.type === tab && c.parentId === null);

  const openAdd = (presetParent?: string) => {
    setEditing(null);
    setName('');
    setIcon('package');
    setParent(presetParent ?? '__none');
    setNecessary(tab === 'expense');
    setOptimizable(false);
    setOpen(true);
  };

  const openEdit = (c: ICategory) => {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon);
    setParent(c.parentId ?? '__none');
    setNecessary(c.necessary);
    setOptimizable(c.optimizable);
    setOpen(true);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error('请填写分类名称');
      return;
    }
    const next: ICategory = {
      id: editing?.id ?? newCategoryId(),
      name: name.trim(),
      icon,
      type: tab,
      parentId: parent === '__none' ? null : parent,
      necessary,
      optimizable,
    };
    saveCategory(next);
    toast.success(editing ? '已更新' : '已添加');
    setOpen(false);
  };

  const countOf = (id: string) => state.records.filter((r) => r.categoryId === id).length;
  const parentCount = (id: string) => {
    const children = state.categories.filter((c) => c.parentId === id);
    return children.reduce((s, c) => s + countOf(c.id), 0);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TRecordType)}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="expense">支出分类</TabsTrigger>
            <TabsTrigger value="income">收入分类</TabsTrigger>
          </TabsList>
          <Button onClick={() => openAdd()}>
            <Plus className="size-4" />
            新增{tab === 'expense' ? '支出' : '收入'}分类
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {parents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无分类，点击右上角新增</p>
          )}
          {parents.map((p) => {
            const children = state.categories.filter((c) => c.parentId === p.id);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <CategoryIcon icon={p.icon} className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.necessary && tab === 'expense' && <Badge variant="secondary">必要</Badge>}
                        {p.optimizable && <Badge variant="outline" className="text-amber-700">可优化</Badge>}
                        <span className="text-xs text-muted-foreground">{parentCount(p.id)} 笔</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleting(p)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {children.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {children.map((c) => (
                        <div key={c.id} className="group flex items-center gap-1.5 rounded-full border px-3 py-1">
                          <CategoryIcon icon={c.icon} className="size-3.5 text-muted-foreground" />
                          <span className="text-xs">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{countOf(c.id)}</span>
                          <button
                            type="button"
                            className="ml-0.5 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => setDeleting(c)}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => openAdd(p.id)}
                      >
                        <Plus className="size-3" />
                        加子分类
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>分类名称</Label>
              <Input placeholder="如：咖啡奶茶" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>图标</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {ICON_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon icon={k} className="size-3.5" />
                        {k}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>所属一级分类</Label>
              <Select value={parent} onValueChange={setParent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">作为一级分类</SelectItem>
                  {parents.filter((x) => x.id !== editing?.id).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tab === 'expense' && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm">必要支出</p>
                  <p className="text-xs text-muted-foreground">非必要消费统计会排除必要支出</p>
                </div>
                <Switch checked={necessary} onCheckedChange={setNecessary} />
              </div>
            )}
            {tab === 'expense' && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm">可优化支出</p>
                  <p className="text-xs text-muted-foreground">计入智能分析中的“可优化支出”</p>
                </div>
                <Switch checked={optimizable} onCheckedChange={setOptimizable} />
              </div>
            )}
            <Button className="w-full" onClick={submit}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="删除这个分类？"
        description={deleting ? `删除「${deleting.name}」后，历史账单会显示为“未分类”` : ''}
        onConfirm={() => {
          if (deleting) {
            deleteCategory(deleting.id);
            toast.success('已删除');
          }
        }}
      />
    </div>
  );
}
