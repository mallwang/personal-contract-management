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

  const sizeStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!url || failed) {
    return (
      <span style={sizeStyle} className={className}>
        <Building2 style={{ width: '100%', height: '100%' }} color="var(--mantine-color-dimmed)" />
      </span>
    );
  }

  return (
    <span style={sizeStyle} className={className}>
      <img
        src={url}
        alt=""
        role="img"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
}
