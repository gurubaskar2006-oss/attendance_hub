import React from 'react';

interface BadgeProps {
  variant?:
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'purple'
    | 'present'
    | 'absent'
    | 'late'
    | 'halfday'
    | 'leave';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
      case 'present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'danger':
      case 'absent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
      case 'late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'halfday':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'info':
      case 'leave':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()} ${className}`}
    >
      {children}
    </span>
  );
};

