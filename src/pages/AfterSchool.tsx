import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Clock, Users, Calendar, ChevronDown, ChevronUp, User, DoorOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { AtividadeAfter } from '../types';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export default function AfterSchool() {
  const { atividadesAfter, estadoEscola } = useEscola();
  const [diaFiltro, setDiaFiltro] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [atividadeAberta, setAtividadeAberta] = useState<string | null>(null);

  const categorias = [...new Set(atividadesAfter.map(a => a.categoria))];

  const atividades = atividadesAfter.filter(a => {
    if (diaFiltro && !a.dias.includes(diaFiltro)) return false;
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false;
    return true;
  });

  const toggleAtividade = (id: string) => {
    setAtividadeAberta(prev => prev === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <header className="relative">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-container/10 text-tertiary-container rounded-full mb-4">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Atividades Extracurriculares</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-2">After School</h1>
          <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
            Atividades após o período regular (15:35+). Clique em uma atividade para ver ensalamento, horários e professor responsável.
          </p>

          {estadoEscola.periodo === 'after' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Período After Ativo Agora</span>
            </div>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1">
          <button
            onClick={() => setDiaFiltro(null)}
            className={cn(
              "flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              !diaFiltro ? "bg-primary text-on-surface-bright" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Todos os dias
          </button>
          {DIAS.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaFiltro(diaFiltro === dia ? null : dia)}
              className={cn(
                "flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                diaFiltro === dia ? "bg-primary text-on-surface-bright" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {dia}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(categoriaFiltro === cat ? null : cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                categoriaFiltro === cat
                  ? "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"
                  : "bg-surface-container-low text-on-surface-variant border-transparent hover:border-outline-variant/20"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Atividades */}
      <div className="space-y-5">
        {atividades.map((atividade) => {
          const expandida = atividadeAberta === atividade.id;

          return (
            <motion.div
              key={atividade.id}
              layout
              className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl border border-primary/5 hover:border-primary/15 transition-all overflow-hidden"
            >
              {/* Cartão principal — clicável */}
              <div
                onClick={() => toggleAtividade(atividade.id)}
                className="p-8 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />

                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                  <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-surface-bright transition-all duration-500 shadow-inner shrink-0">
                    <Sparkles size={28} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 block">{atividade.categoria}</span>
                        <h3 className="text-xl font-black tracking-tight text-on-surface group-hover:text-primary transition-colors">{atividade.nome}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {atividade.vagas && (
                          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded-xl uppercase tracking-widest border border-emerald-500/10">
                            {atividade.vagas} Vagas
                          </span>
                        )}
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                          expandida ? "bg-primary text-on-surface-bright rotate-180" : "bg-surface-container-low text-on-surface-variant"
                        )}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <p className="text-on-surface-variant font-bold text-sm leading-relaxed max-w-xl opacity-80">{atividade.descricao}</p>

                    {/* Badges rápidos */}
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-container-low">
                      <div className="flex items-center gap-2 bg-surface-container-low pr-4 pl-2 py-1.5 rounded-xl border border-primary/5">
                        <div className="p-1.5 bg-surface-container-low rounded-lg"><Clock size={12} className="text-primary" /></div>
                        <span className="text-xs font-black text-on-surface">{atividade.horarioInicio} — {atividade.horarioFim}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-low pr-4 pl-2 py-1.5 rounded-xl border border-primary/5">
                        <div className="p-1.5 bg-surface-container-low rounded-lg"><DoorOpen size={12} className="text-primary" /></div>
                        <span className="text-xs font-black text-on-surface">{atividade.local}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-xl">
                        <User size={12} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-tight">{atividade.nomeProfessor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Painel Expandido */}
              <AnimatePresence>
                {expandida && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 pt-2 space-y-6">
                      {/* Divisor */}
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                      {/* Grid de detalhes */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <DoorOpen size={16} className="text-primary" />
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ensalamento</p>
                          </div>
                          <p className="text-lg font-black text-on-surface">{atividade.local}</p>
                        </div>

                        <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-emerald-600" />
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Início</p>
                          </div>
                          <p className="text-lg font-black text-on-surface">{atividade.horarioInicio}</p>
                        </div>

                        <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-red-500" />
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Término</p>
                          </div>
                          <p className="text-lg font-black text-on-surface">{atividade.horarioFim}</p>
                        </div>

                        <div className="bg-tertiary-container/5 p-5 rounded-2xl border border-tertiary-container/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-tertiary-container" />
                            <p className="text-[9px] font-black text-tertiary-container uppercase tracking-widest">Alunos</p>
                          </div>
                          <p className="text-lg font-black text-on-surface">{atividade.quantidadeAlunos}</p>
                        </div>
                      </div>

                      {/* Professor responsável */}
                      <div className="bg-surface-container-low/50 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-on-surface-bright flex items-center justify-center text-lg font-black shadow-lg shadow-primary/20">
                          {atividade.nomeProfessor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Professor Responsável</p>
                          <p className="text-lg font-black text-on-surface">{atividade.nomeProfessor}</p>
                        </div>
                      </div>

                      {/* Dias da semana */}
                      <div>
                        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Calendar size={12} />
                          Dias de Funcionamento
                        </p>
                        <div className="flex gap-2">
                          {DIAS.map(dia => {
                            const ativo = atividade.dias.includes(dia);
                            return (
                              <div key={dia} className={cn(
                                "flex-1 py-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all",
                                ativo
                                  ? "bg-primary text-on-surface-bright shadow-sm shadow-primary/20"
                                  : "bg-surface-container-low text-on-surface-variant/30"
                              )}>
                                {dia.slice(0, 3)}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Barra visual de horário */}
                      <div>
                        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Clock size={12} />
                          Linha do Tempo
                        </p>
                        <div className="bg-surface-container-low rounded-2xl p-4 relative">
                          {/* Escala de 15:00 a 18:00 */}
                          <div className="flex justify-between text-[8px] font-mono font-bold text-on-surface-variant mb-2 px-1">
                            {['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(h => (
                              <span key={h}>{h}</span>
                            ))}
                          </div>
                          <div className="relative h-10 bg-surface-container-high rounded-xl overflow-hidden">
                            {(() => {
                              const [hi, mi] = atividade.horarioInicio.split(':').map(Number);
                              const [hf, mf] = atividade.horarioFim.split(':').map(Number);
                              const inicioMin = hi * 60 + mi;
                              const fimMin = hf * 60 + mf;
                              const escalaInicio = 15 * 60; // 15:00
                              const escalaFim = 18 * 60;    // 18:00
                              const totalEscala = escalaFim - escalaInicio;

                              const leftPct = Math.max(0, ((inicioMin - escalaInicio) / totalEscala) * 100);
                              const widthPct = Math.min(100 - leftPct, ((fimMin - inicioMin) / totalEscala) * 100);

                              return (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${widthPct}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="absolute top-0 h-full bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                                  style={{ left: `${leftPct}%` }}
                                >
                                  <span className="text-[9px] font-black text-on-surface-bright uppercase tracking-widest">
                                    {atividade.horarioInicio} — {atividade.horarioFim}
                                  </span>
                                </motion.div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Lista de alunos */}
                      {atividade.listaAlunos.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Users size={12} />
                            Alunos Matriculados ({atividade.listaAlunos.length})
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {atividade.listaAlunos.map((aluno, i) => (
                              <div key={i} className="flex items-center gap-2.5 p-3 bg-surface-container-low/50 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                                  {aluno.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="text-xs font-bold text-on-surface truncate">{aluno}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {atividades.length === 0 && (
          <div className="bg-surface-container-low/30 p-16 rounded-[3rem] text-center border-2 border-dashed border-outline-variant/20">
            <Sparkles size={40} className="mx-auto text-on-surface-variant/20 mb-4" />
            <p className="text-on-surface-variant font-black text-sm">Nenhuma atividade encontrada para este filtro</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
