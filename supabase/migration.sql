-- ============================================================
-- SESI Connect — Schema Completo do Supabase
-- Execute todo este arquivo no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. DROPAR TABELAS EXISTENTES (só para recomeçar do zero)
-- ============================================================
DROP TABLE IF EXISTS chamadas CASCADE;
DROP TABLE IF EXISTS mapa_salas CASCADE;
DROP TABLE IF EXISTS salas CASCADE;
DROP TABLE IF EXISTS alunos_cms CASCADE;
DROP TABLE IF EXISTS professores_cms CASCADE;
DROP TABLE IF EXISTS atividades_after CASCADE;
DROP TABLE IF EXISTS monitores CASCADE;
DROP TABLE IF EXISTS grade_monitores CASCADE;
DROP TABLE IF EXISTS language_lab CASCADE;
DROP TABLE IF EXISTS locais_cms CASCADE;
DROP TABLE IF EXISTS periodos_escolares CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS modelos_formulario CASCADE;
DROP TABLE IF EXISTS realocacoes CASCADE;
DROP TABLE IF EXISTS eventos_escola CASCADE;
DROP TABLE IF EXISTS professores_config CASCADE;

DROP TYPE IF EXISTS tipo_periodo CASCADE;
DROP TYPE IF EXISTS tipo_monitor CASCADE;

-- ============================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ============================================================

-- Tabela mapa_salas (Grade de Salas/Aulas)
CREATE TABLE mapa_salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sala INTEGER NOT NULL,
  dia_semana TEXT NOT NULL,
  horario TEXT NOT NULL,
  nome_professor TEXT DEFAULT '—',
  turma TEXT DEFAULT 'A DEFINIR',
  materia TEXT DEFAULT 'A DEFINIR',
  tipo TEXT DEFAULT 'regular',
  lista_alunos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(numero_sala, dia_semana, horario)
);

-- Tabela chamadas (Registro de Presença)
CREATE TABLE chamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  professor TEXT NOT NULL DEFAULT '',
  sala TEXT NOT NULL,
  materia TEXT DEFAULT '',
  id_aluno TEXT NOT NULL,
  nome_aluno TEXT NOT NULL DEFAULT '',
  turma_aluno TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('presente', 'falta', 'atraso', 'justificado')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, horario, sala, id_aluno)
);

-- Tabela salas (Cadastro de Salas)
CREATE TABLE salas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  numero INTEGER UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  segmento TEXT DEFAULT '6º e 7º',
  ano TEXT DEFAULT 'A DEFINIR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela alunos_cms (Alunos)
CREATE TABLE alunos_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  turma TEXT DEFAULT '',
  ano TEXT DEFAULT '',
  numero_sala INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome)
);

-- Tabela professores_cms (Professores)
CREATE TABLE professores_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  especialidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome)
);

-- Tabela atividades_after (After School)
CREATE TABLE atividades_after (
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
CREATE TABLE monitores (
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

-- Tabela grade_monitores (Grade Detalhada de Monitores)
CREATE TABLE grade_monitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_nome TEXT NOT NULL,
  dia_semana TEXT NOT NULL,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  posto TEXT DEFAULT '',
  cor_etiqueta TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela language_lab (Language Lab/Inglês)
CREATE TABLE language_lab (
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

-- Tabela locais_cms (Locais/Salas CMS)
CREATE TABLE locais_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  numero INTEGER,
  tipo TEXT DEFAULT 'sala',
  capacidade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela periodos_escolares (Períodos/Horários)
CREATE TABLE periodos_escolares (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  tipo TEXT NOT NULL,
  segmento TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela ocorrencias (Registro de Ocorrências)
CREATE TABLE ocorrencias (
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
CREATE TABLE modelos_formulario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  campos JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela professores_config (Config de Professores - para realocação)
CREATE TABLE professores_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor TEXT DEFAULT '#3B82F6',
  materia TEXT DEFAULT '',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela eventos_escola (Eventos da Escola)
CREATE TABLE eventos_escola (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data TEXT NOT NULL,
  tipo TEXT DEFAULT 'evento',
  descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela realocacoes (Registro de Troca de Aulas)
CREATE TABLE realocacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_original TEXT NOT NULL,
  professor_substituto TEXT DEFAULT '',
  sala TEXT NOT NULL,
  materia TEXT DEFAULT '',
  turma TEXT DEFAULT '',
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  motivo TEXT DEFAULT '',
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_chamadas_data_sala ON chamadas(data, sala);
CREATE INDEX idx_chamadas_data_aluno ON chamadas(data, id_aluno);
CREATE INDEX idx_mapa_salas_numero ON mapa_salas(numero_sala);
CREATE INDEX idx_mapa_salas_dia ON mapa_salas(dia_semana);
CREATE INDEX idx_mapa_salas_professor ON mapa_salas(nome_professor);
CREATE INDEX idx_realocacoes_data ON realocacoes(data);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
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
ALTER TABLE professores_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE realocacoes ENABLE ROW LEVEL SECURITY;

-- Policies para todas as tabelas (permissão total para desenvolvimento)
CREATE POLICY "allow_all_mapa_salas" ON mapa_salas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chamadas" ON chamadas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_salas" ON salas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_alunos_cms" ON alunos_cms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_professores_cms" ON professores_cms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_atividades_after" ON atividades_after FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_monitores" ON monitores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_grade_monitores" ON grade_monitores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_language_lab" ON language_lab FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_locais_cms" ON locais_cms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_periodos_escolares" ON periodos_escolares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ocorrencias" ON ocorrencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_modelos_formulario" ON modelos_formulario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_professores_config" ON professores_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_eventos_escola" ON eventos_escola FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_realocacoes" ON realocacoes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. DADOS INICIAIS (opcional - descomente se quiser)
-- ============================================================

-- Períodos escolares padrão
-- INSERT INTO periodos_escolares (nome, horario_inicio, horario_fim, tipo, segmento) VALUES
-- ('1ª Aula', '07:30', '08:20', 'aula', '6e7'),
-- ('2ª Aula', '08:20', '09:10', 'aula', '6e7'),
-- ('Intervalo', '09:10', '09:30', 'intervalo', '6e7'),
-- ('3ª Aula', '09:30', '10:20', 'aula', '6e7'),
-- ('4ª Aula', '10:20', '11:10', 'aula', '6e7'),
-- ('5ª Aula', '11:10', '12:00', 'aula', '6e7');

-- Professores padrão
-- INSERT INTO professores_cms (nome, cor, especialidade) VALUES
-- ('Luis Kim', '#3B82F6', 'Matemática'),
-- ('Patricia Santos', '#EF4444', 'Português');

-- ============================================================
-- FIM DO MIGRATION
-- ============================================================