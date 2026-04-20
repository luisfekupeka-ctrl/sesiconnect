import { useState } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Search, Clock, BookOpen, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { Monitor } from '../types';

// Escala de horários do dia para a timeline
const HORAS_ESCALA = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const ESCALA_INICIO = 7 * 60;  // 07:00 em minutos
const ESCALA_FIM = 18 * 60;    // 18:00 em minutos
const ESCALA_TOTAL = ESCALA_FIM - ESCALA_INICIO;

function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export default function Monitores() {
  const { monitores } = useEscola();
  const [busca, setBusca] = useState('');
  const [monitorSelecionado, setMonitorSelecionado] = useState<Monitor | null>(null);
  const [visualizacao, setVisualizacao] = useState<'cards' | 'timeline'>('timeline');

  const monitoresFiltrados = monitores.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.materia.toLowerCase().includes(busca.toLowerCase())
  );

  // Verificar se monitor está ativo agora baseado no horário
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const estaAtivoAgora = (inicio: string, fim: string): boolean => {
    const minInicio = horaParaMinutos(inicio);
    const minFim = horaParaMinutos(fim);
    return minutosAgora >= minInicio && minutosAgora < minFim;
  };

  // Calcular duração em minutos
  const calcularDuracao = (inicio: string, fim: string): number => {
    return horaParaMinutos(fim) - horaParaMinutos(inicio);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-4">
            <BookOpen size={14} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Apoio Pedagógico</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-2">Monitores</h1>
          <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
            Escala completa dos monitores. Veja quem está disponível agora, horários de cada plantão e a cobertura ao longo do dia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador de visualização */}
          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
            <button
              onClick={() => setVisualizacao('timeline')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                visualizacao === 'timeline' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"
              )}
            >
              <Calendar size={12} /> Escala
            </button>
            <button
              onClick={() => setVisualizacao('cards')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                visualizacao === 'cards' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"
              )}
            >
              <UserCircle size={12} /> Cards
            </button>
          </div>

          <div className="relative group w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline"
              placeholder="Buscar monitor..."
            />
          </div>
        </div>
      </header>

      {/* ============ VISUALIZAÇÃO TIMELINE ============ */}
      {visualizacao === 'timeline' && (
        <div className="space-y-6">
          {/* Legenda */}
          <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-on-surface-variant px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" /> Ativo Agora
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/20" /> Plantão Programado
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-surface-container-high" /> Inativo
            </div>
          </div>

          {/* Escala Timeline */}
          <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-hidden">
            {/* Cabeçalho com horas */}
            <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-surface-container-low">
              <div className="flex">
                <div className="w-56 shrink-0 p-4 border-r border-surface-container-low">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Monitor / Matéria</p>
                </div>
                <div className="flex-1 relative">
                  <div className="flex">
                    {HORAS_ESCALA.map((hora, i) => (
                      <div
                        key={hora}
                        className="flex-1 text-center py-4 text-[9px] font-mono font-black text-on-surface-variant uppercase tracking-widest border-l border-surface-container-low/50 relative"
                      >
                        {hora}
                      </div>
                    ))}
                  </div>
                  {/* Linha do horário atual */}
                  {minutosAgora >= ESCALA_INICIO && minutosAgora <= ESCALA_FIM && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: `${((minutosAgora - ESCALA_INICIO) / ESCALA_TOTAL) * 100}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linhas dos monitores */}
            {monitoresFiltrados.map((monitor) => {
              const ativo = estaAtivoAgora(monitor.horarioInicio, monitor.horarioFim) && monitor.status === 'ativo';
              const minInicio = horaParaMinutos(monitor.horarioInicio);
              const minFim = horaParaMinutos(monitor.horarioFim);
              const leftPct = Math.max(0, ((minInicio - ESCALA_INICIO) / ESCALA_TOTAL) * 100);
              const widthPct = Math.min(100 - leftPct, ((minFim - minInicio) / ESCALA_TOTAL) * 100);
              const duracao = calcularDuracao(monitor.horarioInicio, monitor.horarioFim);
              const selecionado = monitorSelecionado?.id === monitor.id;

              return (
                <div
                  key={monitor.id}
                  onClick={() => setMonitorSelecionado(selecionado ? null : monitor)}
                  className={cn(
                    "flex border-b border-surface-container-low/50 cursor-pointer transition-all hover:bg-primary/5",
                    selecionado && "bg-primary/5",
                    ativo && "bg-emerald-500/5"
                  )}
                >
                  {/* Info do monitor */}
                  <div className="w-56 shrink-0 p-4 border-r border-surface-container-low flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors shrink-0",
                      ativo ? "bg-emerald-500/10 text-emerald-600" : monitor.status === 'inativo' ? "bg-surface-container-high text-on-surface-variant/50" : "bg-primary/10 text-primary"
                    )}>
                      {monitor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-black truncate", monitor.status === 'inativo' ? "text-on-surface-variant/50" : "text-on-surface")}>{monitor.nome}</p>
                      <p className="text-[9px] text-on-surface-variant font-bold truncate">{monitor.materia}</p>
                    </div>
                  </div>

                  {/* Barra de horário */}
                  <div className="flex-1 relative p-2 flex items-center">
                    {monitor.status === 'ativo' ? (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${widthPct}%`, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={cn(
                          "absolute h-10 rounded-xl flex items-center px-4 gap-2 shadow-sm overflow-hidden",
                          ativo
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-primary/15 text-primary"
                        )}
                        style={{ left: `${leftPct}%` }}
                      >
                        <Clock size={11} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                          {monitor.horarioInicio} — {monitor.horarioFim}
                        </span>
                        <span className="text-[8px] font-bold opacity-70 whitespace-nowrap">({Math.floor(duracao / 60)}h{duracao % 60 > 0 ? `${duracao % 60}min` : ''})</span>
                      </motion.div>
                    ) : (
                      <div
                        className="absolute h-10 rounded-xl bg-surface-container-high/50 flex items-center px-4 gap-2"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <span className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest whitespace-nowrap">Inativo</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Painel de detalhes do monitor selecionado */}
          {monitorSelecionado && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow p-8"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black",
                  monitorSelecionado.status === 'ativo' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-high text-on-surface-variant"
                )}>
                  {monitorSelecionado.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface mb-1">{monitorSelecionado.nome}</h3>
                  <p className="text-on-surface-variant font-bold">{monitorSelecionado.materia}</p>
                </div>
                {estaAtivoAgora(monitorSelecionado.horarioInicio, monitorSelecionado.horarioFim) && monitorSelecionado.status === 'ativo' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 ml-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Em Plantão Agora</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-primary" />
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Início do Plantão</p>
                  </div>
                  <p className="text-2xl font-black text-on-surface">{monitorSelecionado.horarioInicio}</p>
                </div>

                <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-red-500" />
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Fim do Plantão</p>
                  </div>
                  <p className="text-2xl font-black text-on-surface">{monitorSelecionado.horarioFim}</p>
                </div>

                <div className="bg-tertiary-container/5 p-5 rounded-2xl border border-tertiary-container/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-tertiary-container" />
                    <p className="text-[9px] font-black text-tertiary-container uppercase tracking-widest">Duração</p>
                  </div>
                  <p className="text-2xl font-black text-on-surface">
                    {(() => {
                      const d = calcularDuracao(monitorSelecionado.horarioInicio, monitorSelecionado.horarioFim);
                      return `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}min` : ''}`;
                    })()}
                  </p>
                </div>

                <div className="bg-surface-container-low p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-on-surface-variant" />
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Turno</p>
                  </div>
                  <p className="text-2xl font-black text-on-surface capitalize">{monitorSelecionado.turno === 'manha' ? 'Manhã' : monitorSelecionado.turno === 'tarde' ? 'Tarde' : 'Noite'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ============ VISUALIZAÇÃO CARDS ============ */}
      {visualizacao === 'cards' && (
        <section className="space-y-10">
          {(['manha', 'tarde', 'noite'] as const).map((turno) => {
            const monitoresTurno = monitoresFiltrados.filter(m => m.turno === turno);
            if (monitoresTurno.length === 0 && busca) return null;

            return (
              <div key={turno} className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-8 rounded-full",
                    turno === 'manha' ? "bg-tertiary-container" :
                    turno === 'tarde' ? "bg-primary" : "bg-on-surface-variant/30"
                  )} />
                  <h2 className="text-2xl font-black tracking-tight text-on-surface">
                    {turno === 'manha' ? 'Período da Manhã' : turno === 'tarde' ? 'Período da Tarde' : 'Período da Noite'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {monitoresTurno.map(monitor => {
                    const ativo = estaAtivoAgora(monitor.horarioInicio, monitor.horarioFim) && monitor.status === 'ativo';
                    const duracao = calcularDuracao(monitor.horarioInicio, monitor.horarioFim);

                    return (
                      <div key={monitor.id} className={cn(
                        "bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow transition-all hover:translate-y-[-2px] relative overflow-hidden border-2",
                        ativo ? "border-emerald-500/20" : "border-transparent"
                      )}>
                        {ativo && (
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Ativo Agora</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                            ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary-container/10 text-primary"
                          )}>
                            <UserCircle size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-lg leading-tight">{monitor.nome}</h4>
                            <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">{monitor.materia}</p>
                          </div>
                        </div>

                        {/* Detalhes do horário */}
                        <div className="space-y-3 pt-5 border-t border-surface-container-low">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-500/5 p-3 rounded-xl">
                              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Início</p>
                              <p className="text-sm font-black text-on-surface">{monitor.horarioInicio}</p>
                            </div>
                            <div className="bg-red-500/5 p-3 rounded-xl">
                              <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-0.5">Término</p>
                              <p className="text-sm font-black text-on-surface">{monitor.horarioFim}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-on-surface">
                              <Clock size={14} className="text-primary" />
                              <span className="text-xs font-black">
                                {Math.floor(duracao / 60)}h{duracao % 60 > 0 ? `${duracao % 60}min` : ''} de plantão
                              </span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                              monitor.status === 'ativo' ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                            )}>
                              {monitor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          {/* Mini barra de progresso do plantão */}
                          <div className="bg-surface-container-low rounded-full h-2 overflow-hidden">
                            {(() => {
                              const minInicio = horaParaMinutos(monitor.horarioInicio);
                              const minFim = horaParaMinutos(monitor.horarioFim);
                              const progresso = ativo
                                ? Math.min(100, ((minutosAgora - minInicio) / (minFim - minInicio)) * 100)
                                : minutosAgora > minFim ? 100 : 0;
                              return (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progresso}%` }}
                                  className={cn("h-full rounded-full", ativo ? "bg-emerald-500" : "bg-primary/30")}
                                />
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {monitoresTurno.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-outline-variant/30 rounded-3xl p-12 text-center">
                      <p className="text-on-surface-variant font-black text-xs uppercase tracking-widest">Sem monitores para este turno</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </motion.div>
  );
}
