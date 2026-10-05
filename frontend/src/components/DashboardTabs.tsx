import { motion } from 'framer-motion';
import { ChartLine, LayoutDashboard, Lock } from 'lucide-react';

export type DashboardTabId = 'timeseries' | 'overview';

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
  /** Tab "Phân tích theo thời gian" chỉ khả dụng khi dữ liệu có cột timestamp. */
  timeSeriesEnabled: boolean;
}

const DISABLED_TOOLTIP = 'File CSV cần có cột timestamp để xem phân tích này';

export default function DashboardTabs({ activeTab, onChange, timeSeriesEnabled }: DashboardTabsProps) {
  const tabs: { id: DashboardTabId; label: string; icon: typeof ChartLine; enabled: boolean }[] = [
    { id: 'timeseries', label: 'Phân tích theo thời gian', icon: ChartLine, enabled: timeSeriesEnabled },
    { id: 'overview', label: 'Phân tích tổng quan', icon: LayoutDashboard, enabled: true },
  ];

  return (
    <div
      role="tablist"
      aria-label="Chế độ phân tích"
      className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 dark:bg-slate-800/60 dark:border-white/5 shadow-inner dark:shadow-none self-start"
    >
      {tabs.map(({ id, label, icon: Icon, enabled }) => {
        const isActive = activeTab === id && enabled;
        return (
          <div key={id} className="relative group" title={enabled ? undefined : DISABLED_TOOLTIP}>
            <button
              id={`dashboard-tab-${id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={!enabled}
              onClick={() => enabled && onChange(id)}
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                !enabled
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-70'
                  : isActive
                    ? 'text-white cursor-default'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="dashboard-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {enabled ? <Icon size={16} /> : <Lock size={14} />}
                {label}
              </span>
            </button>

            {!enabled && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700"
              >
                {DISABLED_TOOLTIP}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
