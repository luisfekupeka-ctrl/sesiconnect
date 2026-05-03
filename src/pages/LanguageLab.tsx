import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, GraduationCap, MapPin, Clock, Users, Search, ChevronDown, User, CheckCircle2 } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<string | null>(null);
  const [buscaAlunos, setBuscaAlunos] = useState('');

  // Agrupar labs por nível para uma visão mais organizada
  const labsAgrupados = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    languageLab.forEach(lab => {
      if (!grupos[lab.nivel]) grupos[lab.nivel] = [];
      grupos[lab.nivel].push(lab);
    });
    return grupos;
  }, [languageLab]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-32"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full mb-4 border border-indigo-500/20 shadow-sm">
            <Languages size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Ensino de Idiomas</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white mb-4 italic">Language <span className="text-indigo-500">Lab</span></h1>
          <p className="text-on-surface-variant text-xl font-medium leading-relaxed italic opacity-80">
            Ensalamento especial por níveis de proficiência. Substitui a lógica das salas durante o horário de inglês.
          </p>
        </div>
      </header>

      {/* Cards de Níveis Estilo Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
        {languageLab.map((lab) => {
          const selecionado = labSelecionado === lab.id;
          return (
            <motion.div
              layout
              key={lab.id}
              onClick={() => setLabSelecionado(selecionado ? null : lab.id)}
              className={cn(
                "bg-[#0d1117] p-10 rounded-[3rem] shadow-2xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                selecionado ? "border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.2)]" : "border-[#30363d] hover:border-indigo-500/30"
              )}
            >
              {/* Badge Horário Flutuante */}
              <div className="absolute top-10 right-10 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                 <Clock size={12} className="text-indigo-500" />
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">{lab.horarioInicio} - {lab.horarioFim}</span>
              </div>

              <div className="flex flex-col gap-8">
                 <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <GraduationCap size={32} />
                 </div>

                 <div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none mb-3 group-hover:text-indigo-400 transition-colors">{lab.nivel}</h3>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                       Misto {lab.turma.split(' ')[0]}
                    </span>
                 </div>

                 <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div>
                       <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest mb-1 flex items-center gap-1 opacity-40">
                          <MapPin size={10} /> Local
                       </p>
                       <p className="text-sm font-black text-white italic">{lab.sala}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest mb-1 flex items-center gap-1 opacity-40">
                          <Users size={10} /> Docente
                       </p>
                       <p className="text-sm font-black text-white italic">{lab.professor}</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between mt-4">
                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border border-emerald-500/20">
                       ● {lab.diaSemana}
                    </div>
                    <ChevronDown className={cn("text-outline transition-transform duration-500", selecionado && "rotate-180 text-indigo-500")} />
                 </div>
              </div>

              {/* LISTA NOMINAL PESQUISÁVEL */}
              <AnimatePresence>
                {selecionado && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-10 pt-10 border-t border-white/10"
                  >
                     <div className="flex items-center justify-between gap-4 mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Consulta de Alunos</h4>
                        <div className="relative group flex-1 max-w-[180px]">
                           <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-indigo-500" />
                           <input 
                              type="text"
                              placeholder="Buscar..."
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setBuscaAlunos(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-2xl text-[10px] font-black focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(lab.listaAlunos || [])
                          .filter(a => a.toLowerCase().includes(buscaAlunos.toLowerCase()))
                          .map((aluno, idx) => (
                          <div key={idx} className="flex items-center gap-5 p-5 bg-surface-container-low/40 rounded-3xl hover:bg-indigo-500/10 transition-all group border border-transparent hover:border-indigo-500/20 shadow-sm">
                             <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[11px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                {idx + 1}
                             </div>
                             <span className="font-black text-base text-on-surface-variant group-hover:text-white transition-colors italic truncate flex-1">{aluno}</span>
                             <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
