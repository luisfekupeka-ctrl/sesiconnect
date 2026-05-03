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
          const alunosNoBloco = lab.listaAlunos || [];
          const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(buscaAlunos.toLowerCase()));
          
          return (
            <motion.div
              layout
              key={lab.id}
              className={cn(
                "bg-[#0d1117] p-10 rounded-[3.5rem] shadow-2xl border-2 transition-all relative overflow-hidden group",
                selecionado ? "border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)]" : "border-[#30363d] hover:border-indigo-500/30"
              )}
            >
              {/* Header do Card */}
              <div className="flex justify-between items-start mb-10 relative z-10">
                 <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-inner">
                    {lab.nivel.charAt(0)}
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
                       <Clock size={12} className="text-indigo-400" />
                       <span className="text-[10px] font-black uppercase text-white tracking-widest">{lab.horarioInicio} - {lab.horarioFim}</span>
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[9px] font-black rounded-lg uppercase tracking-widest">
                       {lab.diaSemana}
                    </span>
                 </div>
              </div>

              <div className="relative z-10 space-y-2 mb-10">
                 <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:text-indigo-400 transition-colors">{lab.nivel}</h3>
                 <div className="flex items-center gap-2 text-indigo-500/60 text-[10px] font-black uppercase tracking-[0.4em] italic">
                    <div className="w-4 h-[2px] bg-indigo-500" /> {lab.turma}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/5 relative z-10">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 flex items-center gap-1">
                       <MapPin size={10} /> Localização
                    </p>
                    <p className="text-base font-black text-white italic">{lab.sala}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 flex items-center gap-1">
                       <User size={10} /> Professor
                    </p>
                    <p className="text-base font-black text-white italic">{lab.professor}</p>
                 </div>
              </div>

              {/* Seção de Ensalamento */}
              <div className="pt-8 border-t border-white/5 space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setLabSelecionado(selecionado ? null : lab.id)}
                      className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Users size={16} /> {alunosNoBloco.length} Alunos Ensalados
                      <ChevronDown size={14} className={cn("transition-transform", selecionado && "rotate-180")} />
                    </button>
                    {selecionado && (
                      <div className="relative group w-32">
                         <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                         <input 
                           type="text" 
                           placeholder="Buscar..."
                           value={buscaAlunos}
                           onChange={(e) => setBuscaAlunos(e.target.value)}
                           className="w-full pl-8 pr-2 py-2 bg-white/5 border-none rounded-xl text-[9px] font-black outline-none focus:ring-2 focus:ring-indigo-500/20"
                         />
                      </div>
                    )}
                 </div>

                 <AnimatePresence>
                    {selecionado && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                         <div className="grid gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                            {alunosFiltrados.map((aluno, i) => (
                               <motion.div 
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 key={i} 
                                 className="text-[12px] font-black py-4 px-6 bg-white/[0.03] rounded-[1.5rem] flex items-center justify-between group/item hover:bg-indigo-500 hover:text-black transition-all border border-white/5"
                               >
                                  <span className="italic tracking-tight">{aluno}</span>
                                  <span className="text-[9px] opacity-30 font-black group-hover/item:opacity-60">#{i+1}</span>
                               </motion.div>
                            ))}
                         </div>
                         
                         <button 
                           onClick={() => alert('Abrindo chamada digital para ' + lab.nivel)}
                           className="w-full py-5 bg-indigo-500 text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl mt-4 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                         >
                            <CheckCircle2 size={18} /> Registrar Chamada
                         </button>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              {/* Decoração de Fundo */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-all" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
