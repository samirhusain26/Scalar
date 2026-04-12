import { useMemo } from 'react';

const WORD = 'continuum';

export function ContinuumLogo() {
  // Pick a random split point (between index 1 and len-1) on every mount
  const dotIndex = useMemo(
    () => 1 + Math.floor(Math.random() * (WORD.length - 1)),
    [],
  );

  const before = WORD.slice(0, dotIndex);
  const after  = WORD.slice(dotIndex);

  return (
    <div className="flex flex-col items-center gap-1 select-none" aria-label="continuum">
      {/* Calibration label */}
      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-charcoal/25">
        daily · calibration
      </span>

      {/* Main wordmark */}
      <div className="font-mono text-[28px] font-bold tracking-[0.08em] text-charcoal leading-none flex items-baseline">
        <span>{before}</span>
        <span
          className="text-[#14B8A6]"
          style={{ fontSize: '0.9em', lineHeight: 1, margin: '0 0.01em' }}
        >
          .
        </span>
        <span>{after}</span>
      </div>

      {/* Thin rule underneath — like a chart axis */}
      <div className="flex items-center gap-2 w-full max-w-[220px]">
        <div className="flex-1 h-px bg-charcoal/12" />
        <span className="font-mono text-[7px] text-charcoal/20 uppercase tracking-widest">
          rank · place · repeat
        </span>
        <div className="flex-1 h-px bg-charcoal/12" />
      </div>
    </div>
  );
}
