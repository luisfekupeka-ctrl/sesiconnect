// ============================================================
// SESI Connect — Importador de Dados
// Utilitário para transformar dados crus de planilhas
// Em produção, será conectado ao Supabase
// ============================================================

import { EntradaGradeSala, Aluno, AtividadeAfter, Monitor, LanguageLabRecord } from '../types';

/**
 * Utilitário para transformar dados crus (importados de Excel/JSON)
 * nos formatos internos do SESI Connect.
 */
export const ImportadorDados = {
  mapearGradeSalas: (raw: any[]): EntradaGradeSala[] => {
    return raw.map((r, i) => ({
      id: `gs-${i + 1}`,
      numeroSala: Number(r.numero_sala || r.sala),
      nomeSala: `Sala ${r.numero_sala || r.sala}`,
      anoTurma: String(r.turma),
      diaSemana: String(r.dia_semana || r.dia),
      horario: String(r.horario),
      nomeProfessor: String(r.nome_professor || r.professor),
      turma: String(r.turma),
      materia: String(r.materia),
      tipo: (r.tipo as 'regular' | 'laboratorio_idiomas' | 'after') || 'regular',
    }));
  },

  mapearAlunos: (raw: any[]): Aluno[] => {
    return raw.map((r, i) => ({
      id: `aluno-${i + 1}`,
      nome: String(r.nome),
      turma: String(r.turma),
      ano: String(r.ano),
      numeroSala: Number(r.numero_sala || r.sala),
    }));
  },

  mapearAtividadesAfter: (raw: any[]): AtividadeAfter[] => {
    return raw.map((r, i) => ({
      id: `after-${i + 1}`,
      nome: String(r.nome),
      categoria: String(r.categoria),
      horarioInicio: String(r.horario_inicio),
      horarioFim: String(r.horario_fim),
      local: String(r.local),
      dias: String(r.dias).split(',').map(d => d.trim()),
      nomeProfessor: String(r.nome_professor || r.professor),
      descricao: String(r.descricao || ''),
      quantidadeAlunos: Number(r.quantidade_alunos || 0),
      grupoAlunos: String(r.grupo_alunos || ''),
      listaAlunos: [],
    }));
  },

  mapearMonitores: (raw: any[]): Monitor[] => {
    return raw.map((r, i) => ({
      id: `mon-${i + 1}`,
      nome: String(r.nome),
      materia: String(r.materia),
      turno: (r.turno as 'manha' | 'tarde' | 'noite') || 'manha',
      horarioInicio: String(r.horario_inicio),
      horarioFim: String(r.horario_fim),
      status: (r.status as 'ativo' | 'inativo') || 'ativo',
      localPermanencia: '',
      localAlmoco: '',
      tipo: 'fixo',
    }));
  },

  mapearLaboratorioIdiomas: (raw: any[]): LanguageLabRecord[] => {
    return raw.map((r, i) => ({
      id: `li-${i + 1}`,
      turma: String(r.turma),
      nivel: String(r.nivel),
      professor: String(r.nome_professor || r.professor),
      sala: String(r.numero_sala || r.sala),
      horarioInicio: String(r.horario_inicio),
      horarioFim: String(r.horario_fim),
      diaSemana: String(r.dia_semana || r.dia),
      listaAlunos: [],
    }));
  },
};
