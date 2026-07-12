-- Módulo de Chamados — Schema
-- Execute este script no editor SQL do Supabase.

-- 1. Tabelas de Configuração
CREATE TABLE IF NOT EXISTS andares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tipos_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sequência e Tabela Principal de Chamados
CREATE SEQUENCE IF NOT EXISTS chamados_numero_seq START WITH 1;

CREATE TABLE IF NOT EXISTS chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_chamado TEXT UNIQUE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solicitante TEXT NOT NULL,
  andar_id UUID REFERENCES andares(id) ON DELETE SET NULL,
  local_id UUID REFERENCES locais(id) ON DELETE SET NULL,
  tipo_id UUID REFERENCES tipos_chamado(id) ON DELETE SET NULL,
  descricao VARCHAR(1000) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Atendimento', 'Aguardando Validação', 'Concluído', 'Cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Comentários
CREATE TABLE IF NOT EXISTS comentarios_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Anexos
CREATE TABLE IF NOT EXISTS anexos_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comentarios_chamado(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  url TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Histórico
CREATE TABLE IF NOT EXISTS historico_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Trigger para Auto-geração do Número Sequencial
CREATE OR REPLACE FUNCTION generate_numero_chamado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_chamado IS NULL THEN
    NEW.numero_chamado := 'CH-' || LPAD(nextval('chamados_numero_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_generate_numero_chamado
BEFORE INSERT ON chamados
FOR EACH ROW
EXECUTE FUNCTION generate_numero_chamado();

-- 7. Função Auxiliar para verificar se o usuário logado é Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Habilitar RLS nas tabelas
ALTER TABLE andares ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_chamado ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_chamado ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos_chamado ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_chamado ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de RLS para as Tabelas

-- Andares, Locais, Tipos de Chamado
DROP POLICY IF EXISTS "Visualização de tabelas auxiliares por logados" ON andares;
CREATE POLICY "Visualização de tabelas auxiliares por logados" ON andares FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Escrita de andares por admins" ON andares;
CREATE POLICY "Escrita de andares por admins" ON andares FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Visualização de locais por logados" ON locais;
CREATE POLICY "Visualização de locais por logados" ON locais FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Escrita de locais por admins" ON locais;
CREATE POLICY "Escrita de locais por admins" ON locais FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Visualização de tipos_chamado por logados" ON tipos_chamado;
CREATE POLICY "Visualização de tipos_chamado por logados" ON tipos_chamado FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Escrita de tipos_chamado por admins" ON tipos_chamado;
CREATE POLICY "Escrita de tipos_chamado por admins" ON tipos_chamado FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Chamados
DROP POLICY IF EXISTS "Leitura de chamados" ON chamados;
CREATE POLICY "Leitura de chamados" ON chamados FOR SELECT USING (usuario_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Inserção de chamados" ON chamados;
CREATE POLICY "Inserção de chamados" ON chamados FOR INSERT WITH CHECK (usuario_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Atualização de chamados" ON chamados;
CREATE POLICY "Atualização de chamados" ON chamados FOR UPDATE USING (usuario_id = auth.uid() OR is_admin()) WITH CHECK (usuario_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Exclusão de chamados por admins" ON chamados;
CREATE POLICY "Exclusão de chamados por admins" ON chamados FOR DELETE USING (is_admin());

-- Comentários
DROP POLICY IF EXISTS "Leitura de comentários" ON comentarios_chamado;
CREATE POLICY "Leitura de comentários" ON comentarios_chamado FOR SELECT USING (
  EXISTS (SELECT 1 FROM chamados WHERE chamados.id = chamado_id AND (chamados.usuario_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Inserção de comentários" ON comentarios_chamado;
CREATE POLICY "Inserção de comentários" ON comentarios_chamado FOR INSERT WITH CHECK (
  usuario_id = auth.uid() AND EXISTS (SELECT 1 FROM chamados WHERE chamados.id = chamado_id AND (chamados.usuario_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Edição e exclusão de comentários pelo autor/admin" ON comentarios_chamado;
CREATE POLICY "Edição e exclusão de comentários pelo autor/admin" ON comentarios_chamado FOR ALL USING (usuario_id = auth.uid() OR is_admin());

-- Anexos
DROP POLICY IF EXISTS "Leitura de anexos" ON anexos_chamado;
CREATE POLICY "Leitura de anexos" ON anexos_chamado FOR SELECT USING (
  EXISTS (SELECT 1 FROM chamados WHERE chamados.id = chamado_id AND (chamados.usuario_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Inserção de anexos" ON anexos_chamado;
CREATE POLICY "Inserção de anexos" ON anexos_chamado FOR INSERT WITH CHECK (
  usuario_id = auth.uid() AND EXISTS (SELECT 1 FROM chamados WHERE chamados.id = chamado_id AND (chamados.usuario_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Exclusão de anexos pelo autor/admin" ON anexos_chamado;
CREATE POLICY "Exclusão de anexos pelo autor/admin" ON anexos_chamado FOR DELETE USING (usuario_id = auth.uid() OR is_admin());

-- Histórico
DROP POLICY IF EXISTS "Leitura de histórico" ON historico_chamado;
CREATE POLICY "Leitura de histórico" ON historico_chamado FOR SELECT USING (
  EXISTS (SELECT 1 FROM chamados WHERE chamados.id = chamado_id AND (chamados.usuario_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Inserção de histórico automatizada" ON historico_chamado;
CREATE POLICY "Inserção de histórico automatizada" ON historico_chamado FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 10. Criação do Bucket no Supabase Storage e Políticas
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos_chamados', 'fotos_chamados', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Leitura de fotos_chamados pública" ON storage.objects;
CREATE POLICY "Leitura de fotos_chamados pública" ON storage.objects FOR SELECT USING (bucket_id = 'fotos_chamados');
DROP POLICY IF EXISTS "Upload em fotos_chamados por logados" ON storage.objects;
CREATE POLICY "Upload em fotos_chamados por logados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos_chamados' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Exclusão em fotos_chamados por dono/admin" ON storage.objects;
CREATE POLICY "Exclusão em fotos_chamados por dono/admin" ON storage.objects FOR DELETE USING (bucket_id = 'fotos_chamados' AND auth.role() = 'authenticated');
