"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BranchData {
  name: string;
  count: number;
  fill: string;
}

interface Props {
  byBranch: Record<string, number>;
  branchNames?: Record<string, string>;
}

const FALLBACK_LABELS = [
  "Sede Principal",
  "Sede 2",
  "Sede 3",
  "Sede 4",
  "Sede 5",
];

const BAR_COLORS = ["#dc2626", "#b91c1c", "#ef4444", "#991b1b", "#7f1d1d"];

export default function BranchChart({ byBranch, branchNames = {} }: Props) {
  const entries = Object.entries(byBranch)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const data: BranchData[] = entries.map(([id, count], i) => {
    const name =
      branchNames[id] ??
      FALLBACK_LABELS[i] ??
      `Sede ${i + 1}`;
    return {
      name,
      count,
      fill: BAR_COLORS[i % BAR_COLORS.length],
    };
  });

  return (
    <div
      className="card p-5 animate-fade-in-up"
      style={{ animationDelay: "400ms" }}
    >
      <h3 className="font-semibold text-gray-900 mb-4">
        Equipos por Sede
      </h3>

      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
      ) : (
        <div className="min-h-[400px]">
        <ResponsiveContainer
          width="100%"
          height={Math.max(data.length * 60 + 20, 200)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 13, fill: "#475569", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(value) => [`${value} equipos`, "Cantidad"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              animationBegin={300}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
