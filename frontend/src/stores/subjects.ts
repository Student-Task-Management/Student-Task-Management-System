import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Subject } from '../types'

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

  return { subjects, colorOf }
})
