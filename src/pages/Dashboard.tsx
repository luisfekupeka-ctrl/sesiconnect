import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Users, DoorOpen, Zap, LayoutGrid, ChevronLeft, ChevronRight, Activity, Coffee, Utensils, Moon, Sun, BookOpen, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterRotuloPeriodo, obterCorPeriodo, obterBlocosDeHorario } from '../services/motorEscolar';

const TAMANHO_PAGINA = 8;

export default function Dashboard() {
  const { estadoEscola, horaAtual, salas, professores, atividadesAfter, monitores } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [relogioTexto, setRelogioTexto] = useState('');

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const atualizarRelogio = () => {
      const agora = new Date();
      setRelogioTexto(
        `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`
      );
    };
    atualizarRelogio();
    const intervalo = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const salasOcupadas = estadoEscola.salas.filter(s => s.estaOcupada);
  const totalOcupadas = salasOcupadas.length;
  const profsEmAula = professores.filter(p => p.status === 'em_aula').length;
  const monitoresAtivos = monitores.filter(m => m.status === 'ativo').length;

  // Paginação
  const totalPaginas = Math.ceil(salasOcupadas.length / TAMANHO_PAGINA);
  const salasExibidas = salasOcupadas.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const iconesPeriodo: Record<string, any> = {
    aula: Sun,
    intervalo: Coffee,
    almoco: Utensils,
    after: Activity,
    fora: Moon,
  };
  const IconePeriodo = iconesPeriodo[estadoEscola.periodo] || Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* === Faixa de Status Global === */}
      <section className="relative overflow-hidden rounded-[3rem] p-8 md:p-10" style={{ background: `linear-gradient(135deg, ${obterCorPeriodo(estadoEscola.periodo)}22, ${obterCorPeriodo(estadoEscola.periodo)}08)` }}>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: obterCorPeriodo(estadoEscola.periodo) }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg" style={{ background: obterCorPeriodo(estadoEscola.periodo) }}>
              <IconePeriodo size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface leading-none mb-1">
                {obterRotuloPeriodo(estadoEscola.periodo)}
              </h1>
              <p className="text-on-surface-variant font-bold text-sm">
                {estadoEscola.blocoAtual
                  ? `${estadoEscola.blocoAtual.indice}ª aula • ${estadoEscola.blocoAtual.inicio} — ${estadoEscola.blocoAtual.fim}`
                  : estadoEscola.periodo === 'after' ? 'Atividades extracurriculares' : 'Aguardando início'
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Relógio ao vivo */}
            <div className="bg-on-surface text-surface px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
              <Clock size={18} />
              <span className="font-mono text-xl font-black tracking-tight">{relogioTexto}</span>
            </div>

            {/* Próxima transição */}
            {estadoEscola.proximaTransicao !== '--:--' && (
              <div className="bg-surface-container-lowest px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-outline-variant/10">
                <Zap size={16} className="text-primary animate-pulse" />
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Próx. Transição</p>
                  <p className="text-sm font-black text-on-surface">{estadoEscola.proximaTransicao} <span className="text-on-surface-variant font-bold">• {estadoEscola.rotuloProximaTransicao}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === Métricas Rápidas === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { rotulo: 'Salas Ocupadas', valor: `${totalOcupadas}/31`, icone: DoorOpen, cor: 'primary' },
          { rotulo: 'Professores em Aula', valor: profsEmAula.toString(), icone: Users, cor: 'tertiary-container' },
          { rotulo: 'Monitores Ativos', valor: monitoresAtivos.toString(), icone: BookOpen, cor: 'primary' },
          { rotulo: 'Atividades After', valor: atividadesAfter.length.toString(), icone: Activity, cor: 'tertiary-container' },
        ].map((metrica, i) => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-2xl editorial-shadow flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-${metrica.cor}/10 flex items-center justify-center text-${metrica.cor}`}>
              <metrica.icone size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">{metrica.rotulo}</p>
              <p className={`text-lg font-black text-${metrica.cor}`}>{metrica.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* === Mapa de 31 Salas === */}
      <div className="bg-surface-container-low/50 p-6 rounded-[2.5rem] border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
            <LayoutGrid size={14} />
            Mapa de Ocupação (31 Salas)
          </h3>
          <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-tighter">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary/20" /> Livre</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> Ocupada</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {estadoEscola.salas.map((sala) => (
            <button
              key={sala.numeroSala}
              title={`Sala ${sala.numeroSala.toString().padStart(2, '0')}: ${sala.estaOcupada ? `${sala.materiaAtual} — ${sala.professorAtual}` : 'Livre'}`}
              className={cn(
                "w-8 h-8 rounded-lg transition-all hover:scale-125 hover:shadow-lg active:scale-95 text-[9px] font-black",
                sala.estaOcupada
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-primary/10 text-primary/40 hover:bg-primary hover:text-white"
              )}
            >
              {sala.numeroSala}
            </button>
          ))}
        </div>
      </div>

      {/* === Conteúdo Principal === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Feed de Salas Ocupadas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <DoorOpen size={20} className="text-primary" />
              Salas em Atividade
              <span className="text-[10px] px-3 py-1 bg-primary/10 text-primary rounded-full font-black">{totalOcupadas}</span>
            </h2>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPaginas)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaAtual(i + 1)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                      paginaAtual === i + 1 ? "bg-primary text-white" : "text-on-surface-variant/40 hover:text-on-surface-variant"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={paginaAtual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              {salasExibidas.length > 0 ? salasExibidas.map(sala => (
                <div
                  key={sala.numeroSala}
                  className="bg-surface-container-lowest p-7 rounded-[2.5rem] editorial-shadow relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-primary/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <DoorOpen size={22} />
                      </div>
                      <div>
                        <span className="text-2xl font-black tracking-tighter text-on-surface">{sala.numeroSala.toString().padStart(2, '0')}</span>
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                          {salas.find(s => s.numero === sala.numeroSala)?.segmento}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Término</p>
                      <div className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-black text-on-surface flex items-center gap-1.5">
                        <Clock size={11} className="text-primary" /> {sala.horarioFim}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-surface-container-low">
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Disciplina</p>
                      <h3 className="text-lg font-black group-hover:text-primary transition-colors leading-tight">{sala.materiaAtual}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <Users size={12} />
                      </div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tight">{sala.professorAtual}</span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-surface-container-high text-[8px] font-black rounded-lg uppercase tracking-widest text-on-surface-variant">
                      {sala.turmaAtual}
                    </span>
                  </div>

                  <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                </div>
              )) : (
                <div className="sm:col-span-2 bg-surface-container-low/50 p-16 rounded-[3rem] text-center">
                  <DoorOpen size={40} className="mx-auto text-on-surface-variant/30 mb-4" />
                  <p className="text-on-surface-variant font-black text-sm">
                    {estadoEscola.periodo === 'intervalo' ? 'Intervalo em andamento — salas liberadas' :
                     estadoEscola.periodo === 'almoco' ? 'Horário de almoço — salas liberadas' :
                     estadoEscola.periodo === 'after' ? 'After School — verifique as atividades' :
                     'Nenhuma sala ocupada no momento'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Barra Lateral */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Professores ativos */}
          <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 editorial-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                <Users size={20} />
              </div>
              <h3 className="font-black text-lg tracking-tight text-on-surface">Professores</h3>
              <span className="text-[9px] px-2 py-1 bg-tertiary-container/10 text-tertiary-container rounded-lg font-black">{profsEmAula} em aula</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {professores.filter(p => p.status === 'em_aula').slice(0, 6).map(prof => (
                <div key={prof.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container text-[10px] font-black">
                    {prof.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-on-surface truncate">{prof.nome}</p>
                    <p className="text-[9px] text-on-surface-variant font-bold truncate">{prof.salaAtual} • {prof.materia}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitores */}
          <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 editorial-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen size={20} />
              </div>
              <h3 className="font-black text-lg tracking-tight text-on-surface">Monitores</h3>
            </div>
            <div className="space-y-3">
              {monitores.filter(m => m.status === 'ativo').map(monitor => (
                <div key={monitor.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                  <div>
                    <p className="text-xs font-black text-on-surface">{monitor.nome}</p>
                    <p className="text-[9px] text-on-surface-variant font-bold">{monitor.materia}</p>
                  </div>
                  <div className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {monitor.horarioInicio} - {monitor.horarioFim}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card informativo */}
          <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <Clock size={36} className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Próxima Transição</p>
                <p className="text-4xl font-black tracking-tighter">{estadoEscola.proximaTransicao}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl w-fit">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{estadoEscola.rotuloProximaTransicao}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
