import { motion } from 'framer-motion';
import type { TimeGroupBy } from '../../utils/timeSeriesUtils';
import { GROUP_BY_OPTIONS } from './constants';

interface GroupBySelectProps {
  value: TimeGroupBy;
  onChange: (value: TimeGroupBy) => void;
}

/** Segmented control Ngày / Tuần / Tháng với indicator trượt (Framer Motion layoutId). */
export default function GroupBySelect({ value, onChange }: GroupBySelectProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Nhóm theo"
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800/60 dark:border-white/5"
    >
      <span className="hidden sm:inline px-2 text-xs font-medium text-slate-500 dark:text-slate-400">Nhóm theo</span>
      {GROUP_BY_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            id={`group-by-${option.value}`}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
              isActive
                ? 'text-indigo-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="group-by-indicator"
                className="absolute inset-0 rounded-lg bg-white shadow-sm border border-slate-200 dark:bg-indigo-500/30 dark:border-indigo-400/30"
                transition={{ type: 'spring', stiffness: 450, damping: 36 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
