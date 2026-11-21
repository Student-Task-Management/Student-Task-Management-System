import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Subject } from '../types'

export type SubjectInput = Omit<Subject, 'id'>

export const useSubjectStore = defineStore('subjects', () => {
  // Mock data. Phase 5 replaces this with API calls.
  const subjects = ref<Subject[]>([
    { id: 's1', name: 'Programming', color: '#6366f1', description: 'Web development and coding labs' },
    { id: 's2', name: 'Database', color: '#0ea5e9', description: 'SQL, ER diagrams and MongoDB' },
    { id: 's3', name: 'English', color: '#f59e0b', description: 'Essays, reports and presentations' },
    { id: 's4', name: 'Networking', color: '#10b981', description: 'Protocols, subnetting and topology' },
    { id: 's5', name: 'Mathematics', color: '#ec4899', description: 'Calculus and linear algebra' },
  ])

  function colorOf(name: string): string {
    return subjects.value.find((s) => s.name === name)?.color ?? '#94a3b8'
  }

  function addSubject(input: SubjectInput) {
    subjects.value.push({ ...input, id: 's' + Date.now() })
  }

  function updateSubject(id: string, input: SubjectInput) {
    const s = subjects.value.find((x) => x.id === id)
    if (s) Object.assign(s, input)
  }

  function deleteSubject(id: string) {
    subjects.value = subjects.value.filter((s) => s.id !== id)
  }

  return { subjects, colorOf, addSubject, updateSubject, deleteSubject }
})
