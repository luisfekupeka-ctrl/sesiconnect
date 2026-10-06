import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Search, Filter, ArrowUpDown, FileText, 
  ChevronDown, ChevronUp, Calendar, Clock, User, CheckCircle2,
  BookOpen, Copy, Check, Share2, CheckCheck, Sparkles, ExternalLink,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { occurrenceService, getOccurrenceGroup, GROUP_FRIENDLY_NAMES, getMinimoParaAta } from '../services/occurrenceService';
import type { DailyOccurrenceRecord } from '../types';
import { cn } from '../lib/utils';
import { 
  gerarCabecalhoOficialSesi, 
  extrairRelatoSucinto, 
  gerarTextoCompletoSGE, 
  gerarMensagemResponsaveis 
} from '../lib/ataUtils';
import ModalRegistroDiarioSGE from '../components/ModalRegistroDiarioSGE';

interface PendingAtaGroup {
  studentName: string;
  schoolYear: string;
  type: string;
  groupKey: string;
  count: number;
  latestDate: Date;
  records: DailyOccurrenceRecord[];
}

export default function PendingAtas() {
  const navigate = useNavigate();
  const [dailyRecords, setDailyRecords] = useState<DailyOccurrenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States para filtros e ordenação
  const [busca, setBusca] = useState('');
  const [filtroAno, setFiltroAno] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState<'date_desc' | 'date_asc' | 'alpha_asc' | 'alpha_desc' | 'count_desc'>('date_desc');
  
  // Controle de cards expandidos para ver o histórico individual
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Modal para ver ocorrência individual em detalhe
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<DailyOccurrenceRecord | null>(null);

  // Estados de feedback de cópia rápida
  const [copiadoIds, setCopiadoIds] = useState<Record<string, boolean>>({});
  const [copiadoTodos, setCopiadoTodos] = useState<Record<string, boolean>>({});
  const [tratandoIds, setTratandoIds] = useState<Record<string, boolean>>({});

  const toggleExpandCard = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const carregarOcorrenciasAtivas = async () => {
    setLoading(true);
    setError(null);
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Busca ocorrências não tratadas no trimestre
      const records = await occurrenceService.fetchRecords({
        start_date: ninetyDaysAgo.toISOString(),
        tratada: false
      });
      setDailyRecords(records);
    } catch (err) {
      console.error('Erro ao buscar ocorrências em PendingAtas:', err);
      setError('Não foi possível carregar as ocorrências ativas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOcorrenciasAtivas();
  }, []);

  // Agrupa ocorrências por Estudante + Grupo de Ocorrência
  const pendingAtas = useMemo(() => {
    const groups: Record<string, PendingAtaGroup> = {};

    dailyRecords.forEach(r => {
      const studentClean = r.student_name.trim();
      const typeClean = r.occurrence_type.trim();
      const groupKey = getOccurrenceGroup(typeClean);
      const key = `${studentClean.toLowerCase()}|${groupKey}`;

      const recDate = r.created_at ? new Date(r.created_at) : new Date();

      if (!groups[key]) {
        groups[key] = {
          studentName: studentClean,
          schoolYear: r.school_year || 'Não especificado',
          type: GROUP_FRIENDLY_NAMES[groupKey] || typeClean,
          groupKey,
          count: 0,
          latestDate: recDate,
          records: []
        };
      }

      groups[key].count += 1;
      groups[key].records.push(r);
      
      // Atualiza a data mais recente
      if (recDate > groups[key].latestDate) {
        groups[key].latestDate = recDate;
      }
    });

    // Ordena os records dentro de cada grupo da mais antiga para a mais recente (ordem cronológica)
    Object.values(groups).forEach(g => {
      g.records.sort((a, b) => {
        const da = new Date(a.created_at || 0).getTime();
        const db = new Date(b.created_at || 0).getTime();
        return da - db;
      });
    });

    // Filtra com base nas regras de etapas/gravidade da tabela (>= 4 ou >= 1 para graves)
    return Object.values(groups).filter(g => {
      if (g.records.length === 0) return false;
      return g.count >= getMinimoParaAta(g.groupKey);
    });
  }, [dailyRecords]);

  // Lista dinâmica de Anos e Tipos para os dropdowns de filtro
  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set<string>();
    pendingAtas.forEach(g => {
      if (g.schoolYear) setAnos.add(g.schoolYear);
    });
    return Array.from(setAnos).sort();
  }, [pendingAtas]);

  const tiposDisponiveis = useMemo(() => {
    const setTipos = new Set<string>();
    pendingAtas.forEach(g => {
      if (g.type) setTipos.add(g.type);
    });
    return Array.from(setTipos).sort();
  }, [pendingAtas]);

  // Filtra e ordena a lista
  const filteredAndSortedAtas = useMemo(() => {
    let result = [...pendingAtas];

    // 1. Filtro por Busca (Nome do aluno)
    if (busca.trim()) {
      const query = busca.toLowerCase();
      result = result.filter(g => g.studentName.toLowerCase().includes(query));
    }

    // 2. Filtro por Ano/Série
    if (filtroAno !== 'todos') {
      result = result.filter(g => g.schoolYear === filtroAno);
    }

    // 3. Filtro por Tipo de Ocorrência
    if (filtroTipo !== 'todos') {
      result = result.filter(g => g.type === filtroTipo);
    }

    // 4. Ordenação
    result.sort((a, b) => {
      if (ordenacao === 'date_desc') {
        return b.latestDate.getTime() - a.latestDate.getTime();
      }
      if (ordenacao === 'date_asc') {
        return a.latestDate.getTime() - b.latestDate.getTime();
      }
      if (ordenacao === 'alpha_asc') {
        return a.studentName.localeCompare(b.studentName);
      }
      if (ordenacao === 'alpha_desc') {
        return b.studentName.localeCompare(a.studentName);
      }
      if (ordenacao === 'count_desc') {
        return b.count - a.count;
      }
      return 0;
    });

    return result;
  }, [pendingAtas, busca, filtroAno, filtroTipo, ordenacao]);

  // Copia o texto formatado para o SGE de um dia específico (mensagem curta independente da data)
  const handleCopiarDiaSGE = async (rec: DailyOccurrenceRecord, idKey: string) => {
    const relato = extrairRelatoSucinto(rec.report, rec.occurrence_type);
    const textoSGE = `${rec.occurrence_type.toUpperCase()}\n\n${relato}\n\nDiante do ocorrido, foram realizados os encaminhamentos e/ou orientações necessários, conforme as normas e procedimentos da instituição.`;

    try {
      await navigator.clipboard.writeText(textoSGE);
      setCopiadoIds(prev => ({ ...prev, [idKey]: true }));
      setTimeout(() => {
        setCopiadoIds(prev => ({ ...prev, [idKey]: false }));
      }, 2000);
    } catch (e) {
      console.error('Erro ao copiar texto do dia:', e);
    }
  };

  const [copiadoMensagemPais, setCopiadoMensagemPais] = useState<Record<string, boolean>>({});

  const handleCopiarMensagemPais = async (group: PendingAtaGroup, cardKey: string) => {
    const listaRegistros = group.records.map((rec) => {
      const dataFormatada = rec.created_at ? new Date(rec.created_at).toLocaleDateString('pt-BR') : 'Data não informada';
      const relato = extrairRelatoSucinto(rec.report, rec.occurrence_type);
      return `• ${dataFormatada}: ${relato}`;
    }).join('\n');

    const mensagem = `Prezados(as) responsáveis pelo(a) estudante ${group.studentName}, esperamos que estejam bem.\n\nGostaríamos de compartilhar com vocês alguns registros de acompanhamento pedagógico recentes, referentes a ocorrências de "${group.type}". Abaixo, detalhamos cada um dos episódios registrados:\n\n${listaRegistros}\n\nO(a) estudante tem recebido as devidas orientações de nossa equipe em cada um desses momentos. No entanto, diante da reincidência, solicitamos a parceria e o apoio da família na conversa em casa e no acompanhamento da conduta escolar, visando o melhor desenvolvimento do(a) aluno(a).\n\nFicamos à disposição para eventuais dúvidas.\n\nAtenciosamente,\nCoordenação Pedagógica\nColégio SESI Internacional`;
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiadoMensagemPais(prev => ({ ...prev, [cardKey]: true }));
      setTimeout(() => {
        setCopiadoMensagemPais(prev => ({ ...prev, [cardKey]: false }));
      }, 2500);
    } catch (e) {
      console.error('Erro ao copiar mensagem:', e);
    }
  };

  // Copia todos os registros do aluno agrupados e formatados para o SGE
  const handleCopiarTodosSGE = async (group: PendingAtaGroup, cardKey: string) => {
    const textos = group.records.map((rec, index) => {
      const { cabecalho } = gerarCabecalhoOficialSesi({
        dataStr: rec.created_at,
        nomeAluno: rec.student_name,
        turmaAluno: rec.school_year
      });
      const relato = extrairRelatoSucinto(rec.report, rec.occurrence_type);
      return `--- REGISTRO ${index + 1} DE ${group.records.length} ---
${cabecalho}

${relato}
`;
    });

    const textoConsolidado = textos.join('\n\n') + `\n${ENCAMINHAMENTOS_PADRAO_ATA}\n${FECHAMENTO_PADRAO_ATA_ABNT}`;

    try {
      await navigator.clipboard.writeText(textoConsolidado);
      setCopiadoTodos(prev => ({ ...prev, [cardKey]: true }));
      setTimeout(() => {
        setCopiadoTodos(prev => ({ ...prev, [cardKey]: false }));
      }, 2500);
    } catch (e) {
      console.error('Erro ao copiar todos os registros:', e);
    }
  };

  // Conclui a tratativa no Supabase (marca como tratada)
  const handleConcluirTratativa = async (group: PendingAtaGroup, cardKey: string) => {
    if (!window.confirm(`Deseja confirmar a tratativa pedagógica de ${group.studentName} (${group.type})? A contagem de reincidências ativas será zerada.`)) {
      return;
    }

    setTratandoIds(prev => ({ ...prev, [cardKey]: true }));
    try {
      await occurrenceService.markRecordsAsTreated(group.studentName, group.type);
      await carregarOcorrenciasAtivas();
    } catch (e) {
      alert('Erro ao confirmar tratativa.');
    } finally {
      setTratandoIds(prev => ({ ...prev, [cardKey]: false }));
    }
  };

  const handleFormalizarAtaDisciplinar = (group: PendingAtaGroup) => {
    navigate('/forms', {
      state: {
        prefill: {
          studentName: group.studentName,
          schoolYear: group.schoolYear,
          type: group.type,
          count: group.count,
          records: group.records
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-20 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-lowest p-6 md:p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <AlertTriangle size={32} className="animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Atas e Reincidências</h1>
          </div>
          <p className="text-on-surface-variant font-medium max-w-2xl text-xs md:text-sm leading-relaxed">
            Consulte as ocorrências diárias acumuladas de cada aluno no trimestre. Clique no nome do estudante para gerar e copiar as atas formatadas para anexar diretamente no <strong>SGE oficial</strong>.
          </p>
        </div>

        <div className="relative z-10 bg-surface-container-low px-5 py-3 rounded-2xl border border-red-500/10 shrink-0">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Casos Acumulados</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{filteredAndSortedAtas.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">pendências</span>
          </div>
        </div>
      </header>

      {/* Painel de Filtros e Busca */}
      <section className="bg-surface-container-low p-5 md:p-6 rounded-3xl border border-white/5 space-y-4 editorial-shadow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Busca por Nome */}
          <div className="relative md:col-span-4 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              id="busca-estudante"
              type="text" 
              placeholder="Buscar estudante..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="w-full bg-surface-container-high border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all text-white"
            />
          </div>

          {/* Filtro por Ano */}
          <div className="md:col-span-3 flex items-center gap-2 bg-surface-container-high px-4 py-3 rounded-2xl border border-white/5">
            <Filter size={16} className="text-primary/75 shrink-0" />
            <select 
              id="filtro-ano"
              value={filtroAno} 
              onChange={e => setFiltroAno(e.target.value)} 
              className="bg-transparent text-sm font-bold outline-none w-full text-white cursor-pointer"
            >
              <option value="todos">Todos os Anos</option>
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Ocorrência */}
          <div className="md:col-span-3 flex items-center gap-2 bg-surface-container-high px-4 py-3 rounded-2xl border border-white/5">
            <BookOpen size={16} className="text-primary/75 shrink-0" />
            <select 
              id="filtro-tipo"
              value={filtroTipo} 
              onChange={e => setFiltroTipo(e.target.value)} 
              className="bg-transparent text-sm font-bold outline-none w-full text-white cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              {tiposDisponiveis.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Ordenação */}
          <div className="md:col-span-2 flex items-center gap-2 bg-surface-container-high px-4 py-3 rounded-2xl border border-white/5">
            <ArrowUpDown size={16} className="text-[#f1d86f] shrink-0" />
            <select 
              id="ordenacao"
              value={ordenacao} 
              onChange={e => setOrdenacao(e.target.value as any)} 
              className="bg-transparent text-sm font-bold outline-none w-full text-white cursor-pointer"
            >
              <option value="date_desc">Recentes Primeiro</option>
              <option value="date_asc">Antigos Primeiro</option>
              <option value="alpha_asc">Nome (A-Z)</option>
              <option value="alpha_desc">Nome (Z-A)</option>
              <option value="count_desc">Mais Ocorrências</option>
            </select>
          </div>

        </div>
      </section>

      {/* Listagem de Estudantes com Atas Pendentes */}
      <main className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-surface-container-low rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="font-black text-on-surface-variant uppercase tracking-widest text-xs animate-pulse">Carregando pendências...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-surface-container-low rounded-[2.5rem] border border-red-500/10 text-red-500">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-wider">{error}</p>
          </div>
        ) : filteredAndSortedAtas.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-20 text-center bg-surface-container-low rounded-[2.5rem] border-2 border-dashed border-emerald-500/10 editorial-shadow"
          >
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            </div>
            <h3 className="text-xl font-black mb-2 text-white">Nenhum Caso Pendente</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              Todos os alunos estão em conformidade! Não há reincidências ativas precisando de ata ou lançamento no SGE neste momento.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedAtas.map((group) => {
                const cardKey = `${group.studentName.toLowerCase()}-${group.type.toLowerCase()}`;
                const isExpanded = !!expandedCards[cardKey];
                const todosCopiados = !!copiadoTodos[cardKey];
                const isTratando = !!tratandoIds[cardKey];
                
                return (
                  <motion.div
                    key={cardKey}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "bg-surface-container-lowest border rounded-[2.2rem] overflow-hidden transition-all duration-300 shadow-premium",
                      isExpanded ? "border-red-500/40 ring-1 ring-red-500/20" : "border-outline-variant/10 hover:border-red-500/20"
                    )}
                  >
                    {/* Linha Principal do Card - Clicável */}
                    <div 
                      onClick={() => toggleExpandCard(cardKey)}
                      className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative cursor-pointer group select-none"
                    >
                      {/* Borda de status decorativa */}
                      <div className="absolute top-0 left-0 w-2 h-full bg-red-600 group-hover:bg-red-500 transition-colors" />

                      <div className="flex-1 space-y-2 pl-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-wide flex items-center gap-2">
                            {group.studentName}
                            <span className="text-[11px] font-bold text-slate-400 lowercase tracking-normal group-hover:text-slate-300 transition-colors">
                              (clique para ver atas diárias)
                            </span>
                          </h2>
                          <span className="text-xs font-bold bg-white/5 text-slate-300 px-3 py-1 rounded-full border border-white/5">
                            {group.schoolYear}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant font-medium">
                          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-wide border border-red-500/20">
                            {group.type}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={14} className="text-[#f1d86f]" />
                            Última ocorrência: {group.latestDate.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Badges e Ações Rápidas */}
                      <div className="flex items-center gap-4 pl-2 md:pl-0 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Indicador de Quantidade */}
                        <div className="text-right">
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Acúmulo</p>
                          <p className="text-xl font-black text-red-400">{group.count} Ocorrências</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpandCard(cardKey)}
                            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                          >
                            {isExpanded ? 'Recolher' : 'Abrir Atas dos Dias'}
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopiarMensagemPais(group, cardKey)}
                            className={cn(
                              "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md",
                              !!copiadoMensagemPais[cardKey]
                                ? "bg-emerald-500 text-black shadow-emerald-500/20"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                            )}
                            title="Copiar mensagem para enviar aos pais (WhatsApp)"
                          >
                            {!!copiadoMensagemPais[cardKey] ? <Check size={16} /> : <Share2 size={16} />}
                            {!!copiadoMensagemPais[cardKey] ? 'Copiado!' : 'Mensagem Pais'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopiarTodosSGE(group, cardKey)}
                            className={cn(
                              "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md",
                              todosCopiados 
                                ? "bg-blue-500 text-white shadow-blue-500/20" 
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                            )}
                            title="Copiar todas as atas formatadas deste aluno para o SGE"
                          >
                            {todosCopiados ? <Check size={16} /> : <Copy size={16} />}
                            {todosCopiados ? 'Copiado SGE!' : 'Copiar p/ SGE'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exibição Simplificada dos Registros / Atas de Cada Dia */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-white/5 bg-slate-950/70 overflow-hidden"
                        >
                          <div className="p-6 md:p-8 space-y-6">
                            
                            {/* Toolbar superior do aluno */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                              <div className="space-y-0.5">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                  <Sparkles size={16} className="text-[#f1d86f]" />
                                  Atas Simplificadas de Cada Dia ({group.records.length} registros)
                                </h3>
                                <p className="text-xs text-slate-400">
                                  Cada bloco abaixo já está formatado com cabeçalho oficial e relato sucinto para colar no SGE.
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFormalizarAtaDisciplinar(group)}
                                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/5"
                                  title="Abrir formulário de ata disciplinar formal da coordenação com os pais"
                                >
                                  <FileText size={14} className="text-amber-400" />
                                  Formalizar Ata Disciplinar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleConcluirTratativa(group, cardKey)}
                                  disabled={isTratando}
                                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                >
                                  <ShieldCheck size={14} />
                                  {isTratando ? 'Concluindo...' : 'Concluir Tratativa'}
                                </button>
                              </div>
                            </div>

                            {/* Lista dos Dias Formatados */}
                            <div className="space-y-4">
                              {group.records.map((rec, rIdx) => {
                                const recIdKey = rec.id || `${cardKey}-${rIdx}`;
                                const isCopiadoDia = !!copiadoIds[recIdKey];

                                const { cabecalho, dataFormatada, horarioFormatado } = gerarCabecalhoOficialSesi({
                                  dataStr: rec.created_at,
                                  nomeAluno: rec.student_name,
                                  turmaAluno: rec.school_year
                                });

                                const relatoCurto = extrairRelatoSucinto(rec.report, rec.occurrence_type);

                                return (
                                  <div 
                                    key={recIdKey} 
                                    className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 space-y-4 hover:border-slate-700 transition-colors relative"
                                  >
                                    {/* Header do Dia */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/20">
                                          {rIdx + 1}º
                                        </div>
                                        <div>
                                          <p className="text-xs font-black text-white flex items-center gap-2">
                                            <Calendar size={13} className="text-amber-400" />
                                            {dataFormatada} às {horarioFormatado}
                                          </p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {rec.occurrence_type}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedRecordForModal(rec)}
                                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          <ExternalLink size={12} />
                                          Ver / Detalhar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleCopiarDiaSGE(rec, recIdKey)}
                                          className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                                            isCopiadoDia
                                              ? "bg-emerald-500 text-black"
                                              : "bg-blue-600 hover:bg-blue-500 text-white"
                                          )}
                                        >
                                          {isCopiadoDia ? <Check size={14} /> : <Copy size={14} />}
                                          {isCopiadoDia ? 'Copiado para o SGE!' : 'Copiar para SGE'}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Texto Formatado Oficial */}
                                    <div className="space-y-3 text-xs md:text-sm font-sans text-slate-300">
                                      <p className="text-slate-400 font-medium text-justify">
                                        {cabecalho}
                                      </p>
                                      <div className="p-3.5 bg-slate-850/80 rounded-xl border-l-4 border-blue-500 font-semibold text-white">
                                        <p>{relatoCurto}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal de Registro Diário Completo SGE ao clicar em "Ver / Detalhar" */}
      <AnimatePresence>
        {selectedRecordForModal && (
          <ModalRegistroDiarioSGE
            record={selectedRecordForModal}
            onClose={() => setSelectedRecordForModal(null)}
            onUpdate={carregarOcorrenciasAtivas}
            onDelete={carregarOcorrenciasAtivas}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
