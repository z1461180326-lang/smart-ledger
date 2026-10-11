import { Landmark, CreditCard, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/lib/store-context';
import { fmtMoney } from '@/lib/format';
import { ACCOUNT_ICONS } from '@/lib/icons';

const TYPE_LABEL: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行卡',
  credit: '信用卡',
  cash: '现金',
  other: '其他',
};

export default function BalanceSheetPage() {
  const { state } = useAppStore();
  const assetAccounts = state.accounts.filter((a) => a.type !== 'credit');
  const liabilityAccounts = state.accounts.filter((a) => a.type === 'credit' && a.balance < 0);
  const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(liabilityAccounts.reduce((s, a) => s + a.balance, 0));
  const net = totalAssets - totalLiabilities;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Landmark className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总资产</p>
              <p className="text-xl font-bold tabular-nums">¥{fmtMoney(totalAssets)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总负债（信用卡）</p>
              <p className="text-xl font-bold tabular-nums">¥{fmtMoney(totalLiabilities)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">净资产</p>
              <p className="text-xl font-bold tabular-nums">¥{fmtMoney(net)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">资产明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">账户</TableHead>
                  <TableHead className="whitespace-nowrap">类型</TableHead>
                  <TableHead className="whitespace-nowrap text-right">余额（元）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetAccounts.map((a) => {
                  const Icon = ACCOUNT_ICONS[a.type];
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          {a.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{TYPE_LABEL[a.type]}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">¥{fmtMoney(a.balance)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-medium">小计</TableCell>
                  <TableCell />
                  <TableCell className="whitespace-nowrap text-right font-bold tabular-nums">¥{fmtMoney(totalAssets)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {liabilityAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">负债明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">账户</TableHead>
                    <TableHead className="whitespace-nowrap text-right">欠款（元）</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liabilityAccounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-red-600">¥{fmtMoney(Math.abs(a.balance))}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">小计</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-bold tabular-nums text-red-600">¥{fmtMoney(totalLiabilities)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        口径说明：总资产 = 现金类账户（微信 / 支付宝 / 银行卡 / 现金 / 其他）余额之和；总负债 = 信用卡欠款之和；净资产 = 总资产 − 总负债。
        余额请在「账户管理」中维护，本表不会自动同步银行流水。
      </p>
    </div>
  );
}
