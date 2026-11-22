import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, getErrorMessage } from '../services/api'
import type { Status, Task, TaskInput } from '../types'
import { dateKeyFromOffset } from '../utils/date'
import { useUiStore } from './ui'

export const useTaskStore = defineStore('tasks', () => {
  const ui = useUiStore()

  const tasks = ref<Task[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.get('/tasks')
      tasks.value = data.data.tasks
      loaded.value = true
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  // ---------- Numbers for the dashboard, calculated from the real tasks ----------
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

  // ---------- Changes, saved in the database through the API ----------
  function replace(task: Task) {
    const i = tasks.value.findIndex((t) => t.id === task.id)
    if (i >= 0) tasks.value[i] = task
  }

  // addTask and updateTask throw on failure, so the form can show the error
  async function addTask(input: TaskInput) {
    try {
      const { data } = await api.post('/tasks', input)
      tasks.value.unshift(data.data.task)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async function updateTask(id: string, input: TaskInput) {
    try {
      const { data } = await api.put(`/tasks/${id}`, input)
      replace(data.data.task)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  // deleteTask and setStatus show their own error message and return true or false
  async function deleteTask(id: string): Promise<boolean> {
    try {
      await api.delete(`/tasks/${id}`)
      tasks.value = tasks.value.filter((t) => t.id !== id)
      ui.toast('Task deleted')
      return true
    } catch (e) {
      ui.toast(getErrorMessage(e), 'error')
      return false
    }
  }

  async function setStatus(id: string, status: Status): Promise<boolean> {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return false
    if (task.status === status) return true
    try {
      const { data } = await api.put(`/tasks/${id}`, {
        title: task.title,
        description: task.description,
        subjectId: task.subjectId,
        priority: task.priority,
        status,
        dueDate: task.dueDate,
      })
      replace(data.data.task)
      return true
    } catch (e) {
      ui.toast(getErrorMessage(e), 'error')
      return false
    }
  }

  const completeTask = (id: string) => setStatus(id, 'Completed')

  // The server already deleted these tasks together with their subject
  function removeBySubject(subjectId: string) {
    tasks.value = tasks.value.filter((t) => t.subjectId !== subjectId)
  }

  function reset() {
    tasks.value = []
    loaded.value = false
    loading.value = false
    error.value = ''
  }

  return {
    tasks, loaded, loading, error, load,
    total, pending, inProgress, completed, completionRate,
    todayTasks, upcoming, recentActivity, weekly,
    addTask, updateTask, deleteTask, setStatus, completeTask, removeBySubject, reset,
  }
})
