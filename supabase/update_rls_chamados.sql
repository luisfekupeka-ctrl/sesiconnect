-- Atualização das políticas de leitura (SELECT) para que qualquer usuário logado possa visualizar os chamados
DROP POLICY IF EXISTS "Leitura de chamados" ON chamados;
CREATE POLICY "Leitura de chamados" ON chamados FOR SELECT USING (auth.uid() IS NOT NULL);

-- Atualização das políticas de leitura de comentários para qualquer usuário logado
DROP POLICY IF EXISTS "Leitura de comentários" ON comentarios_chamado;
CREATE POLICY "Leitura de comentários" ON comentarios_chamado FOR SELECT USING (auth.uid() IS NOT NULL);

-- Atualização das políticas de leitura de anexos para qualquer usuário logado
DROP POLICY IF EXISTS "Leitura de anexos" ON anexos_chamado;
CREATE POLICY "Leitura de anexos" ON anexos_chamado FOR SELECT USING (auth.uid() IS NOT NULL);

-- Atualização das políticas de leitura de histórico para qualquer usuário logado
DROP POLICY IF EXISTS "Leitura de histórico" ON historico_chamado;
CREATE POLICY "Leitura de histórico" ON historico_chamado FOR SELECT USING (auth.uid() IS NOT NULL);
