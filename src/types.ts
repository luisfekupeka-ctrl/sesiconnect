// ============================================================
// SESI Connect — Tipos do Sistema
// Tudo em português, baseado em blocos de 45 minutos
// ============================================================

// --- Horários e Períodos ---

export interface BlocoHorario {
  indice: number;
  inicio: string;    // "08:00"
  fim: string;       // "08:45"
}

export type PeriodoEscolar = 'aula' | 'intervalo' | 'almoco' | 'after' | 'fora';

export interface EstadoEscola {
  periodo: PeriodoEscolar;
  blocoAtual: BlocoHorario | null;
  indiceBlocoAtual: number;
  proximaTransicao: string;
  rotuloProximaTransicao: string;
  salas: EstadoSalaAoVivo[];
}

export interface EstadoSalaAoVivo {
  numeroSala: number;
  estaOcupada: boolean;
  professorAtual?: string;
  materiaAtual?: string;
  turmaAtual?: string;
  horarioFim?: string;
  tipoBlocoAtual?: 'regular' | 'laboratorio_idiomas' | 'after';
}

// --- Grade de Salas (base do sistema) ---

export type TipoBloco = 'regular' | 'laboratorio_idiomas' | 'after';

export interface EntradaGradeSala {
  id: string;
  numeroSala: number;        // 1-31
  diaSemana: number;         // 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
  indiceBlocoHorario: number; // 1-9
  nomeProfessor: string;
  turma: string;             // "6º Ano A"
  materia: string;           // "Matemática"
  tipo: TipoBloco;
}

// --- Salas ---

export type SegmentoEscolar = 'Fundamental' | 'Médio' | 'Especializado';

export interface Sala {
  id: string;
  numero: number;
  nome: string;
  andar: string;
  segmento: SegmentoEscolar;
  ano: string;
  grade: EntradaGradeSala[];
}

// --- Professores (derivados das salas) ---

export interface Professor {
  id: string;
  nome: string;
  materia: string;
  status: 'em_aula' | 'presente' | 'ausente';
  salaAtual?: string;
  proximaAula?: string;
  horarioProximaAula?: string;
  agendaDoDia: EntradaGradeSala[];
}

// --- Alunos ---

export interface Aluno {
  id: string;
  nome: string;
  turma: string;        // "6º Ano A"
  ano: string;          // "6º Ano"
  numeroSala: number;
}

// --- Laboratório de Idiomas ---

export interface NivelIdioma {
  id: string;
  nivel: string;
  nomeProfessor: string;
  numeroSala: number;
  horarioInicio: string;
  horarioFim: string;
  quantidadeAlunos: number;
  grupoAlunos: string;
  listaAlunos: string[];
}

// --- Atividades After School ---

export interface AtividadeAfter {
  id: string;
  nome: string;
  categoria: string;
  horarioInicio: string;
  horarioFim: string;
  local: string;
  dias: string[];
  nomeProfessor: string;
  descricao: string;
  quantidadeAlunos: number;
  grupoAlunos: string;
  listaAlunos: string[];
  vagas?: number;
}

// --- Monitores ---

export interface Monitor {
  id: string;
  nome: string;
  materia: string;
  turno: 'manha' | 'tarde' | 'noite';
  horarioInicio: string;
  horarioFim: string;
  status: 'ativo' | 'inativo';
}

// --- Formulários ---

export type TipoCampoFormulario = 'texto' | 'selecao' | 'autocomplete_aluno' | 'data' | 'area_texto';

export interface CampoFormulario {
  id: string;
  rotulo: string;
  tipo: TipoCampoFormulario;
  obrigatorio: boolean;
  opcoes?: string[];
}

export interface ModeloFormulario {
  id: string;
  nome: string;
  descricao: string;
  campos: CampoFormulario[];
  criadoEm: string;
}

export interface RegistroOcorrencia {
  id: string;
  modeloFormularioId: string;
  nomeModelo: string;
  dados: Record<string, any>;
  nomeAluno: string;
  turmaAluno: string;
  anoAluno: string;
  salaAluno: number;
  professorAtual?: string;
  criadoEm: string;
}

// --- Reexport de tipos legados para compatibilidade ---

export type { EntradaGradeSala as ScheduleEntry };
