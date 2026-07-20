import { supabase } from '../lib/supabase';
import type { DailyOccurrenceRecord } from '../types';

export const GROUP_FRIENDLY_NAMES: Record<string, string> = {
  celular_eletronicos: 'Uso indevido de celular e aparelhos eletrônicos',
  desrespeito: 'Desrespeito a colegas, professores e funcionários',
  baderna_perturbacao: 'Baderna, gritaria e perturbação das aulas',
  bullying_constrangimentos: 'Bullying, cyberbullying e constrangimentos',
  agressao_fisica_verbal: 'Agressão física ou verbal',
  saida_sala: 'Saída da sala sem autorização',
  saida_escola: 'Saída da escola sem autorização',
  atraso: 'Atrasos e descumprimento de horários',
  dano_leve: 'Danos leves ao patrimônio ou pertences alheios, sem intenção',
  dano_intencional: 'Dano intencional ou depredação',
  cola_fraude_atividade: 'Cola ou fraude em atividade escolar',
  falsificacao_documentos: 'Falsificação ou adulteração de documentos',
  substancias_proibidas: 'Porte ou uso de vape, cigarros, álcool e drogas',
  uniforme: 'Uso inadequado do uniforme escolar',
  porte_objetos_comuns: 'Porte de objetos ou materiais comuns não autorizados',
  porte_objeto_perigoso: 'Porte de objeto perigoso, arma ou explosivo',
  comercio_vendas: 'Comércio, vendas ou arrecadações sem autorização',
  conduta_incompativel: 'Conduta incompatível com o ambiente escolar'
};

export const getMinimoParaAta = (groupKey: string): number => {
  const graves = [
    'bullying_constrangimentos',
    'agressao_fisica_verbal',
    'saida_escola',
    'dano_intencional',
    'falsificacao_documentos',
    'substancias_proibidas',
    'porte_objeto_perigoso'
  ];
  if (graves.includes(groupKey)) {
    return 1;
  }
  return 4;
};

export const getOccurrenceGroup = (type: string): string => {
  const t = (type || '').toLowerCase().trim();
  
  if (t.includes('celular') || t.includes('aparelho') || t.includes('eletrô') || t.includes('eletro')) {
    return 'celular_eletronicos';
  }
  if (t.includes('uniforme')) {
    return 'uniforme';
  }
  if (t.includes('atraso') || t.includes('horário') || t.includes('horario')) {
    return 'atraso';
  }
  if (t.includes('bullying') || t.includes('cyberbullying') || t.includes('constrangimento')) {
    return 'bullying_constrangimentos';
  }
  if (t.includes('agressão') || t.includes('agressao') || t.includes('física') || t.includes('fisica') || t.includes('verbal') || t.includes('briga') || t.includes('conflito')) {
    return 'agressao_fisica_verbal';
  }
  if (t.includes('desrespeito') || t.includes('ofensa') || t.includes('xingamento') || t.includes('ofender')) {
    return 'desrespeito';
  }
  if (t.includes('dano leve') || (t.includes('patrimônio') && t.includes('leve')) || (t.includes('patrimonio') && t.includes('leve')) || (t.includes('danos') && t.includes('leve')) || (t.includes('danos') && !t.includes('intencional') && !t.includes('depredação') && !t.includes('depredacao'))) {
    return 'dano_leve';
  }
  if (t.includes('depredação') || t.includes('depredacao') || t.includes('intencional') || t.includes('dano intencional')) {
    return 'dano_intencional';
  }
  if (t.includes('saída da sala ou da escola') || t.includes('saida da sala ou da escola') || (t.includes('saida') && t.includes('autorizacao') && !t.includes('sala') && !t.includes('escola'))) {
    return 'saida_sala';
  }
  if (t.includes('saída da sala') || t.includes('saida da sala') || (t.includes('saida') && t.includes('sala'))) {
    return 'saida_sala';
  }
  if (t.includes('saída da escola') || t.includes('saida da escola') || (t.includes('saida') && t.includes('escola'))) {
    return 'saida_escola';
  }
  if (t.includes('vape') || t.includes('cigarro') || t.includes('álcool') || t.includes('alcool') || t.includes('droga') || t.includes('bebida')) {
    return 'substancias_proibidas';
  }
  if (t.includes('baderna') || t.includes('gritaria') || t.includes('perturbação') || t.includes('perturbacao') || t.includes('bagunça') || t.includes('bagunca') || t.includes('barulho')) {
    return 'baderna_perturbacao';
  }
  if (t.includes('cola') || t.includes('fraude') || t.includes('atividade')) {
    return 'cola_fraude_atividade';
  }
  if (t.includes('falsificação') || t.includes('falsificacao') || t.includes('adulteração') || t.includes('adulteracao')) {
    return 'falsificacao_documentos';
  }
  if (t.includes('perigoso') || t.includes('arma') || t.includes('explosivo')) {
    return 'porte_objeto_perigoso';
  }
  if (t.includes('objeto') || t.includes('material') || t.includes('materiais')) {
    return 'porte_objetos_comuns';
  }
  if (t.includes('comércio') || t.includes('comercio') || t.includes('venda') || t.includes('arrecada')) {
    return 'comercio_vendas';
  }
  if (t.includes('orienta')) {
    return 'conduta_incompativel';
  }
  if (t.includes('conduta') || t.includes('incompatível') || t.includes('incompativel') || t.includes('indisciplina') || t.includes('normas') || t.includes('regras') || t.includes('postura')) {
    return 'conduta_incompativel';
  }
  return 'conduta_incompativel';
};

