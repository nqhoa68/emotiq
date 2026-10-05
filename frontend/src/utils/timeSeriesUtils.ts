import type { BatchItem } from '../contexts/AppContext';

/** 6 khía cạnh được phân tích (thứ tự cố định, dùng làm dataKey cho Recharts). */
export const ASPECTS_LIST = ['giai_tri', 'luu_tru', 'nha_hang', 'an_uong', 'van_chuyen', 'mua_sam'] as const;

export type AspectKey = (typeof ASPECTS_LIST)[number];
export type TimeGroupBy = 'day' | 'week' | 'month';

/**
 * Một điểm dữ liệu trên trục thời gian, sẵn sàng cho Recharts.
 * Mỗi khía cạnh là một key phẳng (dataKey) chứa điểm sao trung bình,
 * hoặc `null` nếu trong khoảng đó không có đánh giá nào cho khía cạnh này
 * (Recharts sẽ ngắt đường thay vì vẽ số 0).
 */
export type TimeSeriesPoint = {
  /** Nhãn hiển thị của khoảng thời gian (vd: "01/05 - 07/05/2023"). */
  date: string;
  /** Ngày bắt đầu khoảng (YYYY-MM-DD) – khoá sắp xếp ổn định. */
  periodStart: string;
  /** Tổng số review trong khoảng thời gian. */
  totalReviews: number;
  /** Số lượt nhắc tới từng khía cạnh (bỏ qua sao = 0) trong khoảng – dùng cho Stacked Bar. */
  aspectCounts: Record<AspectKey, number>;
} & Record<AspectKey, number | null>;

const TIMESTAMP_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

/**
 * Parse timestamp dạng "YYYY-MM-DD[ HH:mm[:ss]]" theo giờ local
 * (tránh lệch múi giờ của `new Date('YYYY-MM-DD')` vốn parse theo UTC).
 * Fallback sang `new Date()` cho các định dạng khác (ISO có timezone...).
 */
export function parseTimestamp(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const m = TIMESTAMP_RE.exec(value);
  if (m) {
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    // Loại các ngày không hợp lệ bị JS "tràn" (vd 2023-02-31).
    return date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d)
      ? date
      : null;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Kiểm tra dữ liệu có trục thời gian hay không (CSV loại 2).
 * Mở rộng nhẹ so với `data[0]?.timestamp`: chỉ cần tồn tại ít nhất một
 * timestamp hợp lệ để tránh false-negative khi dòng đầu bị trống.
 */
export function hasTimestampData(data: ReadonlyArray<Pick<BatchItem, 'timestamp'>> | null | undefined): boolean {
  if (!data || data.length === 0) return false;
  if (data[0]?.timestamp && parseTimestamp(data[0].timestamp)) return true;
  return data.some((item) => parseTimestamp(item.timestamp) !== null);
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toShort = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
const toFull = (d: Date) => `${toShort(d)}/${d.getFullYear()}`;

/** Thứ Hai của tuần chứa `d` (tuần ISO, bắt đầu từ thứ Hai). */
function startOfWeek(d: Date): Date {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (result.getDay() + 6) % 7; // Mon=0 ... Sun=6
  result.setDate(result.getDate() - offset);
  return result;
}

function getBucket(d: Date, groupBy: TimeGroupBy): { start: Date; label: string } {
  switch (groupBy) {
    case 'day': {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return { start, label: toFull(start) };
    }
    case 'month': {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      return { start, label: `${pad2(start.getMonth() + 1)}/${start.getFullYear()}` };
    }
    case 'week':
    default: {
      const start = startOfWeek(d);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return { start, label: `${toShort(start)} - ${toFull(end)}` };
    }
  }
}

/**
 * Gom nhóm kết quả phân tích theo Ngày / Tuần / Tháng dựa trên `timestamp`.
 *
 * - Item không có timestamp hợp lệ bị bỏ qua.
 * - `totalReviews` đếm số review (item) trong khoảng.
 * - Điểm trung bình mỗi khía cạnh bỏ qua giá trị sao <= 0; nếu không có giá trị nào → `null`.
 * - Kết quả được sắp xếp tăng dần theo thời gian.
 */
export function transformToTimeSeriesData(
  data: ReadonlyArray<BatchItem> | null | undefined,
  groupBy: TimeGroupBy = 'week',
): TimeSeriesPoint[] {
  if (!data || data.length === 0) return [];

  type Bucket = {
    label: string;
    total: number;
    sums: Record<AspectKey, number>;
    counts: Record<AspectKey, number>;
  };

  const emptyAspectMap = () =>
    Object.fromEntries(ASPECTS_LIST.map((key) => [key, 0])) as Record<AspectKey, number>;

  const buckets = new Map<string, Bucket>();

  for (const item of data) {
    const date = parseTimestamp(item.timestamp);
    if (!date) continue;

    const { start, label } = getBucket(date, groupBy);
    const key = toIsoDate(start);

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, total: 0, sums: emptyAspectMap(), counts: emptyAspectMap() };
      buckets.set(key, bucket);
    }

    bucket.total += 1;

    for (const aspect of item.aspects ?? []) {
      const aspectKey = aspect.aspect as AspectKey;
      if (!(aspectKey in bucket.sums)) continue;
      if (typeof aspect.star !== 'number' || !(aspect.star > 0)) continue; // bỏ qua 0 / không hợp lệ
      bucket.sums[aspectKey] += aspect.star;
      bucket.counts[aspectKey] += 1;
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([periodStart, bucket]) => {
      const averages = {} as Record<AspectKey, number | null>;
      for (const key of ASPECTS_LIST) {
        averages[key] = bucket.counts[key] > 0 ? Math.round((bucket.sums[key] / bucket.counts[key]) * 100) / 100 : null;
      }
      return { date: bucket.label, periodStart, totalReviews: bucket.total, aspectCounts: { ...bucket.counts }, ...averages };
    });
}

/**
 * Lấy các item (review thô) rơi vào một mốc thời gian đã gom nhóm.
 * `periodStart` chính là `TimeSeriesPoint.periodStart` (YYYY-MM-DD).
 */
export function getItemsInPeriod(
  data: ReadonlyArray<BatchItem> | null | undefined,
  periodStart: string,
  groupBy: TimeGroupBy,
): BatchItem[] {
  if (!data) return [];
  return data.filter((item) => {
    const date = parseTimestamp(item.timestamp);
    return date !== null && toIsoDate(getBucket(date, groupBy).start) === periodStart;
  });
}
