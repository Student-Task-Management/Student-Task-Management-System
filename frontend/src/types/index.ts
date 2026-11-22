export type Priority = 'Low' | 'Medium' | 'High'
export type Status = 'Pending' | 'In Progress' | 'Completed'

export interface Task {
  id: string
  title: string
  description: string
  subjectId: string
  priority: Priority
  status: Status
  dueDate: string // format: YYYY-MM-DD
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// What the form sends when creating or editing a task
export type TaskInput = Omit<Task, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>

export interface Subject {
  id: string
  name: string
  color: string
  description: string
}

export type SubjectInput = Omit<Subject, 'id'>
