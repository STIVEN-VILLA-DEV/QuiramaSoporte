"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  type PieLabelRenderProps,
} from "recharts";

const categoryConfig: Record<
  string,
  { label: string; color: string }
> = {
  computer: { label: "Computadores", color: "#dc2626" },
  laptop: { label: "Laptops", color: "#b91c1c" },
  printer: { label: "Impresoras", color: "#ef4444" },
  camera: { label: "Cámaras", color: "#7f1d1d" },
  payment_terminal: { label: "Datafonos", color: "#fca5a5" },
  server: { label: "Servidores", color: "#991b1b" },
  network: { label: "Red", color: "#8a7d40" },
  phone: { label: "Teléfonos", color: "#dc2626" },
  tablet: { label: "Tablets", color: "#ef4444" },
  scanner: { label: "Scanners", color: "#fca5a5" },
  ups: { label: "UPS", color: "#b91c1c" },
  other: { label: "Otros", color: "#9ca3af" },
};

interface Props {
  byCategory: Record<string, number>;
  total: number;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
      fontSize={11}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function CategoryChart({ byCategory, total }: Props) {
  const rawData = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  // Show top 6 + "Otros"
  const top = rawData.slice(0, 6);
  const rest = rawData.slice(6);
  const restTotal = rest.reduce((sum, [, v]) => sum + v, 0);

  const data = [
    ...top.map(([key, value]) => {
      const config = categoryConfig[key] ?? { label: key, color: "#9ca3af" };
      return {
        name: config.label,
        value,
        color: config.color,
      };
    }),
    ...(restTotal > 0
      ? [{ name: "Otros", value: restTotal, color: "#9ca3af" }]
      : []),
  ];

  return (
    <div
      className="card p-5 animate-fade-in-up"
      style={{ animationDelay: "350ms" }}
    >
      <h3 className="font-semibold text-gray-900 mb-4">Por Categoría</h3>

      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
      ) : (
        <div className="min-h-[400px]">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              label={renderCustomLabel}
              labelLine={false}
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} equipos`,
                name,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={40}
              iconType="circle"
              iconSize={9}
              wrapperStyle={{ fontSize: 12, color: "#475569" }}
            />
          </PieChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
