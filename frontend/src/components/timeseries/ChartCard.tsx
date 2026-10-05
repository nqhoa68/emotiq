import type { ReactNode } from 'react';

interface ChartCardProps {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ id, title, subtitle, action, children }: ChartCardProps) {
  return (
    <section
      id={id}
      className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 sm:p-6 dark:bg-[#101b2d] dark:border-none dark:shadow-none"
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