export const occurrenceService = {
  async createRecord(record: Omit<DailyOccurrenceRecord, 'id' | 'created_at'>): Promise<DailyOccurrenceRecord> {
    const { data, error } = await supabase
      .from('daily_occurrence_records')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating daily occurrence record:', error);
      throw error;
    }

    return data;
  },

  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_occurrence_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting daily occurrence record:', error);
      throw error;
    }
  },

  async deleteRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('daily_occurrence_records')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting daily occurrence records:', error);
      throw error;
    }
  },

  async fetchRecords(filters?: {
    student_name?: string;
    school_year?: string;
    occurrence_type?: string;
    date?: string; // YYYY-MM-DD
    start_date?: string; // ISO string
    end_date?: string; // ISO string
    tratada?: boolean;
  }): Promise<DailyOccurrenceRecord[]> {
    let query = supabase
      .from('daily_occurrence_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.student_name) {
        query = query.ilike('student_name', `%${filters.student_name}%`);
      }
      if (filters.school_year) {
        // Replace º, °, and ª with _ (SQL single character wildcard) to match both
        const safeYear = filters.school_year.replace(/[º°ª]/g, '_');
        query = query.ilike('school_year', `%${safeYear}%`);
      }
      if (filters.occurrence_type) {
        query = query.eq('occurrence_type', filters.occurrence_type);
      }
      if (filters.date) {
        // Filter records from the start of the day to the end of the day in local time (UTC-3)
        const startOfDay = new Date(`${filters.date}T00:00:00-03:00`);
        const endOfDay = new Date(`${filters.date}T23:59:59-03:00`);
        query = query.gte('created_at', startOfDay.toISOString());
        query = query.lte('created_at', endOfDay.toISOString());
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }
      if (filters.tratada !== undefined) {
        if (filters.tratada) {
          query = query.eq('tratada', true);
        } else {
          query = query.or('tratada.eq.false,tratada.is.null');
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily occurrence records:', error);
      throw error;
    }

    return data || [];
  },

  async markRecordsAsTreated(studentName: string, occurrenceType: string): Promise<void> {
    // Busca registros não tratados do aluno
    const records = await this.fetchRecords({
      student_name: studentName,
      tratada: false
    });
    
    const targetGroup = getOccurrenceGroup(occurrenceType);
    const targetIds = records
      .filter(r => getOccurrenceGroup(r.occurrence_type) === targetGroup)
      .map(r => r.id)
      .filter((id): id is string => !!id);

    if (targetIds.length === 0) return;

    const { error } = await supabase
      .from('daily_occurrence_records')
      .update({ tratada: true })
      .in('id', targetIds);

    if (error) {
      console.error('Error marking daily occurrence records as treated:', error);
      throw error;
    }
  },

  async updateRecord(id: string, record: Partial<DailyOccurrenceRecord>): Promise<DailyOccurrenceRecord> {
    const { data, error } = await supabase
      .from('daily_occurrence_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily occurrence record:', error);
      throw error;
    }

    return data;
  }
};

