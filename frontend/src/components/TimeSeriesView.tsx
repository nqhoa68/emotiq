import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarRange, FileText, Layers, SearchX } from 'lucide-react';
import type { BatchItem } from '../contexts/AppContext';
import { useIsDark } from '../hooks/useIsDark';
import { transformToTimeSeriesData } from '../utils/timeSeriesUtils';
import type { TimeGroupBy } from '../utils/timeSeriesUtils';
import AnomalyPanel, { detectAnomalies } from './timeseries/AnomalyPanel';
import DrillDownModal from './timeseries/DrillDownModal';
import GroupBySelect from './timeseries/GroupBySelect';
import ReviewVolumeChart from './timeseries/ReviewVolumeChart';
import SentimentTrendChart from './timeseries/SentimentTrendChart';
import TimeSeriesSkeleton from './timeseries/TimeSeriesSkeleton';
import { GROUP_BY_UNIT } from './timeseries/constants';
import type { DrillTarget } from './timeseries/constants';

interface TimeSeriesViewProps {
  /** Kết quả phân tích thô từ backend (mỗi item có thể kèm `timestamp`). */
  items: BatchItem[];
}

/** Thời gian skeleton hiển thị khi mount / đổi chế độ nhóm, để chuyển cảnh mượt thay vì "giật". */
const SKELETON_MS = 350;

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Layers; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-none dark:bg-[#101b2d] dark:shadow-none">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function TimeSeriesView({ items }: TimeSeriesViewProps) {
  const isDark = useIsDark();
  const [groupBy, setGroupBy] = useState<TimeGroupBy>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [drill, setDrill] = useState<DrillTarget | null>(null);

  // Tắt skeleton sau một nhịp ngắn mỗi khi mount hoặc đổi groupBy (setState nằm trong callback của timer)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), SKELETON_MS);
    return () => clearTimeout(timer);
  }, [groupBy]);

  const handleGroupByChange = (value: TimeGroupBy) => {
    if (value === groupBy) return;
    setDrill(null);
    setIsLoading(true);
    setGroupBy(value);
  };

  const data = useMemo(() => transformToTimeSeriesData(items, groupBy), [items, groupBy]);
  const anomalies = useMemo(() => detectAnomalies(data), [data]);
  const totalReviews = useMemo(() => data.reduce((sum, p) => sum + p.totalReviews, 0), [data]);
  const range = data.length > 0 ? `${data[0].date.split(' - ')[0]} → ${data[data.length - 1].date.split(' - ').pop()}` : '—';

  return (
    <div id="time-series-view" className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Xu hướng theo thời gian</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi biến động cảm xúc 6 khía cạnh theo {GROUP_BY_UNIT[groupBy]}
          </p>
        </div>
        <GroupBySelect value={groupBy} onChange={handleGroupByChange} />
      </div>

      {isLoading ? (
        <TimeSeriesSkeleton />
      ) : data.length === 0 ? (
        <div
          id="time-series-empty"
          className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#101b2d]"
        >
          <SearchX size={44} className="mb-4 text-slate-400 dark:text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Không có dữ liệu để hiển thị</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Không tìm thấy review nào có timestamp hợp lệ. Hãy kiểm tra cột <code>timestamp</code> trong file CSV
            (định dạng gợi ý: <code>YYYY-MM-DD HH:mm:ss</code>).
          </p>
        </div>
      ) : (
        <motion.div
          key={groupBy}
          className="flex flex-col space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={FileText}
              label="Review có timestamp"
              value={totalReviews.toLocaleString('vi-VN')}
              tone="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            />
            <StatCard
              icon={CalendarRange}
              label={`${data.length} ${GROUP_BY_UNIT[groupBy]} · khoảng thời gian`}
              value={range}
              tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="Mốc cảnh báo (< 2.5★)"
              value={String(anomalies.length)}
              tone={
                anomalies.length > 0
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              }
            />
          </div>

          <SentimentTrendChart data={data} isDark={isDark} onDrill={setDrill} />
          <ReviewVolumeChart data={data} isDark={isDark} onDrill={setDrill} />
          <AnomalyPanel data={data} anomalies={anomalies} isDark={isDark} onDrill={setDrill} />
        </motion.div>
      )}

      <DrillDownModal target={drill} items={items} groupBy={groupBy} onClose={() => setDrill(null)} />
    </div>
  );
}
