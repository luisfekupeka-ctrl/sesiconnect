-- ==============================================================================
-- MIGRATION: 07_fix_daily_occurrences_rls.sql
-- Permissões de RLS para Registro Diário e Ocorrências
-- Permite que usuários aprovados (Monitores, Professores, Admins) possam registrar, consultar e atualizar
-- ==============================================================================

-- 1. Tabela daily_occurrence_records (Registro Diário)
ALTER TABLE public.daily_occurrence_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_occurrences_admin_only" ON public.daily_occurrence_records;
DROP POLICY IF EXISTS "allow_all_daily_occurrence_records" ON public.daily_occurrence_records;
DROP POLICY IF EXISTS "daily_occurrences_select_auth" ON public.daily_occurrence_records;
DROP POLICY IF EXISTS "daily_occurrences_insert_auth" ON public.daily_occurrence_records;
DROP POLICY IF EXISTS "daily_occurrences_update_auth" ON public.daily_occurrence_records;
DROP POLICY IF EXISTS "daily_occurrences_delete_admin" ON public.daily_occurrence_records;

-- Leitura por todos os usuários aprovados (monitores, professores, admins)
CREATE POLICY "daily_occurrences_select_auth" ON public.daily_occurrence_records
  FOR SELECT TO authenticated
  USING (is_approved_user());

-- Inserção por todos os usuários aprovados
CREATE POLICY "daily_occurrences_insert_auth" ON public.daily_occurrence_records
  FOR INSERT TO authenticated
  WITH CHECK (is_approved_user());

-- Atualização por usuários aprovados (ex: marcar ocorrência como tratada ou editar)
CREATE POLICY "daily_occurrences_update_auth" ON public.daily_occurrence_records
  FOR UPDATE TO authenticated
  USING (is_approved_user())
  WITH CHECK (is_approved_user());

-- Exclusão restrita a administradores
CREATE POLICY "daily_occurrences_delete_admin" ON public.daily_occurrence_records
  FOR DELETE TO authenticated
  USING (is_admin());


-- 2. Tabela ocorrencias (Atas de Ocorrência)
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ocorrencias_admin_only" ON public.ocorrencias;
DROP POLICY IF EXISTS "allow_all_ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias_select_auth" ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias_insert_auth" ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias_update_auth" ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias_delete_admin" ON public.ocorrencias;

CREATE POLICY "ocorrencias_select_auth" ON public.ocorrencias
  FOR SELECT TO authenticated
  USING (is_approved_user());

CREATE POLICY "ocorrencias_insert_auth" ON public.ocorrencias
  FOR INSERT TO authenticated
  WITH CHECK (is_approved_user());

CREATE POLICY "ocorrencias_update_auth" ON public.ocorrencias
  FOR UPDATE TO authenticated
  USING (is_approved_user())
  WITH CHECK (is_approved_user());

CREATE POLICY "ocorrencias_delete_admin" ON public.ocorrencias
  FOR DELETE TO authenticated
  USING (is_admin());
