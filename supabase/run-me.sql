-- =============================================================================
-- CHẠY MỘT LẦN — gom mọi thay đổi cơ sở dữ liệu còn thiếu
--
-- Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file
--            này → Ctrl+Enter
--
-- An toàn khi chạy lại nhiều lần: mọi lệnh đều dùng "if not exists".
-- KHÔNG xoá dữ liệu nào.
-- =============================================================================

-- 1. Cột thứ tự cho biểu đồ dashboard (cho tính năng kéo thả sắp xếp) ----------
alter table public.dashboard_charts
  add column if not exists position integer;

-- 2. Nhóm phân loại người dùng ------------------------------------------------
-- Trước đây chỉ nằm trong trình duyệt, mở máy khác là mất.
create table if not exists public.kpi_groups (
  id text primary key,
  name text not null
);

create table if not exists public.kpi_group_items (
  id text primary key,
  group_id text not null,
  name text not null
);

create index if not exists kpi_group_items_group_idx
  on public.kpi_group_items (group_id);

-- 3. Bảng giao việc -----------------------------------------------------------
-- kpi_id cố tình KHÔNG đặt khoá ngoại: xoá một KPI không được phép làm hỏng
-- hay xoá lây sang danh sách công việc của ai đó.
create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  assignee_id bigint,
  kpi_id text,
  status text not null default 'todo',
  priority text not null default 'medium',
  start_date text,
  due_date text,
  progress integer not null default 0,
  created_by bigint,
  created_at timestamptz not null default now(),
  position integer
);

create index if not exists tasks_assignee_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);

-- 4. Kiểm chứng ---------------------------------------------------------------
select
  (select count(*) from information_schema.columns
     where table_name = 'dashboard_charts' and column_name = 'position') as cot_position,
  (select count(*) from information_schema.tables
     where table_name = 'kpi_groups')      as bang_kpi_groups,
  (select count(*) from information_schema.tables
     where table_name = 'kpi_group_items') as bang_kpi_group_items,
  (select count(*) from information_schema.tables
     where table_name = 'tasks')           as bang_tasks;
-- Cả 4 cột phải trả về 1.
