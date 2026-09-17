import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkConnection() {
  console.log("Supabase 연동 테스트 시작...")
  
  // 데이터베이스 기본 연결 상태 확인
  const { data, error } = await supabase.from('students').select('*').limit(1)
  
  if (error) {
    // 테이블이 없더라도 연결 자체는 성공한 경우
    if (error.code === 'PGRST204' || error.message.includes('relation "public.students" does not exist')) {
      console.log("✅ 성공: Supabase 서버 연동 완료! (단, 아직 students 테이블은 생성 전입니다)");
    } else {
      console.error("❌ 실패: DB 연동 오류 발생 ->", error.message);
    }
  } else {
    console.log("✅ 성공: Supabase 서버 및 테이블 연동 완료!", data);
  }
}

checkConnection()