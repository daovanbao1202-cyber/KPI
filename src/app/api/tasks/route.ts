import { NextResponse } from 'next/server';
import { getSession, requireSession } from '@/lib/auth-server';
import {
  ASSIGNEE_EDITABLE_FIELDS,
  deleteTask,
  findTask,
  listTasks,
  normalizeProgress,
  normalizeStatus,
  upsertTasks,
  type Task,
} from '@/lib/task-store';

export const runtime = 'nodejs';

/**
 * Task assignments.
 *
 * Managers and Admins create, assign and delete. Everyone else may move their
 * own task along — status and progress only — and nothing on anyone else's.
 * That rule is enforced here rather than by hiding buttons, so it holds even if
 * a request is made directly.
 */

function canManage(role: string | undefined) {
  return role === 'Admin' || role === 'Manager';
}

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  return NextResponse.json({ tasks: await listTasks() });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession('Manager');
  if (error) return error;

  try {
    const body = await request.json();

    if (!String(body.title ?? '').trim()) {
      return NextResponse.json({ error: 'Tên công việc không được để trống.' }, { status: 400 });
    }

    const existing = await listTasks();
    const task: Partial<Task> = {
      id: String(body.id || `task-${Date.now()}-${existing.length}`),
      title: String(body.title).trim(),
      description: String(body.description ?? ''),
      assigneeId: body.assigneeId != null ? Number(body.assigneeId) : null,
      kpiId: body.kpiId ? String(body.kpiId) : null,
      status: normalizeStatus(body.status),
      priority: body.priority,
      startDate: body.startDate || null,
      dueDate: body.dueDate || null,
      progress: normalizeProgress(body.progress),
      createdBy: session.uid,
      position: existing.length,
    };

    const failure = await upsertTasks([task]);
    if (failure) return NextResponse.json({ error: failure }, { status: 500 });

    return NextResponse.json({ task });
  } catch (thrown) {
    return NextResponse.json({ error: (thrown as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body.id ?? '');
    if (!id) return NextResponse.json({ error: 'Thiếu id công việc.' }, { status: 400 });

    const current = await findTask(id);
    if (!current) return NextResponse.json({ error: 'Không tìm thấy công việc.' }, { status: 404 });

    if (canManage(session.role)) {
      const merged: Task = {
        ...current,
        title: body.title !== undefined ? String(body.title).trim() || current.title : current.title,
        description: body.description !== undefined ? String(body.description) : current.description,
        assigneeId: body.assigneeId !== undefined ? Number(body.assigneeId) || null : current.assigneeId,
        kpiId: body.kpiId !== undefined ? (body.kpiId ? String(body.kpiId) : null) : current.kpiId,
        status: body.status !== undefined ? normalizeStatus(body.status) : current.status,
        priority: body.priority !== undefined ? body.priority : current.priority,
        startDate: body.startDate !== undefined ? body.startDate || null : current.startDate,
        dueDate: body.dueDate !== undefined ? body.dueDate || null : current.dueDate,
        progress: body.progress !== undefined ? normalizeProgress(body.progress) : current.progress,
      };

      const failure = await upsertTasks([merged]);
      if (failure) return NextResponse.json({ error: failure }, { status: 500 });
      return NextResponse.json({ task: merged });
    }

    // Assignee: their own task, and only the fields they own.
    if (current.assigneeId !== session.uid) {
      return NextResponse.json(
        { error: 'Bạn chỉ cập nhật được công việc được giao cho mình.' },
        { status: 403 }
      );
    }

    const attempted = Object.keys(body).filter(
      (field) => field !== 'id' && !ASSIGNEE_EDITABLE_FIELDS.includes(field as 'status' | 'progress')
    );
    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `Bạn chỉ đổi được trạng thái và tiến độ. Không sửa được: ${attempted.join(', ')}.` },
        { status: 403 }
      );
    }

    const merged: Task = {
      ...current,
      status: body.status !== undefined ? normalizeStatus(body.status) : current.status,
      progress: body.progress !== undefined ? normalizeProgress(body.progress) : current.progress,
    };

    const failure = await upsertTasks([merged]);
    if (failure) return NextResponse.json({ error: failure }, { status: 500 });
    return NextResponse.json({ task: merged });
  } catch (thrown) {
    return NextResponse.json({ error: (thrown as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireSession('Manager');
  if (error) return error;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Thiếu id công việc.' }, { status: 400 });

    const failure = await deleteTask(String(id));
    if (failure) return NextResponse.json({ error: failure }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (thrown) {
    return NextResponse.json({ error: (thrown as Error).message }, { status: 500 });
  }
}
