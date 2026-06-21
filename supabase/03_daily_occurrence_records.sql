-- Tabela daily_occurrence_records (Registro Diário de Ocorrências)
CREATE TABLE IF NOT EXISTS daily_occurrence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  school_year INTEGER NOT NULL,
  occurrence_type TEXT NOT NULL,
  report TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e permitir tudo (para desenvolvimento)
ALTER TABLE daily_occurrence_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_daily_occurrence_records" ON daily_occurrence_records;
CREATE POLICY "allow_all_daily_occurrence_records" ON daily_occurrence_records FOR ALL USING (true) WITH CHECK (true);
