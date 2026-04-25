import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Clock, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Professor, EntradaGradeSala } from '../types';

const OPCOES_DIAS = [
  { label: 'Seg', valor: 'SEGUNDA' },
  { label: 'Ter', valor: 'TERÇA' },
  { label: 'Qua', valor: 'QUARTA' },
  { label: 'Qui', valor: 'QUINTA' },
  { label: 'Sex', valor: 'SEXTA' },
];

export default function TeachersPage() {
  const { professores, horaAtual, estadoEscola, gradeCompleta, periodos } = useEscola();
  const [busca, setBusca] = useState('');
  const [profSelecionado, setProfSelecionado] = useState<Professor | null>(null);
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));

  const blocos = useMemo(() => obterBlocosDeHorario(periodos || []), [periodos]);

  const profsFiltrados = useMemo(() => (professores || []).filter(p => {
    const n = p.nome?.toLowerCase() || '';
    const mat = p.materia?.toLowerCase() || '';
    const b = busca.toLowerCase();
    return n.includes(b) || mat.includes(b);
  }), [professores, busca]);

  const obterAgendaDia = useCallback((nome: string, dia: string): EntradaGradeSala[] => {
    return gradeCompleta
      .filter(e => e.nomeProfessor === nome && e.diaSemana === dia)
      .sort((a, b) => a.horario.localeCompare(b.horario));
  }, [gradeCompleta]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <header>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">Professores</h1>
        <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
          Dados derivados automaticamente das salas. Veja onde cada professor está agora, suas próximas aulas e a agenda completa.
        </p>
      </header>

      {/* Busca */}
      <section className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou matéria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-3xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg placeholder:text-outline"
          />
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-surface-container-low rounded-3xl text-on-surface-variant">
          <Users size={18} />
          <span className="font-black text-sm">{profsFiltrados.length} professores</span>
        </div>
      </section>

      {/* Dois Painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Lista de Professores */}
        <div className="lg:col-span-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide pr-2">
          {profsFiltrados.map(prof => {
            const selecionado = profSelecionado?.id === prof.id;
            return (
              <div
                key={prof.id}
                onClick={() => setProfSelecionado(prof)}
                className={cn(
                  "bg-surface-container-lowest p-6 rounded-[2rem] editorial-shadow cursor-pointer transition-all duration-300 border-2",
                  selecionado
                    ? "border-primary shadow-lg shadow-primary/10 scale-[1.01]"
                    : "border-transparent hover:border-primary/10 hover:translate-y-[-2px]"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-500",
                    selecionado
                      ? "bg-primary text-on-surface-bright"
                      : "bg-secondary-container/10 text-primary"
                  )}>
                    {(prof.nome || 'P').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-on-surface truncate">{prof.nome}</h3>
                    <p className="text-on-surface-variant font-medium text-sm truncate">{prof.materia}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                    prof.status === 'em_aula' ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    {prof.status === 'em_aula' ? 'Em Aula' : 'Disponível'}
                  </span>
                </div>

                <div className="pt-4 border-t border-surface-container-low flex flex-wrap gap-4">
                  {prof.salaAtual && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" strokeWidth={3} />
                      <span className="text-xs font-black text-on-surface">{prof.salaAtual}</span>
                    </div>
                  )}
                  {prof.horarioProximaAula && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-outline" />
                      <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                        Próx: {prof.horarioProximaAula} • {prof.proximaAula}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel de Detalhes */}
        <div className="lg:col-span-7">
          {profSelecionado ? (
            <motion.div
              key={profSelecionado.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-hidden sticky top-24"
            >
              {/* Header */}
              <div className="p-8 bg-primary text-on-surface-bright relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-surface-container-low/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-low/20 flex items-center justify-center text-2xl font-black">
                    {(profSelecionado.nome || 'P').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{profSelecionado.nome}</h2>
                    <p className="text-on-surface-bright/70 font-bold">{profSelecionado.materia}</p>
                  </div>
                </div>
                {profSelecionado.salaAtual && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface-container-low/10 rounded-xl w-fit">
                    <MapPin size={14} />
                    <span className="text-sm font-black">{profSelecionado.salaAtual} agora</span>
                  </div>
                )}
              </div>

              {/* Seletor de dia */}
              <div className="px-8 pt-6 flex gap-2">
                {OPCOES_DIAS.map(dia => (
                  <button
                    key={dia.valor}
                    onClick={() => setDiaGrade(dia.valor)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      diaGrade === dia.valor ? "bg-primary text-on-surface-bright shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    {dia.label}
                  </button>
                ))}
              </d
              {/* Agenda */}
              <div classNamee= `${bloco.inicio} - ${bloco.fim}`;
              const entrada = obterAgendaDia(profSelecionado.nome, diaGrade)
                    .find(e => e.horario === range);
              const ativo = estadoEscola.indiceBlocoAtual === bloco.indice && diaGrade === obterDiaSemana(hor
              return (
              <div key={bloco.indice} className={cn(
                ary text - on - surface - bright shadow - lg" : "bg - surface - container - low / 50 hover:bg-surface-container-low"
                    )}>
              <div className={cn(
                "w-16 py-1.5 rounded-lg text-center shrink-0",
                ativo ? "bg-surface-container-low/20" : "bg-surface-container-low border border-surface-container-low"
              )}>
                <Clock size={10} className={cn("mx-auto mb-0.5", ativo ? "text-on-surface-bright" : "text-primary")} />
                <span className="text-[9px] font-mono font-black">{bloco.inicio}</span>
              </div>
              <div className="flex-1 min-w-0">
                {entrada ? (
                  <>
                    <p className="text-sm font-black truncate">{entrada.materia}</p>
                    <p className={cn("text-[10px] font-bold truncate", ativo ? "text-on-surface-bright/70" : "text-on-surface-variant")}>
                      Sala {entrada.numeroSala.toString().padStart(2, '0')} • {entrada.turma}
                    </p>
                  </>
                ) : (
                  <p className={cn("text-sm font-bold", ativo ? "text-on-surface-bright/60" : "text-on-surface-variant/40")}>—</p>
                )}
              </div>
            </div>
          );
                })}
        </div>
    </motion.div>
  ) : (
    <div className="bg-surface-container-low/30 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-outline-variant/20">
      <Users size={48} className="mx-auto text-on-surface-variant/20 mb-4" />
      <p className="text-on-surface-variant font-black text-sm">Selecione um professor para ver a agenda completa</p>
    </div>
  )
}
        </div >
      </div >
    </motion.div >
  );
}
