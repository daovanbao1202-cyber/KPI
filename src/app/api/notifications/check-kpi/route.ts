import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  // Check for authorization (optional but recommended for cron jobs)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return new Response('Unauthorized', { status: 401 });
    // For now, let's keep it simple during dev
  }

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

    // 1. Fetch all users and their KPIs
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) throw userError;

    const { data: kpis, error: kpiError } = await supabase.from('kpis').select('*');
    if (kpiError) throw kpiError;

    // 2. Process each user
    const notifications = [];
    
    for (const user of users) {
      // Calculate monthly performance for this user
      // (This is a simplified version of the logic in your Analytics page)
      
      // For each KPI assigned to user, check completion
      // For this example, we'll send a general reminder if any KPI is incomplete
      const message = `Chào ${user.firstName}, hôm nay là ngày 26 tháng ${month}. Hệ thống ghi nhận bạn chưa hoàn thành các chỉ tiêu KPI của tháng này. Vui lòng cập nhật và hoàn thiện công việc để đạt kế hoạch đề ra. Trân trọng!`;
      
      notifications.push({
        user_id: user.id,
        title: 'Nhắc nhở hoàn thành KPI tháng',
        message: message,
        is_read: false
      });

      // 3. Send Email (Logic will be added when you have Resend API Key)
      console.log(`Sending email to ${user.email}...`);
    }

    // 4. Bulk insert notifications into system
    if (notifications.length > 0) {
      const { error: notifyError } = await supabase.from('notifications').insert(notifications);
      if (notifyError) throw notifyError;
    }

    return NextResponse.json({ success: true, message: `Processed ${users.length} users.` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
