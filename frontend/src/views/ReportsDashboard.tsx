import React from 'react';
import { FileText, Download, Printer, Table } from 'lucide-react';

interface ReportsDashboardProps {
  onDownloadCSV: (type: string) => void;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ onDownloadCSV }) => {
  const reportsList = [
    { id: 'operational', name: 'Operational Audit Summary', desc: 'Summary of train status, active conflicts, and scheduling integrity indices.', type: 'csv' },
    { id: 'trains', name: 'Active Enrolled Train Sheet', desc: 'Complete tabular Excel CSV file mapping all current train positions, delays, and speeds.', type: 'csv' },
    { id: 'conflicts', name: 'Incidents Conflict Register', desc: 'Chronological list of all detected block overlaps, platform clashes, and resolution audits.', type: 'csv' },
    { id: 'optimization', name: 'CP-SAT Optimization Performance logs', desc: 'Chronological optimization solver runs logging conflict reductions and cost savings.', type: 'csv' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>RailFlow AI Report Generator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Compile daily dispatch statistics and export simulation logs to Excel spreadsheets or printable templates.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Printable Section */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--clr-primary)" /> Daily Print Reports
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
              Compile a clean, stylized HTML audit report covering all active operations, platform statuses, and recent incident conflicts.
            </p>
          </div>
          <a 
            href="http://localhost:8000/api/reports/print" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}
          >
            <Printer size={16} /> Open Printable Audit
          </a>
        </div>

        {/* Excel Downloads Section */}
        {reportsList.map(report => (
          <div key={report.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Table size={18} color="var(--clr-purple)" /> {report.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                {report.desc}
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => onDownloadCSV(report.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <Download size={16} /> Export to Excel (CSV)
            </button>
          </div>
        ))}

      </div>

    </div>
  );
};

export default ReportsDashboard;
