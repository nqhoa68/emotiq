import { useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ASPECTS_LIST } from '../../utils/timeSeriesUtils';
import type { AspectKey, TimeSeriesPoint } from '../../utils/timeSeriesUtils';
import ChartCard from './ChartCard';
import { ANOMALY_THRESHOLD, ASPECT_LABELS, CRITICAL_THRESHOLD, getChartTheme } from './constants';
import type { DrillTarget } from './constants';

export interface Anomaly {
  point: TimeSeriesPoint;
  minScore: number;
  /** Các khía cạnh dưới ngưỡng, điểm thấp nhất đứng đầu. */
  aspects: { aspect: AspectKey; score: number }[];
}

/** Tìm các mốc thời gian có điểm trung bình của bất kỳ khía cạnh nào < ngưỡng cảnh báo. */
export function detectAnomalies(data: TimeSeriesPoint[]): Anomaly[] {
  const result: Anomaly[] = [];
  for (const point of data) {
    const low = ASPECTS_LIST.flatMap((aspect) => {
      const score = point[aspect];
      return score !== null && score < ANOMALY_THRESHOLD ? [{ aspect, score }] : [];
    }).sort((a, b) => a.score - b.score);
    if (low.length > 0) result.push({ point, minScore: low[0].score, aspects: low });
  }
  return result;
}

const severityOf = (score: number) => (score < CRITICAL_THRESHOLD ? 'critical' : 'warning');

const INITIAL_VISIBLE = 6;

interface AnomalyPanelProps {
  data: TimeSeriesPoint[];
  anomalies: Anomaly[];
  isDark: boolean;
  onDrill: (target: DrillTarget) => void;
}

export default function AnomalyPanel({ data, anomalies, isDark, onDrill }: AnomalyPanelProps) {
  const theme = getChartTheme(isDark);
  const [showAll, setShowAll] = useState(false);

  // Điểm thấp nhất trong 6 khía cạnh tại mỗi mốc → vùng Area
  const chartData = useMemo(
    () =>
      data.map((point) => {
        const scores = ASPECTS_LIST.map((a) => point[a]).filter((v): v is number => v !== null);
        return { date: point.date, periodStart: point.periodStart, min: scores.length ? Math.min(...scores) : null };
      }),
    [data],
  );

  const sorted = useMemo(() => [...anomalies].sort((a, b) => a.minScore - b.minScore), [anomalies]);
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);

  const drill = (anomaly: Anomaly, aspect: AspectKey | null) =>
    onDrill({ periodStart: anomaly.point.periodStart, label: anomaly.point.date, aspect });

  return (
    <ChartCard
      id="chart-anomalies"
      title="Cảnh báo bất thường"
      subtitle={`Các mốc thời gian có điểm trung bình của bất kỳ khía cạnh nào < ${ANOMALY_THRESHOLD}★`}
      action={
        anomalies.length > 0 ? (
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
            <AlertTriangle size={14} /> {anomalies.length} mốc cần chú ý
          </span>
        ) : null
      }
    >
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
            onClick={(state) => {
              const idx = Number(state?.activeTooltipIndex);
              const found = sorted.find((a) => a.point.periodStart === chartData[idx]?.periodStart);
              if (found) drill(found, null);
            }}
          >
            <defs>
              <linearGradient id="anomalyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: theme.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}★`}
            />
            <ReferenceLine
              y={ANOMALY_THRESHOLD}
              stroke="#ef4444"
              strokeDasharray="5 4"
              label={{ value: `Ngưỡng ${ANOMALY_THRESHOLD}★`, position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: theme.cursor, strokeDasharray: '4 4' }}
              formatter={(value) => [`${Number(value).toFixed(2)}★`, 'Điểm thấp nhất']}
              contentStyle={{
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: 12,
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#anomalyFill)"
              connectNulls
              animationDuration={600}
              dot={(props: { cx?: number; cy?: number; payload?: { min: number | null }; index?: number }) => {
                const { cx, cy, payload, index } = props;
                const isAnomaly = payload?.min !== null && payload?.min !== undefined && payload.min < ANOMALY_THRESHOLD;
                if (!isAnomaly || cx === undefined || cy === undefined) return <g key={`dot-${index}`} />;
                const critical = payload!.min! < CRITICAL_THRESHOLD;
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={critical ? '#ef4444' : '#f97316'}
                    stroke={isDark ? '#101b2d' : '#ffffff'}
                    strokeWidth={2}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {anomalies.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <ShieldCheck size={20} className="shrink-0" />
          Không có mốc thời gian nào rớt xuống dưới {ANOMALY_THRESHOLD}★. Mọi khía cạnh đều ổn định.
        </div>
      ) : (
        <>
          <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((anomaly) => {
              const critical = severityOf(anomaly.minScore) === 'critical';
              return (
                <li
                  key={anomaly.point.periodStart}
                  className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
                    critical
                      ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => drill(anomaly, null)}
                    className="flex w-full cursor-pointer items-start justify-between gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded-md"
                  >
                    <span>
                      <span
                        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
                          critical ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        <AlertTriangle size={13} /> {critical ? 'Nghiêm trọng' : 'Cảnh báo'}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {anomaly.point.date}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{anomaly.point.totalReviews} review</span>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {anomaly.aspects.map(({ aspect, score }) => (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => drill(anomaly, aspect)}
                        title={`Xem review về ${ASPECT_LABELS[aspect]}`}
                        className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-white/25"
                      >
                        {ASPECT_LABELS[aspect]}{' '}
                        <strong className={score < CRITICAL_THRESHOLD ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}>
                          {score.toFixed(2)}★
                        </strong>
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {sorted.length > INITIAL_VISIBLE && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                {showAll ? 'Thu gọn' : `Xem tất cả ${sorted.length} cảnh báo`}
              </button>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}
