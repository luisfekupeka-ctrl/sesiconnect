// ============================================================
// SESI Connect — Serviço de Dados (Supabase)
// Gerencia a comunicação com o backend em tempo real.
// ============================================================

import { supabase } from '../lib/supabase';
import {
  Sala,
  EntradaGradeSala,
  Aluno,
  LanguageLabRecord,
  AtividadeAfter,
  Monitor,
  GradeMonitor,
  ModeloFormulario,
  RegistroOcorrencia,
  PeriodoConfig,
  PeriodoEscolar,
  RegistroChamada,
  StatusPresenca,
  ProfessorCMS,
  LocalCMS,
} from '../types';

// --- Grades e Salas ---

export async function buscarMapaSalas(): Promise<EntradaGradeSala[]> {
  const { data, error } = await supabase
    .from('mapa_salas')
    .select('*');

  if (error) {
    console.error('Erro ao buscar mapa de salas:', error);
    return [];
  }

  // Mapear campos do banco para o padrão CamelCase do Frontend
  return (data || []).map(item => ({
    id: item.id || `${item.numero_sala}-${item.dia_semana}-${item.horario}`,
    numeroSala: item.numero_sala,
    nomeSala: `Sala ${item.numero_sala}`, // Gerado a partir do número se não houver no banco
    anoTurma: item.turma,
    diaSemana: item.dia_semana,
    horario: item.horario,
    nomeProfessor: item.nome_professor,
    turma: item.turma,
    materia: item.materia,
    tipo: item.tipo || 'regular',
    listaAlunos: item.lista_alunos || [],
  }));
}

export async function buscarSalas(): Promise<Sala[]> {
  const [salasResult, gradeResult] = await Promise.all([
    supabase.from('salas').select('*').order('numero', { ascending: true }),
    buscarMapaSalas()
  ]);

  const rawSalas = salasResult.data || [];
  const grade = gradeResult || [];

  // Mapear salas do banco
  const salas: Sala[] = rawSalas.map(s => ({
    id: s.id,
    numero: s.numero,
    nome: s.nome,
    segmento: s.segmento as any,
    ano: s.ano || 'A DEFINIR',
    grade: []
  }));

  // Se o banco estiver vazio, fornecer um set inicial para não quebrar o dashboard
  // mas incentivando o uso do CRUD dinâmico
  if (salas.length === 0) {
    for (let i = 1; i <= 31; i++) {
      salas.push({
        id: i.toString().padStart(2, '0'),
        numero: i,
        nome: `Sala ${i.toString().padStart(2, '0')}`,
        segmento: i <= 10 ? '6º e 7º' : i <= 20 ? '8º e 9º' : 'Ensino Médio',
        ano: 'A DEFINIR',
        grade: [],
      });
    }
  }

  // Preencher grade em cada sala
  grade.forEach(item => {
    const sala = salas.find(s => s.numero === item.numeroSala);
    if (sala) {
      if (item.anoTurma && item.anoTurma !== 'A DEFINIR') {
        sala.ano = item.anoTurma;
      }
      sala.grade.push(item);
    }
  });

  return salas.sort((a, b) => a.numero - b.numero);
}

// --- Alunos ---

export async function buscarAlunos(): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from('alunos_cms') // Usando a nova tabela
    .select('*');

  if (error) {
    console.error('Erro ao buscar alunos:', error);
    // Fallback temporário caso a migration não tenha sido rodada
    const fallback = await supabase.from('alunos').select('*');
    return (fallback.data || []).map(item => ({
      id: item.nome,
      nome: item.nome,
      turma: item.turma,
      ano: item.ano,
      numeroSala: item.numero_sala,
    }));
  }

  return (data || []).map(item => ({
    id: item.id,
    nome: item.nome,
    turma: item.turma,
    ano: item.ano,
    numeroSala: item.numero_sala,
  }));
}

