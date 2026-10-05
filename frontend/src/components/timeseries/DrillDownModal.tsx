import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, X } from 'lucide-react';
import { getItemsInPeriod, parseTimestamp } from '../../utils/timeSeriesUtils';
import type { TimeGroupBy } from '../../utils/timeSeriesUtils';
import type { BatchItem } from '../../contexts/AppContext';
import { ASPECT_COLORS, ASPECT_LABELS, GROUP_BY_UNIT } from './constants';
import type { DrillTarget } from './constants';
import type { AspectKey } from '../../utils/timeSeriesUtils';

const PAGE_SIZE = 20;

interface DrillDownModalProps {
  target: DrillTarget | null;
  items: BatchItem[];
  groupBy: TimeGroupBy;
  onClose: () => void;
}

const formatDateTime = (raw?: string) => {
  const d = parseTimestamp(raw);
  return d
    ? d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
};

const Stars = ({ value }: { value: number }) => (
  <span className="tracking-widest text-[10px]">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
        ★
      </span>
    ))}
  </span>
);

function ModalBody({ target, items, groupBy, onClose }: Omit<DrillDownModalProps, 'target'> & { target: DrillTarget }) {
  // Có thể bỏ lọc khía cạnh ngay trong modal
  const [aspectFilter, setAspectFilter] = useState<AspectKey | null>(target.aspect);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const periodItems = useMemo(() => getItemsInPeriod(items, target.periodStart, groupBy), [items, target, groupBy]);
  const filtered = useMemo(
    () => (aspectFilter ? periodItems.filter((it) => it.aspects.some((a) => a.aspect === aspectFilter)) : periodItems),
    [periodItems, aspectFilter],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-title"
        id="drilldown-modal"
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl dark:border-white/10 dark:bg-[#101b2d]"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
          <div>
            <h4 id="drilldown-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Review trong {GROUP_BY_UNIT[groupBy]} · {target.label}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} review{aspectFilter ? '' : ` (tổng ${periodItems.length})`}
            </p>
            {aspectFilter && (
              <button
                type="button"
                onClick={() => {
                  setAspectFilter(null);
                  setLimit(PAGE_SIZE);
                }}
                className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
                title="Bỏ lọc khía cạnh"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS[aspectFilter] }} />
                {ASPECT_LABELS[aspectFilter]}
                <X size={12} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-3 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400 dark:text-slate-500">
              <Inbox size={40} className="mb-3 opacity-60" />
              <p className="text-sm">Không có review nào trong mốc thời gian này.</p>
            </div>
          ) : (
            filtered.slice(0, limit).map((item, idx) => (
              <article
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/70"
              >
                {item.timestamp && (
                  <time className="mb-2 block text-xs font-medium text-slate-400 dark:text-slate-500">
                    {formatDateTime(item.timestamp)}
                  </time>
                )}
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">“{item.original_text}”</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.aspects.length > 0 ? (
                    item.aspects.map((a) => {
                      const key = a.aspect as AspectKey;
                      const isFocus = key === aspectFilter;
                      return (
                        <span
                          key={a.aspect}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${
                            isFocus
                              ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/15'
                              : 'border-slate-200 bg-white dark:border-white/5 dark:bg-slate-900/70'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS[key] }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{ASPECT_LABELS[key] ?? a.aspect}</span>
                          <Stars value={a.star} />
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500">Không phát hiện khía cạnh</span>
                  )}
                </div>
              </article>
            ))
          )}
          {filtered.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="w-full cursor-pointer rounded-lg border border-slate-200 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-50 dark:border-white/10 dark:text-indigo-400 dark:hover:bg-slate-800"
            >
              Xem thêm ({filtered.length - limit} review còn lại)
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Modal drill-down hiển thị review thô rơi đúng mốc thời gian (portal ra <body> để tránh bị cắt bởi transform/overflow). */
export default function DrillDownModal({ target, items, groupBy, onClose }: DrillDownModalProps) {
  return createPortal(
    <AnimatePresence>
      {target && (
        <ModalBody
          key={`${target.periodStart}-${target.aspect ?? 'all'}`}
          target={target}
          items={items}
          groupBy={groupBy}
          onClose={onClose}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}
