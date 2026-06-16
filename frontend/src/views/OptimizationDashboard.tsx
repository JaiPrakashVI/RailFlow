import React, { useState } from 'react';
import { Cpu, ArrowRight, ShieldCheck, IndianRupee } from 'lucide-react';

interface OptimizationDashboardProps {
  onRunOptimization: () => Promise<any>;
  optResults: any;
  isLoading: boolean;
}

const OptimizationDashboard: React.FC<OptimizationDashboardProps> = ({
  onRunOptimization,
  optResults,
  isLoading
}) => {
  const [lastRun, setLastRun] = useState<any>(optResults);
  const [busy, setBusy] = useState(false);

  const triggerOptimization = async () => {
    setBusy(true);
    try {
      const res = await onRunOptimization();
      setLastRun(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>Constraint Programming Schedule Optimizer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Resolves headway overlaps and station congestion using Google OR-Tools CP-SAT model.
          </p>
        </div>
        
        <button 
          className="btn" 
          disabled={busy || isLoading} 
          onClick={triggerOptimization}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Cpu size={18} /> {busy ? 'Solving constraints...' : 'Run Optimization'}
        </button>
      </div>

      {lastRun ? (
        <>
          {/* Comparative Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* Conflict reduction */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--clr-emerald)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CONFLICT MITIGATION</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--clr-crimson)', fontSize: '18px' }}>{lastRun.conflicts_before}</span>
                <ArrowRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--clr-emerald)', fontSize: '26px', fontWeight: 'bold' }}>{lastRun.optimized_conflicts}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reduction of {lastRun.conflict_reduction}%</p>
            </div>

            {/* Delay reduction */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--clr-emerald)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AVERAGE DELAY</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--clr-crimson)', fontSize: '18px' }}>{lastRun.delay_before}m</span>
                <ArrowRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--clr-emerald)', fontSize: '26px', fontWeight: 'bold' }}>{lastRun.optimized_delay}m</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mitigated by {lastRun.delay_reduction}%</p>
            </div>

            {/* Track Utilizations */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--clr-primary)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TRACK BLOCK UTILITY</span>
              <p style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '8px 0' }}>
                {lastRun.track_utilization}%
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall throughput efficiency</p>
            </div>

            {/* Cost Savings */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--clr-purple)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(13, 20, 38, 0.6) 100%)' }}>
              <span style={{ fontSize: '11px', color: 'var(--clr-purple)', fontWeight: 600 }}>ESTIMATED SAVINGS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '8px 0' }}>
                <IndianRupee size={20} color="var(--clr-purple)" />
                <span style={{ color: 'var(--text-primary)', fontSize: '26px', fontWeight: 'bold' }}>
                  {lastRun.cost_savings.toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rs 1500 saved/delayed train-hour</p>
            </div>

          </div>

          {/* Solver Log Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--clr-emerald)" /> Solver Schedule Dispatches (Offset Shifts)
            </h3>
            
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Train ID</th>
                  <th>Train Name</th>
                  <th>Category</th>
                  <th>Scheduled Dep</th>
                  <th>Optimized Dep</th>
                  <th>Headway Offset</th>
                  <th>Expected Delay Status</th>
                </tr>
              </thead>
              <tbody>
                {lastRun.optimized_trains && lastRun.optimized_trains.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{t.id}</td>
                    <td>{t.name}</td>
                    <td>{t.type}</td>
                    <td>{t.departure}</td>
                    <td style={{ color: 'var(--clr-emerald)', fontWeight: 600 }}>{t.optimized_departure}</td>
                    <td style={{ color: t.offset > 0 ? 'var(--clr-amber)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {t.offset > 0 ? `+${t.offset} mins` : 'Unchanged'}
                    </td>
                    <td>
                      <span className={`badge ${t.delay === 0 ? 'success' : 'warning'}`}>
                        {t.delay === 0 ? 'Fully Resolved' : `Minimized delay: +${t.delay}m`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Cpu size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
          <h3>No Optimization Run Data Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 20px auto' }}>
            Click the "Run Optimization" button above to evaluate schedules against track headway constraints.
          </p>
        </div>
      )}

    </div>
  );
};

export default OptimizationDashboard;
