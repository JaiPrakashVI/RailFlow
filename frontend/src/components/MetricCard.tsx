import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'var(--clr-primary)', 
  change, 
  changeType = 'neutral' 
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'var(--clr-emerald)';
    if (changeType === 'negative') return 'var(--clr-crimson)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="glass-card metric-card">
      <div className="metric-info">
        <h4>{title}</h4>
        <p>{value}</p>
        {change && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: getChangeColor(), marginTop: '4px', display: 'inline-block' }}>
            {change}
          </span>
        )}
      </div>
      <div 
        className="metric-icon" 
        style={{ 
          backgroundColor: `${color}15`, 
          border: `1px solid ${color}30`,
          color: color 
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default MetricCard;
