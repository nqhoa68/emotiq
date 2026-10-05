import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ASPECTS_LIST } from '../../utils/timeSeriesUtils';
import type { AspectKey, TimeSeriesPoint } from '../../utils/timeSeriesUtils';
import AspectLegend from './AspectLegend';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { ASPECT_COLORS, getChartTheme } from './constants';
import type { DrillTarget } from './constants';

interface ReviewVolumeChartProps {
  data: TimeSeriesPoint[];
  isDark: boolean;
  onDrill: (target: DrillTarget) => void;
}

export default function ReviewVolumeChart({ data, isDark, onDrill }: ReviewVolumeChartProps) {
  const [hidden, setHidden] = useState<ReadonlySet<AspectKey>>(new Set());
  const theme = getChartTheme(isDark);

  const toggle = (aspect: AspectKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(aspect)) next.delete(aspect);
      else next.add(aspect);
      return next;
    });

  const drill = (index: number, aspect: AspectKey | null) => {
    const point = data[index];
    if (point) onDrill({ periodStart: point.periodStart, label: point.date, aspect });
  };

  const visible = ASPECTS_LIST.filter((aspect) => !hidden.has(aspect));

  return (
    <ChartCard
      id="chart-review-volume"
      title="Khối lượng đánh giá"
      subtitle="Số lượt đánh giá theo từng khía cạnh trong mỗi mốc thời gian · Bấm vào khối màu để xem review"
    >
      <div className="mb-4">
        <AspectLegend hidden={hidden} onToggle={toggle} onReset={() => setHidden(new Set())} />
      </div>
      <div className="h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis tick={{ fill: theme.tick, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: theme.cursor, opacity: 0.25 }}
              content={<ChartTooltip suffix=" lượt" hint="Bấm vào khối màu để xem review" />}
            />
            {visible.map((aspect, i) => (
              <Bar
                key={aspect}
                dataKey={`aspectCounts.${aspect}`}
                name={aspect}
                stackId="volume"
                fill={ASPECT_COLORS[aspect]}
                radius={i === visible.length - 1 ? [4, 4, 0, 0] : 0}
                className="cursor-pointer"
                animationDuration={600}
                onClick={(_entry: unknown, index: number) => drill(index, aspect)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
