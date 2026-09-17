import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase 환경 변수가 로드되지 않았습니다. .env.local 및 서버 재시작 여부를 확인하세요.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)