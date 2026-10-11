import { useState } from 'react';
import { toast } from 'sonner';
import { Wand2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RecordForm from '@/components/RecordForm';
import { parseEntries, PARSE_EXAMPLES, type ParsedEntry } from '@/lib/nlp';
import { useAppStore } from '@/lib/store-context';
import { catPathLabel } from '@/lib/analysis';
import { shortDate } from '@/lib/time';
import { fmtMoney } from '@/lib/format';
import type { NewRecord } from '@/lib/types';

export default function EntryPage() {
  const { state, saveEntries, saveRecord } = useAppStore();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedEntry[] | null>(null);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [catOverrides, setCatOverrides] = useState<string[]>([]);
  const [accOverrides, setAccOverrides] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const runParse = () => {
    const res = parseEntries(text, state);
    setParsed(res.entries);
    setIncluded(res.entries.map(() => true));
    setCatOverrides(res.entries.map((e) => e.categoryId));
    setAccOverrides(res.entries.map((e) => e.accountId));
    setErrors(res.errors);
    if (res.entries.length === 0 && res.errors.length === 0) {
      toast.info('没有识别到可记账的内容');
    }
  };

  const toggle = (i: number, v: boolean | 'indeterminate') => {
    setIncluded((prev) => prev.map((x, idx) => (idx === i ? Boolean(v) : x)));
  };

  const saveParsed = () => {
    if (!parsed) return;
    const entries: NewRecord[] = parsed
      .map((e, i) => ({ e, i }))
      .filter(({ i }) => included[i])
      .map(({ e, i }) => ({
        type: e.type,
        amount: e.amount,
        date: e.date,
        categoryId: catOverrides[i] || e.categoryId,
        accountId: accOverrides[i] || e.accountId,
        merchant: e.merchant,
        note: e.note,
      }));
    if (entries.length === 0) {
      toast.error('请至少勾选一笔');
      return;
    }
    saveEntries(entries);
    toast.success(`已记 ${entries.length} 笔`);
    setParsed(null);
    setText('');
  };

  const catOptions = (type: string) =>
    state.categories
      .filter((c) => c.type === type)
      .map((c) => ({ id: c.id, label: catPathLabel(state.categories, c.id) }));

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        {/* 自然语言记账 */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">自然语言记账</CardTitle>
            <CardDescription>说人话就能记账，自动识别日期、金额、分类、支付方式，一句话可拆多笔</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={4}
              placeholder={'例如：今天早餐18，地铁6，中午35，晚上和朋友吃饭128，都是微信'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {PARSE_EXAMPLES.map((ex) => (
                <Badge
                  key={ex}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setText(ex);
                  }}
                >
                  {ex}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={runParse} className="flex-1">
                <Wand2 className="size-4" />
                智能识别
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}

            {parsed && parsed.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-medium">识别结果（{parsed.filter((_, i) => included[i]).length} 笔将被保存）</p>
                <div className="space-y-2">
                  {parsed.map((e, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-2.5 py-2">
                      <Checkbox checked={included[i]} onCheckedChange={(v) => toggle(i, v)} />
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">{shortDate(e.date)}</span>
                      <Badge variant={e.type === 'income' ? 'secondary' : 'outline'} className={e.type === 'income' ? 'text-emerald-700' : ''}>
                        {e.type === 'income' ? '收入' : '支出'}
                      </Badge>
                      <Select
                        value={catOverrides[i] || e.categoryId}
                        onValueChange={(v) => setCatOverrides((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
                      >
                        <SelectTrigger className="h-8 w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {catOptions(e.type).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={accOverrides[i] || e.accountId}
                        onValueChange={(v) => setAccOverrides((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
                      >
                        <SelectTrigger className="h-8 w-28">
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
                      <span className={`ml-auto text-sm font-semibold tabular-nums ${e.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                        {e.type === 'income' ? '+' : '-'}¥{fmtMoney(e.amount)}
                      </span>
                      {(e.merchant || e.note) && (
                        <span className="w-full truncate pl-6 text-xs text-muted-foreground">
                          {e.merchant ? `${e.merchant} · ` : ''}
                          {e.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={saveParsed} className="w-full">
                  <CheckCircle2 className="size-4" />
                  保存这 {parsed.filter((_, i) => included[i]).length} 笔
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 手动记账 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">手动记账</CardTitle>
            <CardDescription>也可以逐笔填写</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordForm
              submitText="保存这笔"
              onSubmit={(v) => {
                saveRecord(v);
                toast.success('已保存');
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
