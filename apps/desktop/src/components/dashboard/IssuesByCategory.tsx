import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { IssueReportDto } from '@ssm/shared';

const COLORS = ['#104d78', '#1a6da8', '#2196f3', '#64b5f6', '#90caf9', '#bbdefb'];

interface IssuesByCategoryProps {
  issues: IssueReportDto[];
}

export function IssuesByCategory({ issues }: IssuesByCategoryProps) {
  const categoryMap = new Map<string, number>();
  for (const issue of issues) {
    const cat = issue.categoryName ?? 'Necategorizat';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }

  const data = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = issues.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Probleme pe categorii</h3>
      <div className="flex items-center">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{total}</span>
          </div>
        </div>
        <div className="flex-1 ml-4 space-y-1.5">
          {data.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-gray-600 truncate flex-1">{d.name}</span>
              <span className="text-xs font-medium text-gray-900">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
