import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoorOpen, Clock, Users, GraduationCap, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala, EntradaGradeSala } from '../types';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, horaAtual } = useEscola();
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'livres' | 'ocupadas'>('todas');
  const [filtroSegmento, setFiltroSegmento] = useState<string>('todos');
  const [salaExpandida, setSalaExpandida] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));

  const blocos = obterBlocosDeHorario();

  const salasFiltradas = salas.filter(sala => {
    const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
    const ocupada = estadoSala?.estaOcupada || false;

    if (filtroStatus === 'livres' && ocupada) return false;
    if (filtroStatus === 'ocupadas' && !ocupada) return false;
    if (filtroSegmento !== 'todos' && sala.segmento !== filtroSegmento) return false;
    if (busca && !sala.nome.toLowerCase().includes(busca.toLowerCase()) && !sala.numero.toString().includes(busca)) return false;

    return true;
  });

  const obterGradeSalaDia = (numeroSala: number, dia: number): EntradaGradeSala[] => {
    return gradeCompleta
      .filter(e => e.numeroSala === numeroSala && e.diaSemana === dia)
      .sort((a, b) => a.indiceBlocoHorario - b.indiceBlocoHorario);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Cabeçalho */}
      <header className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">Salas</h1>
            <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
              Base principal do sistema. Grade completa de horários por sala com blocos de 45 minutos.
            </p>
          </div>

          {/* Busca */}
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar sala..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm placeholder:text-outline"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
            {(['todas', 'livres', 'ocupadas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filtroStatus === f ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {f === 'todas' ? 'Todas' : f === 'livres' ? 'Livres' : 'Ocupadas'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
            {['todos', 'Fundamental', 'Médio'].map(seg => (
              <button
                key={seg}
                onClick={() => setFiltroSegmento(seg)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                  filtroSegmento === seg ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <GraduationCap size={12} />
                {seg === 'todos' ? 'Todos' : seg}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid de Salas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {salasFiltradas.map((sala) => {
            const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
            const ocupada = estadoSala?.estaOcupada || false;
            const expandida = salaExpandida === sala.numero;

            return (
              <motion.div
                layout
                key={sala.numero}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest rounded-[2rem] editorial-shadow overflow-hidden border border-transparent hover:border-primary/10 transition-all"
              >
                {/* Cabeçalho do card */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tighter text-primary">{sala.numero.toString().padStart(2, '0')}</span>
                      <span className="text-[10px] font-black text-outline uppercase">{sala.ano}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      ocupada ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {ocupada ? 'Ocupada' : 'Livre'}
                    </div>
                  </div>

                  <h4 className="font-black text-lg tracking-tight text-on-surface mb-1 leading-tight">{sala.nome}</h4>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">{sala.andar} • {sala.segmento}</p>

                  {/* Aula atual */}
                  {ocupada && estadoSala && (
                    <div className="bg-primary/5 p-4 rounded-xl space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Aula Atual</span>
                      </div>
                      <p className="text-sm font-black text-on-surface">{estadoSala.materiaAtual}</p>
                      <div className="flex items-center gap-2">
                        <Users size={11} className="text-on-surface-variant" />
                        <span className="text-[10px] font-bold text-on-surface-variant">{estadoSala.professorAtual}</span>
                      </div>
                      <span className="text-[9px] font-bold text-on-surface-variant">{estadoSala.turmaAtual} • até {estadoSala.horarioFim}</span>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSalaExpandida(expandida ? null : sala.numero)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Grade
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-4 py-3 bg-tertiary-container/10 text-tertiary-container rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-tertiary-container/20 transition-colors">
                      <AlertTriangle size={12} />
                      Atraso
                    </button>
                  </div>
                </div>

                {/* Grade expandida */}
                <AnimatePresence>
                  {expandida && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2">
                        {/* Seletor de dia */}
                        <div className="flex gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map(dia => (
                            <button
                              key={dia}
                              onClick={() => setDiaGrade(dia)}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                diaGrade === dia ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                              )}
                            >
                              {DIAS_SEMANA[dia]}
                            </button>
                          ))}
                        </div>

                        {/* Blocos do dia */}
                        <div className="space-y-1.5">
                          {blocos.map(bloco => {
                            const entrada = obterGradeSalaDia(sala.numero, diaGrade)
                              .find(e => e.indiceBlocoHorario === bloco.indice);

                            return (
                              <div key={bloco.indice} className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg text-[10px]",
                                estadoEscola.indiceBlocoAtual === bloco.indice && diaGrade === obterDiaSemana(horaAtual)
                                  ? "bg-primary text-white"
                                  : "bg-surface-container-low/50"
                              )}>
                                <span className="w-12 font-mono font-black text-[9px] shrink-0">{bloco.inicio}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black truncate">{entrada?.materia || '—'}</p>
                                  <p className="opacity-70 text-[9px] truncate">{entrada?.nomeProfessor || ''}</p>
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
    </motion.div>
  );
}
