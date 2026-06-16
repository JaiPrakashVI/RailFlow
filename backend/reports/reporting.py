import csv
import io
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database import Train, Conflict, OptimizationRun, Station, Schedule

class ReportingModule:
    def __init__(self):
        pass

    def generate_excel_csv(self, db: Session, report_type: str = "operational") -> str:
        """Generates CSV formatting reports for Excel ingestion"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        if report_type == "trains":
            # Header
            writer.writerow(["Train ID", "Train Name", "Category", "Source", "Destination", "Current Delay (mins)", "Status", "Weather", "Speed (km/h)"])
            trains = db.query(Train).all()
            for t in trains:
                writer.writerow([t.id, t.name, t.type, t.source, t.destination, t.delay, t.status, t.weather, t.speed])
                
        elif report_type == "conflicts":
            writer.writerow(["Conflict ID", "Type", "Train A", "Train B", "Track", "Station", "Incident Time", "Severity", "Root Cause", "Resolved"])
            conflicts = db.query(Conflict).all()
            for c in conflicts:
                writer.writerow([c.id, c.type, c.train_a, c.train_b, c.track, c.station, c.time, c.severity, c.root_cause, c.resolved])
                
        elif report_type == "optimization":
            writer.writerow(["Run ID", "Method", "Before Conflict Count", "After Conflict Count", "Conflict Reduction %", "Avg Delay Before (mins)", "Avg Delay After (mins)", "Cost Savings (Rs)", "Timestamp"])
            opts = db.query(OptimizationRun).all()
            for o in opts:
                conflict_reduction_pct = round(((o.conflicts_before - o.conflicts_after) / o.conflicts_before * 100), 1) if o.conflicts_before > 0 else 0.0
                writer.writerow([o.id, o.method, o.conflicts_before, o.conflicts_after, conflict_reduction_pct, o.delay_before, o.delay_after, o.cost_savings, o.timestamp])
                
        else: # Default operational report
            writer.writerow(["RailFlow AI Railway Digital Twin Operational Audit Summary"])
            writer.writerow([])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Trains Enrolled", db.query(Train).count()])
            writer.writerow(["Active Schedule Stations", db.query(Station).count()])
            writer.writerow(["Total Active Conflicts", db.query(Conflict).filter(Conflict.resolved == False).count()])
            writer.writerow(["Optimization Actions Executed", db.query(OptimizationRun).count()])
            
        return output.getvalue()

    def generate_html_print_report(self, db: Session, title: str = "RailFlow AI Daily Operations Report") -> str:
        """Returns a beautiful HTML report styled for print displays"""
        train_count = db.query(Train).count()
        conflict_count = db.query(Conflict).count()
        active_conflict_count = db.query(Conflict).filter(Conflict.resolved == False).count()
        opt_count = db.query(OptimizationRun).count()
        
        trains = db.query(Train).limit(10).all()
        conflicts = db.query(Conflict).limit(10).all()
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; margin: 30px; }}
                h1 {{ color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }}
                .meta-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }}
                .card {{ background: #f3f4f6; border-radius: 6px; padding: 15px; text-align: center; border: 1px solid #e5e7eb; }}
                .card h3 {{ margin: 0; color: #4b5563; font-size: 14px; }}
                .card p {{ margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111827; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 14px; }}
                th {{ background-color: #f9fafb; color: #374151; }}
                tr:nth-child(even) {{ background-color: #f9fafb; }}
                .footer {{ text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <h1>{title}</h1>
            <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            
            <div class="meta-grid">
                <div class="card">
                    <h3>Active Trains</h3>
                    <p>{train_count}</p>
                </div>
                <div class="card">
                    <h3>Active Conflicts</h3>
                    <p>{active_conflict_count}</p>
                </div>
                <div class="card">
                    <h3>Total Historical Conflicts</h3>
                    <p>{conflict_count}</p>
                </div>
                <div class="card">
                    <h3>Optimization Runs</h3>
                    <p>{opt_count}</p>
                </div>
            </div>

            <h2>Active Trains Sample</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Delay (min)</th>
                    </tr>
                </thead>
                <tbody>
        """
        for t in trains:
            html += f"""
                    <tr>
                        <td>{t.id}</td>
                        <td>{t.name}</td>
                        <td>{t.type}</td>
                        <td>{t.source} &rarr; {t.destination}</td>
                        <td>{t.status}</td>
                        <td>{t.delay}</td>
                    </tr>
            """
        html += """
                </tbody>
            </table>

            <h2>Recent Scheduling Conflicts</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Train A</th>
                        <th>Train B</th>
                        <th>Severity</th>
                        <th>Time</th>
                        <th>Resolved</th>
                    </tr>
                </thead>
                <tbody>
        """
        for c in conflicts:
            html += f"""
                    <tr>
                        <td>{c.id}</td>
                        <td>{c.type}</td>
                        <td>{c.train_a}</td>
                        <td>{c.train_b or "N/A"}</td>
                        <td>{c.severity}</td>
                        <td>{c.time}</td>
                        <td>{"Yes" if c.resolved else "No"}</td>
                    </tr>
            """
        html += f"""
                </tbody>
            </table>
            
            <div class="footer">
                <p>RailFlow AI Digital Twin Platform Control Command center. Confidential.</p>
            </div>
        </body>
        </html>
        """
        return html
