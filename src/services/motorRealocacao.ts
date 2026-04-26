import { supabase } from '../lib/supabase';
import {
  ProfessorConfig,
  EventoEscola,
  ResultadoRealocacao,
  EntradaGradeSala,
  AreaConhecimento,
  TipoEventoEscola,
  AcaoRealocacao,
  SegmentoEscolar,
  StatusEvento
} from '../types';

// DETECÇÃO DE BLOCOS E PROFESSORES LIVRES
// ==========================================

export function detectarBlocos(professor: string, dia: string, grade: EntradaGradeSala[]): string[][] {
  const aulasDoDia = grade
    .filter(a => a.nomeProfessor === professor && a.diaSemana === dia)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const blocos: string[][] = [];
  let blocoAtual: string[] = [];

  for (let i = 0; i < aulasDoDia.length; i++) {
    const aula = aulasDoDia[i];

    if (blocoAtual.length === 0) {
      blocoAtual.push(aula.horario);
    } else {
      const ultimaAulaFim = blocoAtual[blocoAtual.length - 1].split(' - ')[1];
      const aulaAtualInicio = aula.horario.split(' - ')[0];

      // Se os horários são contínuos (ex: 13:45 == 13:45)
      if (ultimaAulaFim === aulaAtualInicio) {
        blocoAtual.push(aula.horario);
      } else {
        blocos.push([...blocoAtual]);
        blocoAtual = [aula.horario];
      }
    }
  }

  if (blocoAtual.length > 0) {
    blocos.push(blocoAtual);
  }

  return blocos;
}

export function encontrarProfessoresLivres(
  horario: string,
  dia: string,
  grade: EntradaGradeSala[],
  professoresConfig: ProfessorConfig[]
): ProfessorConfig[] {
  const ocupados = new Set(
    grade
      .filter(a => a.diaSemana === dia && a.horario === horario)
      .map(a => a.nomeProfessor)
  );

  return professoresConfig.filter(p => !ocupados.has(p.nome));
}

// ==========================================
// CENÁRIO 1: MODO PROVA (Professor Fixo na Sala)
// ==========================================

export function calcularModoProva(
  profFixo: string,
  salaNumero: number,
  horarios: string[],
  dia: string,
  segmento: string,
  grade: EntradaGradeSala[],
  configs: ProfessorConfig[]
): ResultadoRealocacao[] {
  const resultados: ResultadoRealocacao[] = [];

  horarios.forEach(h => {
    resultados.push({
      id: `prova-${Math.random()}`,
      eventoId: 'modo-prova',
      tipo: 'PROVA',
      professorOriginal: 'Livre',
      professorSubstituto: profFixo,
      turma: `SALA ${salaNumero} (PROVA)`,
      horario: h,
      segmento: segmento,
      acao: 'MODO PROVA',
      status: 'EFETIVADO'
    });
  });

  const aulasParaRepor = grade.filter(g =>
    g.nomeProfessor === profFixo &&
    g.diaSemana === dia &&
    horarios.includes(g.horario)
  );

  aulasParaRepor.forEach(aula => {
    const substitutosValidos = configs.filter(c => {
      const ocupado = grade.some(g =>
        g.nomeProfessor === c.nome &&
        g.diaSemana === dia &&
        g.horario === aula.horario
      );
      // Trava de Segmento: No futuro o config terá a lista de segmentos do prof
      return !ocupado;
    });

    if (substitutosValidos.length > 0) {
      resultados.push({
        id: `rep-${Math.random()}`,
        eventoId: 'modo-prova',
        tipo: 'FALTA',
        professorOriginal: profFixo,
        professorSubstituto: substitutosValidos[0].nome,
        turma: aula.turma,
        horario: aula.horario,
        segmento: segmento,
        acao: 'Substituição',
        status: 'EFETIVADO'
      });
    }
  });

  return resultados;
}

// ==========================================
// CENÁRIO 2: FALTA DE PROFESSOR
// ==========================================

export function calcularCenarioFalta(
  dia: string,
  horarios: string[],
  professorAlvo: string,
  segmento: string,
  grade: EntradaGradeSala[],
  professoresConfig: ProfessorConfig[]
): ResultadoRealocacao[] {
  const resultados: ResultadoRealocacao[] = [];

  horarios.forEach(horario => {
    const aulaAfetada = grade.find(a =>
      a.nomeProfessor === professorAlvo &&
      a.diaSemana === dia &&
      a.horario === horario
    );

    if (!aulaAfetada) return;

    let livres = encontrarProfessoresLivres(horario, dia, grade, professoresConfig);
    const substituto = livres.length > 0 ? livres[0] : null;

    resultados.push({
      id: `falta-${Math.random()}`,
      eventoId: 'falta-id',
      tipo: 'FALTA',
      professorOriginal: professorAlvo,
      professorSubstituto: substituto ? substituto.nome : 'A DEFINIR',
      turma: aulaAfetada.turma,
      horario,
      segmento: segmento,
      acao: 'Substituição',
      status: 'EFETIVADO'
    });
  });

  return resultados;
}