export async function salvarAluno(aluno: Partial<Aluno>): Promise<boolean> {
  // Remove campos undefined
  const payload: any = {};
  if (aluno.nome) payload.nome = aluno.nome;
  if (aluno.turma) payload.turma = aluno.turma;
  if (aluno.ano) payload.ano = aluno.ano;
  if (aluno.numeroSala !== undefined) payload.numero_sala = aluno.numeroSala;

  // Só adiciona ID se não for 'novo'
  if (aluno.id && aluno.id !== 'novo') {
    payload.id = aluno.id;
  }

  console.log('Payload aluno:', payload);

  const { error } = await supabase
    .from('alunos_cms')
    .upsert([payload], { onConflict: 'nome' });

  if (error) {
    console.error('Erro ao salvar aluno:', error);
    return false;
  }
  console.log('Aluno salvo:', payload.nome);
  return true;
}

export async function excluirAluno(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('alunos_cms')
    .delete()
    .eq('id', id);
  return !error;
}

// --- Atividades After School ---

export async function buscarAtividadesAfter(): Promise<AtividadeAfter[]> {
  const { data, error } = await supabase
    .from('atividades_after')
    .select('*');

  if (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }

  // Mapear snake_case para camelCase
  return (data || []).map(item => ({
    id: item.id,
    nome: item.nome,
    categoria: item.categoria,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    local: item.local,
    dias: item.dias || [],
    nomeProfessor: item.nome_professor,
    descricao: item.descricao,
    quantidadeAlunos: item.quantidade_alunos,
    grupoAlunos: item.grupo_alunos,
    vagas: item.vagas,
    listaAlunos: item.lista_alunos || []
  }));
}

export async function salvarAtividadeAfter(atividade: Partial<AtividadeAfter>): Promise<boolean> {
  const payload: any = {
    nome: atividade.nome,
    categoria: atividade.categoria,
    horario_inicio: atividade.horarioInicio,
    horario_fim: atividade.horarioFim,
    local: atividade.local,
    dias: atividade.dias,
    nome_professor: atividade.nomeProfessor,
    descricao: atividade.descricao,
    quantidade_alunos: atividade.quantidadeAlunos,
    grupo_alunos: atividade.grupoAlunos,
    vagas: atividade.vagas,
    lista_alunos: atividade.listaAlunos || []
  };

  if (atividade.id && atividade.id !== 'novo') {
    payload.id = atividade.id;
  }

  const { error } = await supabase
    .from('atividades_after')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar atividade:', error);
    return false;
  }
  return true;
}

export async function excluirAtividadeAfter(id: string): Promise<boolean> {
  const { error } = await supabase.from('atividades_after').delete().eq('id', id);
  return !error;
}

// --- Monitores ---

export async function buscarMonitores(): Promise<Monitor[]> {
  const { data, error } = await supabase
    .from('monitores')
    .select('*');

  if (error) {
    console.error('Erro ao buscar monitores:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    nome: item.nome,
    materia: item.materia,
    diaSemana: item.dia_semana,
    turno: (item.turno || 'manha') as 'manha' | 'tarde' | 'noite',
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    localPermanencia: item.local_permanencia || '',
    localAlmoco: item.local_almoco || '',
    almocoInicio: item.almoco_inicio || '',
    almocoFim: item.almoco_fim || '',
    tipo: (item.tipo || 'fixo') as 'volante' | 'fixo' | 'hibrido',
    status: item.status as 'ativo' | 'inativo'
  }));
}

export async function salvarMonitor(monitor: Partial<Monitor>): Promise<boolean> {
  const payload: any = {
    nome: monitor.nome,
    materia: monitor.materia,
    dia_semana: monitor.diaSemana,
    turno: monitor.turno,
    horario_inicio: monitor.horarioInicio,
    horario_fim: monitor.horarioFim,
    almoco_inicio: monitor.almocoInicio,
    almoco_fim: monitor.almocoFim,
    local_permanencia: monitor.localPermanencia,
    local_almoco: monitor.localAlmoco,
    tipo: monitor.tipo,
    status: monitor.status
  };

  if (monitor.id && monitor.id !== 'novo') {
    payload.id = monitor.id;
  }

  const { error } = await supabase
    .from('monitores')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar monitor:', error);
    return false;
  }
  return true;
}

