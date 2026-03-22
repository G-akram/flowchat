import React, { useState, useCallback } from 'react';
import { useTheme } from '@/hooks/use-theme';

function Icon({ d, className }: { d: string; className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICON_PATHS = {
  palette: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  x: 'M6 18L18 6M6 6l12 12',
  copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  check: 'M5 13l4 4L19 7',
  reset: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
} as const;

const DEFAULTS = {
  light: { primary: '262.1 83.3% 57.8%', background: '220 14.3% 95.9%' },
  dark: { primary: '263.4 70% 50.4%', background: '224 71.4% 4.1%' },
};

const RELATED_VARS: Record<string, string[]> = {
  '--primary': ['--ring'],
  '--background': ['--card', '--popover'],
};

function hslStringToHex(hslStr: string): string {
  const [h = 0, s = 0, l = 0] = hslStr
    .replace(/%/g, '')
    .trim()
    .split(/\s+/)
    .map(Number);
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHslString(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${(l * 100).toFixed(1)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

function getVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setVar(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value);
  const related = RELATED_VARS[name];
  if (related) {
    related.forEach((v) => document.documentElement.style.setProperty(v, value));
  }
}

function removeVar(name: string): void {
  document.documentElement.style.removeProperty(name);
  const related = RELATED_VARS[name];
  if (related) {
    related.forEach((v) => document.documentElement.style.removeProperty(v));
  }
}

function generateCssBlock(): string {
  const isDark = document.documentElement.classList.contains('dark');
  const selector = isDark ? '.dark' : ':root';
  const names = [
    'background', 'foreground', 'card', 'card-foreground', 'popover',
    'popover-foreground', 'primary', 'primary-foreground', 'secondary',
    'secondary-foreground', 'muted', 'muted-foreground', 'accent',
    'accent-foreground', 'destructive', 'destructive-foreground', 'border',
    'input', 'ring', 'sidebar', 'sidebar-foreground', 'sidebar-border',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-muted-foreground',
  ];
  const style = getComputedStyle(document.documentElement);
  const lines = names
    .map((n) => {
      const v = style.getPropertyValue(`--${n}`).trim();
      return v ? `    --${n}: ${v};` : null;
    })
    .filter(Boolean);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

interface ColorRowProps {
  label: string;
  cssVar: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorRow({ label, cssVar, value, onChange }: ColorRowProps): React.JSX.Element {
  const hex = hslStringToHex(value);

  return (
    <div className="flex items-center gap-3">
      <label className="group relative">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div
          className="h-9 w-9 rounded-lg border border-border shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: `hsl(${value})` }}
        />
      </label>
      <div className="flex-1">
        <p className="text-xs font-medium text-popover-foreground">{label}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{cssVar}</p>
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">
        {hex.toUpperCase()}
      </span>
    </div>
  );
}

export function ColorCustomizer(): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  const defaults = DEFAULTS[resolvedTheme];

  const [primary, setPrimary] = useState<string>(
    () => getVar('--primary') || defaults.primary
  );
  const [background, setBackground] = useState<string>(
    () => getVar('--background') || defaults.background
  );

  const handlePrimaryChange = useCallback((hex: string): void => {
    const hsl = hexToHslString(hex);
    setPrimary(hsl);
    setVar('--primary', hsl);
  }, []);

  const handleBackgroundChange = useCallback((hex: string): void => {
    const hsl = hexToHslString(hex);
    setBackground(hsl);
    setVar('--background', hsl);
  }, []);

  const handleReset = useCallback((): void => {
    removeVar('--primary');
    removeVar('--background');
    setPrimary(defaults.primary);
    setBackground(defaults.background);
  }, [defaults]);

  const handleCopy = useCallback(async (): Promise<void> => {
    await navigator.clipboard.writeText(generateCssBlock());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        title="Open color customizer"
      >
        <Icon d={ICON_PATHS.palette} className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-64 rounded-xl border border-border bg-popover p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-popover-foreground">Colors</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Icon d={ICON_PATHS.x} className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <ColorRow
          label="Primary"
          cssVar="--primary"
          value={primary}
          onChange={handlePrimaryChange}
        />
        <ColorRow
          label="Background"
          cssVar="--background"
          value={background}
          onChange={handleBackgroundChange}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Icon d={copied ? ICON_PATHS.check : ICON_PATHS.copy} className="h-3 w-3" />
          {copied ? 'Copied' : 'Copy CSS'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-popover-foreground transition-colors hover:bg-accent"
        >
          <Icon d={ICON_PATHS.reset} className="h-3 w-3" />
          Reset
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground/50">DEV only</p>
    </div>
  );
}
