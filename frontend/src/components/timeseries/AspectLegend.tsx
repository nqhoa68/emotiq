import { ASPECTS_LIST } from '../../utils/timeSeriesUtils';
import type { AspectKey } from '../../utils/timeSeriesUtils';
import { ASPECT_COLORS, ASPECT_LABELS } from './constants';

interface AspectLegendProps {
  hidden: ReadonlySet<AspectKey>;
  onToggle: (aspect: AspectKey) => void;
  onReset: () => void;
}

/** Custom Legend: click để bật/tắt từng khía cạnh. */
export default function AspectLegend({ hidden, onToggle, onReset }: AspectLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Chú giải khía cạnh">
      {ASPECTS_LIST.map((aspect) => {
        const isHidden = hidden.has(aspect);
        return (
          <button
            key={aspect}
            type="button"
            aria-pressed={!isHidden}
            onClick={() => onToggle(aspect)}
            title={isHidden ? 'Bấm để hiện' : 'Bấm để ẩn'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
              isHidden
                ? 'bg-transparent border-slate-200 text-slate-400 dark:border-white/10 dark:text-slate-500 line-through'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300 dark:bg-slate-800/70 dark:border-white/10 dark:text-slate-200 dark:shadow-none dark:hover:border-white/20'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full transition-opacity"
              style={{ backgroundColor: ASPECT_COLORS[aspect], opacity: isHidden ? 0.3 : 1 }}
            />
            {ASPECT_LABELS[aspect]}
          </button>
        );
      })}
      {hidden.size > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="px-2 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
        >
          Hiện tất cả
        </button>
      )}
    </div>
  );
}
