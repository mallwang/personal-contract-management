import { useState } from 'react';
import { Building2 } from 'lucide-react';

export function logoUrl(name: string, isAnonymized: boolean): string | null {
  if (isAnonymized || !name.trim()) return null;
  const token = import.meta.env['VITE_LOGO_DEV_TOKEN'] as string | undefined;
  return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${token ?? ''}`;
}

interface ProviderLogoProps {
  name: string;
  isAnonymized?: boolean;
  size?: number;
  className?: string;
}

export function ProviderLogo({
  name,
  isAnonymized = false,
  size = 24,
  className,
}: ProviderLogoProps) {
  const [failed, setFailed] = useState(false);

  const url = logoUrl(name, isAnonymized);

  const sizeStyle: React.CSSProperties = { width: `${size}px`, height: `${size}px` };

  if (!url || failed) {
    return (
      <span
        style={sizeStyle}
        className={`inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
      >
        <Building2 className="h-full w-full text-[--color-muted-foreground]" />
      </span>
    );
  }

  return (
    <span
      style={sizeStyle}
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
    >
      <img
        src={url}
        alt=""
        role="img"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
