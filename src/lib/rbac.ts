/**
 * CampusIQ RBAC policy.
 *
 * Four roles — student, faculty, parent, admin.
 * Every page + every record category has an explicit visibility rule.
 * Omni-Search, the sidebar, and protected routes all derive their
 * behavior from this single source of truth.
 */

import type { Role } from './session';

export type Resource =
  | 'dashboard' | 'timetable' | 'attendance' | 'assignments' | 'exams' | 'lms' | 'fees'
  | 'library' | 'hostel' | 'transport' | 'students' | 'faculty' | 'courses' | 'admissions'
  | 'payroll' | 'workflows' | 'analytics' | 'reports' | 'notifications' | 'messages'
  | 'documents' | 'settings' | 'account_approvals';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'download' | 'approve';

/** True → role may perform action on resource. */
export function can(role: Role, resource: Resource, action: Action = 'view'): boolean {
  const policy: Record<Role, Partial<Record<Resource, Action[]>>> = {
    student: {
      dashboard: ['view'],
      timetable: ['view'],
      attendance: ['view'],
      assignments: ['view', 'edit'],      // can submit own
      exams: ['view'],
      lms: ['view'],
      fees: ['view', 'download'],         // own receipts only
      library: ['view', 'edit'],          // borrow / return
      hostel: ['view'],
      transport: ['view'],
      notifications: ['view'],
      messages: ['view', 'create'],
      documents: ['view', 'download'],
      settings: ['view', 'edit'],
    },
    faculty: {
      dashboard: ['view'],
      timetable: ['view'],
      attendance: ['view', 'create', 'edit'],
      assignments: ['view', 'create', 'edit', 'delete'],
      exams: ['view', 'create', 'edit'],
      lms: ['view', 'create', 'edit'],
      students: ['view'],
      courses: ['view', 'edit'],
      workflows: ['view', 'approve'],
      notifications: ['view', 'create'],
      messages: ['view', 'create'],
      documents: ['view', 'download'],
      settings: ['view', 'edit'],
    },
    parent: {
      dashboard: ['view'],
      attendance: ['view'],
      exams: ['view'],
      fees: ['view', 'download'],
      transport: ['view'],
      notifications: ['view'],
      messages: ['view', 'create'],
      documents: ['view', 'download'],
      settings: ['view', 'edit'],
    },
    admin: {
      dashboard: ['view'],
      timetable: ['view', 'create', 'edit', 'delete'],
      students: ['view', 'create', 'edit', 'delete'],
      faculty: ['view', 'create', 'edit', 'delete'],
      admissions: ['view', 'create', 'edit', 'delete', 'approve'],
      courses: ['view', 'create', 'edit', 'delete'],
      fees: ['view', 'create', 'edit', 'delete', 'download'],
      payroll: ['view', 'create', 'edit', 'delete', 'download'],
      library: ['view', 'create', 'edit', 'delete'],
      hostel: ['view', 'create', 'edit', 'delete'],
      transport: ['view', 'create', 'edit', 'delete'],
      workflows: ['view', 'approve'],
      account_approvals: ['view', 'approve'],
      analytics: ['view'],
      reports: ['view', 'download'],
      notifications: ['view', 'create'],
      messages: ['view', 'create'],
      documents: ['view', 'create', 'edit', 'delete', 'download'],
      settings: ['view', 'edit'],
      attendance: ['view'],
      assignments: ['view'],
      exams: ['view'],
      lms: ['view'],
    },
  };
  const allowed = policy[role]?.[resource];
  return !!allowed && allowed.includes(action);
}

/** Resource → in-app route. */
export const routeFor: Record<Resource, string> = {
  dashboard: '/app/dashboard',
  timetable: '/app/timetable',
  attendance: '/app/attendance',
  assignments: '/app/assignments',
  exams: '/app/exams',
  lms: '/app/lms',
  fees: '/app/fees',
  library: '/app/library',
  hostel: '/app/hostel',
  transport: '/app/transport',
  students: '/app/students',
  faculty: '/app/faculty',
  courses: '/app/courses',
  admissions: '/app/admissions',
  payroll: '/app/payroll',
  workflows: '/app/workflows',
  account_approvals: '/app/account-approvals',
  analytics: '/app/analytics',
  reports: '/app/reports',
  notifications: '/app/notifications',
  messages: '/app/messages',
  documents: '/app/documents',
  settings: '/app/settings',
};

export type RecordGroup =
  | 'pages' | 'students' | 'faculty' | 'courses' | 'books' | 'fees' | 'documents'
  | 'exams' | 'assignments' | 'rooms' | 'routes' | 'notifications' | 'workflows'
  | 'admissions' | 'payroll' | 'messages' | 'timetable';

/**
 * Which record-categories this role is allowed to see in the Omni-Search
 * (search-level data isolation — enforced in addition to page-level RBAC).
 */
export function searchableGroups(role: Role): RecordGroup[] {
  switch (role) {
    case 'student':
      return ['pages', 'courses', 'books', 'fees', 'documents', 'exams', 'assignments', 'notifications', 'timetable', 'messages'];
    case 'faculty':
      return ['pages', 'students', 'courses', 'books', 'documents', 'exams', 'assignments', 'workflows', 'notifications', 'timetable', 'messages'];
    case 'parent':
      return ['pages', 'fees', 'documents', 'exams', 'notifications', 'timetable', 'messages', 'routes'];
    case 'admin':
      return ['pages', 'students', 'faculty', 'courses', 'books', 'fees', 'documents', 'exams', 'assignments', 'rooms', 'routes', 'notifications', 'workflows', 'admissions', 'payroll', 'messages', 'timetable'];
  }
}

/**
 * Role + identity predicate: is this *specific* record visible to the user?
 * Owns/scopes so searches don't leak cross-user data.
 */
export function canSeeRecord(params: {
  role: Role;
  studentId?: string;
  email?: string;
  record: { group: RecordGroup; ownerStudentId?: string; recipient?: string; sender?: string };
}): boolean {
  const { role, studentId, email, record } = params;
  // Admin + faculty can see everything their groups allow
  if (role === 'admin') return true;
  if (role === 'faculty') return true;

  // Student: restrict personal categories to own records
  if (role === 'student') {
    if (record.group === 'fees' || record.group === 'assignments' || record.group === 'documents') {
      if (record.ownerStudentId && studentId && record.ownerStudentId !== studentId) return false;
    }
    if (record.group === 'messages') {
      if (record.recipient && email && record.recipient !== email && record.sender !== email) return false;
    }
    return true;
  }

  // Parent: only messages to self + documents of ward + ward's fees.
  // We model the parent as linked to studentId on the session.
  if (role === 'parent') {
    if (record.group === 'fees' || record.group === 'documents') {
      if (record.ownerStudentId && studentId && record.ownerStudentId !== studentId) return false;
    }
    if (record.group === 'messages') {
      if (record.recipient && email && record.recipient !== email && record.sender !== email) return false;
    }
    return true;
  }
  return false;
}

/** Human label for a role. */
export function roleLabel(role: Role): string {
  return ({ student: 'Student', faculty: 'Faculty', parent: 'Parent', admin: 'Super Admin' } as const)[role];
}