export async function excluirMonitor(id: string): Promise<boolean> {
  const { error } = await supabase.from('monitores').delete().eq('id', id);
  return !error;
}

// --- Grade Detalhada de Monitores ---

export async function buscarGradeMonitores(): Promise<GradeMonitor[]> {
  const { data, error } = await supabase
    .from('grade_monitores')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (error) {
    console.error('Erro ao buscar grade de monitores:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    monitorNome: item.monitor_nome,
    diaSemana: item.dia_semana,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    posto: item.posto,
    corEtiqueta: item.cor_etiqueta,
  }));
}

// --- Language Lab (Ensalamento de Inglês) ---

export async function buscarLanguageLab(): Promise<LanguageLabRecord[]> {
  const { data, error } = await supabase
    .from('language_lab')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (error) {
    console.error('Erro ao buscar Language Lab:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    turma: item.turma,
    nivel: item.nivel,
    professor: item.professor,
    sala: item.sala,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    diaSemana: item.dia_semana,
    listaAlunos: item.lista_alunos || [],
  }));
}

export async function salvarLanguageLab(record: Partial<LanguageLabRecord>): Promise<boolean> {
  const payload: any = {
    turma: record.turma,
    nivel: record.nivel,
    professor: record.professor,
    sala: record.sala,
    horario_inicio: record.horarioInicio,
    horario_fim: record.horarioFim,
    dia_semana: record.diaSemana,
    lista_alunos: record.listaAlunos || []
  };

  if (record.id && record.id !== 'novo') {
    payload.id = record.id;
  }

  const { error } = await supabase
    .from('language_lab')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar language lab:', error);
    return false;
  }
  return true;
}

export async function excluirLanguageLab(id: string): Promise<boolean> {
  const { error } = await supabase.from('language_lab').delete().eq('id', id);
  return !error;
}


// --- Professores CMS ---

export async function buscarProfessoresCMS(): Promise<ProfessorCMS[]> {
  const { data, error } = await supabase
    .from('professores_cms')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar professores:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    nome: p.nome,
    cor: p.cor,
    especialidade: p.especialidade
  }));
}

export async function salvarProfessorCMS(prof: Partial<ProfessorCMS>): Promise<boolean> {
  const payload: any = {
    nome: prof.nome,
    cor: prof.cor,
    especialidade: prof.especialidade
  };

  // Só adiciona ID se não for 'novo'
  if (prof.id && prof.id !== 'novo') {
    payload.id = prof.id;
  }

  const { error } = await supabase
    .from('professores_cms')
    .upsert([payload], { onConflict: 'nome' });

  if (error) {
    console.error('Erro ao salvar professor:', error);
    return false;
  }
  return true;
}

export async function excluirProfessorCMS(id: string): Promise<boolean> {
  const { error } = await supabase.from('professores_cms').delete().eq('id', id);
  return !error;
}

// --- Locais CMS ---

export async function buscarLocaisCMS(): Promise<LocalCMS[]> {
  const { data, error } = await supabase
    .from('locais_cms')
    .select('*')
    .order('numero', { ascending: true });

  if (error) {
    console.error('Erro ao buscar locais:', error);
    return [];
  }

  return (data || []).map(l => ({
    id: l.id,
    nome: l.nome,
    numero: l.numero,
    tipo: l.tipo,
    capacidade: l.capacidade
  }));
}

export async function salvarLocalCMS(local: Partial<LocalCMS>): Promise<boolean> {
  const payload: any = {
    nome: local.nome,
    numero: local.numero,
    tipo: local.tipo,
    capacidade: local.capacidade
  };

  if (local.id && local.id !== 'novo') {
    payload.id = local.id;
  }

  const { error } = await supabase
    .from('locais_cms')
    .upsert([payload], { onConflict: 'nome' });

  if (error) {
    console.error('Erro ao salvar local:', error);
    return false;
  }
  return true;
}

