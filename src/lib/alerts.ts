import { calculateTrend } from './kpi';

export interface Alert {
  id: string;
  kpiName: string;
  message: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
}

export async function sendEmailAlert(userEmail: string, userName: string, kpiName: string, completion: number) {
  // Simulation of an API call to a backend service like SendGrid, Mailchimp, or AWS SES
  console.log(`[EMAIL SIMULATOR] Sending warning to ${userEmail}...`);
  
  const emailContent = {
    subject: `⚠️ KPI Performance Alert: ${kpiName}`,
    body: `
      Hello ${userName},
      
      This is an automated alert from the K-Pulse Platform.
      Your current performance for "${kpiName}" is at ${completion.toFixed(1)}%, which is below the monthly target.
      
      Please review your dashboard and take necessary actions to stay on track.
      
      Best regards,
      Management Team
    `
  };

  // Logic to simulate a network request
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[EMAIL SIMULATOR] Email successfully sent to ${userEmail}`);
      resolve({ success: true, timestamp: new Date() });
    }, 1500);
  });
}

export function checkThresholds(kpis: any[]): Alert[] {
  const alerts: Alert[] = [];
  
  kpis.forEach(kpi => {
    if (kpi.actual === undefined || kpi.target === undefined || kpi.target === 0) return;
    
    const higherIsBetter = kpi.name !== 'Customer Churn';
    const completion = higherIsBetter 
      ? (kpi.actual / kpi.target) * 100 
      : (kpi.target / kpi.actual) * 100;
    
    if (completion < 80) {
      alerts.push({
        id: `alert-crit-${kpi.id}-${Date.now()}`,
        kpiName: kpi.name,
        message: `Critical: "${kpi.name}" is only at ${completion.toFixed(1)}%! Immediate action required.`,
        type: 'critical',
        timestamp: new Date(),
        read: false
      });
    } else if (completion < 95) {
      alerts.push({
        id: `alert-warn-${kpi.id}-${Date.now()}`,
        kpiName: kpi.name,
        message: `Warning: "${kpi.name}" is falling behind target (${completion.toFixed(1)}%).`,
        type: 'warning',
        timestamp: new Date(),
        read: false
      });
    }
  });
  
  return alerts;
}
