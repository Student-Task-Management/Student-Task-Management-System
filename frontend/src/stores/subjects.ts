import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getErrorMessage } from '../services/api'
import type { Subject, SubjectInput } from '../types'

export const useSubjectStore = defineStore('subjects', () => {
  const subjects = ref<Subject[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.get('/subjects')
      subjects.value = data.data.subjects
      loaded.value = true
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  const colorOf = (id: string) => subjects.value.find((s) => s.id === id)?.color ?? '#94a3b8'
  const nameOf = (id: string) => subjects.value.find((s) => s.id === id)?.name ?? 'Unknown subject'

  async function addSubject(input: SubjectInput) {
    try {
      const { data } = await api.post('/subjects', input)
      subjects.value.push(data.data.subject)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async function updateSubject(id: string, input: SubjectInput) {
    try {
      const { data } = await api.put(`/subjects/${id}`, input)
      const i = subjects.value.findIndex((s) => s.id === id)
      if (i >= 0) subjects.value[i] = data.data.subject
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  // The server deletes the subject's tasks too
  async function deleteSubject(id: string) {
    try {
      await api.delete(`/subjects/${id}`)
      subjects.value = subjects.value.filter((s) => s.id !== id)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  function reset() {
    subjects.value = []
    loaded.value = false
    loading.value = false
    error.value = ''
  }

  return { subjects, loaded, loading, error, load, colorOf, nameOf, addSubject, updateSubject, deleteSubject, reset }
})
