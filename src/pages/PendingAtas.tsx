import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Search, Filter, ArrowUpDown, FileText, 
  ChevronDown, ChevronUp, Calendar, Clock, User, CheckCircle2,
  BookOpen
} from 'lucide-react';
import { occurrenceService, getOccurrenceGroup, GROUP_FRIENDLY_NAMES } from '../services/occurrenceService';
import type { DailyOccurrenceRecord } from '../types';
import { cn } from '../lib/utils';

interface PendingAtaGroup {
  studentName: string;
  schoolYear: string;
  type: string;
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

  const toggleExpandCard = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function carregarOcorrenciasAtivas() {
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
    }

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

    // Filtra apenas grupos com 4 ou mais ocorrências
    return Object.values(groups).filter(g => g.count >= 4);
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

  // Função para encaminhar para a tela de geração de Ata
  const handleGerarAta = (group: PendingAtaGroup) => {
    navigate('/forms', {
      state: {
        prefill: {
          studentName: group.studentName,
          schoolYear: group.schoolYear,
          type: group.type,
          count: group.count
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-20 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Cabeçalho Premium */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3 text-red-500">
            <AlertTriangle size={32} className="animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <h1 className="text-4xl font-black tracking-tighter text-white">Atas Pendentes</h1>
          </div>
          <p className="text-on-surface-variant font-medium max-w-2xl text-sm leading-relaxed">
            Alunos que atingiram o limite de reincidência de conduta (4 ou mais ocorrências diárias ativas no trimestre) e necessitam de uma ata oficial de orientação e tratativa pedagógica da Coordenação.
          </p>
        </div>

        <div className="relative z-10 bg-surface-container-low px-5 py-3 rounded-2xl border border-red-500/10 shrink-0">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Total Pendente</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{filteredAndSortedAtas.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">casos críticos</span>
          </div>
        </div>
      </header>

      {/* Painel de Filtros e Busca */}
      <section className="bg-surface-container-low p-6 rounded-3xl border border-white/5 space-y-4 editorial-shadow">
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

      {/* Listagem em Cards Premium */}
      <main className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-surface-container-low rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="font-black text-on-surface-variant uppercase tracking-widest text-xs animate-pulse">Carregando atas pendentes...</p>
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
            <h3 className="text-xl font-black mb-2 text-white">Nenhuma Ata Pendente</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              Todos os alunos estão em conformidade! Não há nenhum estudante com 4 ou mais ocorrências diárias ativas no trimestre precisando de ata pedagógica neste momento.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedAtas.map((group) => {
                const cardKey = `${group.studentName.toLowerCase()}-${group.type.toLowerCase()}`;
                const isExpanded = !!expandedCards[cardKey];
                
                return (
                  <motion.div
                    key={cardKey}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "bg-surface-container-lowest border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-premium",
                      isExpanded ? "border-red-500/30 ring-1 ring-red-500/10" : "border-outline-variant/10 hover:border-red-500/20"
                    )}
                  >
                    {/* Linha Principal do Card */}
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                      {/* Borda de status decorativa */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />

                      <div className="flex-1 space-y-2 pl-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h2 className="text-lg md:text-xl font-black text-red-500 uppercase tracking-wide">
                            {group.studentName}
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

                      {/* Badges e Ações */}
                      <div className="flex items-center gap-4 pl-2 md:pl-0 shrink-0">
                        {/* Indicador de Quantidade */}
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Acúmulo</p>
                          <p className="text-lg font-black text-red-400">{group.count} Ocorrências</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            id={`expand-${cardKey}`}
                            onClick={() => toggleExpandCard(cardKey)}
                            className="btn-mini hover:bg-white/5 hover:text-white border border-white/5 cursor-pointer"
                          >
                            {isExpanded ? 'Ocultar' : 'Ver Ocorrências'}
                            {isExpanded ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                          </button>
                          
                          <button
                            id={`gerar-ata-${cardKey}`}
                            onClick={() => handleGerarAta(group)}
                            className="btn-primary !py-3 !px-5 !rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow-yellow border border-primary flex items-center gap-2 cursor-pointer"
                          >
                            <FileText size={14} />
                            Gerar Ata
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline expandida de Ocorrências Diárias */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-white/5 bg-surface-container-low/30 overflow-hidden"
                        >
                          <div className="p-6 md:p-8 space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={14} className="text-primary" />
                              Histórico do trimestre
                            </h3>

                            <div className="relative pl-6 border-l-2 border-outline-variant/30 space-y-6">
                              {group.records.map((rec, rIdx) => {
                                const recDate = rec.created_at ? new Date(rec.created_at) : new Date();
                                return (
                                  <div key={rec.id || rIdx} className="relative group/timeline-item">
                                    {/* Bullet da linha do tempo */}
                                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#f1d86f] border-2 border-background group-hover/timeline-item:bg-red-500 transition-colors" />
                                    
                                    <div className="space-y-1.5 bg-surface-container-high/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                        <span className="font-bold flex items-center gap-1.5 text-slate-300">
                                          <Calendar size={12} className="text-primary/75" />
                                          {recDate.toLocaleDateString('pt-BR')} - {recDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                          Registrado por: Administrador
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                                        {rec.report}
                                      </p>
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
    </div>
  );
}
