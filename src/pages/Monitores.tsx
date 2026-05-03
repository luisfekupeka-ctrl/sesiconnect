import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Search, Clock, MapPin, ChevronLeft, ChevronRight, Users, Calendar, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const HORAS_ESCALA = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const ESCALA_INICIO = 7 * 60;
const ESCALA_FIM = 18 * 60;
const ESCALA_TOTAL = ESCALA_FIM - ESCALA_INICIO;

// Paleta de cores vibrantes para cada monitor
const CORES_MONITOR = [
  '#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6',
  '#EC4899','#06B6D4','#F97316','#14B8A6','#6366F1',
  '#D946EF','#0EA5E9','#84CC16','#E11D48','#7C3AED',
];

function horaParaMinutos(hora: string): number {
  if (!hora || typeof hora !== 'string' || !hora.includes(':')) return 0;
  const parts = hora.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

export default function Monitores() {
  const { monitores, horaAtual, gradeMonitores } = useEscola();
  const [busca, setBusca] = useState('');
  const [monitorSelecionadoId, setMonitorSelecionadoId] = useState<string | null>(null);
  const [diaFiltro, setDiaFiltro] = useState(() => {
    const dias = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    return dias[horaAtual.getDay()] || 'SEGUNDA';
  });

  const minutosAgora = horaAtual.getHours() * 60 + horaAtual.getMinutes();

  // Mapa de cores: cada nome de monitor recebe uma cor fixa
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

  const monitoresFiltrados = (monitores || []).filter(m => {
    const b = busca.toLowerCase();
    return (m.nome?.toLowerCase() || '').includes(b) || (m.materia?.toLowerCase() || '').includes(b);
  });

  const monitorAtivo = monitores.find(m => m.id === monitorSelecionadoId);

  // Grade do monitor selecionado, filtrada pelo dia
  const gradeDoMonitor = useMemo(() => {
    if (!monitorAtivo) return [];
    return (gradeMonitores || [])
      .filter(g => g.monitorNome === monitorAtivo.nome && g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [monitorAtivo, diaFiltro, gradeMonitores]);

  // Grade de todos os monitores do dia (escala geral)
  const escalaDoDia = useMemo(() => {
    return (gradeMonitores || [])
      .filter(g => g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [gradeMonitores, diaFiltro]);

  // ========== SUB-PÁGINA: Grade individual do monitor ==========
  if (monitorAtivo) {
    const cor = mapaCorMonitor[monitorAtivo.nome] || '#3B82F6';

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          {/* Cabeçalho */}
          <div className="p-6 md:p-8 text-white relative" style={{ backgroundColor: cor }}>
            <button onClick={() => setMonitorSelecionadoId(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-3xl font-black" style={{ color: cor }}>
                {(monitorAtivo.nome || 'M').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none text-black">{monitorAtivo.nome}</h2>
                <p className="text-sm font-bold opacity-80 mt-1 italic text-black/70">
                  {monitorAtivo.tipo === 'volante' ? 'VOLANTE' : monitorAtivo.tipo === 'hibrido' ? 'HÍBRIDO' : 'FIXO'} · {monitorAtivo.turno}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
            {/* Seletor de dia */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <h3 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
                <Calendar size={18} style={{ color: cor }} /> Grade de Postos
              </h3>
              <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                {DIAS_SEMANA.map(dia => (
                  <button key={dia} onClick={() => setDiaFiltro(dia)}
                    className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                      diaFiltro === dia ? "text-black shadow-md" : "text-white/40 hover:bg-white/5")}
                    style={diaFiltro === dia ? { backgroundColor: cor } : {}}>
                    {dia.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade vertical de postos */}
            <div className="flex flex-col gap-3">
              {gradeDoMonitor.length === 0 ? (
                <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Sem postos neste dia.</div>
              ) : gradeDoMonitor.map((slot, i) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border-2 border-white/5 bg-[#0d0d0d] shadow-premium flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden"
                  style={{ borderLeftWidth: '6px', borderLeftColor: slot.corEtiqueta || cor }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-black rounded-xl border border-white/5 flex items-center justify-center text-[10px] font-black" style={{ color: cor }}>#{i+1}</div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: cor }}>{slot.horarioInicio} — {slot.horarioFim}</p>
                      <h4 className="text-base font-black text-white italic tracking-tighter">{slot.posto}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: `${cor}15`, color: cor }}>
                      <MapPin size={10} className="inline mr-1" />{slot.funcao || 'Monitoria'}
                    </div>
                    {slot.instrucoes && (
                      <div className="px-3 py-1.5 bg-white/5 rounded-xl text-[8px] font-black text-white/40 italic truncate max-w-[200px]">
                        {slot.instrucoes}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Postos Hoje</p>
                <p className="text-2xl font-black italic" style={{ color: cor }}>{gradeDoMonitor.length}</p>
              </div>
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Início</p>
                <p className="text-lg font-black italic text-white">{gradeDoMonitor[0]?.horarioInicio || '--:--'}</p>
              </div>
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Fim</p>
                <p className="text-lg font-black italic text-white">{gradeDoMonitor[gradeDoMonitor.length - 1]?.horarioFim || '--:--'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ========== PÁGINA PRINCIPAL ==========
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">
            <span className="text-[#42a0f5]">Monitores</span>
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">
            Grade de postos, funções e escala geral do dia.
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

      {/* ====== SEÇÃO 1: LISTA DE MONITORES ====== */}
      <section className="space-y-4">
        <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
          <Users size={18} className="text-[#42a0f5]" /> Equipe
        </h2>
        <div className="flex flex-col gap-3">
          {monitoresFiltrados.map((monitor) => {
            const cor = mapaCorMonitor[monitor.nome] || '#3B82F6';
            const postosHoje = (gradeMonitores || []).filter(g => g.monitorNome === monitor.nome && g.diaSemana === diaFiltro).length;
            const ativo = monitor.status === 'ativo';

            return (
              <motion.div key={monitor.id} whileHover={{ x: 5 }} onClick={() => setMonitorSelecionadoId(monitor.id)}
                className={cn("bg-[#0d0d0d] rounded-2xl shadow-premium p-4 cursor-pointer group border-2 transition-all flex items-center justify-between",
                  ativo ? "border-white/5 hover:border-white/20" : "border-white/5 opacity-40")}
                style={{ borderLeftWidth: '5px', borderLeftColor: cor }}>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all"
                    style={{ backgroundColor: `${cor}20`, color: cor }}>
                    {(monitor.nome || 'M')[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tighter leading-tight italic group-hover:text-[#42a0f5]">{monitor.nome}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${cor}15`, color: cor }}>
                        {monitor.tipo === 'volante' ? 'VOLANTE' : monitor.tipo === 'hibrido' ? 'HÍBRIDO' : 'FIXO'}
                      </span>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{monitor.turno}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] font-black text-white tracking-widest">{monitor.horarioInicio} — {monitor.horarioFim}</p>
                    <p className="text-[9px] font-black uppercase" style={{ color: cor }}>{postosHoje} posto{postosHoje !== 1 ? 's' : ''} hoje</p>
                  </div>
                  {ativo && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cor, boxShadow: `0 0 8px ${cor}` }} />}
                  <ChevronRight size={18} className="text-[#42a0f5] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ====== SEÇÃO 2: ESCALA GERAL DO DIA ====== */}
      <section className="space-y-4">
        <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#fbbf24]" /> Escala do Dia — {diaFiltro}
          </div>
          <select 
            value={busca || 'Todos'} 
            onChange={(e) => setBusca(e.target.value === 'Todos' ? '' : e.target.value)}
            className="bg-[#0a0a0a] border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none ring-2 ring-[#42a0f5]/10 focus:ring-[#42a0f5]/30 text-[#42a0f5] cursor-pointer"
          >
            <option value="Todos">Todos os Monitores</option>
            {monitores.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
          </select>
        </h2>

        {escalaDoDia.length === 0 ? (
          <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Nenhum posto agendado.</div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
            {/* Timeline header */}
            <div className="flex border-b border-white/5">
              <div className="w-40 shrink-0 p-4 border-r border-white/5">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Monitor</p>
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {HORAS_ESCALA.map(hora => (
                    <div key={hora} className="flex-1 text-center py-4 text-[8px] font-mono font-black text-white/20 uppercase tracking-widest border-l border-white/5">{hora}</div>
                  ))}
                </div>
                {/* Linha do horário atual */}
                {minutosAgora >= ESCALA_INICIO && minutosAgora <= ESCALA_FIM && (
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: `${((minutosAgora - ESCALA_INICIO) / ESCALA_TOTAL) * 100}%` }}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Agrupar por monitor */}
            {(() => {
              const monitoresNaEscala = Array.from(new Set(escalaDoDia.map(g => g.monitorNome))).sort();
              return monitoresNaEscala.map(nome => {
                const cor = mapaCorMonitor[nome] || '#3B82F6';
                const postos = escalaDoDia.filter(g => g.monitorNome === nome);

                return (
                  <div key={nome} className="flex border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                    {/* Nome */}
                    <div className="w-40 shrink-0 p-3 border-r border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ backgroundColor: `${cor}20`, color: cor }}>
                        {nome.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-white truncate">{nome}</p>
                      </div>
                    </div>

                    {/* Barras de postos */}
                    <div className="flex-1 relative py-2">
                      {postos.map(slot => {
                        const minInicio = horaParaMinutos(slot.horarioInicio);
                        const minFim = horaParaMinutos(slot.horarioFim);
                        const leftPct = Math.max(0, ((minInicio - ESCALA_INICIO) / ESCALA_TOTAL) * 100);
                        const widthPct = Math.min(100 - leftPct, ((minFim - minInicio) / ESCALA_TOTAL) * 100);
                        const estaAtivo = minutosAgora >= minInicio && minutosAgora < minFim;

                        return (
                          <div
                            key={slot.id}
                            className={cn("absolute h-8 rounded-lg flex items-center px-2 gap-1 overflow-hidden transition-all",
                              estaAtivo ? "shadow-lg" : "opacity-80")}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: estaAtivo ? cor : `${cor}30`,
                              color: estaAtivo ? '#000' : cor,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              boxShadow: estaAtivo ? `0 0 12px ${cor}40` : 'none',
                            }}
                            title={`${slot.horarioInicio}–${slot.horarioFim} | ${slot.posto} | ${slot.funcao || 'Monitoria'}`}
                          >
                            <MapPin size={8} strokeWidth={3} />
                            <span className="text-[7px] font-black uppercase tracking-tight truncate">{slot.posto}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </section>

      {/* Legenda de cores */}
      <section className="flex flex-wrap gap-2">
        {Object.entries(mapaCorMonitor).map(([nome, cor]) => (
          <div key={nome} className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d0d] rounded-lg border border-white/5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{nome.split(' ')[0]}</span>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
