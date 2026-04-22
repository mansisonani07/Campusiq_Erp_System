-- ============================================================
-- CampusIQ · Row-Level Security Policies
-- ============================================================
-- RLS is enabled on every public table. Default deny. Access is
-- granted explicitly by role via helper functions that read
-- public.profiles for the current authenticated user.
-- ============================================================

-- Helper: current user's role
create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: current user's linked student_id (for students and parents)
create or replace function public.current_student_id()
returns text language sql stable security definer set search_path = public as $$
  select student_id from public.profiles where id = auth.uid();
$$;

-- Helper: role check shortcuts
create or replace function public.is_admin()   returns boolean language sql stable as $$ select public.current_role() = 'admin' $$;
create or replace function public.is_faculty() returns boolean language sql stable as $$ select public.current_role() = 'faculty' $$;
create or replace function public.is_student() returns boolean language sql stable as $$ select public.current_role() = 'student' $$;
create or replace function public.is_parent()  returns boolean language sql stable as $$ select public.current_role() = 'parent' $$;

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.students      enable row level security;
alter table public.faculty       enable row level security;
alter table public.courses       enable row level security;
alter table public.attendance    enable row level security;
alter table public.timetable     enable row level security;
alter table public.fees          enable row level security;
alter table public.exams         enable row level security;
alter table public.grades        enable row level security;
alter table public.assignments   enable row level security;
alter table public.lms_modules   enable row level security;
alter table public.library_books enable row level security;
alter table public.hostel        enable row level security;
alter table public.transport     enable row level security;
alter table public.payroll       enable row level security;
alter table public.notifications enable row level security;
alter table public.admissions    enable row level security;
alter table public.workflows     enable row level security;
alter table public.documents     enable row level security;
alter table public.messages      enable row level security;

-- ------------------------------------------------------------
-- profiles — users see their own row; admins see all
-- ------------------------------------------------------------
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

-- ------------------------------------------------------------
-- students, faculty, courses, timetable —
--   any authenticated user can read; admins/faculty can write.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['students','faculty','courses','timetable','exams','lms_modules','library_books','hostel','transport'] loop
    execute format('drop policy if exists %1$I_read on public.%1$I;', t);
    execute format('create policy %1$I_read on public.%1$I for select using (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists %1$I_write on public.%1$I;', t);
    execute format($pol$
      create policy %1$I_write on public.%1$I for all
      using (public.is_admin() or public.is_faculty())
      with check (public.is_admin() or public.is_faculty());
    $pol$, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- attendance —
--   students / parents see their own student_id; faculty+admin see all.
-- ------------------------------------------------------------
drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance
  for select using (
    public.is_admin() or public.is_faculty()
    or (public.is_student() and student_id = public.current_student_id())
    or (public.is_parent()  and student_id = public.current_student_id())
  );

drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance
  for all using (public.is_admin() or public.is_faculty())
  with check (public.is_admin() or public.is_faculty());

-- ------------------------------------------------------------
-- fees — own records for student/parent; all for admin
-- ------------------------------------------------------------
drop policy if exists fees_read on public.fees;
create policy fees_read on public.fees
  for select using (
    public.is_admin()
    or ((public.is_student() or public.is_parent()) and student_id = public.current_student_id())
  );
drop policy if exists fees_write on public.fees;
create policy fees_write on public.fees
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists fees_student_update on public.fees;
create policy fees_student_update on public.fees
  for update using (public.is_student() and student_id = public.current_student_id())
  with check   (public.is_student() and student_id = public.current_student_id());

-- ------------------------------------------------------------
-- grades — students/parents see own; faculty + admin all.
-- ------------------------------------------------------------
drop policy if exists grades_read on public.grades;
create policy grades_read on public.grades
  for select using (
    public.is_admin() or public.is_faculty()
    or ((public.is_student() or public.is_parent()) and student_id = public.current_student_id())
  );
drop policy if exists grades_write on public.grades;
create policy grades_write on public.grades
  for all using (public.is_admin() or public.is_faculty())
  with check (public.is_admin() or public.is_faculty());

-- ------------------------------------------------------------
-- assignments — ownership scoped; faculty can write.
-- ------------------------------------------------------------
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments
  for select using (
    public.is_admin() or public.is_faculty()
    or ((public.is_student() or public.is_parent()) and student_id = public.current_student_id())
  );
drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments
  for all using (public.is_admin() or public.is_faculty())
  with check (public.is_admin() or public.is_faculty());
drop policy if exists assignments_student_update on public.assignments;
create policy assignments_student_update on public.assignments
  for update using (public.is_student() and student_id = public.current_student_id())
  with check   (public.is_student() and student_id = public.current_student_id());

-- ------------------------------------------------------------
-- payroll — admin only
-- ------------------------------------------------------------
drop policy if exists payroll_admin on public.payroll;
create policy payroll_admin on public.payroll
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- notifications — any authenticated user reads; admin/faculty writes
-- ------------------------------------------------------------
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications
  for select using (auth.role() = 'authenticated');
drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications
  for all using (public.is_admin() or public.is_faculty())
  with check (public.is_admin() or public.is_faculty());

-- ------------------------------------------------------------
-- admissions — public INSERT (applicants), admin-only read/update
-- ------------------------------------------------------------
drop policy if exists admissions_public_insert on public.admissions;
create policy admissions_public_insert on public.admissions
  for insert to anon, authenticated with check (true);
drop policy if exists admissions_admin_all on public.admissions;
create policy admissions_admin_all on public.admissions
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- workflows — requester sees own; faculty/admin approve
-- ------------------------------------------------------------
drop policy if exists workflows_read on public.workflows;
create policy workflows_read on public.workflows
  for select using (
    public.is_admin() or public.is_faculty()
    or requester_name = (select full_name from public.profiles where id = auth.uid())
  );
drop policy if exists workflows_insert on public.workflows;
create policy workflows_insert on public.workflows
  for insert with check (auth.role() = 'authenticated');
drop policy if exists workflows_update on public.workflows;
create policy workflows_update on public.workflows
  for update using (public.is_admin() or public.is_faculty())
  with check (public.is_admin() or public.is_faculty());

-- ------------------------------------------------------------
-- documents — owner sees own; admin all
-- ------------------------------------------------------------
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
  for select using (
    public.is_admin() or public.is_faculty()
    or ((public.is_student() or public.is_parent()) and owner = public.current_student_id())
  );
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- messages — sender or recipient email matches
-- ------------------------------------------------------------
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (
    public.is_admin()
    or sender    = (select email from public.profiles where id = auth.uid())
    or recipient = (select email from public.profiles where id = auth.uid())
  );
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    auth.role() = 'authenticated' and
    sender = (select email from public.profiles where id = auth.uid())
  );
