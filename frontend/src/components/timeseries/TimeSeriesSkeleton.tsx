/** Skeleton loading giả lập layout của dashboard time-series (stat cards + 3 biểu đồ). */
const Block = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

const CardSkeleton = ({ chartHeight }: { chartHeight: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-none dark:bg-[#101b2d] dark:shadow-none">
    <Block className="h-5 w-48" />
    <Block className="mt-2 h-3.5 w-80 max-w-full" />
    <div className="mt-5 flex flex-wrap gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Block key={i} className="h-7 w-24 rounded-full" />
      ))}
    </div>
    <Block className={`mt-5 w-full ${chartHeight}`} />
  </div>
);

export default function TimeSeriesSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Đang tải biểu đồ">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-none dark:bg-[#101b2d] dark:shadow-none"
          >
            <Block className="h-3.5 w-24" />
            <Block className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>
      <CardSkeleton chartHeight="h-80" />
      <CardSkeleton chartHeight="h-80" />
      <CardSkeleton chartHeight="h-56" />
    </div>
  );
}
