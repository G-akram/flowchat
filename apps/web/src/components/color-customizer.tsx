import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';

const DEFAULTS = {
  light: { primary: { h: 262.1, s: 83.3, l: 57.8 }, background: { h: 220, s: 14.3, l: 95.9 } },
  dark: { primary: { h: 263.4, s: 70, l: 50.4 }, background: { h: 224, s: 71.4, l: 4.1 } },
};

interface HslValues {
  h: number;
  s: number;
  l: number;
}

function parseHsl(raw: string): HslValues {
  const parts = raw.trim().split(/\s+/).map(Number);
  return { h: parts[0] ?? 0, s: parts[1] ?? 0, l: parts[2] ?? 0 };
}

function formatHsl(values: HslValues): string {
  return `${values.h} ${values.s}% ${values.l}%`;
}

function hslToHex(hsl: HslValues): string {
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + hsl.h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): HslValues {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: +(l * 100).toFixed(1) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: +(h * 360).toFixed(1), s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
}

function getCurrentVariables(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const vars: Record<string, string> = {};
  const names = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
    'muted', 'muted-foreground', 'accent', 'accent-foreground',
    'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'sidebar', 'sidebar-foreground', 'sidebar-border', 'sidebar-accent',
    'sidebar-accent-foreground', 'sidebar-muted-foreground',
  ];
  for (const name of names) {
    vars[name] = style.getPropertyValue(`--${name}`).trim();
  }
  return vars;
}

function generateCssBlock(): string {
  const vars = getCurrentVariables();
  const isDark = document.documentElement.classList.contains('dark');
  const selector = isDark ? '.dark' : ':root';
  const lines = Object.entries(vars)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `    --${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

function HslInputRow({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="w-3 font-medium text-popover-foreground">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(0, v)));
        }}
        className="h-6 w-full rounded border border-border bg-background px-1.5 text-xs tabular-nums text-foreground outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

function ColorPickerButton({
  hsl,
  onChange,
}: {
  hsl: HslValues;
  onChange: (next: HslValues) => void;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="color"
        value={hslToHex(hsl)}
        onChange={(e) => onChange(hexToHsl(e.target.value))}
        className="sr-only"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Pick color"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
        </svg>
      </button>
    </>
  );
}

export function ColorCustomizer(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  const [position, setPosition] = useState({ x: 264, y: 12 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; didDrag: boolean } | null>(null);
  const DRAG_THRESHOLD = 4;

  const handlePointerDown = useCallback((e: React.PointerEvent): void => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y, didDrag: false };
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent): void => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.didDrag && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
    dragRef.current.didDrag = true;
    setPosition({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  }, []);

  const handlePointerUp = useCallback((): void => {
    const wasDrag = dragRef.current?.didDrag ?? false;
    dragRef.current = null;
    if (!isOpen && !wasDrag) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const defaults = DEFAULTS[resolvedTheme];

  const currentPrimaryRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim();
  const currentBgRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--background').trim();

  const [primary, setPrimary] = useState<HslValues>(
    currentPrimaryRaw ? parseHsl(currentPrimaryRaw) : defaults.primary
  );
  const [background, setBackground] = useState<HslValues>(
    currentBgRaw ? parseHsl(currentBgRaw) : defaults.background
  );

  const applyPrimary = useCallback((next: HslValues): void => {
    setPrimary(next);
    const value = formatHsl(next);
    document.documentElement.style.setProperty('--primary', value);
    document.documentElement.style.setProperty('--ring', value);
  }, []);

  const applyBackground = useCallback((next: HslValues): void => {
    setBackground(next);
    const value = formatHsl(next);
    document.documentElement.style.setProperty('--background', value);
    document.documentElement.style.setProperty('--card', value);
    document.documentElement.style.setProperty('--popover', value);
  }, []);

  const handleReset = useCallback((): void => {
    const vars = ['--primary', '--ring', '--background', '--card', '--popover'];
    vars.forEach((v) => document.documentElement.style.removeProperty(v));
    setPrimary(defaults.primary);
    setBackground(defaults.background);
  }, [defaults]);

  const handleCopy = useCallback(async (): Promise<void> => {
    const css = generateCssBlock();
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!isOpen) {
    return (
      <div
        style={{ left: position.x, top: position.y }}
        className="fixed z-[9999] flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:cursor-grabbing"
        title="Drag to move, click to open"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ left: position.x, top: position.y }}
      className="fixed z-[9999] w-72 rounded-lg border border-border bg-popover p-4 shadow-xl"
    >
      <div
        className="mb-3 flex cursor-grab items-center justify-between active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="text-sm font-semibold text-popover-foreground select-none">Theme Customizer</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-2">
        <div className="mb-1.5 flex items-center gap-2">
          <div
            className="h-6 w-6 shrink-0 rounded border border-border"
            style={{ backgroundColor: `hsl(${formatHsl(primary)})` }}
          />
          <span className="flex-1 text-xs font-medium text-popover-foreground">Primary</span>
          <ColorPickerButton hsl={primary} onChange={applyPrimary} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <HslInputRow label="H" value={primary.h} max={360} onChange={(h) => applyPrimary({ ...primary, h })} />
          <HslInputRow label="S" value={primary.s} max={100} onChange={(s) => applyPrimary({ ...primary, s })} />
          <HslInputRow label="L" value={primary.l} max={100} onChange={(l) => applyPrimary({ ...primary, l })} />
        </div>
      </div>

      <div className="mb-3 border-t border-border pt-2">
        <div className="mb-1.5 flex items-center gap-2">
          <div
            className="h-6 w-6 shrink-0 rounded border border-border"
            style={{ backgroundColor: `hsl(${formatHsl(background)})` }}
          />
          <span className="flex-1 text-xs font-medium text-popover-foreground">Background</span>
          <ColorPickerButton hsl={background} onChange={applyBackground} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <HslInputRow label="H" value={background.h} max={360} onChange={(h) => applyBackground({ ...background, h })} />
          <HslInputRow label="S" value={background.s} max={100} onChange={(s) => applyBackground({ ...background, s })} />
          <HslInputRow label="L" value={background.l} max={100} onChange={(l) => applyBackground({ ...background, l })} />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          {copied ? 'Copied!' : 'Copy CSS'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-popover-foreground transition-colors hover:bg-accent"
        >
          Reset
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">DEV only</p>
    </div>
  );
}
