-- ==============================================================================
-- MIGRATION: 06_cftv_cameras_schema.sql
-- Módulo de Solicitação e Gestão de Imagens CFTV (Câmeras de Segurança)
-- ==============================================================================

-- Tabela de Pré-Cadastro e Aprovação de Solicitantes CFTV (Super Admin)
CREATE TABLE IF NOT EXISTS public.solicitantes_cftv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'bloqueado')),
    aprovado_por_nome TEXT,
    aprovado_por_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMPTZ,
    ultimo_login_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_solicitantes_cftv_email ON public.solicitantes_cftv(email);
CREATE INDEX IF NOT EXISTS idx_solicitantes_cftv_status ON public.solicitantes_cftv(status);

ALTER TABLE public.solicitantes_cftv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir select solicitantes_cftv" ON public.solicitantes_cftv FOR SELECT USING (true);
CREATE POLICY "Permitir insert solicitantes_cftv" ON public.solicitantes_cftv FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update solicitantes_cftv" ON public.solicitantes_cftv FOR UPDATE USING (true);

-- Tabela de Códigos OTP de Verificação por E-mail
CREATE TABLE IF NOT EXISTS public.cftv_codigos_otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    codigo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'login_solicitante',
    tentativas INT NOT NULL DEFAULT 0,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    expira_em TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cftv_otp_email ON public.cftv_codigos_otp(email, codigo, expira_em);

ALTER TABLE public.cftv_codigos_otp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir select otp cftv" ON public.cftv_codigos_otp FOR SELECT USING (true);
CREATE POLICY "Permitir insert otp cftv" ON public.cftv_codigos_otp FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update otp cftv" ON public.cftv_codigos_otp FOR UPDATE USING (true);
CREATE POLICY "Permitir delete otp cftv" ON public.cftv_codigos_otp FOR DELETE USING (true);

CREATE SEQUENCE IF NOT EXISTS seq_solicitacoes_cftv_numero START 1;


CREATE TABLE IF NOT EXISTS public.solicitacoes_cftv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_protocolo TEXT UNIQUE NOT NULL,
    solicitante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    solicitante_nome TEXT NOT NULL,
    solicitante_cargo TEXT NOT NULL,
    solicitante_email TEXT NOT NULL,
    
    -- Data e Horário
    data_fato DATE NOT NULL,
    tipo_intervalo TEXT NOT NULL CHECK (tipo_intervalo IN ('Exato', 'Aproximado', 'Amplo')),
    horario_inicio TIME NOT NULL,
    horario_termino TIME NOT NULL,
    
    -- Local da Ocorrência
    andar TEXT NOT NULL,
    andar_id UUID REFERENCES public.andares(id) ON DELETE SET NULL,
    ambiente TEXT NOT NULL,
    local_id UUID REFERENCES public.locais(id) ON DELETE SET NULL,
    ponto_referencia TEXT,
    
    -- Tipo de Ocorrência
    tipo_ocorrencia TEXT NOT NULL,
    tipo_ocorrencia_outro TEXT,
    
    -- Descrição dos Fatos
    descricao_fatos TEXT NOT NULL,
    
    -- Identificação e Deslocamento
    envolvidos_nomes_turmas TEXT,
    envolvidos_caracteristicas TEXT,
    envolvidos_sentido_fuga TEXT,
    objetos_envolvidos TEXT,
    
    -- Finalidade
    motivo_solicitacao TEXT NOT NULL,
    motivo_outro_descricao TEXT,
    
    -- Status e Parecer de Análise
    status TEXT NOT NULL DEFAULT 'Em Espera' CHECK (status IN ('Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado')),
    parecer_analise TEXT,
    cameras_analisadas TEXT,
    justificativa_cancelamento TEXT,
    analisado_por_nome TEXT,
    analisado_por_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    analisado_em TIMESTAMPTZ,
    devolutiva_enviada_em TIMESTAMPTZ,
    devolutiva_enviada_por TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_cftv_status ON public.solicitacoes_cftv(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cftv_email ON public.solicitacoes_cftv(solicitante_email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cftv_data ON public.solicitacoes_cftv(data_fato);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cftv_created ON public.solicitacoes_cftv(created_at DESC);

-- Trigger para gerar protocolo automaticamente caso não informado (ex: CFTV-2026-0001)
CREATE OR REPLACE FUNCTION set_solicitacao_cftv_protocolo()
RETURNS TRIGGER AS $$
DECLARE
    next_val BIGINT;
    current_year TEXT;
BEGIN
    IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
        next_val := nextval('seq_solicitacoes_cftv_numero');
        current_year := TO_CHAR(NOW(), 'YYYY');
        NEW.numero_protocolo := 'CFTV-' || current_year || '-' || LPAD(next_val::TEXT, 4, '0');
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_solicitacao_cftv_protocolo ON public.solicitacoes_cftv;
CREATE TRIGGER trg_set_solicitacao_cftv_protocolo
    BEFORE INSERT ON public.solicitacoes_cftv
    FOR EACH ROW
    EXECUTE FUNCTION set_solicitacao_cftv_protocolo();

-- Habilitar RLS
ALTER TABLE public.solicitacoes_cftv ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir leitura pública ou de autenticados cftv" ON public.solicitacoes_cftv;
CREATE POLICY "Permitir leitura pública ou de autenticados cftv"
    ON public.solicitacoes_cftv
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública e autenticada cftv" ON public.solicitacoes_cftv;
CREATE POLICY "Permitir inserção pública e autenticada cftv"
    ON public.solicitacoes_cftv
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização para admins e solicitantes cftv" ON public.solicitacoes_cftv;
CREATE POLICY "Permitir atualização para admins e solicitantes cftv"
    ON public.solicitacoes_cftv
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão para admins cftv" ON public.solicitacoes_cftv;
CREATE POLICY "Permitir exclusão para admins cftv"
    ON public.solicitacoes_cftv
    FOR DELETE
    USING (true);
