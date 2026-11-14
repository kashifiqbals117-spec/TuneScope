import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HourlyHeatmapProps {
  data: { hour: number; count: number; label: string }[];
  peakHour: number;
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({ data, peakHour }) => {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(h) => (h % 3 === 0 ? `${h}h` : '')}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const hour = payload[0].payload.hour;
                return (
                  <div className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                    <p className="font-semibold text-white">{hour}:00 - {hour}:59</p>
                    <p className="text-brand-cyan font-bold mt-1">
                      {payload[0].value} Plays
                    </p>
                    {hour === peakHour && (
                      <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                        ⭐ Peak Listening Hour
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.hour}`}
                fill={
                  entry.hour === peakHour
                    ? '#F59E0B'
                    : entry.hour >= 21 || entry.hour <= 4
                    ? '#8B5CF6'
                    : '#06B6D4'
                }
                fillOpacity={entry.hour === peakHour ? 1.0 : entry.count > 0 ? 0.75 : 0.15}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

