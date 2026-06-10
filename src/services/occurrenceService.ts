import { supabase } from '../lib/supabase';
import type { DailyOccurrenceRecord } from '../types';

export const GROUP_FRIENDLY_NAMES: Record<string, string> = {
  celular_eletronicos: 'Uso indevido de celular e aparelhos eletrônicos',
  desrespeito: 'Desrespeito a colegas, professores e funcionários',
  baderna_perturbacao: 'Baderna, gritaria e perturbação das aulas',
  bullying_constrangimentos: 'Bullying, cyberbullying e constrangimentos',
  agressao_fisica_verbal: 'Agressão física ou verbal',
  saida_sem_autorizacao: 'Saída da sala ou da escola sem autorização',
  atraso: 'Atrasos e descumprimento de horários',
  patrimonio: 'Danos ao patrimônio escolar ou pertences alheios',
  cola_fraude: 'Cola, fraude e falsificação de documentos',
  substancias_proibidas: 'Porte ou uso de vape, cigarros, álcool e drogas',
  uniforme: 'Uso inadequado do uniforme escolar',
  porte_objetos: 'Porte de objetos ou materiais não autorizados',
  comercio_vendas: 'Comércio, vendas ou arrecadações sem autorização',
  descumprimento_orientacoes: 'Descumprimento de orientações da equipe escolar',
  conduta_incompativel: 'Conduta incompatível com o ambiente escolar'
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
  if (t.includes('patrimônio') || t.includes('patrimonio') || t.includes('danos') || t.includes('pertence') || t.includes('quebrar')) {
    return 'patrimonio';
  }
  if (t.includes('saída') || t.includes('saida')) {
    return 'saida_sem_autorizacao';
  }
  if (t.includes('vape') || t.includes('cigarro') || t.includes('álcool') || t.includes('alcool') || t.includes('droga') || t.includes('bebida')) {
    return 'substancias_proibidas';
  }
  if (t.includes('baderna') || t.includes('gritaria') || t.includes('perturbação') || t.includes('perturbacao') || t.includes('bagunça') || t.includes('bagunca') || t.includes('barulho')) {
    return 'baderna_perturbacao';
  }
  if (t.includes('cola') || t.includes('fraude') || t.includes('falsificação') || t.includes('falsificacao')) {
    return 'cola_fraude';
  }
  if (t.includes('objeto') || t.includes('material') || t.includes('materiais')) {
    return 'porte_objetos';
  }
  if (t.includes('comércio') || t.includes('comercio') || t.includes('venda') || t.includes('arrecada')) {
    return 'comercio_vendas';
  }
  if (t.includes('orienta')) {
    return 'descumprimento_orientacoes';
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

