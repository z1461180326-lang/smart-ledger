import { CATEGORY_ICONS, ACCOUNT_ICONS } from '@/lib/icons';

export default function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? ACCOUNT_ICONS[icon] ?? CATEGORY_ICONS.package;
  return <Icon className={className ?? 'h-4 w-4'} />;
}
