import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({
  label,
  value,
  sub,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'income' | 'expense';
  icon?: LucideIcon;
}) {
  const color = tone === 'income' ? 'text-emerald-600' : tone === 'expense' ? 'text-red-600' : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        </div>
        <p className={`mt-2 text-xl font-bold tabular-nums md:text-2xl ${color}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
