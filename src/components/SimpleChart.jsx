import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Pie,
} from 'recharts';

const COLOR_MAP = {
  emerald: { from: '#10b981', to: '#34d399', hoverFrom: '#059669', hoverTo: '#6ee7b7' },
  blue: { from: '#3b82f6', to: '#60a5fa', hoverFrom: '#2563eb', hoverTo: '#93c5fd' },
  purple: { from: '#8b5cf6', to: '#a78bfa', hoverFrom: '#7c3aed', hoverTo: '#c4b5fd' },
  pink: { from: '#ec4899', to: '#f472b6', hoverFrom: '#db2777', hoverTo: '#f9a8d4' },
  orange: { from: '#f97316', to: '#fb923c', hoverFrom: '#ea580c', hoverTo: '#fdba74' },
  yellow: { from: '#eab308', to: '#facc15', hoverFrom: '#ca8a04', hoverTo: '#fde047' },
  red: { from: '#ef4444', to: '#f87171', hoverFrom: '#dc2626', hoverTo: '#fca5a5' },
  teal: { from: '#14b8a6', to: '#5eead4', hoverFrom: '#0d9488', hoverTo: '#99f6e4' },
};

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#ef4444',
];

/**
 * Professional Bar Chart using Recharts
 */
export function BarChart({
  data,
  height = 200,
  color = 'emerald',
  labelKey = 'label',
  valueKey = 'value',
}) {
  console.log('📊 [BarChart] Rendering with:', {
    dataLength: data?.length,
    data: data,
    labelKey,
    valueKey,
    color,
    height,
  });

  if (!data || data.length === 0) {
    console.warn('📊 [BarChart] No data provided');
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">No data available</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Start viewing recipes to see trends!
        </p>
      </div>
    );
  }

  const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
  const chartData = data.map((item, idx) => {
    const name = item[labelKey] || item.name || `Day ${idx + 1}`;
    const value = Number(item[valueKey]) || 0;
    return { name, value };
  });

  console.log('📊 [BarChart] Processed chart data:', {
    chartDataLength: chartData.length,
    chartData: chartData.slice(0, 5),
    allZero: chartData.every(d => d.value === 0),
    maxValue: Math.max(...chartData.map(d => d.value)),
  });

  // Ensure we have at least some data points
  if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
    console.warn('📊 [BarChart] All values are zero or no data points');
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">No data to display</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Start tracking to see your trends!
        </p>
      </div>
    );
  }

  console.log('📊 [BarChart] Rendering chart with', chartData.length, 'data points');

  return (
    <div
      style={{ width: '100%', height: `${height}px`, minWidth: 0, minHeight: `${height}px` }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={height}>
        <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            className="dark:fill-slate-400"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            className="dark:fill-slate-400"
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            labelStyle={{ color: '#f1f5f9', marginBottom: '4px' }}
          />
          <Bar dataKey="value" fill={colors.from} radius={[8, 8, 0, 0]} animationDuration={1000}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors.from} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Professional Line Chart using Recharts
 */
export function LineChart({
  data,
  height = 200,
  color = 'blue',
  labelKey = 'label',
  valueKey = 'value',
}) {
  console.log('📊 [LineChart] Rendering with:', {
    dataLength: data?.length,
    data: data,
    labelKey,
    valueKey,
    color,
    height,
  });

  if (!data || data.length === 0) {
    console.warn('📊 [LineChart] No data provided');
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">No data available</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Start viewing recipes to see trends!
        </p>
      </div>
    );
  }

  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  const chartData = data.map((item, idx) => {
    const name = item[labelKey] || item.name || `Day ${idx + 1}`;
    const value = Number(item[valueKey]) || 0;
    return { name, value };
  });

  console.log('📊 [LineChart] Processed chart data:', {
    chartDataLength: chartData.length,
    chartData: chartData.slice(0, 5),
    allZero: chartData.every(d => d.value === 0),
    maxValue: Math.max(...chartData.map(d => d.value)),
  });

  // Ensure we have at least some data points
  if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
    console.warn('📊 [LineChart] All values are zero or no data points');
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">No data to display</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Start tracking to see your trends!
        </p>
      </div>
    );
  }

  console.log('📊 [LineChart] Rendering chart with', chartData.length, 'data points');

  return (
    <div
      style={{ width: '100%', height: `${height}px`, minWidth: 0, minHeight: `${height}px` }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={height}>
        <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            className="dark:fill-slate-400"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            className="dark:fill-slate-400"
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            labelStyle={{ color: '#f1f5f9', marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors.from}
            strokeWidth={3}
            dot={{ fill: colors.from, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, stroke: colors.from, strokeWidth: 2 }}
            animationDuration={1000}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Progress ring chart
 */
export function ProgressRing({ value, max, size = 120, color = 'emerald', label }) {
  const percentage = Math.min(100, (value / max) * 100);
  // Responsive size based on screen
  const responsiveSize =
    typeof window !== 'undefined' && window.innerWidth < 640
      ? Math.min(size, 100)
      : typeof window !== 'undefined' && window.innerWidth < 1024
        ? Math.min(size, 120)
        : size;
  const radius = (responsiveSize - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = COLOR_MAP[color] || COLOR_MAP.emerald;

  return (
    <div
      className="relative inline-flex items-center justify-center w-full max-w-full"
      style={{ width: responsiveSize, height: responsiveSize }}
    >
      <svg
        width={responsiveSize}
        height={responsiveSize}
        className="transform -rotate-90"
        viewBox={`0 0 ${responsiveSize} ${responsiveSize}`}
      >
        {/* Background circle */}
        <circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={responsiveSize < 100 ? '6' : '8'}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={radius}
          fill="none"
          stroke={colors.from}
          strokeWidth={responsiveSize < 100 ? '6' : '8'}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`${responsiveSize < 100 ? 'text-base' : responsiveSize < 120 ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold`}
          style={{ color: colors.from }}
        >
          {value}
        </div>
        {label && (
          <div className="text-[9px] sm:text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced donut chart using Recharts
 */
export function DonutChart({ data, size = 200, innerRadius = 0.6 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const outerRadius = radius - 10;
  const inner = radius * innerRadius;

  // Responsive size
  const responsiveSize = Math.min(
    size,
    typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : size
  );

  const chartData = data.map((item, idx) => ({
    name: item.label,
    value: item.value,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <ResponsiveContainer width={responsiveSize} height={responsiveSize}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={outerRadius}
            innerRadius={inner}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
