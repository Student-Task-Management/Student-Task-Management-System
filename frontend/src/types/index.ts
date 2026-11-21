export type Priority = 'Low' | 'Medium' | 'High'
export type Status = 'Pending' | 'In Progress' | 'Completed'

export interface Task {
  id: string
  title: string
  description: string
  subject: string
  priority: Priority
  status: Status
  dueDate: string // format: YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

// What the form sends when creating or editing a task
export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

export interface Subject {
  id: string
  name: string
  color: string
  description: string
}
