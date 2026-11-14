import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ListeningActivityChartProps {
  data: { day: string; count: number }[];
}

export const ListeningActivityChart: React.FC<ListeningActivityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.slice(0, 3)}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                    <p className="font-semibold text-white">{payload[0].payload.day}</p>
                    <p className="text-brand-emerald font-bold mt-1">
                      {payload[0].value} Scrobbles
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#10B981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#activityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

