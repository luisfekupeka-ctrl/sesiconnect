import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCircle, Search, Clock, MapPin, ChevronLeft, ChevronRight, 
  Users, Calendar, Shield, FileText, Printer, Coffee, Download, X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { generateEscalaGeralPDF, generateEscalasIndividuaisPDF } from '../lib/reportGenerator';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

const MACRO_SETORES = [
  '🏫 Térreo',
  '🌳 Pátio Lateral',
  '🏢 1º Andar',
  '🏢 2º Andar',
  '🏢 3º Andar',
  '🚗 S1',
  '🚗 S2',
  '🛡️ Volante 1',
  '🛡️ Volante 2',
  '🛡️ Monitoria',
  '📚 Biblioteca',
  '🏥 Enfermaria',
  '🍽️ Almoço'
];

const CORES_MONITOR = [
  '#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6',
  '#EC4899','#06B6D4','#F97316','#14B8A6','#6366F1',
  '#D946EF','#0EA5E9','#84CC16','#E11D48','#7C3AED',
];

const PERIODOS_FALLBACK = [
  { id: 'p1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p2', nome: '2ª Aula', horarioInicio: '08:20', horarioFim: '09:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p3', nome: '3ª Aula', horarioInicio: '09:10', horarioFim: '10:00', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p-int', nome: 'Intervalo', horarioInicio: '10:00', horarioFim: '10:20', tipo: 'intervalo', segmento: 'monitoria' },
  { id: 'p4', nome: '4ª Aula', horarioInicio: '10:20', horarioFim: '11:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p5', nome: '5ª Aula', horarioInicio: '11:10', horarioFim: '12:00', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p-alm', nome: 'Almoço', horarioInicio: '12:00', horarioFim: '13:00', tipo: 'almoco', segmento: 'monitoria' },
  { id: 'p6', nome: '6ª Aula', horarioInicio: '13:00', horarioFim: '13:50', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p7', nome: '7ª Aula', horarioInicio: '13:50', horarioFim: '14:40', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p8', nome: '8ª Aula', horarioInicio: '14:40', horarioFim: '15:30', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p9', nome: '9ª Aula', horarioInicio: '15:30', horarioFim: '16:20', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p10', nome: '10ª Aula', horarioInicio: '16:20', horarioFim: '17:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p11', nome: '11ª Aula', horarioInicio: '17:10', horarioFim: '18:00', tipo: 'aula', segmento: 'monitoria' }
];

function horaParaMinutos(hora: string): number {
  if (!hora || typeof hora !== 'string' || !hora.includes(':')) return 0;
  const parts = hora.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function obterMacroSetor(posto: string): string {
  const p = (posto || '').trim().toLowerCase();
  
  if (p === 'almoço' || p === 'almoco' || p === 'almoçando' || p === 'refeitório' || p === 'refeitorio') return '🍽️ Almoço';
  if (p === 'volante 1') return '🛡️ Volante 1';
  if (p === 'volante 2') return '🛡️ Volante 2';
  if (p === 'térreo' || p === 'terreo') return '🏫 Térreo';
  if (p === 'pátio lateral' || p === 'patio lateral') return '🌳 Pátio Lateral';
  if (p === '1º andar' || p === '1 andar') return '🏢 1º Andar';
  if (p === '2º andar' || p === '2 andar') return '🏢 2º Andar';
  if (p === '3º andar' || p === '3 andar') return '🏢 3º Andar';
  if (p === 's1') return '🚗 S1';
  if (p === 's2') return '🚗 S2';
  if (p === 'monitoria') return '🛡️ Monitoria';
  if (p === 'biblioteca') return '📚 Biblioteca';
  if (p === 'enfermaria') return '🏥 Enfermaria';

  if (p.includes('almoça') || p.includes('almoço')) return '🍽️ Almoço';

  const candidates: { sector: string; index: number }[] = [];

  const addCandidate = (sector: string, keywords: string[]) => {
    for (const kw of keywords) {
      const idx = p.indexOf(kw);
      if (idx !== -1) {
        candidates.push({ sector, index: idx });
      }
    }
  };

  addCandidate('🛡️ Volante 1', ['volante 2', 'volante2', 'apoio interno']);
  addCandidate('🛡️ Volante 2', ['volante 1', 'volante1', 'apoio externo']);
  addCandidate('🛡️ Monitoria', ['monitoria']);
  addCandidate('📚 Biblioteca', ['biblioteca', 'bliblioteca']);
  addCandidate('🏥 Enfermaria', ['enfermaria']);
  addCandidate('🚗 S1', ['s1']);
  addCandidate('🚗 S2', ['s2']);
  addCandidate('🏢 1º Andar', ['1º andar', '1 andar', 'primeiro andar']);
  addCandidate('🏢 2º Andar', ['2º andar', '2 andar', 'segundo andar']);
  addCandidate('🏢 3º Andar', ['3º andar', '3 andar', 'terceiro andar']);
  addCandidate('🌳 Pátio Lateral', ['patio', 'pátio', 'lateral', 'gramado', 'botânico', 'botanico']);
  addCandidate('🏫 Térreo', ['térreo', 'terreo']);

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.index - b.index);
    return candidates[0].sector;
  }

  return '🛡️ Monitoria';
}

export default function Monitores() {
  const { isAdmin } = useAuth();
  const { monitores, horaAtual, gradeMonitores, periodos } = useEscola();
  const [busca, setBusca] = useState('');
  const [diaFiltro, setDiaFiltro] = useState(() => {
    const dias = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    return dias[horaAtual.getDay()] || 'SEGUNDA';
  });

  const [monitorSelecionadoId, setMonitorSelecionadoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'monitor' | 'setor'>('monitor');

  // Mapa de cores
  const mapaCorMonitor = useMemo(() => {
    const mapa: Record<string, string> = {};
    const nomes = Array.from(new Set([
      ...(monitores || []).map(m => m.nome),
      ...(gradeMonitores || []).map(g => g.monitorNome),
    ])).sort();
    nomes.forEach((nome, i) => {
      const monitor = (monitores || []).find(m => m.nome === nome);
      const gradeEntry = (gradeMonitores || []).find(g => g.monitorNome === nome && g.corEtiqueta);
      mapa[nome] = monitor?.cor || gradeEntry?.corEtiqueta || CORES_MONITOR[i % CORES_MONITOR.length];
    });
    return mapa;
  }, [monitores, gradeMonitores]);

  // Grade de todos os monitores do dia
  const escalaDoDia = useMemo(() => {
    return (gradeMonitores || [])
      .filter(g => g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [gradeMonitores, diaFiltro]);

  const [ordenacao, setOrdenacao] = useState<'nome' | 'local'>('local');

  const SEQUENCIA_LOCAIS = useMemo(() => [
    'S1',
    'S2',
    'GRAMADO',
    'PÁTIO LATERAL',
    'TÉRREO',
    'BIBLIOTECA',
    '1º ANDAR',
    '2º ANDAR',
    '3º ANDAR'
  ], []);

  const obterPesoLocal = (posto: string): number => {
    if (!posto) return 999;
    const p = posto.trim().toUpperCase();
    const idx = SEQUENCIA_LOCAIS.findIndex(loc => p.includes(loc) || loc.includes(p));
    return idx === -1 ? 900 : idx;
  };

  const monitoresOrdenados = useMemo(() => {
    const filtrados = (monitores || []).filter(m => {
      const b = busca.toLowerCase();
      return (m.nome?.toLowerCase() || '').includes(b) || (m.materia?.toLowerCase() || '').includes(b);
    });

    if (ordenacao === 'nome') {
      return filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      return filtrados.sort((a, b) => {
        const turnosA = escalaDoDia.filter(g => g.monitorNome === a.nome).sort((x, y) => x.horarioInicio.localeCompare(y.horarioInicio));
        const turnosB = escalaDoDia.filter(g => g.monitorNome === b.nome).sort((x, y) => x.horarioInicio.localeCompare(y.horarioInicio));
        
        const postoA = turnosA[0]?.posto || '';
        const postoB = turnosB[0]?.posto || '';
        
        const pesoA = obterPesoLocal(postoA);
        const pesoB = obterPesoLocal(postoB);
        
        if (pesoA !== pesoB) return pesoA - pesoB;
        return a.nome.localeCompare(b.nome);
      });
    }
  }, [monitores, escalaDoDia, ordenacao, busca]);

  const monitorAtivo = monitores.find(m => m.id === monitorSelecionadoId);

  const gradeDoMonitorAtivo = useMemo(() => {
    if (!monitorAtivo) return [];
    return (gradeMonitores || [])
      .filter(g => g.monitorNome === monitorAtivo.nome && g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [monitorAtivo, diaFiltro, gradeMonitores]);

  // Períodos de monitoria
  const periodosMonitoria = useMemo(() => {
    const filtrados = (periodos || []).filter(p => p.segmento === 'monitoria');
    return filtrados.length > 0 ? filtrados : PERIODOS_FALLBACK;
  }, [periodos]);

  const handleExportarGeral = () => {
    generateEscalaGeralPDF(escalaDoDia, diaFiltro, monitores);
  };

  const handleExportarIndividuais = () => {
    generateEscalasIndividuaisPDF(monitores, gradeMonitores, diaFiltro);
  };

  const handleExportarMonitorEspecifico = (monitor: any) => {
    generateEscalasIndividuaisPDF([monitor], gradeMonitores, diaFiltro);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">
            <span className="text-[#42a0f5]">Monitores</span>
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">
            Visualização de postos, setores e escala geral.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {DIAS_SEMANA.map(dia => (
              <button key={dia} onClick={() => setDiaFiltro(dia)}
                className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                  diaFiltro === dia ? "bg-[#42a0f5] text-black shadow-md" : "text-white/40 hover:bg-white/5")}>
                {dia.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="relative group w-48 lg:w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#42a0f5]" size={18} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl text-white font-black text-xs focus:ring-4 focus:ring-[#42a0f5]/5 outline-none" />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-[#0a0a0a] p-1 rounded-2xl border border-white/5 gap-1 w-fit">
          <button
            onClick={() => setViewMode('monitor')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
              viewMode === 'monitor'
                ? "bg-[#42a0f5] text-black shadow-md"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            )}
          >
            <Users size={12} />
            Por Monitor
          </button>
          <button
            onClick={() => setViewMode('setor')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
              viewMode === 'setor'
                ? "bg-[#fbbf24] text-black shadow-md"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            )}
          >
            <MapPin size={12} />
            Por Setor / Local
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={handleExportarGeral}
              className="flex-1 md:flex-initial btn-secondary flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              <FileText size={12} className="text-[#fbbf24]" />
              PDF Escala Geral
            </button>
            <button
              onClick={handleExportarIndividuais}
              className="flex-1 md:flex-initial btn-secondary flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              <Printer size={12} className="text-[#42a0f5]" />
              PDFs Individuais
            </button>
          </div>
        )}
      </div>

      {viewMode === 'monitor' ? (
        /* ====== ABA 1: POR MONITOR (ESCALA DO DIA EM LINHAS E CLIQUE ABRE DETALHE EM LISTA) ====== */
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Shield size={18} className="text-[#42a0f5]" /> Escala do Dia — {diaFiltro}
            </h2>
            <button 
              onClick={() => setOrdenacao(ordenacao === 'nome' ? 'local' : 'nome')} 
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:bg-white/10 text-primary transition-all flex items-center gap-2"
            >
              <span>Filtro: {ordenacao === 'nome' ? 'Por Nome 👤' : 'Por Local 📍'}</span>
            </button>
          </div>

          {escalaDoDia.length === 0 ? (
            <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">
              Nenhum posto agendado.
            </div>
          ) : (
            <div className="space-y-3">
              {monitoresOrdenados.map(monitor => {
                const cor = mapaCorMonitor[monitor.nome] || '#3B82F6';
                const turnos = escalaDoDia
                  .filter(g => g.monitorNome === monitor.nome)
                  .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

                return (
                  <div key={monitor.id} className="bg-[#0a0a0a]/50 rounded-xl border border-white/5 p-4 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Monitor Card (Left side, click opens detailed list) */}
                    <div 
                      onClick={() => setMonitorSelecionadoId(monitor.id)}
                      className="md:w-52 shrink-0 flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/[0.02] active:scale-[0.98] transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 relative"
                        style={{ backgroundColor: `${cor}20`, color: cor, border: `1.5px solid ${cor}40` }}>
                        {monitor.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate leading-tight italic hover:text-primary transition-all">
                          {monitor.nome}
                        </h4>
                        <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: cor }}>
                          {turnos.length} Turnos
                        </p>
                      </div>
                    </div>

                    {/* Horizontal scroll shifts list */}
                    <div className="flex-1 flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
                      {turnos.length === 0 ? (
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider py-3 pl-2">Sem escala hoje</span>
                      ) : (
                        turnos.map(slot => {
                          const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO' || slot.posto === 'REFEITÓRIO';
                          const blockColor = ehAlmoco ? '#fbbf24' : (slot.corEtiqueta || cor);

                          return (
                            <div
                              key={slot.id}
                              className="flex-shrink-0 w-52 bg-[#0d0d0d] rounded-md p-3 border flex flex-col justify-center"
                              style={{ 
                                backgroundColor: `${blockColor}15`, 
                                borderColor: `${blockColor}40`,
                                borderLeft: `4px solid ${blockColor}` 
                              }}
                            >
                              <div className="text-[10px] font-black text-white truncate flex items-center gap-1 uppercase tracking-tight">
                                {ehAlmoco ? <Coffee size={10} className="text-amber-400 shrink-0" /> : <MapPin size={10} className="shrink-0" style={{ color: blockColor }} />}
                                {slot.posto}
                              </div>
                              <div className="text-[8px] font-bold text-white/50 truncate mt-1">
                                {slot.horarioInicio.slice(0, 5)} - {slot.horarioFim.slice(0, 5)} · {slot.funcao}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==================== ABA 2: POR SETOR (REPLICA DA ESCALA DO ADM - LEITURA) ==================== */
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Calendar size={18} className="text-[#fbbf24]" /> Escala Macro por Setor — {diaFiltro}
            </h3>
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Modo Leitura</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[900px] relative pb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40">
                    <th className="py-4 px-5 text-left text-[10px] font-black text-white/30 uppercase tracking-widest w-[200px] sticky left-0 bg-[#0a0a0a] z-20 border-r border-white/5">
                      Macro Setor / Local
                    </th>
                    {periodosMonitoria.map(p => (
                      <th key={p.id} className="py-3 px-2 text-center border-l border-white/5 min-w-[140px]">
                        <div className="text-[10px] font-black text-[#fbbf24] uppercase tracking-wider">{p.nome}</div>
                        <div className="text-[8px] font-black text-white/40 tracking-widest mt-0.5">
                          {p.horarioInicio.slice(0, 5)} - {p.horarioFim.slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MACRO_SETORES.map(macro => {
                    return (
                      <tr key={macro} className="hover:bg-white/[0.01] transition-all">
                        {/* Sector Name */}
                        <td className="py-4 px-5 font-black text-xs text-white uppercase italic tracking-wider sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5 min-w-[200px]">
                          {macro}
                        </td>

                        {/* Monitor Cards for each time period slot */}
                        {periodosMonitoria.map(p => {
                          const slotsAlocados = escalaDoDia.filter(g => 
                            obterMacroSetor(g.posto) === macro && 
                            g.horarioInicio.slice(0, 5) === p.horarioInicio.slice(0, 5)
                          );

                          return (
                            <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                              {slotsAlocados.length > 0 ? (
                                <div className="space-y-1">
                                  {slotsAlocados.map(slot => {
                                    const cor = mapaCorMonitor[slot.monitorNome] || '#3b82f6';
                                    const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO';
                                    const blockColor = ehAlmoco ? '#fbbf24' : cor;

                                    return (
                                      <div
                                        key={slot.id}
                                        className="text-left p-2 rounded-md border flex flex-col justify-center min-h-[50px]"
                                        style={{ 
                                          backgroundColor: `${blockColor}15`, 
                                          borderColor: `${blockColor}40`,
                                          borderLeft: `4px solid ${blockColor}` 
                                        }}
                                      >
                                        <div className="text-[10px] font-black text-white truncate uppercase flex items-center gap-1">
                                          <UserCircle size={12} style={{ color: blockColor }} />
                                          {slot.monitorNome.split(' ')[0]}
                                        </div>
                                        <div className="text-[7.5px] font-bold text-white/50 truncate uppercase mt-0.5 leading-none">
                                          {slot.funcao}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="py-4 flex items-center justify-center text-[8px] font-black text-white/10 uppercase tracking-widest">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DO MONITOR ATIVO */}
      <AnimatePresence>
        {monitorAtivo && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setMonitorSelecionadoId(null)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-xl bg-surface-container-lowest border border-white/10 rounded-2xl p-6 md:p-8 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0" style={{ color: mapaCorMonitor[monitorAtivo.nome] || '#3B82F6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-sm font-black shrink-0" 
                    style={{ color: mapaCorMonitor[monitorAtivo.nome] || '#3B82F6', border: `1.5px solid ${mapaCorMonitor[monitorAtivo.nome] || '#3B82F6'}40` }}>
                    {monitorAtivo.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">
                      Escala de {monitorAtivo.nome}
                    </h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                      Tipo: {monitorAtivo.tipo} | Turno: {monitorAtivo.turno}
                    </p>
                  </div>
                </div>
                <button onClick={() => setMonitorSelecionadoId(null)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/45 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Vertical list of shifts */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Postos do dia — {diaFiltro}</span>
                  <button 
                    onClick={() => handleExportarMonitorEspecifico(monitorAtivo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-primary border border-white/5"
                  >
                    <Download size={11} /> Baixar Escala Individual
                  </button>
                </div>

                {gradeDoMonitorAtivo.length === 0 ? (
                  <div className="py-12 text-center text-white/30 italic text-xs border-2 border-dashed border-white/5 rounded-xl">
                    Sem postos alocados neste dia.
                  </div>
                ) : (
                  gradeDoMonitorAtivo.map((slot, idx) => {
                    const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO' || slot.posto === 'REFEITÓRIO';
                    const blockColor = ehAlmoco ? '#fbbf24' : (slot.corEtiqueta || mapaCorMonitor[monitorAtivo.nome] || '#3B82F6');

                    return (
                      <div 
                        key={slot.id} 
                        className="p-4 rounded-md border flex items-center gap-4 relative overflow-hidden"
                        style={{ 
                          backgroundColor: `${blockColor}15`, 
                          borderColor: `${blockColor}40`,
                          borderLeft: `5px solid ${blockColor}` 
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-black shrink-0 text-white/40">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8.5px] font-black uppercase tracking-widest text-[#42a0f5] mb-0.5">
                            {slot.horarioInicio.slice(0, 5)} — {slot.horarioFim.slice(0, 5)}
                          </p>
                          <h4 className="text-sm font-black text-white uppercase italic truncate tracking-tight">{slot.posto}</h4>
                        </div>
                        <span className="px-2.5 py-1 bg-black/30 rounded-lg text-[8px] font-black uppercase tracking-wider text-white/50 border border-white/5">
                          {slot.funcao}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="flex border-t border-white/5 pt-4 shrink-0 justify-end">
                <button onClick={() => setMonitorSelecionadoId(null)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                  Fechar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
