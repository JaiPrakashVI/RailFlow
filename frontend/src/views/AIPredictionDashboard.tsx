import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
import { Sparkles, BrainCircuit } from 'lucide-react';

interface AIPredictionDashboardProps {
  trains: any[];
  onPredictDelay: (trainId: string, weather: string, congestion: number, signalDelay: number, maintenance: boolean) => Promise<any>;
  onGetModelMetrics: () => Promise<any>;
}

const AIPredictionDashboard: React.FC<AIPredictionDashboardProps> = ({
  trains,
  onPredictDelay,
  onGetModelMetrics
}) => {
  const [selectedTrain, setSelectedTrain] = useState('');
  const [weather, setWeather] = useState('Clear');
  const [congestion, setCongestion] = useState(0.3);
  const [signalDelay, setSignalDelay] = useState(5);
  const [maintenance, setMaintenance] = useState(false);
  
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [importance, setImportance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await onGetModelMetrics();
        setMetrics(res.metrics);
        setImportance(res.feature_importance);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetrics();
    
    if (trains.length > 0) {
      setSelectedTrain(trains[0].id);
    }
  }, [trains]);

  const handlePredict = async () => {
    if (!selectedTrain) return;
    setLoading(true);
    try {
      const res = await onPredictDelay(selectedTrain, weather, congestion, signalDelay, maintenance);
      setPredictionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Color map for feature importance
  const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#a855f7'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: 600 }}>AI Delay Predictor & Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Evaluate route schedules against machine learning models to forecast operational risks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* On-demand Predictor Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="var(--clr-primary)" /> Forecast Delay
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SELECT ACTIVE TRAIN</label>
            <select className="form-input" value={selectedTrain} onChange={(e) => setSelectedTrain(e.target.value)}>
              {trains.map(t => (
                <option key={t.id} value={t.id}>{t.id} - {t.name} ({t.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>WEATHER CONDITION</label>
              <select className="form-input" value={weather} onChange={(e) => setWeather(e.target.value)}>
                <option value="Clear">Clear</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Rainy">Rainy</option>
                <option value="Foggy">Foggy</option>
                <option value="Stormy">Stormy</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TRACK CONGESTION RATIO</label>
              <input type="number" step="0.1" min="0" max="1" className="form-input" value={congestion} onChange={(e) => setCongestion(parseFloat(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SIGNAL DELAY LIMIT (MIN)</label>
              <input type="number" min="0" max="60" className="form-input" value={signalDelay} onChange={(e) => setSignalDelay(parseInt(e.target.value))} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Active Track Maintenance
              </label>
            </div>
          </div>

          <button className="btn" style={{ height: '42px', marginTop: '10px' }} onClick={handlePredict} disabled={loading}>
            {loading ? 'Evaluating...' : 'Run ML Forecast'}
          </button>
        </div>

        {/* Prediction Results */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Forecast Outcome</h3>
          {predictionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', margin: 'auto 0' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '15px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PREDICTED DELAY</span>
                  <p style={{ fontSize: '42px', fontWeight: 800, color: predictionResult.predicted_delay > 15 ? 'var(--clr-amber)' : 'var(--clr-emerald)' }}>
                    +{predictionResult.predicted_delay}m
                  </p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK INDEX</span>
                  <p style={{ fontSize: '42px', fontWeight: 800, color: predictionResult.risk_score > 0.6 ? 'var(--clr-crimson)' : 'var(--clr-emerald)' }}>
                    {Math.round(predictionResult.risk_score * 100)}%
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Model Confidence:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>{(predictionResult.confidence * 100).toFixed(0)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Congestion Factor:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{predictionResult.features.congestion * 100}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Track Block Status:</span>
                  <span style={{ color: predictionResult.features.maintenance ? 'var(--clr-crimson)' : 'var(--clr-emerald)' }}>
                    {predictionResult.features.maintenance ? 'Block Under Maintenance' : 'Operational'}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto 0', padding: '40px 0' }}>
              <BrainCircuit size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
              <p>Execute a forecast to calculate delay estimations.</p>
            </div>
          )}
        </div>

      </div>

      {/* Model Performance Comparison Section */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          {/* Comparative Metrics Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--clr-purple)" /> Classifier Benchmarks Comparison
            </h3>
            
            <table className="custom-table" style={{ marginTop: '10px' }}>
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>R² Score (Accuracy)</th>
                  <th>Mean Abs Error (MAE)</th>
                  <th>RMSE</th>
                  <th>Train Duration (s)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(metrics).map(modelKey => (
                  <tr key={modelKey}>
                    <td style={{ fontWeight: 'bold' }}>{modelKey}</td>
                    <td style={{ color: 'var(--clr-emerald)', fontWeight: 600 }}>{metrics[modelKey].r2}</td>
                    <td>{metrics[modelKey].mae} mins</td>
                    <td>{metrics[modelKey].rmse}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{metrics[modelKey].train_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Models dynamically fit on a simulated dataset containing 4,000 operational records.
            </span>
          </div>

          {/* Feature Importance plot */}
          <div className="glass-card" style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Feature Significance (Random Forest)</h3>
            <div style={{ flexGrow: 1, width: '100%', height: '85%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={importance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                  <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="var(--text-secondary)" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-slate)', borderColor: 'var(--border-glass)' }} />
                  <Bar dataKey="importance" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {importance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AIPredictionDashboard;
