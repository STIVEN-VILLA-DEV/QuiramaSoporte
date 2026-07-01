"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { DashboardStats } from "@/types";

interface Props {
  stats: DashboardStats;
}

const COLORS = {
  red: "#dc2626",
  redDark: "#b91c1c",
  redDarker: "#7f1d1d",
  amber: "#d97706",
  amberDark: "#b45309",
  gray: "#d1d5db",
  grayBg: "#f3f4f6",
};

function MiniDonut({
  data,
  colors,
}: {
  data: { name: string; value: number }[];
  colors: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={18}
          outerRadius={26}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          animationBegin={200}
          animationDuration={600}
          isAnimationActive
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function MiniArea({
  data,
  color,
}: {
  data: { name: string; value: number }[];
  color: string;
}) {
  const gradientId = `areaGrad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive
          animationBegin={200}
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function StatsGrid({ stats }: Props) {
  const cards = [
    {
      label: "Total Equipos",
      value: stats.total_devices,
      description: "en inventario",
      textColor: "text-accent",
      bgColor: "bg-accent/10 border-accent/20",
      chart: (
        <MiniArea
          data={[
            { name: "Activos", value: stats.active_devices },
            { name: "Mantenimiento", value: stats.maintenance_devices },
            { name: "Dañados", value: stats.damaged_devices },
            { name: "Retirados", value: stats.retired_devices },
          ]}
          color={COLORS.red}
        />
      ),
    },
    {
      label: "Equipos Dañados",
      value: stats.damaged_devices,
      description: `${
        stats.total_devices > 0
          ? ((stats.damaged_devices / stats.total_devices) * 100).toFixed(1)
          : "0"
      }% del total`,
      textColor: "text-red-700",
      bgColor: "bg-red-100 border-red-200",
      chart: (
        <MiniDonut
          data={[
            { name: "Dañados", value: stats.damaged_devices },
            { name: "Resto", value: Math.max(0, stats.total_devices - stats.damaged_devices) },
          ]}
          colors={[COLORS.red, COLORS.grayBg]}
        />
      ),
    },
    {
      label: "Sin Licencia Antivirus",
      value: stats.no_antivirus,
      description: "equipos sin protección",
      textColor: "text-amber-700",
      bgColor: "bg-amber-100 border-amber-200",
      chart: (
        <MiniDonut
          data={[
            { name: "Sin AV", value: stats.no_antivirus },
            { name: "Con AV", value: Math.max(0, stats.total_computer_like - stats.no_antivirus) },
          ]}
          colors={[COLORS.amber, COLORS.grayBg]}
        />
      ),
    },
    {
      label: "Malware Detectado",
      value: stats.malware_detected,
      description: "equipos infectados",
      textColor: "text-red-700",
      bgColor: "bg-red-100 border-red-200",
      chart: (
        <MiniDonut
          data={[
            { name: "Malware", value: stats.malware_detected },
            { name: "Limpios", value: Math.max(0, stats.total_devices - stats.malware_detected) },
          ]}
          colors={[COLORS.redDarker, COLORS.grayBg]}
        />
      ),
    },
    {
      label: "Mantenimiento Vencido",
      value: stats.overdue_maintenance,
      description: "requieren atención",
      textColor: "text-amber-700",
      bgColor: "bg-amber-100 border-amber-200",
      chart: (
        <MiniDonut
          data={[
            { name: "Vencido", value: stats.overdue_maintenance },
            { name: "Al día", value: Math.max(0, stats.total_devices - stats.overdue_maintenance) },
          ]}
          colors={[COLORS.amberDark, COLORS.grayBg]}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col animate-fade-in-up ${card.bgColor}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-0.5 leading-tight">
                {card.label}
              </p>
              {card.description && (
                <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
              )}
            </div>
            <div className="w-[60px] h-[60px] shrink-0 -mt-1">{card.chart}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
