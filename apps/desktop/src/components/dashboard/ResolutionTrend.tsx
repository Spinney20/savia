import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { IssueReportDto } from '@ssm/shared';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ro } from 'date-fns/locale';

interface ResolutionTrendProps {
  issues: IssueReportDto[];
}

export function ResolutionTrend({ issues }: ResolutionTrendProps) {
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const reported = issues.filter((is) =>
      isWithinInterval(new Date(is.reportedAt), { start, end }),
    ).length;
    const resolved = issues.filter((is) =>
      is.resolvedAt && isWithinInterval(new Date(is.resolvedAt), { start, end }),
    ).length;
    return {
      month: format(date, 'MMM', { locale: ro }),
      reported,
      resolved,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendință rezolvare</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
          <Area type="monotone" dataKey="reported" name="Raportate" stroke="#ef4444" strokeWidth={2} fill="url(#reportedGrad)" />
          <Area type="monotone" dataKey="resolved" name="Rezolvate" stroke="#22c55e" strokeWidth={2} fill="url(#resolvedGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
