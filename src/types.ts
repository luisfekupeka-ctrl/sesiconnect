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

export interface PeriodoConfig {
  id: string;
  nome: string;
  horarioInicio: string; // "09:30"
  horarioFim: string;    // "09:50"
  tipo: PeriodoEscolar;
  segmento?: SegmentoEscolar; // Opcional para manter compatibilidade
}

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
  nomeSala?: string;
  anoTurma?: string;
  estaOcupada: boolean;
  professorAtual?: string;
  materiaAtual?: string;
  turmaAtual?: string;
  horarioFim?: string;
  tipoBlocoAtual?: TipoBloco;
}

// --- Grade de Salas (base do sistema) ---

export type TipoBloco = 'regular' | 'laboratorio_idiomas' | 'after' | 'almoco' | 'permanencia';

export interface EntradaGradeSala {
  id: string;
  numeroSala: number;        // 1-31
  nomeSala: string;          // "ONE OF A KIND"
  anoTurma: string;          // "6º Ano A"
  diaSemana: string;         // "SEGUNDA"
  horario: string;           // "08:00 - 08:45"
  nomeProfessor: string;
  turma: string;             // Alias de anoTurma
  materia: string;
  tipo: TipoBloco;
  listaAlunos?: string[];
}

// --- Salas ---

export type SegmentoEscolar = '6º e 7º' | '8º e 9º' | 'Ensino Médio' | 'Especializado';

export interface Sala {
  id: string;
  numero: number;
  nome: string;
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

// --- Language Lab (Ensalamento de Inglês) ---

export interface LanguageLabRecord {
  id: string;
  turma: string;
  nivel: string;
  professor: string;
  sala: string;
  horarioInicio: string;
  horarioFim: string;
  diaSemana: string;
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
  diaSemana?: string;
  turno: 'manha' | 'tarde' | 'noite';
  horarioInicio: string;
  horarioFim: string;
  almocoInicio?: string;
  almocoFim?: string;
  localPermanencia: string;
  localAlmoco: string;
  tipo: 'volante' | 'fixo' | 'hibrido';
  status: 'ativo' | 'inativo';
  cor: string;
}

export interface GradeMonitor {
  id: string;
  monitorNome: string;
  diaSemana: string;
  horarioInicio: string;
  horarioFim: string;
  posto: string;
  funcao: string;
  instrucoes?: string;
  corEtiqueta: string;
}

export interface ProfessorCMS {
  id: string;
  nome: string;
  cor: string;
  especialidade?: string;
}

export interface LocalCMS {
  id: string;
  nome: string;
  numero?: number;
  tipo: 'sala' | 'arena' | 'quadra' | 'patio' | 'especializado';
  capacidade?: number;
}

// --- Formulários ---

export type TipoCampoFormulario = 'texto' | 'selecao' | 'autocomplete_aluno' | 'data' | 'area_texto' | 'checkbox' | 'radio' | 'serie_escolar';

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
  anoAluno?: string;
  salaAluno?: number;
  professorAtual?: string;
  criadoEm: string;
}

// --- Reexport de tipos legados para compatibilidade ---

export type { EntradaGradeSala as ScheduleEntry };

// --- Chamada Escolar ---

export type StatusPresenca = 'presente' | 'falta' | 'atraso' | 'justificado';

export interface RegistroChamada {
  id?: string;
  data: string; // YYYY-MM-DD
  horario: string;
  professor: string;
  sala: string;
  materia: string;
  idAluno: string;
  nomeAluno: string;
  turmaAluno: string;
  status: StatusPresenca;
  criadoEm?: string;
}

// --- Gestão de Realocação Automática ---

export type AreaConhecimento = 'Humanas' | 'Exatas' | 'Linguagens' | 'Biológicas' | 'Outras';

export interface ProfessorConfig {
  id: string;
  nome: string;
  disciplina: string;
  cargaMaximaDia: number;
  area: AreaConhecimento;
}

export type TipoEventoEscola = 'PROVA' | 'FALTA';
export type StatusEvento = 'RASCUNHO' | 'EFETIVADO';

export interface EventoEscola {
  id: string;
  tipo: TipoEventoEscola;
  status?: StatusEvento;
  professor?: string;
  turma?: string;
  dia: string;
  horarios: string[]; // ["13:00 - 13:45", "13:45 - 14:30"]
}

export type AcaoRealocacao = 'Troca Completa' | 'Substituição' | 'MODO PROVA' | 'Parcial';

export interface ResultadoRealocacao {
  id: string;
  eventoId: string;
  tipo: TipoEventoEscola;
  professorOriginal?: string;
  professorSubstituto: string;
  turma: string;
  horario: string;
  segmento: string;
  acao: AcaoRealocacao;
  status?: StatusEvento;
  dia?: string;
}
