import { Zap, Play, Shield, Home, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '@pcm/shared';

export const CATEGORY_ICON_MAP: Record<Category | 'DEFAULT', LucideIcon> = {
  UTILITIES: Zap,
  SUBSCRIPTIONS: Play,
  INSURANCE: Shield,
  HOUSING: Home,
  OTHER: FileText,
  DEFAULT: FileText,
};

interface CategoryIconProps {
  category: Category;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category] ?? CATEGORY_ICON_MAP.DEFAULT;
  return <Icon size={size} className={className} />;
}
