import { ASPECT_LABELS } from './constants';
import type { AspectKey } from '../../utils/timeSeriesUtils';

interface TooltipEntry {
  name?: string | number;
  value?: number | string | null;
  color?: string;
  dataKey?: unknown;
  payload?: { totalReviews?: number };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
  /** Hậu tố giá trị, vd "★" hoặc " lượt". */
  suffix?: string;
  decimals?: number;
  hint?: string;
}

/** Tooltip chi tiết dùng chung cho Line / Bar / Area (hỗ trợ dark & light). */
export default function ChartTooltip({ active, payload, label, suffix = '', decimals = 0, hint }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== '')
    .map((entry) => {
      // Tên lấy từ dataKey (có thể là "aspectCounts.giai_tri") → nhãn tiếng Việt
      const rawKey = String(entry.dataKey ?? entry.name ?? '').split('.').pop() as AspectKey;
      return { ...entry, display: ASPECT_LABELS[rawKey] ?? String(entry.name ?? '') };
    });
  const total = payload[0]?.payload?.totalReviews;

  return (
    <div className="min-w-44 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{label ?? payload[0].name}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={String(row.dataKey ?? row.name)} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.display}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {typeof row.value === 'number' ? row.value.toFixed(decimals) : row.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
      {typeof total === 'number' && (
        <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          Tổng: <strong className="text-slate-700 dark:text-slate-200">{total}</strong> review
        </p>
      )}
      {hint && <p className="mt-1.5 text-[11px] italic text-indigo-500 dark:text-indigo-400">{hint}</p>}
    </div>
  );
}
