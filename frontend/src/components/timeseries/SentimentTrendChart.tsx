import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { ASPECTS_LIST } from '../../utils/timeSeriesUtils';
import type { AspectKey, TimeSeriesPoint } from '../../utils/timeSeriesUtils';
import AspectLegend from './AspectLegend';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { ANOMALY_THRESHOLD, ASPECT_COLORS, getChartTheme } from './constants';
import type { DrillTarget } from './constants';

interface SentimentTrendChartProps {
  data: TimeSeriesPoint[];
  isDark: boolean;
  onDrill: (target: DrillTarget) => void;
}

export default function SentimentTrendChart({ data, isDark, onDrill }: SentimentTrendChartProps) {
  const [hidden, setHidden] = useState<ReadonlySet<AspectKey>>(new Set());
  const theme = getChartTheme(isDark);

  const toggle = (aspect: AspectKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(aspect)) next.delete(aspect);
      else next.add(aspect);
      return next;
    });

  const drillByIndex = (index: number, aspect: AspectKey | null) => {
    const point = data[index];
    if (point) onDrill({ periodStart: point.periodStart, label: point.date, aspect });
  };

  // Click bất kỳ vị trí nào trên biểu đồ → drill-down cả mốc thời gian (tiện cho mobile)
  const handleChartClick = (state: MouseHandlerDataParam) => {
    if (state?.activeTooltipIndex === undefined || state.activeTooltipIndex === null) return;
    drillByIndex(Number(state.activeTooltipIndex), null);
  };

  const allHidden = hidden.size === ASPECTS_LIST.length;

  return (
    <ChartCard
      id="chart-sentiment-trend"
      title="Xu hướng cảm xúc"
      subtitle="Điểm sao trung bình (1–5★) của từng khía cạnh theo thời gian · Bấm vào điểm để xem review"
    >
      <div className="mb-4">
        <AspectLegend hidden={hidden} onToggle={toggle} onReset={() => setHidden(new Set())} />
      </div>
      <div className="h-80 w-full min-w-0 relative">
        {allHidden && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Tất cả khía cạnh đang bị ẩn
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: 'pointer' }}
          >
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
            <ReferenceLine y={ANOMALY_THRESHOLD} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Tooltip
              cursor={{ stroke: theme.cursor, strokeDasharray: '4 4' }}
              content={<ChartTooltip suffix="★" decimals={2} hint="Bấm để xem review gốc" />}
            />
            {ASPECTS_LIST.filter((aspect) => !hidden.has(aspect)).map((aspect) => (
              <Line
                key={aspect}
                type="monotone"
                dataKey={aspect}
                name={aspect}
                stroke={ASPECT_COLORS[aspect]}
                strokeWidth={2.5}
                connectNulls
                dot={{ r: 3, strokeWidth: 0, fill: ASPECT_COLORS[aspect] }}
                activeDot={(props: { cx?: number; cy?: number; index?: number }) => (
                  <circle
                    key={`${aspect}-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={7}
                    fill={ASPECT_COLORS[aspect]}
                    stroke={isDark ? '#101b2d' : '#ffffff'}
                    strokeWidth={2}
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation(); // tránh trigger drill-down cấp mốc thời gian
                      if (props.index !== undefined) drillByIndex(props.index, aspect);
                    }}
                  />
                )}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
