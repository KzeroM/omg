import type { DailyPlay } from "@/utils/supabase/tracks";

interface Last7DaysChartProps {
  days: DailyPlay[];
}

export default function Last7DaysChart({ days }: Last7DaysChartProps) {
  if (!days.length) return null;

  const maxCount = Math.max(...days.map(d => d.count), 1);
  const today = new Date();
  const todayKey = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 uppercase tracking-wide">
        최근 7일
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = day.date === todayKey;
          const heightPercent = (day.count / maxCount) * 100;

          return (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-sm overflow-hidden bg-[var(--color-bg-hover)] flex items-end justify-center"
                style={{ minHeight: '60px' }}
              >
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    isToday
                      ? 'bg-[var(--color-accent)]'
                      : 'bg-[var(--color-accent)]/60'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {day.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
