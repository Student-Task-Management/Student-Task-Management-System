import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task } from '../types'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

// Controls the create/edit panel and the toast messages
export const useUiStore = defineStore('ui', () => {
  const taskPanelOpen = ref(false)
  const editingTask = ref<Task | null>(null)
  const defaultDueDate = ref<string | null>(null)
  const toasts = ref<Toast[]>([])

  function openCreate(dueDate?: string) {
    editingTask.value = null
    defaultDueDate.value = dueDate ?? null
    taskPanelOpen.value = true
  }

  function openEdit(task: Task) {
    editingTask.value = task
    taskPanelOpen.value = true
  }

  function closeTaskPanel() {
    taskPanelOpen.value = false
  }

  function toast(message: string, type: Toast['type'] = 'success') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 3000)
  }

  return { taskPanelOpen, editingTask, defaultDueDate, toasts, openCreate, openEdit, closeTaskPanel, toast }
})
