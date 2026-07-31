import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase, isOnline } from '@/lib/supabase';
import { NOTIFICATIONS_FILE, readJsonFile, writeJsonFile } from '@/lib/local-store';
import { listUsers, type ServerUser } from '@/lib/server-users';
import { requireSession } from '@/lib/auth-server';

export const runtime = 'nodejs';

const FROM_ADDRESS = process.env.RESEND_FROM || 'KPI System <onboarding@resend.dev>';

interface NotificationRecord {
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured — emails will be skipped.');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Only Vercel Cron (or a caller holding CRON_SECRET) may trigger the monthly
 * blast. Without this the endpoint let anyone email every employee at will.
 */
function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret configured: allow only outside production so local dev works.
    return process.env.NODE_ENV !== 'production';
  }
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Writes to Supabase when configured, otherwise to the local JSON file. */
async function persistNotifications(notifications: NotificationRecord[]): Promise<void> {
  if (notifications.length === 0) return;

  if (isOnline) {
    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) throw error;
    return;
  }

  const existing = await readJsonFile<Record<string, unknown>[]>(NOTIFICATIONS_FILE, []);
  const stamped = notifications.map((notification, index) => ({
    ...notification,
    id: `notif-${Date.now()}-${index}`,
    created_at: new Date().toISOString(),
  }));

  const written = await writeJsonFile(NOTIFICATIONS_FILE, [...stamped, ...existing]);
  if (!written) {
    throw new Error(
      'Không lưu được thông báo: Supabase chưa cấu hình và hệ thống tệp ở chế độ chỉ đọc.'
    );
  }
}

async function sendEmails(
  resend: Resend | null,
  recipients: ServerUser[],
  subject: string,
  message: string
): Promise<string[]> {
  if (!resend) {
    return ['Cảnh báo: RESEND_API_KEY chưa được cấu hình nên hệ thống không gửi được email.'];
  }

  const errors: string[] = [];
  const html = `<p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`;

  for (const user of recipients) {
    if (!user.email) continue;
    try {
      const result = await resend.emails.send({
        from: FROM_ADDRESS,
        to: user.email,
        subject,
        html,
      });
      if (result.error) {
        errors.push(`${user.email}: ${result.error.message || 'lỗi không xác định'}`);
      }
    } catch (error) {
      errors.push(`${user.email}: ${(error as Error).message}`);
    }
  }

  return errors;
}

/** Monthly reminder, triggered by Vercel Cron. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resend = getResendClient();
    const now = new Date();
    const users = await listUsers();

    const notifications: NotificationRecord[] = [];
    const emailErrors: string[] = [];

    for (const user of users) {
      const message =
        `Chào ${user.firstName}, hôm nay là ngày ${now.getDate()} tháng ${now.getMonth() + 1}. ` +
        'Hệ thống ghi nhận bạn chưa hoàn thành các chỉ tiêu KPI của tháng này. ' +
        'Vui lòng cập nhật và hoàn thiện công việc để đạt kế hoạch đề ra. Trân trọng!';

      notifications.push({
        user_id: user.id,
        title: 'Nhắc nhở hoàn thành KPI tháng',
        message,
        is_read: false,
      });

      emailErrors.push(...(await sendEmails(resend, [user], 'Nhắc nhở hoàn thành KPI tháng', message)));
    }

    await persistNotifications(notifications);

    return NextResponse.json({
      success: true,
      message: `Đã xử lý ${users.length} người dùng.`,
      errors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

/** Ad-hoc notification sent by an Admin from the dashboard. */
export async function POST(request: Request) {
  const { error: authError } = await requireSession('Admin');
  if (authError) return authError;

  try {
    const { userIds, title, message } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Chưa chọn người nhận.' }, { status: 400 });
    }

    const resolvedTitle = String(title || 'Thông báo từ hệ thống');
    const resolvedMessage = String(message ?? '');
    const targetIds = userIds.map(Number);

    const recipients = (await listUsers()).filter((user) => targetIds.includes(user.id));

    await persistNotifications(
      targetIds.map((userId) => ({
        user_id: userId,
        title: resolvedTitle,
        message: resolvedMessage,
        is_read: false,
      }))
    );

    const emailErrors = await sendEmails(getResendClient(), recipients, resolvedTitle, resolvedMessage);

    if (emailErrors.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Đã lưu thông báo, nhưng gặp lỗi khi gửi email.',
        errors: emailErrors,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi thông báo và email thành công cho ${targetIds.length} người dùng.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