export async function excluirLocalCMS(id: string): Promise<boolean> {
  const { error } = await supabase.from('locais_cms').delete().eq('id', id);
  return !error;
}

// --- Modelos de Formulário ---

export async function buscarModelosFormulario(): Promise<ModeloFormulario[]> {
  const { data, error } = await supabase
    .from('modelos_formulario')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao buscar modelos:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    campos: item.campos,
    criadoEm: item.criado_em,
  }));
}

export async function salvarModeloFormulario(modelo: Partial<ModeloFormulario>): Promise<boolean> {
  const payload: any = {
    nome: modelo.nome,
    descricao: modelo.descricao,
    campos: modelo.campos
  };

  if (modelo.id && modelo.id !== 'novo') {
    payload.id = modelo.id;
  }

  const { error } = await supabase
    .from('modelos_formulario')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar modelo:', error);
    return false;
  }
  return true;
}

export async function excluirModeloFormulario(id: string): Promise<boolean> {
  const { error } = await supabase.from('modelos_formulario').delete().eq('id', id);
  return !error;
}

// --- Ocorrências ---

export async function buscarOcorrencias(): Promise<RegistroOcorrencia[]> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao buscar ocorrências:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    modeloFormularioId: item.modelo_id, // Corrigido para modelo_id
    nomeModelo: item.nome_modelo,
    dados: item.dados,
    nomeAluno: item.nome_aluno,
    turmaAluno: item.turma_aluno,
    anoAluno: item.ano_aluno,
    salaAluno: item.sala_aluno,
    professorAtual: item.professor_atual,
    criadoEm: item.criado_em,
  }));
}

export async function salvarOcorrencia(ocorrencia: Partial<RegistroOcorrencia>): Promise<boolean> {
  const { error } = await supabase
    .from('ocorrencias')
    .insert([{
      modelo_id: ocorrencia.modeloFormularioId,
      nome_modelo: ocorrencia.nomeModelo,
      dados: ocorrencia.dados,
      nome_aluno: ocorrencia.nomeAluno,
      turma_aluno: ocorrencia.turmaAluno,
      ano_aluno: ocorrencia.anoAluno,
      sala_aluno: ocorrencia.salaAluno,
      professor_atual: ocorrencia.professorAtual,
    }]);

  return !error;
}

export async function registrarAtrasoProfessor(payload: {
  sala: number,
  professor: string,
  materia: string,
  turma: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('ocorrencias')
    .insert([{
      nome_modelo: 'Atraso de Professor',
      nome_aluno: 'SALA ' + payload.sala, // Usamos campos existentes para identificar
      turma_aluno: payload.turma,
      sala_aluno: payload.sala,
      professor_atual: payload.professor,
      dados: { materia: payload.materia, tipo: 'atraso_imediato' }
    }]);

  return !error;
}

// --- Períodos Escolares ---

export async function buscarPeriodosEscolares(): Promise<PeriodoConfig[]> {
  const { data, error } = await supabase
    .from('periodos_escolares')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (error) {
    console.error('Erro ao buscar períodos:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id.toString(),
    nome: p.nome,
    horarioInicio: p.horario_inicio,
    horarioFim: p.horario_fim,
    tipo: p.tipo as PeriodoEscolar,
    segmento: p.segmento, // Novo campo
  }));
}

export async function salvarPeriodo(periodo: Partial<PeriodoConfig>): Promise<boolean> {
  const payload: any = {
    nome: periodo.nome,
    horario_inicio: periodo.horarioInicio,
    horario_fim: periodo.horarioFim,
    tipo: periodo.tipo,
    segmento: periodo.segmento
  };

  // Só adiciona ID se não for 'novo'
  if (periodo.id && periodo.id !== 'novo') {
    payload.id = parseInt(periodo.id);
  }

  const { error } = await supabase
    .from('periodos_escolares')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar período:', error);
    return false;
  }
  return true;
}

export async function excluirPeriodo(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('periodos_escolares')
    .delete()
    .eq('id', id);

  return !error;
}

