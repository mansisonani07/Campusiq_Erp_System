-- ============================================================
-- CampusIQ · Initial Schema Migration
-- ============================================================
-- Creates the full relational model, keys, indexes, and triggers.
-- Apply via:
--   supabase db push
-- or run this file from the SQL editor in the Supabase dashboard.
--
-- All domain tables use `serial` PKs except `profiles` which uses
-- the Supabase Auth user's uuid (auth.users.id).
-- ============================================================

-- Required extensions (idempotent)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Role enum (mirrors src/lib/rbac.ts)
-- ------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'faculty', 'parent', 'admin');
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- profiles — 1:1 with auth.users, drives RBAC.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        public.user_role not null default 'student',
  student_id  text,
  department  text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx       on public.profiles(role);
create index if not exists profiles_student_id_idx on public.profiles(student_id);

-- ------------------------------------------------------------
-- Core academic tables
-- ------------------------------------------------------------
create table if not exists public.students (
  id          serial primary key,
  student_id  text not null unique,
  full_name   text not null,
  email       text not null unique,
  phone       text,
  program     text,
  semester    integer check (semester between 1 and 12),
  cgpa        numeric(4, 2) check (cgpa between 0 and 10),
  status      text not null default 'active' check (status in ('active','inactive','alumni','suspended')),
  guardian    text,
  dob         date,
  address     text
);
create index if not exists students_program_idx  on public.students(program);
create index if not exists students_semester_idx on public.students(semester);
create index if not exists students_status_idx   on public.students(status);

create table if not exists public.faculty (
  id              serial primary key,
  full_name       text not null,
  email           text not null unique,
  phone           text,
  department      text,
  designation     text,
  qualification   text,
  courses_count   integer default 0,
  students_count  integer default 0,
  rating          numeric(3, 2) check (rating between 0 and 5),
  joined_on       date
);
create index if not exists faculty_dept_idx on public.faculty(department);

create table if not exists public.courses (
  id              serial primary key,
  code            text not null unique,
  title           text not null,
  description     text,
  faculty_name    text,
  semester        integer,
  credits         integer check (credits between 0 and 10),
  enrolled        integer default 0,
  total_sessions  integer default 0,
  sessions_done   integer default 0,
  program         text
);
create index if not exists courses_program_idx  on public.courses(program);
create index if not exists courses_semester_idx on public.courses(semester);

create table if not exists public.attendance (
  id             serial primary key,
  student_id     text not null,
  course_code    text not null,
  session_date   date not null,
  session_title  text,
  status         text not null check (status in ('present','absent','late','excused')),
  method         text check (method in ('biometric','QR','manual','RFID'))
);
create index if not exists attendance_student_idx on public.attendance(student_id);
create index if not exists attendance_course_idx  on public.attendance(course_code);
create index if not exists attendance_date_idx    on public.attendance(session_date);

create table if not exists public.timetable (
  id           serial primary key,
  day_index    integer not null check (day_index between 0 and 6),
  start_time   time not null,
  end_time     time,
  subject      text not null,
  course_code  text,
  faculty      text,
  room         text
);
create index if not exists timetable_day_idx on public.timetable(day_index);

create table if not exists public.fees (
  id          serial primary key,
  invoice_no  text not null unique,
  student_id  text not null,
  description text,
  amount      numeric(12, 2) not null check (amount >= 0),
  due_date    date,
  paid_on     date,
  status      text not null default 'pending' check (status in ('paid','pending','overdue','waived'))
);
create index if not exists fees_student_idx on public.fees(student_id);
create index if not exists fees_status_idx  on public.fees(status);
create index if not exists fees_due_idx     on public.fees(due_date);

create table if not exists public.exams (
  id             serial primary key,
  subject        text not null,
  course_code    text,
  exam_type      text check (exam_type in ('Quiz-1','Quiz-2','Mid-term','Final','Assignment Test','Viva')),
  exam_date      date not null,
  start_time     time,
  duration_min   integer check (duration_min > 0),
  room           text,
  semester       integer
);
create index if not exists exams_date_idx on public.exams(exam_date);

create table if not exists public.grades (
  id              serial primary key,
  student_id      text not null,
  course_code     text,
  course_title    text,
  marks           integer check (marks >= 0),
  max_marks       integer check (max_marks > 0),
  grade           text,
  grade_point     numeric(3, 2),
  semester_label  text
);
create index if not exists grades_student_idx on public.grades(student_id);

