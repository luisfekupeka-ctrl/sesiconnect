import { supabase } from '../lib/supabase';
import type { DailyOccurrenceRecord } from '../types';

export const GROUP_FRIENDLY_NAMES: Record<string, string> = {
  celular_eletronicos: 'Uso Indevido de Celular / Eletrônicos',
  indisciplina_conduta: 'Indisciplina / Conduta Escolar',
  uniforme: 'Descumprimento do Uniforme',
  atraso: 'Atraso',
  conflito_agressao: 'Conflito / Agressão',
  patrimonio: 'Danos ao Patrimônio',
  outros: 'Outros'
};

export const getOccurrenceGroup = (type: string): string => {
  const t = (type || '').toLowerCase().trim();
  
  if (t.includes('celular') || t.includes('aparelho') || t.includes('eletrônico') || t.includes('eletronico')) {
    return 'celular_eletronicos';
  }
  if (t.includes('uniforme')) {
    return 'uniforme';
  }
  if (t.includes('atraso')) {
    return 'atraso';
  }
  if (t.includes('agressão') || t.includes('agressao') || t.includes('conflito') || t.includes('desrespeito')) {
    return 'conflito_agressao';
  }
  if (t.includes('patrimônio') || t.includes('patrimonio') || t.includes('danos')) {
    return 'patrimonio';
  }
  if (t.includes('indisciplina') || t.includes('conduta') || t.includes('normas') || t.includes('atividades') || t.includes('orientações') || t.includes('material')) {
    return 'indisciplina_conduta';
  }
  return 'outros';
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

