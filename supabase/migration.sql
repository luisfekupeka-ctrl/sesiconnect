-- ============================================================
-- SESI Connect — Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor (tudo de uma vez)
-- ============================================================

-- ============================================================
-- 1. CRIAÇÃO DAS TABELAS
-- ============================================================

-- Tabela mapa_salas (Grade de Salas)
CREATE TABLE IF NOT EXISTS mapa_salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sala INTEGER NOT NULL,
  dia_semana TEXT NOT NULL,
  horario TEXT NOT NULL,
  nome_professor TEXT DEFAULT '—',
  turma TEXT DEFAULT 'A DEFINIR',
  materia TEXT DEFAULT 'A DEFINIR',
  tipo TEXT DEFAULT 'regular',
  lista_alunos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela chamadas (Registro de Presença)
CREATE TABLE IF NOT EXISTS chamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  professor TEXT NOT NULL,
  sala TEXT NOT NULL,
  materia TEXT DEFAULT '',
  id_aluno TEXT NOT NULL,
  nome_aluno TEXT NOT NULL,
  turma_aluno TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('presente', 'falta', 'atraso', 'justificado')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, horario, sala, id_aluno)
);

-- Tabela salas (Cadastro de Salas)
CREATE TABLE IF NOT EXISTS salas (
  id TEXT PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  segmento TEXT DEFAULT '6º e 7º',
  ano TEXT DEFAULT 'A DEFINIR'
);

-- Tabela alunos_cms (Alunos)
CREATE TABLE IF NOT EXISTS alunos_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  turma TEXT DEFAULT '',
  ano TEXT DEFAULT '',
  numero_sala INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela professores_cms (Professores)
CREATE TABLE IF NOT EXISTS professores_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  especialidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela atividades_after (After School)
CREATE TABLE IF NOT EXISTS atividades_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  horario_inicio TEXT DEFAULT '',
  horario_fim TEXT DEFAULT '',
  local TEXT DEFAULT '',
  dias TEXT[] DEFAULT '{}',
  nome_professor TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  quantidade_alunos INTEGER DEFAULT 0,
  grupo_alunos TEXT DEFAULT '',
  vagas INTEGER DEFAULT 0,
  lista_alunos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela monitores (Monitores)
CREATE TABLE IF NOT EXISTS monitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  materia TEXT DEFAULT '',
  dia_semana TEXT DEFAULT '',
  turno TEXT DEFAULT 'manha',
  horario_inicio TEXT DEFAULT '',
  horario_fim TEXT DEFAULT '',
  almoco_inicio TEXT DEFAULT '',
  almoco_fim TEXT DEFAULT '',
  local_permanencia TEXT DEFAULT '',
  local_almoco TEXT DEFAULT '',
  tipo TEXT DEFAULT 'fixo',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela grade_monitores (Grade de Monitores)
CREATE TABLE IF NOT EXISTS grade_monitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_nome TEXT NOT NULL,
  dia_semana TEXT NOT NULL,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  posto TEXT DEFAULT '',
  cor_etiqueta TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela language_lab (Language Lab)
CREATE TABLE IF NOT EXISTS language_lab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma TEXT NOT NULL,
  nivel TEXT DEFAULT '',
  professor TEXT DEFAULT '',
  sala INTEGER DEFAULT 0,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  dia_semana TEXT NOT NULL,
  lista_alunos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela locais_cms (Locais)
CREATE TABLE IF NOT EXISTS locais_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  numero INTEGER,
  tipo TEXT DEFAULT 'sala',
  capacidade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela periodos_escolares (Períodos Escolares)
