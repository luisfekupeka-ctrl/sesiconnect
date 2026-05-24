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

  async fetchRecords(filters?: {
    student_name?: string;
    school_year?: string;
    occurrence_type?: string;
    date?: string; // YYYY-MM-DD
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
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily occurrence records:', error);
      throw error;
    }

    return data || [];
  }
};
