import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'amber':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'rose':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'indigo':
        return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'purple':
        return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'emerald':
      default:
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg border ${getColorStyles()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

