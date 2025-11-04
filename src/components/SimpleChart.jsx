import React from "react";
import { motion } from "framer-motion";

const COLOR_MAP = {
    emerald: { from: "#10b981", to: "#34d399", hoverFrom: "#059669", hoverTo: "#6ee7b7" },
    blue: { from: "#3b82f6", to: "#60a5fa", hoverFrom: "#2563eb", hoverTo: "#93c5fd" },
    purple: { from: "#8b5cf6", to: "#a78bfa", hoverFrom: "#7c3aed", hoverTo: "#c4b5fd" },
    pink: { from: "#ec4899", to: "#f472b6", hoverFrom: "#db2777", hoverTo: "#f9a8d4" },
    orange: { from: "#f97316", to: "#fb923c", hoverFrom: "#ea580c", hoverTo: "#fdba74" },
    yellow: { from: "#eab308", to: "#facc15", hoverFrom: "#ca8a04", hoverTo: "#fde047" },
    red: { from: "#ef4444", to: "#f87171", hoverFrom: "#dc2626", hoverTo: "#fca5a5" },
    teal: { from: "#14b8a6", to: "#5eead4", hoverFrom: "#0d9488", hoverTo: "#99f6e4" },
};

/**
 * Simple bar chart component
 */
export function BarChart({ data, height = 200, color = "emerald", labelKey = "label", valueKey = "value" }) {
    const maxValue = Math.max(...data.map((d) => d[valueKey]), 1);
    const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
    
    return (
        <div className="relative" style={{ height: `${height}px` }}>
            <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2">
                {data.map((item, idx) => {
                    const percentage = (item[valueKey] / maxValue) * 100;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ height: 0 }}
                            animate={{ height: `${percentage}%` }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            className="flex-1 flex flex-col items-center gap-1 group"
                        >
                            <div
                                className="w-full rounded-t-lg transition-all shadow-sm group-hover:shadow-md relative"
                                style={{
                                    height: `${percentage}%`,
                                    background: `linear-gradient(to top, ${colors.from}, ${colors.to})`,
                                }}
                                title={`${item[labelKey]}: ${item[valueKey]}`}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {item[valueKey]}
                                </div>
                            </div>
                            {item[labelKey] && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center">
                                    {item[labelKey]}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Simple line chart component
 */
export function LineChart({ data, height = 200, color = "blue", labelKey = "label", valueKey = "value" }) {
    const maxValue = Math.max(...data.map((d) => d[valueKey]), 1);
    const minValue = Math.min(...data.map((d) => d[valueKey]), 0);
    const range = maxValue - minValue || 1;
    const colors = COLOR_MAP[color] || COLOR_MAP.blue;
    
    const points = data.map((item, idx) => {
        const x = (idx / (data.length - 1 || 1)) * 100;
        const y = 100 - ((item[valueKey] - minValue) / range) * 100;
        return { x, y, value: item[valueKey], label: item[labelKey] };
    });
    
    const pathD = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    
    return (
        <div className="relative" style={{ height: `${height}px` }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.from} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={colors.from} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                    d={`${pathD} L 100 100 L 0 100 Z`}
                    fill={`url(#gradient-${color})`}
                />
                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={colors.from}
                    strokeWidth="2"
                />
                {/* Points */}
                {points.map((p, idx) => (
                    <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="2"
                        fill={colors.from}
                    />
                ))}
            </svg>
            {/* Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500">
                {data.length > 0 && (
                    <>
                        <span>{data[0][labelKey]}</span>
                        {data.length > 1 && <span>{data[data.length - 1][labelKey]}</span>}
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Progress ring chart
 */
export function ProgressRing({ value, max, size = 120, color = "emerald", label }) {
    const percentage = Math.min(100, (value / max) * 100);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
    
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.from}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    strokeDasharray={circumference}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold" style={{ color: colors.from }}>{value}</div>
                {label && <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>}
            </div>
        </div>
    );
}

/**
 * Donut chart
 */
export function DonutChart({ data, size = 200, innerRadius = 0.6 }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return null;
    
    const radius = size / 2;
    const outerRadius = radius - 10;
    const inner = radius * innerRadius;
    const center = size / 2;
    
    let currentAngle = -90;
    const colorsArray = Object.values(COLOR_MAP);
    
    return (
        <svg width={size} height={size} className="transform">
            {data.map((item, idx) => {
                const percentage = (item.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;
                
                const color = colorsArray[idx % colorsArray.length];
                
                const startX = center + outerRadius * Math.cos((startAngle * Math.PI) / 180);
                const startY = center + outerRadius * Math.sin((startAngle * Math.PI) / 180);
                const endX = center + outerRadius * Math.cos((endAngle * Math.PI) / 180);
                const endY = center + outerRadius * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArc = angle > 180 ? 1 : 0;
                
                const pathD = [
                    `M ${center + inner * Math.cos((startAngle * Math.PI) / 180)} ${center + inner * Math.sin((startAngle * Math.PI) / 180)}`,
                    `L ${startX} ${startY}`,
                    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endX} ${endY}`,
                    `L ${center + inner * Math.cos((endAngle * Math.PI) / 180)} ${center + inner * Math.sin((endAngle * Math.PI) / 180)}`,
                    `A ${inner} ${inner} 0 ${largeArc} 0 ${center + inner * Math.cos((startAngle * Math.PI) / 180)} ${center + inner * Math.sin((startAngle * Math.PI) / 180)}`,
                    "Z",
                ].join(" ");
                
                return (
                    <motion.path
                        key={idx}
                        d={pathD}
                        fill={color.from}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                    />
                );
            })}
        </svg>
    );
}
