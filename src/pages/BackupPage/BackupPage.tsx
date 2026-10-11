import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, RefreshCcw, Trash2, DatabaseBackup, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppStore } from '@/lib/store-context';
import { TODAY } from '@/lib/time';
import { fmtMoney } from '@/lib/format';
import { totalAssets } from '@/lib/analysis';
import type { IAppState } from '@/lib/types';

export default function BackupPage() {
  const { state, importState, resetToDemo, clearAll } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `智能记账本备份-${TODAY}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('备份文件已导出');
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as IAppState;
        if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.records) || !Array.isArray(parsed.categories)) {
          toast.error('文件格式不正确，请选择本应用导出的备份文件');
          return;
        }
        importState({ ...state, ...parsed });
        toast.success('导入成功');
      } catch {
        toast.error('无法解析该文件，请选择本应用导出的备份文件');
      }
    };
    reader.readAsText(file);
  };

  const expenseCount = state.records.filter((r) => r.type === 'expense').length;
  const incomeSum = state.records.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <DatabaseBackup className="size-4" />
            数据概览
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">账单笔数</p>
            <p className="text-xl font-bold tabular-nums">{state.records.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">其中支出</p>
            <p className="text-xl font-bold tabular-nums">{expenseCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">累计收入</p>
            <p className="text-xl font-bold tabular-nums">¥{fmtMoney(incomeSum)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">总资产</p>
            <p className="text-xl font-bold tabular-nums">¥{fmtMoney(totalAssets(state.accounts))}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <HardDrive className="size-4" />
            备份与恢复
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData}>
              <Download className="size-4" />
              导出备份（JSON）
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              导入备份
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            所有数据保存在当前浏览器（localStorage），换设备、换浏览器或清除浏览器数据前请先导出备份。
            导出文件可在任何设备上通过「导入备份」恢复。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">重置数据</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirmDemo(true)}>
            <RefreshCcw className="size-4" />
            恢复示例数据
          </Button>
          <Button variant="destructive" onClick={() => setConfirmClear(true)}>
            <Trash2 className="size-4" />
            清空记账数据
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDemo}
        onOpenChange={setConfirmDemo}
        title="恢复示例数据？"
        description="当前所有记账、预算、订阅和规则将被示例数据覆盖，建议先导出备份"
        confirmText="恢复示例"
        onConfirm={() => {
          resetToDemo();
          toast.success('已恢复示例数据');
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="清空全部记账数据？"
        description="将删除全部收支记录、预算、订阅和规则（账户与分类保留），操作不可撤销"
        confirmText="清空"
        onConfirm={() => {
          clearAll();
          toast.success('已清空');
        }}
      />
    </div>
  );
}
