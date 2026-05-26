import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Search, PlusCircle, Download, FileSpreadsheet, Loader2, Calendar, User, Tag, CheckCircle2, Copy, X, Printer, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { occurrenceService } from '../services/occurrenceService';
import { generateOccurrencesPDF, generateOccurrencesExcel, generateSingleOccurrencePDF } from '../lib/reportGenerator';
import { useEscola } from '../context/ContextoEscola';
import { useAuth } from '../context/AuthContext';
import type { DailyOccurrenceRecord } from '../types';
import { generateWordOccurrence } from '../lib/wordGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TIPOS_OCORRENCIA = [
  'Atraso',
  'Sem uniforme',
  'Indisciplina em sala',
  'Uso indevido de celular',
  'Falta de material',
  'Agressão verbal',
  'Agressão física',
  'Outros'
];

const SERIES_OPCOES = [
  'Todos',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º Ano EM',
  '2º Ano EM',
  '3º Ano EM'
];

const SERIES_CADASTRO = [
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º Ano EM',
  '2º Ano EM',
  '3º Ano EM'
];

export function Occurrences() {
  const { alunos } = useEscola();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClose = (e: Event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'registro' | 'consulta' | 'relatorios'>('registro');
  
  // Registration Form State
  const [studentName, setStudentName] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [schoolYear, setSchoolYear] = useState('');
  const [occurrenceType, setOccurrenceType] = useState(TIPOS_OCORRENCIA[0]);
  const [dynamicValue, setDynamicValue] = useState('');
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DailyOccurrenceRecord | null>(null);
  const [emissorName, setEmissorName] = useState('');
  const [generatedMessageAfterSubmit, setGeneratedMessageAfterSubmit] = useState('');
  const [reoffenderAlert, setReoffenderAlert] = useState<{
    visible: boolean;
    studentName: string;
    occurrenceType: string;
    count: number;
    occurrences: DailyOccurrenceRecord[];
  } | null>(null);

  useEffect(() => {
    if (profile?.nome) {
      setEmissorName(profile.nome);
    }
  }, [profile]);

  // Dynamic field config
  const getDynamicField = (type: string) => {
    switch (type) {
      case 'Atraso': return { label: 'Horário de Chegada', type: 'time', placeholder: 'Ex: 07:30' };
      case 'Sem uniforme': return { label: 'Peça Faltando (Opcional)', type: 'text', placeholder: 'Ex: Camiseta padrão' };
      case 'Indisciplina em sala': return { label: 'Aula / Matéria', type: 'text', placeholder: 'Ex: Matemática' };
      case 'Uso indevido de celular': return { label: 'Local do Ocorrido', type: 'text', placeholder: 'Ex: Pátio, Sala 3...' };
      case 'Falta de material': return { label: 'Qual Material', type: 'text', placeholder: 'Ex: Apostila de História' };
      case 'Agressão verbal': return { label: 'Envolvidos / Vítima', type: 'text', placeholder: 'Ex: Colega de classe' };
      case 'Agressão física': return { label: 'Envolvidos / Vítima', type: 'text', placeholder: 'Ex: Colega de classe' };
      default: return null;
    }
  };
  const currentDynamicField = getDynamicField(occurrenceType);

  // Report Export Filter
  const [reportFilterYear, setReportFilterYear] = useState('');
  const [reportFilterPeriod, setReportFilterPeriod] = useState('Todos');

  const filteredStudents = useMemo(() => {
    if (!studentName) return alunos.slice(0, 5);
    const query = studentName.toLowerCase();
    return alunos.filter(a => a.nome?.toLowerCase().includes(query)).slice(0, 5);
  }, [studentName, alunos]);

  const handleSelectStudent = (aluno: any) => {
    setStudentName(aluno.nome);
    setSchoolYear(aluno.ano || '');
    setShowAutocomplete(false);
  };

  const getPeriodDateRange = (period: string, customDate?: string) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    end.setHours(23, 59, 59, 999);
    
    if (period === 'Hoje') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'Semanal') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'Quinzenal') {
      start.setDate(now.getDate() - 15);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'Mensal') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'Personalizado' && customDate) {
      const [y, m, d] = customDate.split('-').map(Number);
      start.setFullYear(y, m - 1, d);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(y, m - 1, d);
      end.setHours(23, 59, 59, 999);
    } else {
      return { start_date: undefined, end_date: undefined };
    }
    
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  };

  // Consultation State
  const [records, setRecords] = useState<DailyOccurrenceRecord[]>([]);
  const [thirtyDaysRecords, setThirtyDaysRecords] = useState<DailyOccurrenceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Hoje');
  const [filterDate, setFilterDate] = useState('');

  const getRecurrenceCount = (studentName: string, type: string) => {
    if (!studentName || !type) return 0;
    return thirtyDaysRecords.filter(r => 
      r.student_name.trim().toLowerCase() === studentName.trim().toLowerCase() &&
      r.occurrence_type.trim().toLowerCase() === type.trim().toLowerCase()
    ).length;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !schoolYear || !occurrenceType || !report) return;

    setIsSubmitting(true);
    try {
      const dynField = getDynamicField(occurrenceType);
      let finalReport = report;
      if (dynField && dynamicValue) {
        finalReport = `[${dynField.label}: ${dynamicValue}]\n${report}`;
      }

      await occurrenceService.createRecord({
        student_name: studentName,
        school_year: schoolYear,
        occurrence_type: occurrenceType,
        report: finalReport
      });
      const registeredStudent = studentName;
      const registeredType = occurrenceType;

      if (occurrenceType === 'Sem uniforme') {
        setGeneratedMessageAfterSubmit(getUniformMessage());
      }

      setSuccessMessage('Ocorrência registrada com sucesso!');
      setStudentName('');
      setSchoolYear('');
      setOccurrenceType(TIPOS_OCORRENCIA[0]);
      setDynamicValue('');
      setReport('');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Check for reoffending (recurrence) in the last 30 days
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const studentPastRecords = await occurrenceService.fetchRecords({
          student_name: registeredStudent,
          start_date: thirtyDaysAgo.toISOString()
        });

        const studentOccurrences = studentPastRecords.filter(r => 
          r.student_name.trim().toLowerCase() === registeredStudent.trim().toLowerCase() &&
          r.occurrence_type.trim().toLowerCase() === registeredType.trim().toLowerCase()
        );

        if (studentOccurrences.length >= 3) {
          setReoffenderAlert({
            visible: true,
            studentName: registeredStudent,
            occurrenceType: registeredType,
            count: studentOccurrences.length,
            occurrences: studentOccurrences
          });

          // Auto trigger download
          await generateOccurrencesPDF(studentOccurrences, 'dossie_urgente', registeredStudent, studentOccurrences);
        }
      } catch (err) {
        console.error('Erro ao verificar reincidência:', err);
      }
      
      // Auto-refresh records if we go to consultation tab
      fetchRecords();
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      let start_date: string | undefined;
      let end_date: string | undefined;

      if (activeTab === 'relatorios') {
        const range = getPeriodDateRange(reportFilterPeriod);
        start_date = range.start_date;
        end_date = range.end_date;
      } else {
        const range = getPeriodDateRange(filterPeriod, filterDate);
        start_date = range.start_date;
        end_date = range.end_date;
      }
      
      const params = {
        student_name: activeTab === 'consulta' ? (searchName || undefined) : undefined,
        school_year: activeTab === 'consulta' ? (filterYear || undefined) : undefined,
        occurrence_type: activeTab === 'consulta' ? (filterType || undefined) : undefined,
        start_date,
        end_date
      };

      const data = await occurrenceService.fetchRecords(params);
      setRecords(data);

      // Load 30 days master records for recurrence counting
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const data30 = await occurrenceService.fetchRecords({
        start_date: thirtyDaysAgo.toISOString()
      });
      setThirtyDaysRecords(data30);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'consulta' || activeTab === 'relatorios') {
      fetchRecords();
    }
  }, [activeTab, filterPeriod, filterDate, reportFilterPeriod]);

  const normalizeYear = (y: string) => (y || '').toLowerCase().replace(/[^0-9a-z]/gi, '');

  const getFilteredReportRecords = () => {
    let dataToExport = records;

    if (reportFilterYear) {
      dataToExport = dataToExport.filter(r => normalizeYear(r.school_year || '') === normalizeYear(reportFilterYear));
    }

    if (reportFilterPeriod !== 'Todos') {
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      dataToExport = dataToExport.filter(r => {
        const created = new Date(r.created_at || '');
        if (isNaN(created.getTime())) return false;

        const inicioCreated = new Date(created);
        inicioCreated.setHours(0, 0, 0, 0);

        const diffTime = inicioHoje.getTime() - inicioCreated.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (reportFilterPeriod === 'Hoje') return diffDays === 0;
        if (reportFilterPeriod === 'Semanal') return diffDays < 7;
        if (reportFilterPeriod === 'Quinzenal') return diffDays < 15;
        if (reportFilterPeriod === 'Mensal') return diffDays < 30;
        return true;
      });
    }

    return dataToExport;
  };

  const handleGeneratePDF = async () => {
    await generateOccurrencesPDF(getFilteredReportRecords(), reportFilterPeriod, reportFilterYear, thirtyDaysRecords);
  };

  const getUniformMessage = () => {
    if (dynamicValue) {
      return `Prezados responsáveis pelo(a) aluno(a) ${studentName || '[NOME DO ALUNO]'}, do ${schoolYear || '[ANO/TURMA]'},

Informamos que o(a) estudante compareceu à unidade escolar sem o uso completo do uniforme.

Item não utilizado: ${dynamicValue}

Solicitamos a colaboração da família para regularização da situação nos próximos dias, conforme as orientações e normas institucionais da escola.

Permanecemos à disposição em caso de dúvidas.

Atenciosamente,
${emissorName || '[NOME DE QUEM PREENCHEU]'}`;
    } else {
      return `Prezados responsáveis pelo(a) aluno(a) ${studentName || '[NOME DO ALUNO]'}, do ${schoolYear || '[ANO/TURMA]'},

Informamos que o(a) estudante compareceu à unidade escolar sem o uso completo do uniforme, em desacordo com as orientações e normas institucionais do colégio.

Solicitamos a colaboração da família para que o uniforme seja utilizado de forma completa e adequada nos próximos dias, contribuindo para a organização, identificação e segurança no ambiente escolar.

Em caso de dúvidas, permanecemos à disposição.

Atenciosamente,
${emissorName || '[NOME DE QUEM PREENCHEU]'}`;
    }
  };

  const copyUniformMessage = () => {
    navigator.clipboard.writeText(getUniformMessage());
    alert('Mensagem copiada para a área de transferência!');
  };

  const handleGenerateExcel = () => {
    generateOccurrencesExcel(getFilteredReportRecords(), reportFilterPeriod, reportFilterYear, thirtyDaysRecords);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-4 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Registro Diário de Ocorrências
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Módulo operacional leve para controle diário de alunos.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full max-w-md mx-auto md:mx-0 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
        {[
          { id: 'registro', label: 'Registro', icon: PlusCircle },
          { id: 'consulta', label: 'Consulta', icon: Search },
          ...(isAdmin ? [{ id: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB: REGISTRO */}
          {activeTab === 'registro' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                Nova Ocorrência
              </h2>

              <AnimatePresence>
                {generatedMessageAfterSubmit && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-6 p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative"
                  >
                    <button 
                      onClick={() => setGeneratedMessageAfterSubmit('')}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 pr-10">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Mensagem Gerada (Copie e envie aos responsáveis)
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedMessageAfterSubmit);
                          alert('Mensagem copiada para a área de transferência!');
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Mensagem
                      </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line font-medium leading-relaxed">
                      {generatedMessageAfterSubmit}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl flex items-center gap-3 border border-emerald-200 dark:border-emerald-500/20"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {successMessage}
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative" ref={autocompleteRef}>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Aluno</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          setShowAutocomplete(true);
                        }}
                        onFocus={() => setShowAutocomplete(true)}
                        className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                        placeholder="Ex: João Silva"
                        autoComplete="off"
                      />
                    </div>
                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showAutocomplete && filteredStudents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        >
                          {filteredStudents.map((aluno, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectStudent(aluno)}
                              className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{aluno.nome}</span>
                              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{aluno.ano || 'Série indefinida'} {aluno.turma ? `• ${aluno.turma}` : ''}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ano Letivo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        required
                        value={schoolYear}
                        onChange={(e) => setSchoolYear(e.target.value)}
                        className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                      >
                        <option value="" disabled>Selecione o ano</option>
                        {SERIES_CADASTRO.map(serie => (
                          <option key={serie} value={serie}>{serie}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Ocorrência</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        value={occurrenceType}
                        onChange={(e) => {
                          setOccurrenceType(e.target.value);
                          setDynamicValue('');
                        }}
                        className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                      >
                        {TIPOS_OCORRENCIA.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seu Nome (Responsável pelo Registro)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={emissorName}
                        onChange={(e) => setEmissorName(e.target.value)}
                        placeholder="Ex: Prof. João"
                        className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {currentDynamicField && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentDynamicField.label}</label>
                    <input
                      type={currentDynamicField.type}
                      required={currentDynamicField.type === 'time'}
                      value={dynamicValue}
                      onChange={(e) => setDynamicValue(e.target.value)}
                      placeholder={currentDynamicField.placeholder}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Relato Completo</label>
                  <textarea
                    required
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white resize-none"
                    placeholder="Descreva o que aconteceu em detalhes..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5" />
                        Registrar Ocorrência
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: CONSULTA */}
          {activeTab === 'consulta' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-end">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar Aluno</label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Nome do aluno..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ano</label>
                  <select
                    value={filterYear || 'Todos'}
                    onChange={(e) => setFilterYear(e.target.value === 'Todos' ? '' : e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                  >
                    {SERIES_OPCOES.map(serie => (
                      <option key={serie} value={serie}>{serie}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-44 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  >
                    <option value="">Todos</option>
                    {TIPOS_OCORRENCIA.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-44 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => {
                      setFilterPeriod(e.target.value);
                      if (e.target.value !== 'Personalizado') setFilterDate('');
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                  >
                    {['Hoje', 'Semanal', 'Quinzenal', 'Mensal', 'Todos', 'Personalizado'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                
                {filterPeriod === 'Personalizado' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full md:w-44 space-y-2"
                  >
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Escolher Dia</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    />
                  </motion.div>
                )}

                <button
                  onClick={fetchRecords}
                  className="w-full md:w-auto px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Filtrar
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto pb-2">
                  <table className="w-full text-left text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Data</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium min-w-[150px]">Aluno</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium whitespace-nowrap">Ano Letivo</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium min-w-[120px]">Tipo</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium min-w-[200px]">Relato</th>
                        {isAdmin && <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {isLoadingRecords ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                            Carregando registros...
                          </td>
                        </tr>
                      ) : records.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        records.map((record) => (
                          <tr key={record.id} onClick={() => setSelectedRecord(record)} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer">
                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-slate-900 dark:text-slate-200">
                              {new Date(record.created_at || '').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4 font-medium">
                              {(() => {
                                const count = getRecurrenceCount(record.student_name, record.occurrence_type);
                                if (count >= 3) {
                                  return (
                                    <span className="text-red-500 font-extrabold flex items-center gap-1.5" title={`${count} ocorrências deste tipo nos últimos 30 dias`}>
                                      {record.student_name}
                                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest">{count}x Reincidente</span>
                                    </span>
                                  );
                                }
                                return <span className="text-slate-900 dark:text-slate-100">{record.student_name}</span>;
                              })()}
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] md:text-xs font-medium whitespace-nowrap">
                                {record.school_year}
                              </span>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-[10px] md:text-xs font-medium border border-amber-200 dark:border-amber-500/20 whitespace-nowrap inline-block">
                                {record.occurrence_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4 max-w-[150px] md:max-w-xs truncate" title={record.report}>
                              {record.report}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
                                      try {
                                        if (record.id) {
                                          await occurrenceService.deleteRecord(record.id);
                                          setRecords(prev => prev.filter(r => r.id !== record.id));
                                          if (selectedRecord?.id === record.id) setSelectedRecord(null);
                                        }
                                      } catch(error) {
                                        alert('Erro ao apagar registro.');
                                      }
                                    }
                                  }}
                                  className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                  title="Apagar Registro"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RELATÓRIOS */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-64 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por Ano</label>
                  <select
                    value={reportFilterYear || 'Todos'}
                    onChange={(e) => setReportFilterYear(e.target.value === 'Todos' ? '' : e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                  >
                    {SERIES_OPCOES.map(serie => (
                      <option key={serie} value={serie}>{serie}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-64 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por Período</label>
                  <select
                    value={reportFilterPeriod}
                    onChange={(e) => setReportFilterPeriod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white appearance-none"
                  >
                    {['Todos', 'Hoje', 'Semanal', 'Quinzenal', 'Mensal'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-6">
                  {`Exportando ${getFilteredReportRecords().length} registro(s) encontrados.`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                    <Download className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Exportar em PDF</h3>
                  <p className="text-blue-100 mb-8 max-w-sm">
                    Gere um documento formatado com o layout oficial para arquivamento ou envio. O arquivo é gerado dinamicamente e descartado após o download.
                  </p>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={getFilteredReportRecords().length === 0}
                    className="w-full sm:w-auto justify-center bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <FileText className="w-5 h-5" />
                    Gerar Relatório PDF
                  </button>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                    <FileSpreadsheet className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Exportar Planilha</h3>
                  <p className="text-emerald-100 mb-8 max-w-sm">
                    Exporte os dados em formato tabular (Excel/CSV) para análises avançadas, criação de gráficos ou integração com outros sistemas.
                  </p>
                  <button
                    onClick={handleGenerateExcel}
                    disabled={getFilteredReportRecords().length === 0}
                    className="w-full sm:w-auto justify-center bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Gerar Planilha (XLSX)
                  </button>
                </div>
              
              <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Panorama Geral</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total de Registros</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{records.length}</p>
                  </div>
                  {/* You can add more stats here, like occurrences today, etc. */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Registros Hoje</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {records.filter(r => new Date(r.created_at || '').toLocaleDateString() === new Date().toLocaleDateString()).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de Detalhe da Ocorrência estilo Documento Oficial */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl my-8 border border-slate-200"
            >
              <div id="modal-print-content" className="bg-white">
              {/* Header Oficial do Colégio Sesi */}
              <div className="relative w-full h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-8 select-none">
                {/* Polígonos Geométricos */}
                <div className="absolute top-0 left-0 w-[300px] h-full pointer-events-none">
                  <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                  <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                  <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
                </div>
                <div className="flex-1" />
                {/* Logo Sesi */}
                <div className="relative z-10">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 leading-none">
                      <span className="text-[10px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                      <div className="w-2 h-2 rounded-full bg-[#0c2340] mt-0.5" />
                    </div>
                    <div className="text-[40px] font-black text-[#0c2340] leading-none tracking-tighter -mt-1 font-serif italic">
                      Sesi
                    </div>
                    <div className="bg-[#fbbf24] text-[#0c2340] text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 mt-1 rounded-sm transform -skew-x-6 origin-right leading-none">
                      internacional
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Fechar / Ações no Topo */}
              <div className="absolute top-4 right-4 z-20 flex flex-wrap justify-end gap-2 pr-2">
                <button
                  onClick={() => window.print()}
                  className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm cursor-pointer print:hidden"
                  title="Imprimir"
                >
                  <Printer className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => generateSingleOccurrencePDF(selectedRecord)}
                  className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors shadow-sm cursor-pointer print:hidden"
                  title="Baixar PDF"
                >
                  <FileText className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => generateWordOccurrence(selectedRecord, emissorName)}
                  className="p-3 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm cursor-pointer print:hidden"
                  title="Baixar Word"
                >
                  <FileText className="w-[18px] h-[18px]" />
                </button>

                {isAdmin && (
                  <button 
                    onClick={async () => {
                      if (window.confirm('Tem certeza que deseja apagar este registro?')) {
                        try {
                          if (selectedRecord.id) {
                            await occurrenceService.deleteRecord(selectedRecord.id);
                            setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
                            setSelectedRecord(null);
                          }
                        } catch(e) {
                          alert('Erro ao apagar registro.');
                        }
                      }
                    }}
                    className="p-3 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-sm cursor-pointer print:hidden"
                    title="Apagar Registro"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
                  </button>
                )}
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm cursor-pointer ml-auto print:hidden"
                  title="Fechar"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Corpo da Ocorrência */}
              <div className="p-4 md:p-8 md:p-12 space-y-8 print:p-4 md:p-8 font-sans">
                <div className="text-center border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-extrabold uppercase tracking-widest text-[#0c2340]">Registro de Ocorrência</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedRecord.occurrence_type}</p>
                </div>

                {/* Info do Aluno */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Aluno</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRecord.student_name}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Série / Ano</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRecord.school_year}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Turma</span>
                    <span className="text-sm font-bold text-slate-800">A DEFINIR</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Data do Registro</span>
                    <span className="text-sm font-bold text-slate-800">{new Date(selectedRecord.created_at || '').toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Conteúdo Dinâmico */}
                <div className="bg-slate-50/50 p-4 md:p-10 rounded-[2rem] border border-slate-100 space-y-10">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-200/60 pb-4">
                    <FileText className="w-[18px] h-[18px] text-[#0c2340]" />
                    <span className="text-xs font-black text-[#0c2340] uppercase tracking-widest">{selectedRecord.occurrence_type}</span>
                  </div>
                  <div className="space-y-10">
                    <div className="border-b border-slate-100 pb-8 last:border-none last:pb-0">
                      <span className="text-[10px] font-black text-[#0c2340] uppercase tracking-widest block mb-3">Descrição / Relato</span>
                      <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line pl-4 border-l-2 border-slate-200">
                        {selectedRecord.report}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-12 mt-12 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <div className="w-full border-b border-slate-300 h-10" />
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Assinatura do Aluno/Responsável</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-full border-b border-slate-300 h-10" />
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Professor / Coordenação</span>
                  </div>
                </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Alerta de Reincidência Crítica */}
      <AnimatePresence>
        {reoffenderAlert?.visible && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-950 text-white rounded-[2rem] p-6 md:p-8 overflow-hidden shadow-2xl border border-red-500/30 flex flex-col items-center text-center animate-fade-in"
            >
              {/* Glow background effects */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Warning Icon Banner */}
              <div className="relative mb-5 z-10">
                <div className="absolute inset-0 rounded-full bg-red-500/25 blur-md animate-pulse" />
                <div className="relative p-4 rounded-full bg-red-500/10 border border-red-500/40 text-red-500">
                  <ShieldAlert className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              {/* Header Title */}
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-red-500 mb-3 z-10">
                Atenção! Reincidência
              </h2>

              {/* Message Requested */}
              <p className="text-sm md:text-base font-bold text-slate-100 leading-relaxed max-w-sm mb-5 z-10">
                Este aluno tem mais de três ocorrências em <span className="text-red-400 underline">{reoffenderAlert.occurrenceType}</span> e precisa ser encaminhado à coordenação para a tratativa.
              </p>

              {/* Occurrences compilation title */}
              <div className="w-full flex items-center gap-1.5 justify-start text-left mb-2 z-10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Histórico (Últimos 30 dias):</span>
              </div>

              {/* Compact feed of occurrences */}
              <div className="w-full max-h-40 overflow-y-auto mb-6 space-y-2 pr-1 text-left z-10 custom-scrollbar">
                {reoffenderAlert.occurrences.map((oc, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-xs hover:border-slate-850 transition-colors">
                    <div className="flex justify-between items-center mb-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <span>{new Date(oc.created_at || '').toLocaleDateString('pt-BR')}</span>
                      <span className="text-amber-500">{oc.school_year}</span>
                    </div>
                    <p className="text-slate-200 font-extrabold mb-1">{oc.occurrence_type}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed italic line-clamp-2">{oc.report}</p>
                  </div>
                ))}
              </div>

              {/* Subtext info */}
              <p className="text-[10px] text-slate-400 mb-6 max-w-xs leading-normal z-10">
                O dossiê completo foi gerado e baixado automaticamente. Imprima o relatório e leve junto com o aluno.
              </p>

              {/* Actions */}
              <div className="w-full space-y-2.5 z-10">
                <button
                  onClick={() => generateOccurrencesPDF(reoffenderAlert.occurrences, 'dossie_urgente', reoffenderAlert.studentName, reoffenderAlert.occurrences)}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 hover:shadow-red-600/20 cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
                <button
                  onClick={() => setReoffenderAlert(null)}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Entendido e Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