// --- Gestão de Grade Monitores (Escrita) ---

export async function salvarGradeMonitor(grade: Partial<GradeMonitor>): Promise<boolean> {
  const payload: any = {
    monitor_nome: grade.monitorNome,
    dia_semana: grade.diaSemana,
    horario_inicio: grade.horarioInicio,
    horario_fim: grade.horarioFim,
    posto: grade.posto,
    cor_etiqueta: grade.corEtiqueta
  };

  if (grade.id && grade.id !== 'novo') {
    payload.id = grade.id;
  }

  const { error } = await supabase
    .from('grade_monitores')
    .upsert([payload], { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar grade monitor:', error);
    return false;
  }
  return true;
}

export async function excluirGradeMonitor(id: string): Promise<boolean> {
  const { error } = await supabase.from('grade_monitores').delete().eq('id', id);
  return !error;
}

// --- Gestão de Grade (Escrita) ---

export async function salvarGradeSala(entradas: Omit<EntradaGradeSala, 'id'>[]): Promise<boolean> {
  const payload = entradas.map(e => ({
    numero_sala: e.numeroSala,
    dia_semana: e.diaSemana,
    horario: e.horario,
    materia: e.materia,
    nome_professor: e.nomeProfessor,
    turma: e.turma,
    tipo: e.tipo || 'regular',
    lista_alunos: e.listaAlunos || []
  }));

  const { error } = await supabase
    .from('mapa_salas')
    .upsert(payload, {
      onConflict: 'numero_sala,dia_semana,horario'
    });

  if (error) {
    console.error('Erro ao salvar grade:', error);
    return false;
  }

  // LOGICA EXTRA: Criar professor automaticamente se não existir
  const professoresUnicos = Array.from(new Set(entradas.map(e => e.nomeProfessor).filter(n => n && n !== '—' && n !== 'A DEFINIR')));
  for (const nome of professoresUnicos) {
    await salvarProfessorCMS({ nome, cor: '#3B82F6' });
  }

  return true;
}

// --- Chamadas ---

export async function buscarChamadas(filtros?: {
  data?: string;
  professor?: string;
  sala?: string;
  materia?: string;
  idAluno?: string;
  horario?: string;
}): Promise<RegistroChamada[]> {
  let query = supabase.from('chamadas').select('*');

  if (filtros) {
    if (filtros.data) query = query.eq('data', filtros.data);
    if (filtros.professor) query = query.eq('professor', filtros.professor);
    if (filtros.sala) query = query.eq('sala', filtros.sala);
    if (filtros.materia) query = query.eq('materia', filtros.materia);
    if (filtros.idAluno) query = query.eq('id_aluno', filtros.idAluno);
    if (filtros.horario) query = query.eq('horario', filtros.horario);
  }

  const { data, error } = await query.order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao buscar chamadas:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    data: item.data,
    horario: item.horario,
    professor: item.professor,
    sala: item.sala,
    materia: item.materia,
    idAluno: item.id_aluno,
    nomeAluno: item.nome_aluno,
    turmaAluno: item.turma_aluno,
    status: item.status as StatusPresenca,
    criadoEm: item.criado_em,
  }));
}

export async function salvarChamadas(registros: RegistroChamada[]): Promise<boolean> {
  const payload = registros.map(r => ({
    data: r.data,
    horario: r.horario,
    professor: r.professor,
    sala: r.sala,
    materia: r.materia,
    id_aluno: r.idAluno,
    nome_aluno: r.nomeAluno,
    turma_aluno: r.turmaAluno,
    status: r.status,
  }));

  // Utilizamos upsert para garantir que se o professor enviar a chamada novamente,
  // os registros existentes sejam atualizados em vez de duplicados.
  // O 'onConflict' deve bater com a constraint UNIQUE que criamos no SQL.
  const { error } = await supabase
    .from('chamadas')
    .upsert(payload, { onConflict: 'data,horario,sala,id_aluno' });

  return !error;
}