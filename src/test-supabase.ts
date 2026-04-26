// Teste de conexão com Supabase
// Cole no console do navegador (F12 > Console)

import { supabase } from './src/lib/supabase';

// Testar conexão
async function testConnection() {
  console.log('=== TESTE DE CONEXÃO SUPABASE ===');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'FALTANDO!');
  
  try {
    // Testar SELECT
    const { data, error } = await supabase
      .from('mapa_salas')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('ERRO no SELECT:', error.code, error.message);
    } else {
      console.log('CONECTADO! Dados:', data);
    }
  } catch (e) {
    console.error('EXCEÇÃO:', e);
  }
}

// Testar INSERT
async function testInsert() {
  console.log('=== TESTE DE INSERT ===');
  
  const payload = {
    numero_sala: 99,
    dia_semana: 'SEGUNDA',
    horario: '07:00 - 08:00',
    nome_professor: 'Teste Professor',
    turma: 'Teste Turma',
    materia: 'Teste Materia'
  };
  
  const { data, error } = await supabase
    .from('mapa_salas')
    .insert(payload)
    .select();
  
  if (error) {
    console.error('ERRO no INSERT:', error.code, error.message);
  } else {
    console.log('SUCESSO! Inserido:', data);
  }
}

// Executar
testConnection();
testInsert();