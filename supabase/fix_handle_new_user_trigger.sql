-- ============================================================
-- FIX: handle_new_user trigger
-- Data: 2026-07-18
-- Problema: Trigger criava perfis com role='admin' e sem
--   SECURITY DEFINER, causando falha silenciosa por RLS
--   quando auth.uid() era null no contexto do trigger.
--   Resultado: usuários registravam conta mas ficavam sem
--   perfil na tabela profiles, nunca aparecendo na fila
--   de aprovação do Admin.
-- Solução:
--   1. Adicionar SECURITY DEFINER para bypassar RLS
--   2. Corrigir role default para 'user'
--   3. Adicionar ON CONFLICT DO NOTHING para segurança
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user',
    CASE 
      WHEN NEW.email = 'luisfe.kupeka@gmail.com' THEN 'approved'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recuperar perfis de usuários que ficaram sem profile
-- (users registrados antes da correção do trigger)
INSERT INTO public.profiles (id, full_name, email, role, status)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  au.email,
  'user',
  'pending'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