// ==========================================
// FUNÇÕES DE PERSISTÊNCIA (SUPABASE)
// ==========================================

export async function buscarProfessoresConfig(): Promise<ProfessorConfig[]> {
  const { data, error } = await supabase.from('professores_config').select('*');
  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    nome: item.nome,
    disciplina: item.disciplina,
    cargaMaximaDia: item.carga_maxima_dia,
    area: item.area as AreaConhecimento
  }));
}

export async function salvarProfessorConfig(config: Partial<ProfessorConfig>): Promise<boolean> {
  const payload = {
    id: config.id !== 'novo' ? config.id : undefined,
    nome: config.nome,
    disciplina: config.disciplina,
    carga_maxima_dia: config.cargaMaximaDia,
    area: config.area
  };

  const { error } = await supabase.from('professores_config').upsert([payload], { onConflict: 'nome' });
  return !error;
}

export async function salvarEventoEscola(evento: Partial<EventoEscola>): Promise<string | null> {
  console.log('[DEBUG]Salvando evento escola:', evento);
  
  const payload = {
    tipo: evento.tipo,
    professor: evento.professor,
    turma: evento.turma,
    dia: evento.dia,
    horarios: evento.horarios,
    status: evento.status || 'EFETIVADO'
  };

  console.log('[DEBUG] Payload evento:', JSON.stringify(payload, null, 2));

  const { data, error } = await supabase.from('eventos_escola').insert([payload]).select().single();
  if (error || !data) {
    console.error('[DEBUG] Erro ao salvar evento:', error);
    return null;
  }
  console.log('[DEBUG] Evento salvo com ID:', data.id);
  return data.id;
}

export async function salvarRealocacoes(realocacoes: ResultadoRealocacao[]): Promise<boolean> {
  console.log('[DEBUG] Salvando realocacoes:', realocacoes.length);
  
  const payload = realocacoes.map(r => ({
    evento_id: r.eventoId,
    tipo: r.tipo,
    professor_original: r.professorOriginal,
    professor_substituto: r.professorSubstituto,
    turma: r.turma,
    horario: r.horario,
    segmento: r.segmento,
    acao: r.acao,
    status: r.status || 'EFETIVADO'
  }));

  console.log('[DEBUG] Payload realocacoes:', JSON.stringify(payload, null, 2));

  const { error } = await supabase.from('realocacoes').insert(payload);
  if (error) {
    console.error('[DEBUG] Erro ao salvar realocacoes:', error);
    return false;
  }
  console.log('[DEBUG] Realocacoes salvas com sucesso!');
  return true;
}

export async function buscarRealocacoes(): Promise<ResultadoRealocacao[]> {
  const { data, error } = await supabase
    .from('realocacoes')
    .select('*, eventos_escola(dia)')
    .order('criado_em', { ascending: false });
  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    eventoId: item.evento_id,
    tipo: item.tipo as TipoEventoEscola,
    professorOriginal: item.professor_original,
    professorSubstituto: item.professor_substituto,
    turma: item.turma,
    horario: item.horario,
    segmento: item.segmento,
    acao: item.acao as AcaoRealocacao,
    status: item.status as StatusEvento,
    dia: (item as any).eventos_escola?.dia
  }));
}

export async function aprovarRascunho(eventoId: string): Promise<boolean> {
  // Atualiza o status do evento principal
  const { error: err1 } = await supabase
    .from('eventos_escola')
    .update({ status: 'EFETIVADO' })
    .eq('id', eventoId);
  if (err1) return false;

  // Atualiza todas as realocações vinculadas a este evento
  const { error: err2 } = await supabase
    .from('realocacoes')
    .update({ status: 'EFETIVADO' })
    .eq('evento_id', eventoId);
  return !err2;
}

export async function excluirEvento(eventoId: string): Promise<boolean> {
  // Primeiro deletamos as realocações vinculadas ao evento
  const { error: errRealoc } = await supabase
    .from('realocacoes')
    .delete()
    .eq('evento_id', eventoId);

  if (errRealoc) return false;

  // Depois removemos o registro do evento principal
  const { error: errEvento } = await supabase
    .from('eventos_escola')
    .delete()
    .eq('id', eventoId);

  return !errEvento;
}