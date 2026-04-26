// ============================================================
// SESI Connect — Serviço de Dados (Supabase)
// ============================================================

import { supabase } from '../lib/supabase';
import type {
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

// ============================================================
// GRADE DE SALAS
// ============================================================

export async function buscarMapaSalas(): Promise<EntradaGradeSala[]> {
  const { data, error } = await supabase.from('mapa_salas').select('*');

  if (error) {
    console.error('[DEBUG] Erro ao buscar mapa de salas:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id || `${item.numero_sala}-${item.dia_semana}-${item.horario}`,
    numeroSala: item.numero_sala,
    nomeSala: `Sala ${item.numero_sala}`,
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

  let salas: Sala[] = rawSalas.map(s => ({
    id: s.id,
    numero: s.numero,
    nome: s.nome,
    segmento: s.segmento as any,
    ano: s.ano || 'A DEFINIR',
    grade: []
  }));

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

  grade.forEach(item => {
    const sala = salas.find(s => s.numero === item.numeroSala);
    if (sala) {
      if (item.anoTurma && item.anoTurma !== 'A DEFINIR') sala.ano = item.anoTurma;
      sala.grade.push(item);
    }
  });

  return salas.sort((a, b) => a.numero - b.numero);
}

export async function salvarGradeSala(entrada: Partial<EntradaGradeSala> | Partial<EntradaGradeSala>[]): Promise<boolean> {
  const lista = Array.isArray(entrada) ? entrada : [entrada];

  const payloads = lista.map(grade => {
    const nSala = Number(grade.numeroSala);
    const diaFormatado = String(grade.diaSemana || '').toUpperCase().trim();
    const horarioStr = String(grade.horario || '').trim();

    if (!nSala || nSala <= 0 || !diaFormatado || !horarioStr) {
      return null;
    }

    return {
      numero_sala: nSala,
      dia_semana: diaFormatado,
      horario: horarioStr,
      nome_professor: grade.nomeProfessor || '—',
      turma: grade.turma || grade.anoTurma || 'A DEFINIR',
      materia: grade.materia || 'A DEFINIR',
      tipo: grade.tipo || 'regular',
      lista_alunos: grade.listaAlunos || [],
    };
  }).filter(p => p !== null);

  console.log('[DEBUG] Payload para salvar:', payloads);

  if (!payloads || payloads.length === 0) {
    console.error('[DEBUG] Nenhum registro válido para salvar na grade.');
    return false;
  }

  try {
    let todosSalvos = true;
    
    for (const payload of payloads) {
      console.log('[DEBUG] Salvando grade:', payload);
      
      const { error: insertError } = await supabase
        .from('mapa_salas')
        .insert(payload);

      if (insertError) {
        console.log('[DEBUG] Erro no insert:', insertError.code, insertError.message);
        
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('mapa_salas')
            .update(payload)
            .eq('numero_sala', payload.numero_sala)
            .eq('dia_semana', payload.dia_semana)
            .eq('horario', payload.horario);
          
          if (updateError) {
            console.error('[DEBUG] Erro no update:', updateError);
            todosSalvos = false;
          } else {
            console.log('[DEBUG] Atualizado com sucesso');
          }
        } else {
          console.error('[DEBUG] Erro ao salvar grade:', insertError);
          todosSalvos = false;
        }
      } else {
        console.log('[DEBUG] Inserido com sucesso');
      }
    }
    console.log('[DEBUG] Resultado final:', todosSalvos);
    return todosSalvos;
  } catch (e) {
    console.error('[DEBUG] Exceção ao salvar grade:', e);
    return false;
  }
}

export async function salvarAlunosNaGrade(
  numeroSala: number,
  diaSemana: string,
  horario: string,
  listaAlunos: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('mapa_salas')
    .update({ lista_alunos: listaAlunos })
    .eq('numero_sala', numeroSala)
    .eq('dia_semana', diaSemana.toUpperCase().trim())
    .eq('horario', horario.trim());

  return !error;
}

// ============================================================
// ALUNOS
// ============================================================

export async function buscarAlunos(): Promise<Aluno[]> {
  const { data, error } = await supabase.from('alunos_cms').select('*');
  if (error) return [];
  return (data || []).map(item => ({
    id: item.id,
    nome: item.nome,
    turma: item.turma,
    ano: item.ano,
    numeroSala: item.numero_sala,
  }));
}

export async function salvarAluno(aluno: Partial<Aluno>): Promise<boolean> {
  if (!aluno.nome?.trim()) return false;

  const payload: any = {
    nome: aluno.nome.trim(),
    turma: String(aluno.turma || '').trim(),
    ano: String(aluno.ano || '').trim(),
  };

  if (aluno.numeroSala !== undefined && aluno.numeroSala !== null) {
    payload.numero_sala = Number(aluno.numeroSala);
  }

  try {
    // Primeiro tenta INSERT
    const { error: insertError } = await supabase
      .from('alunos_cms')
      .insert([payload]);

    if (insertError) {
      // Se for duplicado, faz UPDATE
      if (insertError.code === '23505') {
        await supabase
          .from('alunos_cms')
          .update(payload)
          .eq('nome', payload.nome);
      } else {
        console.error('[DEBUG] Erro ao salvar aluno:', insertError);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error('[DEBUG] Erro ao salvar aluno:', e);
    return false;
  }
}

export async function excluirAluno(id: string): Promise<boolean> {
  const { error } = await supabase.from('alunos_cms').delete().eq('id', id);
  return !error;
}

// ============================================================
// PROFESSORES
// ============================================================

export async function buscarProfessoresCMS(): Promise<ProfessorCMS[]> {
  const { data, error } = await supabase
    .from('professores_cms')
    .select('*')
    .order('nome', { ascending: true });

  if (error) return [];
  return (data || []).map(p => ({
    id: p.id,
    nome: p.nome,
    cor: p.cor,
    especialidade: p.especialidade
  }));
}

export async function salvarProfessorCMS(prof: Partial<ProfessorCMS>): Promise<boolean> {
  if (!prof.nome?.trim()) return false;

  const payload = {
    nome: prof.nome.trim(),
    cor: prof.cor || '#3B82F6',
    especialidade: prof.especialidade || '',
  };

  try {
    const { error: insertError } = await supabase
      .from('professores_cms')
      .insert([payload]);

    if (insertError && insertError.code === '23505') {
      await supabase
        .from('professores_cms')
        .update(payload)
        .eq('nome', payload.nome);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function excluirProfessorCMS(id: string): Promise<boolean> {
  const { error } = await supabase.from('professores_cms').delete().eq('id', id);
  return !error;
}

// ============================================================
// ATIVIDADES AFTER SCHOOL
// ============================================================

export async function buscarAtividadesAfter(): Promise<AtividadeAfter[]> {
  const { data } = await supabase.from('atividades_after').select('*');
  if (!data) return [];

  return data.map(item => ({
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
    const { error } = await supabase.from('atividades_after').update(payload).eq('id', atividade.id);
    return !error;
  }

  const { error } = await supabase.from('atividades_after').insert([payload]);
  return !error;
}

export async function excluirAtividadeAfter(id: string): Promise<boolean> {
  const { error } = await supabase.from('atividades_after').delete().eq('id', id);
  return !error;
}

// ============================================================
// MONITORES
// ============================================================

export async function buscarMonitores(): Promise<Monitor[]> {
  const { data } = await supabase.from('monitores').select('*');
  if (!data) return [];

  return data.map(item => ({
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
    const { error } = await supabase.from('monitores').update(payload).eq('id', monitor.id);
    return !error;
  }

  const { error } = await supabase.from('monitores').insert([payload]);
  return !error;
}

export async function excluirMonitor(id: string): Promise<boolean> {
  const { error } = await supabase.from('monitores').delete().eq('id', id);
  return !error;
}

// ============================================================
// GRADE MONITORES
// ============================================================

export async function buscarGradeMonitores(): Promise<GradeMonitor[]> {
  const { data } = await supabase
    .from('grade_monitores')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (!data) return [];

  return data.map(item => ({
    id: item.id,
    monitorNome: item.monitor_nome,
    diaSemana: item.dia_semana,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    posto: item.posto,
    corEtiqueta: item.cor_etiqueta,
  }));
}

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
    const { error } = await supabase.from('grade_monitores').update(payload).eq('id', grade.id);
    return !error;
  }

  const { error } = await supabase.from('grade_monitores').insert([payload]);
  return !error;
}

export async function excluirGradeMonitor(id: string): Promise<boolean> {
  const { error } = await supabase.from('grade_monitores').delete().eq('id', id);
  return !error;
}

// ============================================================
// LANGUAGE LAB
// ============================================================

export async function buscarLanguageLab(): Promise<LanguageLabRecord[]> {
  const { data } = await supabase
    .from('language_lab')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (!data) return [];

  return data.map(item => ({
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
    const { error } = await supabase.from('language_lab').update(payload).eq('id', record.id);
    return !error;
  }

  const { error } = await supabase.from('language_lab').insert([payload]);
  return !error;
}

export async function excluirLanguageLab(id: string): Promise<boolean> {
  const { error } = await supabase.from('language_lab').delete().eq('id', id);
  return !error;
}

// ============================================================
// LOCAIS
// ============================================================

export async function buscarLocaisCMS(): Promise<LocalCMS[]> {
  const { data } = await supabase
    .from('locais_cms')
    .select('*')
    .order('numero', { ascending: true });

  if (!data) return [];

  return data.map(l => ({
    id: l.id,
    nome: l.nome,
    numero: l.numero,
    tipo: l.tipo,
    capacidade: l.capacidade
  }));
}

export async function salvarLocalCMS(local: Partial<LocalCMS>): Promise<boolean> {
  if (!local.nome?.trim()) {
    console.error('[DEBUG] Nome do local é obrigatório');
    return false;
  }

  const payload: any = {
    nome: local.nome.trim(),
    numero: local.numero ?? undefined,
    tipo: local.tipo || 'sala',
    capacidade: local.capacidade || 0
  };

  console.log('[DEBUG] Salvando local:', payload);

  try {
    const { error } = await supabase
      .from('locais_cms')
      .insert([payload]);
    
    if (error) {
      console.log('[DEBUG] Erro no insert:', error.code, error.message);
      
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('locais_cms')
          .update(payload)
          .eq('nome', local.nome.trim());
        
        if (updateError) {
          console.error('[DEBUG] Erro no update local:', updateError);
          return false;
        }
        console.log('[DEBUG] Local atualizado com sucesso');
        return true;
      }
      
      console.error('[DEBUG] Erro ao inserir local:', error);
      return false;
    }
    
    console.log('[DEBUG] Local inserido com sucesso');
    return true;
  } catch (e) {
    console.error('[DEBUG] Exceção ao salvar local:', e);
    return false;
  }
}

export async function excluirLocalCMS(id: string): Promise<boolean> {
  const { error } = await supabase.from('locais_cms').delete().eq('id', id);
  return !error;
}

// ============================================================
// PERÍODOS ESCOLARES
// ============================================================

export async function buscarPeriodosEscolares(): Promise<PeriodoConfig[]> {
  const { data } = await supabase
    .from('periodos_escolares')
    .select('*')
    .order('horario_inicio', { ascending: true });

  if (!data) return [];

  return data.map(p => ({
    id: p.id.toString(),
    nome: p.nome,
    horarioInicio: p.horario_inicio,
    horarioFim: p.horario_fim,
    tipo: p.tipo as PeriodoEscolar,
    segmento: p.segmento,
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

  if (periodo.id && periodo.id !== 'novo') {
    payload.id = parseInt(periodo.id);
    const { error } = await supabase.from('periodos_escolares').update(payload).eq('id', payload.id);
    return !error;
  }

  const { error } = await supabase.from('periodos_escolares').insert([payload]);
  return !error;
}

export async function excluirPeriodo(id: string): Promise<boolean> {
  const { error } = await supabase.from('periodos_escolares').delete().eq('id', id);
  return !error;
}

// ============================================================
// OCORRÊNCIAS
// ============================================================

export async function buscarOcorrencias(): Promise<RegistroOcorrencia[]> {
  const { data } = await supabase
    .from('ocorrencias')
    .select('*')
    .order('criado_em', { ascending: false });

  if (!data) return [];

  return data.map(item => ({
    id: item.id,
    modeloFormularioId: item.modelo_id,
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
  const { error } = await supabase.from('ocorrencias').insert([{
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
  sala: number;
  professor: string;
  materia: string;
  turma: string
}): Promise<boolean> {
  const { error } = await supabase.from('ocorrencias').insert([{
    nome_modelo: 'Atraso de Professor',
    nome_aluno: 'SALA ' + payload.sala,
    turma_aluno: payload.turma,
    sala_aluno: payload.sala,
    professor_atual: payload.professor,
    dados: { materia: payload.materia, tipo: 'atraso_imediato' }
  }]);
  return !error;
}

// ============================================================
// MODELOS DE FORMULÁRIO
// ============================================================

export async function buscarModelosFormulario(): Promise<ModeloFormulario[]> {
  const { data } = await supabase
    .from('modelos_formulario')
    .select('*')
    .order('criado_em', { ascending: false });

  if (!data) return [];

  return data.map(item => ({
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
    const { error } = await supabase.from('modelos_formulario').update(payload).eq('id', modelo.id);
    return !error;
  }

  const { error } = await supabase.from('modelos_formulario').insert([payload]);
  return !error;
}

export async function excluirModeloFormulario(id: string): Promise<boolean> {
  const { error } = await supabase.from('modelos_formulario').delete().eq('id', id);
  return !error;
}

// ============================================================
// CHAMADAS
// ============================================================

export async function buscarChamadas(filtros?: {
  data?: string;
  sala?: string;
  horario?: string;
  professor?: string;
}): Promise<RegistroChamada[]> {
  let query = supabase.from('chamadas').select('*');

  if (filtros?.data) query = query.eq('data', filtros.data);
  if (filtros?.sala) query = query.eq('sala', filtros.sala);
  if (filtros?.horario) query = query.eq('horario', filtros.horario);
  if (filtros?.professor) query = query.eq('professor', filtros.professor);

  const { data } = await query.order('data', { ascending: false });
  if (!data) return [];

  return data.map(item => ({
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

export async function salvarChamadas(registros: Partial<RegistroChamada>[]): Promise<boolean> {
  if (!registros?.length) return false;

  const payloads = registros.map(r => ({
    data: r.data,
    horario: r.horario,
    professor: r.professor || '',
    sala: r.sala,
    materia: r.materia || '',
    id_aluno: r.idAluno,
    nome_aluno: r.nomeAluno || '',
    turma_aluno: r.turmaAluno || '',
    status: r.status,
  }));

  const { error } = await supabase.from('chamadas').insert(payloads);
  
  // Ignora erro de duplicata para chamadas
  if (error && error.code !== '23505') {
    console.error('[DEBUG] Erro ao salvar chamadas:', error);
    return false;
  }

  return true;
}

// ============================================================
// PROFESSORES CONFIG (realocação)
// ============================================================

export async function buscarProfessoresConfig(): Promise<any[]> {
  const { data } = await supabase.from('professores_config').select('*');
  return data || [];
}

export async function salvarProfessorConfig(prof: any): Promise<boolean> {
  const payload = {
    nome: prof.nome,
    cor: prof.cor || '#3B82F6',
    materia: prof.materia || '',
    ativo: prof.ativo !== false,
  };
  const { error: insertError } = await supabase.from('professores_config').insert([payload]);
  if (insertError && insertError.code === '23505') {
    await supabase.from('professores_config').update(payload).eq('nome', payload.nome);
  }
  return true;
}

// ============================================================
// EVENTOS E REALOCAÇÕES
// ============================================================

export async function buscarEventosEscola(): Promise<any[]> {
  const { data } = await supabase.from('eventos_escola').select('*');
  return data || [];
}

export async function salvarEvento(evento: any): Promise<boolean> {
  const payload = {
    titulo: evento.titulo,
    data: evento.data,
    tipo: evento.tipo || 'evento',
    descricao: evento.descricao || '',
  };
  if (evento.id) payload.id = evento.id;
  const { error } = await supabase.from('eventos_escola').insert([payload]);
  return !error;
}

export async function buscarRealocacoes(): Promise<any[]> {
  const { data } = await supabase.from('realocacoes').select('*');
  return data || [];
}

export async function salvarRealocacao(realocacao: any): Promise<boolean> {
  const payload = {
    professor_original: realocacao.professorOriginal,
    professor_substituto: realocacao.professorSubstituto || '',
    sala: realocacao.sala,
    materia: realocacao.materia || '',
    turma: realocacao.turma || '',
    data: realocacao.data,
    horario: realocacao.horario,
    motivo: realocacao.motivo || '',
    status: realocacao.status || 'pendente',
  };
  if (realocacao.id) payload.id = realocacao.id;
  const { error } = await supabase.from('realocacoes').insert([payload]);
  return !error;
}