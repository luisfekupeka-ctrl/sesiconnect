import { supabase } from '../lib/supabase';
import type { DailyOccurrenceRecord } from '../types';

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

  async fetchRecords(filters?: {
    student_name?: string;
    school_year?: number;
    occurrence_type?: string;
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
        query = query.eq('school_year', filters.school_year);
      }
      if (filters.occurrence_type) {
        query = query.eq('occurrence_type', filters.occurrence_type);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily occurrence records:', error);
      throw error;
    }

    return data || [];
  }
};
