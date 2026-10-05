import type { AspectKey, TimeGroupBy } from '../../utils/timeSeriesUtils';

export const ASPECT_LABELS: Record<AspectKey, string> = {
  giai_tri: 'Giải trí',
  luu_tru: 'Lưu trú',
  nha_hang: 'Nhà hàng',
  an_uong: 'Ăn uống',
  van_chuyen: 'Vận chuyển',
  mua_sam: 'Mua sắm',
};

/** Bảng màu tương phản tốt trên cả nền sáng & tối (không trùng sắc cam/đỏ dành cho cảnh báo). */
export const ASPECT_COLORS: Record<AspectKey, string> = {
  giai_tri: '#8b5cf6',
  luu_tru: '#06b6d4',
  nha_hang: '#eab308',
  an_uong: '#10b981',
  van_chuyen: '#3b82f6',
  mua_sam: '#ec4899',
};

/** Điểm trung bình của một khía cạnh rớt xuống dưới ngưỡng này sẽ bị cảnh báo. */
export const ANOMALY_THRESHOLD = 2.5;
/** Dưới ngưỡng này được coi là nghiêm trọng (đỏ), còn lại là cảnh báo (cam). */
export const CRITICAL_THRESHOLD = 2;

export const GROUP_BY_OPTIONS: { value: TimeGroupBy; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
];

export const GROUP_BY_UNIT: Record<TimeGroupBy, string> = {
  day: 'ngày',
  week: 'tuần',
  month: 'tháng',
};

export const getChartTheme = (isDark: boolean) => ({
  grid: isDark ? '#334155' : '#e2e8f0',
  tick: isDark ? '#94a3b8' : '#64748b',
  cursor: isDark ? '#475569' : '#cbd5e1',
});

/** Mốc thời gian được click để drill-down (kèm khía cạnh nếu click vào đúng một line/khối màu). */
export type DrillTarget = { periodStart: string; label: string; aspect: AspectKey | null };