create table if not exists public.assignments (
  id            serial primary key,
  title         text not null,
  description   text,
  course_code   text,
  due_date      date,
  status        text not null default 'pending' check (status in ('pending','submitted','overdue','graded')),
  max_marks     integer check (max_marks > 0),
  marks         integer,
  submitted_on  date,
  student_id    text
);
create index if not exists assignments_student_idx on public.assignments(student_id);
create index if not exists assignments_status_idx  on public.assignments(status);

create table if not exists public.lms_modules (
  id              serial primary key,
  title           text not null,
  description     text,
  category        text,
  videos_count    integer default 0,
  readings_count  integer default 0,
  quizzes_count   integer default 0,
  progress_pct    integer check (progress_pct between 0 and 100),
  course_code     text
);
create index if not exists lms_course_idx on public.lms_modules(course_code);

create table if not exists public.library_books (
  id         serial primary key,
  title      text not null,
  author     text,
  isbn       text unique,
  category   text,
  status     text not null default 'available' check (status in ('available','borrowed','reserved','lost')),
  borrower   text,
  due_date   date
);
create index if not exists library_status_idx on public.library_books(status);

create table if not exists public.hostel (
  id             serial primary key,
  block          text not null,
  room_no        text not null,
  room_type      text check (room_type in ('Single','Double','Triple','Quad')),
  occupant_name  text,
  occupant_id    text,
  monthly_fee    numeric(10, 2) check (monthly_fee >= 0),
  status         text not null default 'vacant' check (status in ('occupied','vacant','maintenance')),
  unique (block, room_no)
);

create table if not exists public.transport (
  id           serial primary key,
  route_no     text not null unique,
  route_name   text,
  vehicle_no   text,
  driver_name  text,
  driver_phone text,
  capacity     integer check (capacity > 0),
  stops        text,
  next_pickup  text
);

create table if not exists public.payroll (
  id             serial primary key,
  employee_id    text not null,
  employee_name  text not null,
  designation    text,
  pay_period     text not null,
  basic          numeric(12, 2) not null default 0,
  allowances     numeric(12, 2) not null default 0,
  deductions     numeric(12, 2) not null default 0,
  net_pay        numeric(12, 2) generated always as (basic + allowances - deductions) stored,
  status         text not null default 'processing' check (status in ('paid','processing','held')),
  unique (employee_id, pay_period)
);
create index if not exists payroll_period_idx on public.payroll(pay_period);

create table if not exists public.notifications (
  id         serial primary key,
  title      text not null,
  body       text,
  priority   text not null default 'medium' check (priority in ('low','medium','high')),
  audience   text not null default 'all' check (audience in ('all','students','faculty','parents','admins')),
  channel    text not null default 'in_app' check (channel in ('in_app','email','sms','push')),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_audience_idx on public.notifications(audience);
create index if not exists notifications_created_idx  on public.notifications(created_at desc);

create table if not exists public.admissions (
  id            serial primary key,
  full_name     text not null,
  email         text not null,
  phone         text,
  program       text,
  guardian      text,
  score         numeric(5, 2) check (score between 0 and 100),
  essay         text,
  status        text not null default 'pending' check (status in ('pending','shortlisted','approved','rejected')),
  submitted_at  timestamptz not null default now()
);
create index if not exists admissions_status_idx on public.admissions(status);

create table if not exists public.workflows (
  id             serial primary key,
  reference_no   text unique,
  request_type   text,
  title          text not null,
  description    text,
  requester_name text,
  status         text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  current_step   integer default 1,
  total_steps    integer default 3,
  created_at     timestamptz not null default now()
);
create index if not exists workflows_status_idx on public.workflows(status);

create table if not exists public.documents (
  id           serial primary key,
  title        text not null,
  category     text,
  file_type    text,
  size_kb      integer,
  uploaded_at  timestamptz not null default now(),
  owner        text
);
create index if not exists documents_owner_idx on public.documents(owner);

create table if not exists public.messages (
  id         serial primary key,
  sender     text,
  recipient  text,
  subject    text,
  body       text,
  sent_at    timestamptz not null default now(),
  is_read    boolean not null default false
);
create index if not exists messages_recipient_idx on public.messages(recipient);
create index if not exists messages_sender_idx    on public.messages(sender);

-- ------------------------------------------------------------
-- Triggers: keep profiles.updated_at fresh
-- ------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- Auto-create a profile when a new auth.user signs up
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