CREATE TABLE IF NOT EXISTS periodos_escolares (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  tipo TEXT NOT NULL,
  segmento TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela ocorrencias (Ocorrências)
CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id TEXT,
  nome_modelo TEXT NOT NULL,
  dados JSONB DEFAULT '{}',
  nome_aluno TEXT DEFAULT '',
  turma_aluno TEXT DEFAULT '',
  ano_aluno TEXT DEFAULT '',
  sala_aluno INTEGER,
  professor_atual TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela modelos_formulario (Modelos de Formulário)
CREATE TABLE IF NOT EXISTS modelos_formulario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  campos JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 2. CONSTRAINTS E ÍNDICES
-- ============================================================

-- Constraints UNIQUE (usando nome de constraint único para evitar conflitos)
ALTER TABLE mapa_salas ADD CONSTRAINT unique_mapa_salas_key UNIQUE (numero_sala, dia_semana, horario);
ALTER TABLE mapa_salas DROP CONSTRAINT IF EXISTS unique_mapa_salas;
ALTER TABLE alunos_cms ADD CONSTRAINT unique_alunos_cms_nome UNIQUE (nome);
ALTER TABLE professores_cms ADD CONSTRAINT unique_professores_cms_nome UNIQUE (nome);

-- Índices para buscas
CREATE INDEX IF NOT EXISTS idx_chamadas_data_sala ON chamadas(data, sala);
CREATE INDEX IF NOT EXISTS idx_chamadas_data_aluno ON chamadas(data, id_aluno);
CREATE INDEX IF NOT EXISTS idx_mapa_salas_numero ON mapa_salas(numero_sala);
CREATE INDEX IF NOT EXISTS idx_mapa_salas_dia ON mapa_salas(dia_semana);
CREATE INDEX IF NOT EXISTS idx_mapa_salas_professor ON mapa_salas(nome_professor);


-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) - Policies Completas
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE mapa_salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_monitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_escolares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_formulario ENABLE ROW LEVEL SECURITY;

-- ========== POLICIES ==========

-- mapa_salas: todas operações (leitura + escrita)
DROP POLICY IF EXISTS "Allow all mapa_salas" ON mapa_salas;
CREATE POLICY "Allow all mapa_salas" ON mapa_salas FOR ALL USING (true);

-- chamadas: todas operações
DROP POLICY IF EXISTS "Allow all chamadas" ON chamadas;
CREATE POLICY "Allow all chamadas" ON chamadas FOR ALL USING (true);

-- salas: todas operações
DROP POLICY IF EXISTS "Allow all salas" ON salas;
CREATE POLICY "Allow all salas" ON salas FOR ALL USING (true);

-- alunos_cms: todas operações
DROP POLICY IF EXISTS "Allow all alunos_cms" ON alunos_cms;
CREATE POLICY "Allow all alunos_cms" ON alunos_cms FOR ALL USING (true);

-- professores_cms: todas operações
DROP POLICY IF EXISTS "Allow all professores_cms" ON professores_cms;
CREATE POLICY "Allow all professores_cms" ON professores_cms FOR ALL USING (true);

-- atividades_after: todas operações
DROP POLICY IF EXISTS "Allow all atividades_after" ON atividades_after;
CREATE POLICY "Allow all atividades_after" ON atividades_after FOR ALL USING (true);

-- monitores: todas operações
DROP POLICY IF EXISTS "Allow all monitores" ON monitores;
CREATE POLICY "Allow all monitores" ON monitores FOR ALL USING (true);

-- grade_monitores: todas operações
DROP POLICY IF EXISTS "Allow all grade_monitores" ON grade_monitores;
CREATE POLICY "Allow all grade_monitores" ON grade_monitores FOR ALL USING (true);

-- language_lab: todas operações
DROP POLICY IF EXISTS "Allow all language_lab" ON language_lab;
CREATE POLICY "Allow all language_lab" ON language_lab FOR ALL USING (true);

-- locais_cms: todas operações
DROP POLICY IF EXISTS "Allow all locais_cms" ON locais_cms;
CREATE POLICY "Allow all locais_cms" ON locais_cms FOR ALL USING (true);

-- periodos_escolares: todas operações
DROP POLICY IF EXISTS "Allow all periodos_escolares" ON periodos_escolares;
CREATE POLICY "Allow all periodos_escolares" ON periodos_escolares FOR ALL USING (true);

-- ocorrencias: todas operações
DROP POLICY IF EXISTS "Allow all ocorrencias" ON ocorrencias;
CREATE POLICY "Allow all ocorrencias" ON ocorrencias FOR ALL USING (true);

-- modelos_formulario: todas operações
DROP POLICY IF EXISTS "Allow all modelos_formulario" ON modelos_formulario;
CREATE POLICY "Allow all modelos_formulario" ON modelos_formulario FOR ALL USING (true);