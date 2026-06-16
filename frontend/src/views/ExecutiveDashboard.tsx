import React from 'react';
import { Activity, ShieldAlert, Clock, Award, Train, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import MetricCard from '../components/MetricCard';

interface ExecutiveDashboardProps {
  kpis: any;
  trafficTrends: any[];
  activeView: string;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ kpis, trafficTrends }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* View Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Executive Control Center</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time operations summary, scheduling integrity index, and network analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="metric-grid">
        <MetricCard 
          title="Network Health"
          value={`${kpis?.network_health ?? 95}%`}
          icon={<Activity size={20} />}
          color="var(--clr-emerald)"
          change="Safety & Schedule Integrity Score"
        />
        <MetricCard 
          title="Active Trains"
          value={kpis?.active_trains ?? 0}
          icon={<Train size={20} />}
          color="var(--clr-primary)"
          change={`Total Enrolled: ${kpis?.total_trains ?? 80}`}
        />
        <MetricCard 
          title="Average Delay"
          value={`${kpis?.average_delay ?? 0.0}m`}
          icon={<Clock size={20} />}
          color="var(--clr-amber)"
          change="Average time deviation per run"
        />
        <MetricCard 
          title="Active Conflicts"
          value={kpis?.active_conflicts ?? 0}
          icon={<ShieldAlert size={20} />}
          color="var(--clr-crimson)"
          change={`Total Incident Logs: ${kpis?.conflict_count ?? 0}`}
        />
        <MetricCard 
          title="Track Utilization"
          value={`${kpis?.track_utilization ?? 0}%`}
          icon={<TrendingUp size={20} />}
          color="var(--clr-primary)"
          change="Segment block allocation density"
        />
        <MetricCard 
          title="Platform Load"
          value={`${kpis?.platform_utilization ?? 0}%`}
          icon={<Users size={20} />}
          color="var(--clr-purple)"
          change="Platform occupancy efficiency"
        />
      </div>

      {/* Optimization Gains Panel */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(13, 20, 38, 0.6) 100%)' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-purple)' }}>
            <Award size={18} /> Optimization Solver Insights
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
            Calculated comparison gains following constraints scheduler runs on active schedules.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CONFLICT REDUCTION</h4>
            <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--clr-emerald)' }}>+{kpis?.opt_gain_conflicts ?? 22.4}%</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DELAY MITIGATION</h4>
            <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--clr-emerald)' }}>+{kpis?.opt_gain_delays ?? 30.5}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Chart 1: Active Trains & Conflicts */}
        <div className="glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Hourly Traffic & Incident Trends</h3>
          <div style={{ flexGrow: 1, width: '100%', height: '90%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTrends}>
                <defs>
                  <linearGradient id="colorTrains" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--clr-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--clr-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConflicts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--clr-crimson)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--clr-crimson)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-slate)', borderColor: 'var(--border-glass)' }} />
                <Legend />
                <Area type="monotone" dataKey="trains_active" name="Active Trains" stroke="var(--clr-primary)" fillOpacity={1} fill="url(#colorTrains)" />
                <Area type="monotone" dataKey="conflicts_detected" name="Conflicts Detected" stroke="var(--clr-crimson)" fillOpacity={1} fill="url(#colorConflicts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Delay Trend */}
        <div className="glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Hourly Delay Variance</h3>
          <div style={{ flexGrow: 1, width: '100%', height: '90%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-slate)', borderColor: 'var(--border-glass)' }} />
                <Legend />
                <Bar dataKey="average_delay_mins" name="Avg Delay (mins)" fill="var(--clr-amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ExecutiveDashboard;
