-- Adicionar constraint única para locais_cms
ALTER TABLE locais_cms ADD CONSTRAINT locais_cms_nome_key UNIQUE (nome);