import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Search, PlusCircle, Download, FileSpreadsheet, Loader2, Calendar, User, Tag, CheckCircle2, Copy, X, Printer, Trash2, AlertTriangle, ShieldAlert, Clock, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { occurrenceService, getOccurrenceGroup, GROUP_FRIENDLY_NAMES, getMinimoParaAta } from '../services/occurrenceService';
import { generateOccurrencesPDF, generateOccurrencesExcel, generateSingleOccurrencePDF } from '../lib/reportGenerator';
import { useEscola } from '../context/ContextoEscola';
import { useAuth } from '../context/AuthContext';
import type { DailyOccurrenceRecord, RegistroOcorrencia } from '../types';
import { generateWordOccurrence } from '../lib/wordGenerator';
import FichaOcorrencia from '../components/FichaOcorrencia';
import { FluxogramaOcorrencias } from '../components/FluxogramaOcorrencias';
import { HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

import jsPDF from 'jspdf';

interface Emprestimo {
  id: string;
  studentName: string;
  item: string;
  loanTime: string;      // HH:MM
  limitTime: string;     // HH:MM
  status: 'emprestado' | 'devolvido';
  date: string;          // YYYY-MM-DD
}

const TIPOS_OCORRENCIA = [
  'Uso indevido de celular e aparelhos eletrônicos',
  'Desrespeito a colegas, professores e funcionários',
  'Baderna, gritaria e perturbação das aulas',
  'Bullying, cyberbullying e constrangimentos',
  'Agressão física ou verbal',
  'Saída da sala sem autorização',
  'Saída da escola sem autorização',
  'Atrasos e descumprimento de horários',
  'Danos leves ao patrimônio ou pertences alheios, sem intenção',
  'Dano intencional ou depredação',
  'Cola ou fraude em atividade escolar',
  'Falsificação ou adulteração de documentos',
  'Porte ou uso de vape, cigarros, álcool e drogas',
  'Uso inadequado do uniforme escolar',
  'Porte de objetos ou materiais comuns não autorizados',
  'Porte de objeto perigoso, arma ou explosivo',
  'Comércio, vendas ou arrecadações sem autorização',
  'Descumprimento de orientações da equipe escolar',
  'Conduta incompatível com o ambiente escolar'
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
  const loanAutocompleteRef = useRef<HTMLDivElement>(null);

  // Material Loans State
  const [loans, setLoans] = useState<Emprestimo[]>([]);
  const [loanStudentName, setLoanStudentName] = useState('');
  const [showLoanAutocomplete, setShowLoanAutocomplete] = useState(false);
  const [loanItem, setLoanItem] = useState('');
  const [loanLimitTime, setLoanLimitTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleClose = (e: Event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
      if (loanAutocompleteRef.current && !loanAutocompleteRef.current.contains(e.target as Node)) {
        setShowLoanAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
    };
  }, []);

  // Load loans from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sesiconnect_loans');
    if (stored) {
      try {
        setLoans(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar empréstimos:', e);
      }
    }
    
    // Set default limit time (current time + 30 mins)
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setLoanLimitTime(`${hours}:${mins}`);
  }, []);

  // Update current time periodically for overdue checks
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState<'registro' | 'consulta' | 'relatorios'>('registro');
  const [registroSubTab, setRegistroSubTab] = useState<'ocorrencia' | 'emprestimos'>('ocorrencia');
  const [showFluxograma, setShowFluxograma] = useState(false);
  
  // Registration Form State

  const [studentName, setStudentName] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [schoolYear, setSchoolYear] = useState('');
  const [occurrenceType, setOccurrenceType] = useState(TIPOS_OCORRENCIA[0]);
  const [dynamicValue, setDynamicValue] = useState('');
  const [motivoAtraso, setMotivoAtraso] = useState('');
  const [momentoAtraso, setMomentoAtraso] = useState('Chegada ao Colégio');
  const [customMomentoAtraso, setCustomMomentoAtraso] = useState('');
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DailyOccurrenceRecord | null>(null);
  const [editModeOnOpen, setEditModeOnOpen] = useState(false);
  const [emissorName, setEmissorName] = useState('');
  const [generatedMessageAfterSubmit, setGeneratedMessageAfterSubmit] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<DailyOccurrenceRecord | null>(null);
  const [reoffenderAlert, setReoffenderAlert] = useState<{
    visible: boolean;
    studentName: string;
    occurrenceType: string;
    count: number;
    occurrences: DailyOccurrenceRecord[];
  } | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setEmissorName(profile.full_name);
    }
  }, [profile]);

  // Dynamic field config
  const getDynamicField = (type: string) => {
    switch (type) {
      case 'Atrasos e descumprimento de horários': return { label: 'Horário de Chegada', type: 'time', placeholder: 'Ex: 07:30' };
      case 'Uso inadequado do uniforme escolar': return { label: 'Peça Faltando / Inadequada (Opcional)', type: 'text', placeholder: 'Ex: Sem camiseta padrão' };
      case 'Baderna, gritaria e perturbação das aulas': return { label: 'Aula / Matéria (Opcional)', type: 'text', placeholder: 'Ex: Matemática' };
      case 'Uso indevido de celular e aparelhos eletrônicos':
        return { label: 'Justificativa do(a) Estudante', type: 'text', placeholder: 'Ex: Estava verificando o horário / Falando com a mãe...' };
      case 'Agressão física ou verbal': return { label: 'Envolvidos / Vítima (Opcional)', type: 'text', placeholder: 'Ex: Colega de classe' };
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

  const filteredLoanStudents = useMemo(() => {
    if (!loanStudentName) return alunos.slice(0, 5);
    const query = loanStudentName.toLowerCase();
    return alunos.filter(a => a.nome?.toLowerCase().includes(query)).slice(0, 5);
  }, [loanStudentName, alunos]);

  const handleSelectLoanStudent = (aluno: any) => {
    setLoanStudentName(aluno.nome);
    setShowLoanAutocomplete(false);
  };

  const handleRegisterLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanStudentName.trim() || !loanItem.trim() || !loanLimitTime) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    
    const newLoan: Emprestimo = {
      id: Math.random().toString(36).substring(2, 9),
      studentName: loanStudentName.trim(),
      item: loanItem.trim(),
      loanTime: `${hours}:${mins}`,
      limitTime: loanLimitTime,
      status: 'emprestado',
      date: now.toISOString().split('T')[0]
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    localStorage.setItem('sesiconnect_loans', JSON.stringify(updatedLoans));

    // Reset fields
    setLoanStudentName('');
    setLoanItem('');
    
    // Set next default limit time (current time + 30 mins)
    const nextLimit = new Date();
    nextLimit.setMinutes(nextLimit.getMinutes() + 30);
    const nHours = String(nextLimit.getHours()).padStart(2, '0');
    const nMins = String(nextLimit.getMinutes()).padStart(2, '0');
    setLoanLimitTime(`${nHours}:${nMins}`);
  };

  const handleToggleReturn = (id: string) => {
    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        return {
          ...loan,
          status: loan.status === 'emprestado' ? 'devolvido' as const : 'emprestado' as const
        };
      }
      return loan;
    });
    setLoans(updatedLoans);
    localStorage.setItem('sesiconnect_loans', JSON.stringify(updatedLoans));
  };

  const handleDeleteLoan = (id: string) => {
    if (window.confirm('Deseja realmente excluir este empréstimo?')) {
      const updatedLoans = loans.filter(loan => loan.id !== id);
      setLoans(updatedLoans);
      localStorage.setItem('sesiconnect_loans', JSON.stringify(updatedLoans));
    }
  };

  const isLoanOverdue = (loan: Emprestimo) => {
    if (loan.status === 'devolvido') return false;
    
    const todayStr = currentTime.toISOString().split('T')[0];
    if (loan.date < todayStr) return true;
    if (loan.date > todayStr) return false;

    const [limitHour, limitMin] = loan.limitTime.split(':').map(Number);
    const limitDate = new Date(currentTime);
    limitDate.setHours(limitHour, limitMin, 0, 0);
    
    return currentTime > limitDate;
  };

  const displayedLoans = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return loans.filter(l => l.status === 'emprestado' || l.date === today);
  }, [loans, currentTime]);

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
    } else if (period === 'Trimestral') {
      start.setDate(now.getDate() - 90);
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
  const [filterPeriod, setFilterPeriod] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');
  const [isResettingTratativa, setIsResettingTratativa] = useState(false);

  const getRecurrenceCount = (studentName: string, type: string) => {
    if (!studentName || !type) return 0;
    const targetGroup = getOccurrenceGroup(type);
    return thirtyDaysRecords.filter(r => 
      r.student_name.trim().toLowerCase() === studentName.trim().toLowerCase() &&
      getOccurrenceGroup(r.occurrence_type) === targetGroup &&
      !r.tratada
    ).length;
  };

  const handleConfirmTratativa = async (studentName: string, type: string) => {
    setIsResettingTratativa(true);
    try {
      await occurrenceService.markRecordsAsTreated(studentName, type);
      alert('Tratativa confirmada com sucesso! A contagem de ocorrências ativas foi reiniciada.');
      setReoffenderAlert(null);
      fetchRecords();
    } catch (err) {
      console.error('Erro ao confirmar tratativa:', err);
      alert('Erro ao confirmar tratativa.');
    } finally {
      setIsResettingTratativa(false);
    }
  };

  const isCellPhoneUse = occurrenceType === 'Uso indevido de celular e aparelhos eletrônicos';
  const isUniform = occurrenceType === 'Uso inadequado do uniforme escolar';
  const isGraveOccurrence = useMemo(() => {
    const graves = [
      'Bullying, cyberbullying e constrangimentos',
      'Agressão física ou verbal',
      'Saída da escola sem autorização',
      'Dano intencional ou depredação',
      'Falsificação ou adulteração de documentos',
      'Porte ou uso de vape, cigarros, álcool e drogas',
      'Porte de objeto perigoso, arma ou explosivo'
    ];
    return graves.includes(occurrenceType);
  }, [occurrenceType]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAtraso = occurrenceType === 'Atrasos e descumprimento de horários';
    if (!studentName || !schoolYear || !occurrenceType || (!isCellPhoneUse && !isAtraso && !isUniform && !report)) return;

    setIsSubmitting(true);
    try {
      let finalReport = report;
      if (isCellPhoneUse) {
        finalReport = getCellPhoneReport();
      } else if (isAtraso) {
        finalReport = getAtrasoReport();
      } else if (isUniform) {
        finalReport = getUniformReport();
      } else {
        const dynField = getDynamicField(occurrenceType);
        if (dynField && dynamicValue) {
          finalReport = `[${dynField.label}: ${dynamicValue}]\n${report}`;
        }
      }

      const newRec = await occurrenceService.createRecord({
        student_name: studentName,
        school_year: schoolYear,
        occurrence_type: occurrenceType,
        report: finalReport,
        created_by: profile?.full_name || 'Administração'
      });
      const registeredStudent = studentName;
      const registeredType = occurrenceType;

      if (occurrenceType === 'Uso inadequado do uniforme escolar') {
        setGeneratedMessageAfterSubmit(getUniformMessage());
      } else if (isCellPhoneUse) {
        setGeneratedMessageAfterSubmit(getCellPhoneMessage());
      } else if (occurrenceType === 'Atrasos e descumprimento de horários') {
        setGeneratedMessageAfterSubmit(getAtrasoMessage());
      }

      setSubmittedRecord(newRec);
      setStudentName('');
      setSchoolYear('');
      setOccurrenceType(TIPOS_OCORRENCIA[0]);
      setDynamicValue('');
      setMotivoAtraso('');
      setMomentoAtraso('Chegada ao Colégio');
      setCustomMomentoAtraso('');
      setReport('');

      // Check for reoffending (recurrence) in the last 90 days (trimestre)
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const studentPastRecords = await occurrenceService.fetchRecords({
          student_name: registeredStudent,
          start_date: ninetyDaysAgo.toISOString()
        });

        const targetGroup = getOccurrenceGroup(registeredType);
        const studentOccurrences = studentPastRecords.filter(r => 
          r.student_name.trim().toLowerCase() === registeredStudent.trim().toLowerCase() &&
          getOccurrenceGroup(r.occurrence_type) === targetGroup &&
          !r.tratada
        );

        const minParaAta = getMinimoParaAta(targetGroup);
        if (studentOccurrences.length >= minParaAta) {
          setReoffenderAlert({
            visible: true,
            studentName: registeredStudent,
            occurrenceType: GROUP_FRIENDLY_NAMES[targetGroup] || registeredType,
            count: studentOccurrences.length,
            occurrences: studentOccurrences
          });

          // Auto trigger download if it reaches the exact limit for the minute
          if (studentOccurrences.length === minParaAta) {
            await generateOccurrencesPDF(studentOccurrences, 'dossie_urgente', registeredStudent, studentOccurrences);
          }
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

      // Load 90 days (trimestre) master records for recurrence counting
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const data90 = await occurrenceService.fetchRecords({
        start_date: ninetyDaysAgo.toISOString()
      });
      setThirtyDaysRecords(data90);
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
  }, [activeTab, filterPeriod, filterDate, reportFilterPeriod, filterYear, filterType, searchName]);

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
        if (reportFilterPeriod === 'Trimestral') return diffDays < 90;
        return true;
      });
    }

    return dataToExport;
  };

  const handleGeneratePDF = async () => {
    await generateOccurrencesPDF(getFilteredReportRecords(), reportFilterPeriod, reportFilterYear, thirtyDaysRecords);
  };

  const getUniformMessage = () => {
    return `Prezados responsáveis pelo(a) estudante ${studentName || '[NOME DO ALUNO]'}, esperamos que estejam bem.

Informamos que, nesta data, o(a) estudante compareceu à escola sem o uniforme adequado. Reforçamos que seu uso é obrigatório e importante para a identificação e a segurança dos alunos. Contamos com a colaboração da família para que ele(a) venha devidamente uniformizado(a) nos próximos dias.

Agradecemos pela atenção e parceria.`;
  };

  const getUniformReport = () => {
    const defaultDetails = dynamicValue ? dynamicValue : 'em desacordo com as normas estabelecidas para o uso do uniforme escolar';
    return `O(A) estudante ${studentName || '[NOME DO ALUNO]'}, do ${schoolYear || '[ANO/TURMA]'}, apresentou-se na instituição ${defaultDetails}, estando em desacordo com as normas estabelecidas para a permanência no ambiente escolar.

O(A) estudante foi orientado(a) sobre a obrigatoriedade do uso completo e adequado do uniforme durante o período de aula e nas demais atividades promovidas pela instituição. Foi ressaltado que o uniforme contribui para a identificação dos estudantes, para a segurança da comunidade escolar e para a organização da rotina pedagógica.

Também foi reforçado que o uso do uniforme representa o pertencimento à instituição e favorece um ambiente baseado na igualdade, na responsabilidade, na disciplina e no cumprimento das normas de convivência.

A ocorrência foi registrada para acompanhamento pedagógico e institucional. O(A) estudante foi orientado(a) a comparecer às próximas atividades utilizando o uniforme completo. Em caso de reincidência, os pais ou responsáveis poderão ser comunicados pelos canais oficiais da instituição.`;
  };

  const getCellPhoneMessage = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR');
    return `Prezados responsáveis pelo(a) estudante ${studentName || '[NOME DO ALUNO]'}, esperamos que estejam bem.

Informamos que, nesta data (${dateStr}), ${studentName || '[NOME DO ALUNO]'} foi orientado(a) devido ao uso de celular durante o período escolar, sem autorização para finalidade pedagógica. Conforme a Lei Federal nº 15.100/2025 e o Regimento Escolar, o uso de aparelhos eletrônicos pessoais é proibido durante o período letivo, salvo quando autorizado para fins pedagógicos ou em situações previstas em lei.

A ocorrência foi registrada para acompanhamento. Contamos com a parceria da família para reforçar essa orientação com ${studentName || '[NOME DO ALUNO]'}.

Agradecemos pela atenção e colaboração.`;
  };

  const getCellPhoneReport = () => {
    const currentDateStr = new Date().toLocaleDateString('pt-BR');
    return `Na data de ${currentDateStr}, o(a) aluno(a) ${studentName || '_____________________________'}, do ${schoolYear || '____ ano'} foi abordado(a) pela equipe escolar em razão do uso indevido de celular e aparelhos eletrônicos durante o período escolar.

Ao ser questionado(a), o(a) estudante apresentou a seguinte justificativa: ${dynamicValue || '_____________________________'}

O(a) aluno(a) foi orientado(a) sobre as normas institucionais referentes ao uso de dispositivos eletrônicos e sobre a Lei Federal nº 15.100/2025, que regulamenta o uso de aparelhos eletrônicos pessoais nas instituições de ensino.

Foi esclarecido que a utilização de celular e aparelhos eletrônicos somente é permitida para fins pedagógicos, mediante autorização da equipe escolar, ou em situações específicas previstas pela instituição, nos locais previamente definidos para essa finalidade.

O(a) estudante declarou estar ciente das orientações recebidas e comprometeu-se a cumprir as normas estabelecidas pela escola.`;
  };

  const getAtrasoReport = () => {
    const momentoTexto = momentoAtraso === 'Outro' ? (customMomentoAtraso || 'Outro') : momentoAtraso;
    return `Na presente data, o(a) estudante ${studentName || '[NOME DO(A) ESTUDANTE]'}, do ${schoolYear || '[ANO/TURMA]'}, apresentou atraso às ${dynamicValue || '____'}, no momento de ${momentoTexto.toUpperCase()}.

Ao ser questionado(a), apresentou a seguinte justificativa: ${motivoAtraso || '________________________________'}.

O(a) estudante foi orientado(a) quanto à importância do cumprimento dos horários estabelecidos pela instituição, considerando que a pontualidade contribui para o pleno aproveitamento das atividades pedagógicas, para a organização da rotina escolar e para evitar interrupções no andamento das aulas e demais atividades.

Também foi reforçada a necessidade de comparecer ou retornar aos espaços escolares nos horários determinados, demonstrando responsabilidade, comprometimento e respeito à organização coletiva da instituição.

A ocorrência foi registrada para acompanhamento pedagógico e institucional. O(a) estudante declarou estar ciente das orientações recebidas e foi orientado(a) a evitar novos atrasos. Em caso de reincidência, os pais ou responsáveis poderão ser comunicados pelos canais oficiais da instituição.`;
  };

  const getAtrasoMessage = () => {
    const momentoTexto = momentoAtraso === 'Outro' ? (customMomentoAtraso || 'Outro') : momentoAtraso;
    return `Prezados(as) responsáveis,

Informamos que, na presente data, o(a) estudante ${studentName || '[NOME DO(A) ESTUDANTE]'}, do ${schoolYear || '[ANO/TURMA]'}, apresentou atraso às ${dynamicValue || '____'}, no momento de ${momentoTexto.toUpperCase()}.

O(a) estudante apresentou a seguinte justificativa: ${motivoAtraso || '________________________________'}.

Ele(a) foi orientado(a) quanto à importância do cumprimento dos horários estabelecidos pela instituição, considerando que a pontualidade contribui para o aproveitamento das atividades pedagógicas, para a organização da rotina escolar e para evitar interrupções no andamento das aulas.

Solicitamos o apoio da família para reforçar a importância do cumprimento dos horários e prevenir novos atrasos.

Atenciosamente,
${emissorName || 'Responsável pelo Registro'}
Coordenação Pedagógica / SESI`;
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
        <div>
          <button
            onClick={() => setShowFluxograma(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Fluxograma de Ocorrências
          </button>
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
            <div className="space-y-4">
              {/* Mobile sub-tabs selector */}
              <div className="flex lg:hidden p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full max-w-sm mx-auto mb-2 border border-[#30363d] dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setRegistroSubTab('ocorrencia')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    registroSubTab === 'ocorrencia'
                      ? 'bg-white dark:bg-slate-705 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Registrar Ocorrência
                </button>
                <button
                  type="button"
                  onClick={() => setRegistroSubTab('emprestimos')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    registroSubTab === 'emprestimos'
                      ? 'bg-white dark:bg-slate-705 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Empréstimos do Dia
                </button>
              </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* COLUNA 1 & 2: NOVA OCORRÊNCIA */}
                <div className={`lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative ${
                  registroSubTab === 'ocorrencia' ? 'block' : 'hidden lg:block'
                }`}>
                {submittedRecord ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 md:p-10 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center space-y-6 flex flex-col items-center justify-center relative text-slate-800 dark:text-slate-100"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <CheckCircle2 size={36} />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Registro Efetuado!</h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">A ocorrência diária foi salva no prontuário com sucesso.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-md w-full text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <p><span className="font-bold text-slate-800 dark:text-slate-200">Estudante:</span> {submittedRecord.student_name}</p>
                      <p><span className="font-bold text-slate-800 dark:text-slate-200">Série/Ano:</span> {submittedRecord.school_year}</p>
                      <p><span className="font-bold text-slate-800 dark:text-slate-200">Tipo:</span> {submittedRecord.occurrence_type}</p>
                      <p className="line-clamp-3"><span className="font-bold text-slate-800 dark:text-slate-200">Relato:</span> {submittedRecord.report}</p>
                    </div>

                    {generatedMessageAfterSubmit && (
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-md w-full text-left space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Mensagem para Responsáveis</span>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedMessageAfterSubmit);
                              alert('Mensagem copiada!');
                            }}
                            className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-all border border-slate-200 dark:border-slate-700"
                          >
                            Copiar
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">{generatedMessageAfterSubmit}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setSubmittedRecord(null);
                          setGeneratedMessageAfterSubmit('');
                        }}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        Novo Registro
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateSingleOccurrencePDF(submittedRecord)}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> Baixar PDF
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
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
                            type="button"
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
                          <AnimatePresence>
                            {isGraveOccurrence && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex gap-3 text-red-500 animate-pulse">
                                  <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
                                  <div className="text-xs space-y-2">
                                    <p className="font-black uppercase tracking-wider text-sm flex items-center gap-1.5 text-red-550 dark:text-red-400">
                                      ⚠️ Atenção! Esta situação está prevista no Plano de Contingência.
                                    </p>
                                    <p className="font-bold text-red-650 dark:text-red-350 leading-relaxed text-[11px]">
                                      Priorize a segurança, colete apenas as informações iniciais, preserve possíveis evidências e comunique imediatamente à Coordenação.
                                    </p>
                                    <p className="text-[11px] font-bold text-red-500 dark:text-red-300 leading-relaxed">
                                      Não faça o registro comum. Siga as orientações específicas da ocorrência e, em caso de dúvida, consulte o Fluxograma de Ocorrências.
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentDynamicField.label}</label>
                            <input
                              type={currentDynamicField.type}
                              required={currentDynamicField.type === 'time'}
                              value={dynamicValue}
                              onChange={(e) => setDynamicValue(e.target.value)}
                              placeholder={currentDynamicField.placeholder}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                            />
                          </div>

                          {occurrenceType === 'Atrasos e descumprimento de horários' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Momento do Atraso</label>
                                <select
                                  value={momentoAtraso}
                                  onChange={(e) => setMomentoAtraso(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                                >
                                  <option value="Chegada ao Colégio">Chegada ao Colégio</option>
                                  <option value="Retorno do Intervalo">Retorno do Intervalo</option>
                                  <option value="Troca de Aula">Troca de Aula</option>
                                  <option value="Retorno de Atividade Externa">Retorno de Atividade Externa</option>
                                  <option value="Outro">Outro</option>
                                </select>
                              </div>

                              {momentoAtraso === 'Outro' && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Especifique o Momento</label>
                                  <input
                                    type="text"
                                    required
                                    value={customMomentoAtraso}
                                    onChange={(e) => setCustomMomentoAtraso(e.target.value)}
                                    placeholder="Ex: Entrada do auditório, etc."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                                  />
                                </div>
                              )}

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Motivo do Atraso</label>
                                <input
                                  type="text"
                                  value={motivoAtraso}
                                  onChange={(e) => setMotivoAtraso(e.target.value)}
                                  placeholder="Ex: Ônibus quebrou, consulta médica..."
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {isCellPhoneUse || occurrenceType === 'Atrasos e descumprimento de horários' || isUniform ? (
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pré-visualização do Relato Diário (Será salvo automaticamente)</label>
                          <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line font-medium leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                            {occurrenceType === 'Atrasos e descumprimento de horários' 
                              ? getAtrasoReport() 
                              : isUniform
                                ? getUniformReport()
                                : getCellPhoneReport()}
                          </div>
                        </div>
                      ) : (
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
                      )}

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting || isGraveOccurrence}
                          className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                            isGraveOccurrence 
                              ? 'bg-red-500/20 text-red-500 border border-red-500/30 cursor-not-allowed opacity-80' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 disabled:opacity-50'
                          }`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isGraveOccurrence ? (
                            <>
                              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                              Registro Bloqueado (Grave/Contingência)
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-5 h-5" />
                              Registrar Ocorrência
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* COLUNA 3: EMPRÉSTIMO DE MATERIAIS */}
              <div className={`lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative flex flex-col ${
                registroSubTab === 'emprestimos' ? 'block' : 'hidden lg:block'
              }`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                  <Clock className="w-5 h-5 text-purple-500" />
                  Empréstimo de Itens
                </h2>

                {/* Form Cadastro Empréstimo */}
                <form onSubmit={handleRegisterLoan} className="space-y-4 relative z-10 border-b border-slate-100 dark:border-slate-700/50 pb-6 mb-6">
                  <div className="space-y-1.5 relative" ref={loanAutocompleteRef}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nome do Aluno</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loanStudentName}
                        onChange={(e) => {
                          setLoanStudentName(e.target.value);
                          setShowLoanAutocomplete(true);
                        }}
                        onFocus={() => setShowLoanAutocomplete(true)}
                        className="pl-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white h-11"
                        placeholder="Buscar aluno..."
                        autoComplete="off"
                      />
                    </div>
                    {/* Loan Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showLoanAutocomplete && filteredLoanStudents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        >
                          {filteredLoanStudents.map((aluno, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectLoanStudent(aluno)}
                              className="px-3 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{aluno.nome}</span>
                              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{aluno.ano || 'Série indefinida'} {aluno.turma ? `• ${aluno.turma}` : ''}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Material</label>
                      <input
                        type="text"
                        required
                        value={loanItem}
                        onChange={(e) => setLoanItem(e.target.value)}
                        placeholder="Ex: Bola de basquete"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Devolução até</label>
                      <input
                        type="time"
                        required
                        value={loanLimitTime}
                        onChange={(e) => setLoanLimitTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white h-11"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-purple-500/10 flex items-center justify-center gap-1.5 h-11 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Emprestar Item
                  </button>
                </form>

                {/* Lista de Empréstimos */}
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Painel de Devoluções
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1 custom-scrollbar relative z-10">
                  {displayedLoans.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Nenhum empréstimo ativo ou devolvido hoje.</p>
                    </div>
                  ) : (
                    displayedLoans.map((loan) => {
                      const overdue = isLoanOverdue(loan);
                      return (
                        <div
                          key={loan.id}
                          className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                            loan.status === 'devolvido'
                              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-500'
                              : overdue
                              ? 'bg-red-500/10 dark:bg-red-500/5 border-red-500/30 shadow-sm shadow-red-500/5 ring-1 ring-red-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold ${
                                  loan.status === 'devolvido' 
                                    ? 'line-through text-slate-400 dark:text-slate-500' 
                                    : overdue 
                                    ? 'text-red-500 dark:text-red-400' 
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {loan.studentName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  loan.status === 'devolvido'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    : overdue
                                    ? 'bg-red-500/10 text-red-500'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {loan.item}
                                </span>
                                <span>•</span>
                                <span>{loan.loanTime}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteLoan(loan.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Excluir empréstimo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className={`w-3.5 h-3.5 ${loan.status === 'devolvido' ? 'text-slate-300 dark:text-slate-700' : overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`} />
                              <span className={`text-[10px] font-bold ${
                                loan.status === 'devolvido'
                                  ? 'text-slate-400'
                                  : overdue
                                  ? 'text-red-500 dark:text-red-400'
                                  : 'text-slate-600 dark:text-slate-350'
                              }`}>
                                Limite: {loan.limitTime}
                              </span>
                            </div>

                            {loan.status === 'devolvido' ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-650 dark:text-emerald-500 uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Devolvido
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {overdue && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-650 dark:text-red-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Atrasado
                                  </span>
                                )}
                                <button
                                  onClick={() => handleToggleReturn(loan.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                                    overdue
                                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10'
                                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white'
                                  }`}
                                >
                                  Devolver
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
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
                    {['Hoje', 'Semanal', 'Quinzenal', 'Trimestral', 'Todos', 'Personalizado'].map(p => (
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
                <div className="max-h-[65vh] overflow-auto pb-2">
                  <table className="w-full text-left text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
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
                          <tr key={record.id} onClick={() => { setSelectedRecord(record); setEditModeOnOpen(false); }} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer">
                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-slate-900 dark:text-slate-200">
                              {new Date(record.created_at || '').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4 font-medium">
                              {(() => {
                                const count = getRecurrenceCount(record.student_name, record.occurrence_type);
                                if (count >= 4) {
                                  return (
                                    <span className="text-red-500 font-extrabold flex items-center gap-1.5" title={`${count} ocorrências deste tipo no trimestre`}>
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
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setEditModeOnOpen(true);
                                    }}
                                    className="p-2 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                    title="Editar Registro"
                                  >
                                    <Pencil className="w-4 h-4 inline" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm('Tem certeza que deseja apagar este registro?')) {
                                        try {
                                          if (record.id) {
                                            await occurrenceService.deleteRecord(record.id);
                                            setRecords(prev => prev.filter(r => r.id !== record.id));
                                            setThirtyDaysRecords(prev => prev.filter(r => r.id !== record.id));
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
                                </div>
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
                    {['Todos', 'Hoje', 'Semanal', 'Quinzenal', 'Trimestral'].map(p => (
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

      {/* Modal de Detalhe da Ocorrência usando o novo componente FichaOcorrencia */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl my-8"
            >
              {isAdmin && (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
                      try {
                        if (selectedRecord.id) {
                          await occurrenceService.deleteRecord(selectedRecord.id);
                          setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
                          setThirtyDaysRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
                          setSelectedRecord(null);
                        }
                      } catch(e) {
                        alert('Erro ao apagar registro.');
                      }
                    }
                  }}
                  className="absolute top-4 left-4 z-[120] p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-xl cursor-pointer print:hidden flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0"
                  title="Apagar Registro"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {(() => {
                const mappedRecord: RegistroOcorrencia = {
                  id: selectedRecord.id || '',
                  modeloFormularioId: 'diario',
                  nomeModelo: selectedRecord.occurrence_type,
                  nomeAluno: selectedRecord.student_name,
                  turmaAluno: selectedRecord.school_year,
                  anoAluno: selectedRecord.school_year,
                  professorAtual: selectedRecord.created_by || 'Administração',
                  criadoEm: selectedRecord.created_at || new Date().toISOString(),
                  dados: {
                    'Tipo de Ocorrência': selectedRecord.occurrence_type,
                    'Descrição': selectedRecord.report
                  }
                };
                return (
                  <FichaOcorrencia 
                    ocorrencia={mappedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                    onEditSuccess={fetchRecords}
                    onDeleteSuccess={fetchRecords}
                    startInEditMode={editModeOnOpen}
                  />
                );
              })()}
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
                {reoffenderAlert.count >= 5 ? (
                  `O(a) aluno(a) ${reoffenderAlert.studentName} acumula ${reoffenderAlert.count} ocorrências relacionadas a esta conduta. Considerando a reincidência, faz-se necessário o encaminhamento à Coordenação para atendimento e adoção das medidas educativas e disciplinares pertinentes.`
                ) : (
                  <>
                    Este aluno tem mais de três ocorrências em <span className="text-red-400 underline">{reoffenderAlert.occurrenceType}</span> e precisa ser encaminhado à coordenação para a tratativa.
                  </>
                )}
              </p>
 
              {/* Occurrences compilation title */}
              <div className="w-full flex items-center gap-1.5 justify-start text-left mb-2 z-10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Histórico (Trimestre):</span>
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
                {reoffenderAlert.count === 4 ? (
                  "O dossiê completo foi gerado e baixado automaticamente. Imprima o relatório e leve junto com o aluno."
                ) : (
                  "Consulte a coordenação para a tomada de decisões pedagógicas baseadas no histórico."
                )}
              </p>
 
              {/* Actions */}
              <div className="w-full space-y-2.5 z-10">
                <button
                  onClick={() => generateOccurrencesPDF(reoffenderAlert.occurrences, 'dossie_urgente', reoffenderAlert.studentName, reoffenderAlert.occurrences)}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar Ocorrências
                </button>
                <button
                  onClick={() => handleConfirmTratativa(reoffenderAlert.studentName, reoffenderAlert.occurrenceType)}
                  disabled={isResettingTratativa}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 hover:shadow-red-600/20 cursor-pointer text-sm disabled:opacity-50"
                >
                  {isResettingTratativa ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'O aluno já fez tratativa'
                  )}
                </button>
                <button
                  onClick={() => setReoffenderAlert(null)}
                  className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal do Fluxograma de Ocorrências Interativo */}
      <AnimatePresence>
        {showFluxograma && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex justify-center"
            >
              <FluxogramaOcorrencias onClose={() => setShowFluxograma(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
}
