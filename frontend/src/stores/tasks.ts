import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Priority, Status, Task, TaskInput } from '../types'
import { dateKeyFromOffset } from '../utils/date'

function mock(
  id: string,
  title: string,
  subject: string,
  priority: Priority,
  status: Status,
  dueOffset: number,
  updatedHoursAgo: number,
): Task {
  const updated = new Date(Date.now() - updatedHoursAgo * 3600000).toISOString()
  return {
    id,
    title,
    description: `Work on: ${title}`,
    subject,
    priority,
    status,
    dueDate: dateKeyFromOffset(dueOffset),
    createdAt: new Date(Date.now() - (updatedHoursAgo + 48) * 3600000).toISOString(),
    updatedAt: updated,
  }
}

export const useTaskStore = defineStore('tasks', () => {
  // Mock data. Phase 5 replaces this with API calls.
  const tasks = ref<Task[]>([
    mock('1', 'Database ER diagram', 'Database', 'High', 'In Progress', 0, 2),
    mock('2', 'Read Chapter 5 - Networking', 'Networking', 'Medium', 'Pending', 0, 5),
    mock('3', 'Vue component quiz prep', 'Programming', 'Low', 'Completed', 0, 1),
    mock('4', 'Essay: Technology in Education', 'English', 'Medium', 'Pending', 2, 20),
    mock('5', 'SQL joins worksheet', 'Database', 'High', 'Pending', 1, 8),
    mock('6', 'Calculus problem set 4', 'Mathematics', 'High', 'In Progress', 3, 30),
    mock('7', 'Subnetting practice', 'Networking', 'Medium', 'Pending', 5, 40),
    mock('8', 'Build REST API lab', 'Programming', 'High', 'In Progress', 6, 12),
    mock('9', 'Group presentation slides', 'English', 'Medium', 'Pending', -1, 26),
    mock('10', 'Linear algebra notes', 'Mathematics', 'Low', 'Completed', -1, 3),
    mock('11', 'Normalization exercise', 'Database', 'Medium', 'Completed', -2, 50),
    mock('12', 'Git basics assignment', 'Programming', 'Low', 'Completed', -3, 70),
    mock('13', 'Vocabulary test', 'English', 'Low', 'Completed', -4, 90),
    mock('14', 'Network topology report', 'Networking', 'High', 'Completed', -5, 110),
    mock('15', 'Lab report', 'Programming', 'Medium', 'Completed', -6, 130),
  ])

  const total = computed(() => tasks.value.length)
  const pending = computed(() => tasks.value.filter((t) => t.status === 'Pending').length)
  const inProgress = computed(() => tasks.value.filter((t) => t.status === 'In Progress').length)
  const completed = computed(() => tasks.value.filter((t) => t.status === 'Completed').length)
  const completionRate = computed(() =>
    total.value === 0 ? 0 : Math.round((completed.value / total.value) * 100),
  )

  const todayTasks = computed(() => {
    const today = dateKeyFromOffset(0)
    return tasks.value.filter((t) => t.dueDate === today)
  })

  const upcoming = computed(() => {
    const today = dateKeyFromOffset(0)
    return tasks.value
      .filter((t) => t.status !== 'Completed' && t.dueDate !== today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  })

  const recentActivity = computed(() =>
    [...tasks.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
  )

  const weekly = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const offset = i - 6
      const key = dateKeyFromOffset(offset)
      const d = new Date()
      d.setDate(d.getDate() + offset)
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: tasks.value.filter((t) => t.dueDate === key && t.status === 'Completed').length,
        pending: tasks.value.filter((t) => t.dueDate === key && t.status !== 'Completed').length,
      }
    }),
  )

  function addTask(input: TaskInput) {
    const now = new Date().toISOString()
    tasks.value.unshift({ ...input, id: String(Date.now()), createdAt: now, updatedAt: now })
  }

  function updateTask(id: string, input: TaskInput) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) Object.assign(task, input, { updatedAt: new Date().toISOString() })
  }

  function deleteTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  function setStatus(id: string, status: Status) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
    }
  }

  function completeTask(id: string) {
    setStatus(id, 'Completed')
  }

  return {
    tasks, total, pending, inProgress, completed, completionRate,
    todayTasks, upcoming, recentActivity, weekly,
    addTask, updateTask, deleteTask, setStatus, completeTask,
  }
})
