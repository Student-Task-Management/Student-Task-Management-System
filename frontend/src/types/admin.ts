import type { Priority, Status } from './index'

export type Role = 'user' | 'admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  disabled: boolean
  createdAt: string
  taskCount: number
  completedCount: number
}

export interface Totals {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
}

export interface ActivityDay {
  date: string
  label: string
  signups: number
  tasksCreated: number
  tasksCompleted: number
}

export interface AdminStats {
  students: { total: number; active: number; disabled: number; admins: number; newThisWeek: number }
  tasks: Totals & { completionRate: number }
  subjects: { total: number; catalog: number }
  activity: ActivityDay[]
  priorities: Record<string, number>
  topSubjects: { name: string; color: string; count: number }[]
  recentUsers: { id: string; name: string; email: string; createdAt: string; disabled?: boolean }[]
}

export interface TaskSubject {
  name: string
  color: string
}

export interface TaskOwner {
  id: string
  name: string
  email: string
}

export interface AdminTask {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  overdue: boolean
  user: TaskOwner | null
  subject: TaskSubject | null
}

export type RecentTask = Omit<AdminTask, 'user'>

export interface CatalogSubject {
  id: string
  name: string
  color: string
  description: string
  studentCount: number
}
