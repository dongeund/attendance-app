import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface DataState {
  courses: any[]
  students: any[]
  leaves: any[]
  fetchInitialData: () => Promise<void>
  addCourse: (courseData: any) => Promise<void>
  addStudent: (studentData: any) => Promise<void>
  addLeave: (leaveData: any) => Promise<void>
}

export const useStore = create<DataState>((set, get) => ({
  courses: [],
  students: [],
  leaves: [],

  // 전체 데이터 최초 조회
  fetchInitialData: async () => {
    const { data: courses } = await supabase.from('courses').select('*')
    const { data: students } = await supabase.from('students').select('*')
    const { data: leaves } = await supabase.from('leaves').select('*')

    set({
      courses: courses || [],
      students: students || [],
      leaves: leaves || []
    })
  },

  // 과정 추가 액션
  addCourse: async (courseData) => {
    const { data, error } = await supabase.from('courses').insert([courseData]).select()
    if (!error && data) {
      set((state) => ({ courses: [...state.courses, data[0]] }))
    }
  },

  // 교육생 추가 액션
  addStudent: async (studentData) => {
    const { data, error } = await supabase.from('students').insert([studentData]).select()
    if (!error && data) {
      set((state) => ({ students: [...state.students, data[0]] }))
    }
  },

  // 공가 등록 액션
  addLeave: async (leaveData) => {
    const { data, error } = await supabase.from('leaves').insert([leaveData]).select()
    if (!error && data) {
      set((state) => ({ leaves: [...state.leaves, data[0]] }))
    }
  }
}))