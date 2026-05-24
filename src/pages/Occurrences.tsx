// Modulo de Registro de Ocorrencias Diárias
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Search, PlusCircle, Download, FileSpreadsheet, Loader2, Calendar, User, Tag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { occurrenceService } from '../services/occurrenceService';
import { generateOccurrencesPDF, generateOccurrencesExcel } from '../lib/reportGenerator';
import { useEscola } from '../context/ContextoEscola';
import { useAuth } from '../context/AuthContext';
import type { DailyOccurrenceRecord } from '../types';

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

  // Consultation State
  const [records, setRecords] = useState<DailyOccurrenceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');

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
      setSuccessMessage('Ocorrência registrada com sucesso!');
      setStudentName('');
      setSchoolYear('');
      setOccurrenceType(TIPOS_OCORRENCIA[0]);
      setDynamicValue('');
      setReport('');
      setTimeout(() => setSuccessMessage(''), 3000);
      
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
      const data = await occurrenceService.fetchRecords({
        student_name: searchName || undefined,
        school_year: filterYear || undefined,
        occurrence_type: filterType || undefined
      });
      setRecords(data);
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
  }, [activeTab]);

  const handleGeneratePDF = async () => {
    const dataToExport = reportFilterYear 
      ? records.filter(r => r.school_year?.toLowerCase().includes(reportFilterYear.toLowerCase()))
      : records;
    await generateOccurrencesPDF(dataToExport);
  };

  const handleGenerateExcel = () => {
    const dataToExport = reportFilterYear 
      ? records.filter(r => r.school_year?.toLowerCase().includes(reportFilterYear.toLowerCase()))
      : records;
    generateOccurrencesExcel(dataToExport);
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
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-200 ${
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
                  <div className="space-y-2 relative">
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
                        onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
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
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                    Registrar Ocorrência
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: CONSULTA */}
          {activeTab === 'consulta' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                <div className="flex-1 space-y-2 w-full">
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
                <div className="w-full md:w-48 space-y-2">
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
                <button
                  onClick={fetchRecords}
                  className="w-full md:w-auto px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Filtrar
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-medium">Data</th>
                        <th className="px-6 py-4 font-medium">Aluno</th>
                        <th className="px-6 py-4 font-medium">Ano Letivo</th>
                        <th className="px-6 py-4 font-medium">Tipo</th>
                        <th className="px-6 py-4 font-medium">Relato</th>
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
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        records.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-slate-200">
                              {new Date(record.created_at || '').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                              {record.student_name}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs font-medium">
                                {record.school_year}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-xs font-medium border border-amber-200 dark:border-amber-500/20">
                                {record.occurrence_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate" title={record.report}>
                              {record.report}
                            </td>
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
              {/* Report Filters */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-64 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar exportação por Ano</label>
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
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-6">
                  {reportFilterYear 
                    ? `Exportando apenas registros filtrados por "${reportFilterYear}" (${records.filter(r => r.school_year?.toLowerCase().includes(reportFilterYear.toLowerCase())).length} encontrados).`
                    : `Exportando todos os registros da base.`}
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
                    disabled={reportFilterYear ? records.filter(r => r.school_year?.toLowerCase().includes(reportFilterYear.toLowerCase())).length === 0 : records.length === 0}
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
                    disabled={reportFilterYear ? records.filter(r => r.school_year?.toLowerCase().includes(reportFilterYear.toLowerCase())).length === 0 : records.length === 0}
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
    </div>
  );
}
