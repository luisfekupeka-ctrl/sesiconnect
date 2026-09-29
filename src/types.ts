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

export type TipoBloco = 'regular' | 'laboratorio_idiomas' | 'after' | 'almoco' | 'permanencia' | 'language_lab' | 'after_school';

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
  segmento?: string;
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
  segmentos?: string[]; // Ex: ['6º Ano', '7º Ano'] — Fundamental II ou Ensino Médio
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
  user_id?: string;
}

export interface LocalCMS {
  id: string;
  nome: string;
  numero?: number;
  tipo: 'sala' | 'arena' | 'quadra' | 'patio' | 'especializado';
  capacidade?: number;
  lista_alunos?: string[];
}

// --- Formulários ---

export type TipoCampoFormulario = 'texto' | 'selecao' | 'autocomplete_aluno' | 'data' | 'area_texto' | 'checkbox' | 'radio' | 'serie_escolar' | 'sessao';

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

export type TipoEventoEscola = 'PROVA' | 'FALTA' | 'SUBSTITUICAO';
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

export type AcaoRealocacao = string; // 'Troca Completa' | 'Substituição' | 'MODO PROVA' | 'Parcial'

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

// --- Registro Diário de Ocorrências ---

export interface DailyOccurrenceRecord {
  id?: string;
  student_name: string;
  school_year: string;
  occurrence_type: string;
  report: string;
  created_by?: string;
  created_at?: string;
  tratada?: boolean;
}

// --- Solicitação de Imagens CFTV (Câmeras) ---
export type TipoIntervaloCftv = 'Exato' | 'Aproximado' | 'Amplo';
export type StatusCftv = 'Em Espera' | 'Em Análise' | 'Atendido' | 'Finalizado' | 'Cancelado';

export interface SolicitacaoCFTV {
  id: string;
  numero_protocolo: string;
  solicitante_id?: string | null;
  solicitante_nome: string;
  solicitante_cargo: string;
  solicitante_email: string;
  
  // Data e Horário
  data_fato: string; // YYYY-MM-DD
  tipo_intervalo: TipoIntervaloCftv;
  horario_inicio: string; // HH:mm
  horario_termino: string; // HH:mm
  
  // Local da Ocorrência
  andar: string;
  andar_id?: string | null;
  ambiente: string;
  local_id?: string | null;
  ponto_referencia?: string | null;
  
  // Tipo de Ocorrência
  tipo_ocorrencia: string;
  tipo_ocorrencia_outro?: string | null;
  descricao_fatos: string;
  
  // Identificação e Deslocamento
  envolvidos_nomes_turmas?: string | null;
  envolvidos_caracteristicas?: string | null;
  envolvidos_sentido_fuga?: string | null;
  objetos_envolvidos?: string | null;
  
  // Finalidade / Motivo
  motivo_solicitacao: string;
  motivo_outro_descricao?: string | null;
  
  // Status e Parecer de Análise
  status: StatusCftv;
  parecer_analise?: string | null;
  cameras_analisadas?: string | null;
  justificativa_cancelamento?: string | null;
  analisado_por_nome?: string | null;
  analisado_por_id?: string | null;
  analisado_em?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface SolicitanteProfile {
  nome: string;
  cargo: string;
  email: string;
}


