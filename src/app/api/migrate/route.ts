import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);

    console.log('Starting migration...');

    // 1. Migrate Users
    if (data.users && data.users.length > 0) {
      const { error: userError } = await supabase.from('users').upsert(
        data.users.map((u: any) => ({
          id: u.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          role: u.role,
          department: u.department,
          position: u.position,
          avatar: u.avatar
        }))
      );
      if (userError) throw userError;
      console.log('Users migrated');
    }

    // 2. Migrate KPI Definitions
    if (data.kpiDefs && data.kpiDefs.length > 0) {
      const { error: kpiError } = await supabase.from('kpi_definitions').upsert(
        data.kpiDefs.map((k: any) => ({
          id: k.id,
          name: k.name,
          unit: k.unit,
          description: k.description,
          icon: k.icon,
          frequency: k.frequency,
          format: k.format,
          direction: k.direction,
          category: k.category,
          aggregation: k.aggregation,
          thresholds: k.thresholds,
          working_days: k.workingDays,
          formula: k.formula,
          calculate_this_target: k.calculateThisTarget,
          has_target: k.hasTarget
        }))
      );
      if (kpiError) throw kpiError;
      console.log('KPI Definitions migrated');
    }

    // 3. Migrate User Actuals (Filter out actuals pointing to non-existent KPIs)
    if (data.userActuals && data.userActuals.length > 0) {
      const validKpiIds = new Set(data.kpiDefs?.map((k: any) => k.id) || []);
      const filteredActuals = data.userActuals.filter((a: any) => validKpiIds.has(a.kpiId));
      
      if (filteredActuals.length > 0) {
        const { error: actualError } = await supabase.from('user_actuals').upsert(
          filteredActuals.map((a: any) => ({
            id: a.id,
            kpi_id: a.kpiId,
            user_id: a.userId,
            date: a.date,
            actual_value: a.actualValue
          }))
        );
        if (actualError) throw actualError;
        console.log(`User Actuals migrated (${filteredActuals.length} records)`);
      }
    }

    // 4. Migrate User Targets (Filter out targets pointing to non-existent KPIs)
    if (data.userTargets && data.userTargets.length > 0) {
      const validKpiIds = new Set(data.kpiDefs?.map((k: any) => k.id) || []);
      const filteredTargets = data.userTargets.filter((t: any) => validKpiIds.has(t.kpiId));

      if (filteredTargets.length > 0) {
        const { error: targetError } = await supabase.from('user_targets').upsert(
          filteredTargets.map((t: any) => ({
            id: t.id,
            kpi_id: t.kpiId,
            user_id: t.userId,
            date_key: t.dateKey,
            target_value: t.targetValue
          }))
        );
        if (targetError) throw targetError;
        console.log(`User Targets migrated (${filteredTargets.length} records)`);
      }
    }

    // 5. Migrate Dashboard Charts
    if (data.dashboardCharts && data.dashboardCharts.length > 0) {
      const { error: chartError } = await supabase.from('dashboard_charts').upsert(
        data.dashboardCharts.map((c: any) => ({
          id: c.id,
          type: c.type,
          kpi_id: c.kpiId,
          kpi_ids: c.kpiIds,
          title: c.title,
          date_range: c.dateRange
        }))
      );
      if (chartError) throw chartError;
      console.log('Dashboard Charts migrated');
    }

    return NextResponse.json({ message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
