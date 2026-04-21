import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const tables = ['grade_salas', 'alunos', 'atividades_after', 'monitores', 'ocorrencias'];
  console.log('--- Checking Tables ---');
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`[ ] ${table}: Does not exist`);
        } else {
          console.log(`[ ] ${table}: Error (${error.message})`);
        }
      } else {
        console.log(`[x] ${table}: Exists`);
      }
    } catch (e) {
      console.log(`[ ] ${table}: Critical error`);
    }
  }
}

checkTables();
