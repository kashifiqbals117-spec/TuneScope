import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface GenreRadarProps {
  data: { trait: string; value: number }[];
}

export const GenreRadar: React.FC<GenreRadarProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="trait" stroke="#94A3B8" fontSize={11} />
          <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} tick={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
                    <p className="font-semibold text-white">{payload[0].payload.trait}</p>
                    <p className="text-brand-violet font-bold mt-0.5">{payload[0].value}% Intensity</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Sonic Identity"
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

