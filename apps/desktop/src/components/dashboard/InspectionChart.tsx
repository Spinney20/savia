import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { InspectionDto } from '@ssm/shared';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ro } from 'date-fns/locale';

interface InspectionChartProps {
  inspections: InspectionDto[];
}

export function InspectionChart({ inspections }: InspectionChartProps) {
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const count = inspections.filter((ins) =>
      isWithinInterval(new Date(ins.createdAt), { start, end }),
    ).length;
    return {
      month: format(date, 'MMM', { locale: ro }),
      count,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Inspecții / lună</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
            cursor={{ fill: 'rgba(16,77,120,0.05)' }}
          />
          <Bar dataKey="count" name="Inspecții" fill="#104d78" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
