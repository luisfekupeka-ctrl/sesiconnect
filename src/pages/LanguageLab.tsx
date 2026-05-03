import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, MapPin, Clock, Users, Search, ChevronLeft, User, CheckCircle2, BookOpen, Globe, XCircle, ClipboardCheck } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<any | null>(null);
  const [busca, setBusca] = useState('');
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const alternarPresenca = (aluno: string) => {
    setPresencas(prev => ({
      ...prev,
      [aluno]: prev[aluno] === undefined ? true : prev[aluno] === true ? false : true
    }));
  };

  if (labSelecionado) {
    const alunos = labSelecionado.listaAlunos || [];
    const alunosFiltrados = alunos.filter((a: string) => a.toLowerCase().includes(busca.toLowerCase()));

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen pb-32 pt-2 md:pt-10 px-2 md:px-10 space-y-6 md:space-y-10"
      >
        <div className="bg-[#0a0a0a] rounded-[2.5rem] md:rounded-[4.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-8 md:p-12 bg-[#42a0f5] text-black relative">
             <button 
               onClick={() => { setLabSelecionado(null); setPresencas({}); }}
               className="absolute top-6 right-6 md:top-12 md:right-12 w-12 h-12 md:w-16 md:h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all shadow-xl"
             >
               <ChevronLeft size={24} className="md:size-32" />
             </button>

             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-black text-[#42a0f5] rounded-[1.8rem] md:rounded-[3rem] flex items-center justify-center text-4xl md:text-6xl font-black shadow-inner border border-white/5">
                  {labSelecionado.nivel.charAt(0)}
                </div>
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-3">
                     <span className="px-3 py-1 bg-black/10 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-black/5">Level Dashboard</span>
                     <span className="text-black/60 font-black text-xs md:text-sm uppercase italic tracking-widest">{labSelecionado.diaSemana}</span>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black tracking-tighter italic leading-none">{labSelecionado.nivel}</h2>
                  <p className="text-lg md:text-2xl font-bold opacity-70 mt-3 md:mt-4 italic flex items-center justify-center md:justify-start gap-3">
                     <BookOpen size={18} className="md:size-24" /> {labSelecionado.turma}
                  </p>
                </div>
             </div>
          </div>

          <div className="p-6 md:p-12 space-y-10 md:space-y-16 bg-surface-container-lowest">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                <div className="p-6 md:p-10 bg-black rounded-[2rem] md:rounded-[3rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><MapPin size={14} /> Sala Designada</p>
                   <p className="text-2xl md:text-4xl font-black italic text-[#42a0f5]">{labSelecionado.sala}</p>
                </div>
                <div className="p-6 md:p-10 bg-black rounded-[2rem] md:rounded-[3rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><User size={14} /> Professor(a)</p>
                   <p className="text-2xl md:text-4xl font-black italic text-[#42a0f5]">{labSelecionado.professor}</p>
                </div>
                <div className="p-6 md:p-10 bg-black rounded-[2rem] md:rounded-[3rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><Clock size={14} /> Horário</p>
                   <p className="text-2xl md:text-4xl font-black italic text-[#42a0f5]">{labSelecionado.horarioInicio}</p>
                </div>
             </div>

             <div className="space-y-8 md:space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                   <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-4">
                      <Users size={32} className="text-[#42a0f5] md:size-48" /> Chamada Digital
                   </h3>
                   <div className="relative group w-full md:w-96">
                      <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#42a0f5]" />
                      <input 
                       type="text" placeholder="Filtrar alunos..." value={busca} onChange={(e) => setBusca(e.target.value)}
                       className="w-full pl-16 pr-8 py-5 md:py-7 bg-black border border-white/5 rounded-[2rem] md:rounded-[2.5rem] text-sm md:text-base font-black outline-none"
                      />
                   </div>
                </div>

                {/* Grade de Chamada Digital */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   {alunosFiltrados.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-30 italic text-xl border-2 border-dashed border-white/5 rounded-[3rem]">Nenhum aluno encontrado.</div>
                   ) : (
                     alunosFiltrados.map((aluno: string, i: number) => (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={i} 
                         onClick={() => alternarPresenca(aluno)}
                         className={cn(
                           "p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all cursor-pointer group shadow-lg",
                           presencas[aluno] === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                           presencas[aluno] === false ? "bg-red-500/10 border-red-500/30 text-red-500" :
                           "bg-black border-white/5 text-white/70 hover:border-[#42a0f5]/40"
                         )}
                       >
                          <div className="flex items-center gap-5">
                             <span className="text-[10px] font-black opacity-30">#{i+1}</span>
                             <span className="text-lg md:text-xl font-black italic tracking-tight">{aluno}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             {presencas[aluno] === true && <CheckCircle2 size={24} />}
                             {presencas[aluno] === false && <XCircle size={24} />}
                             {presencas[aluno] === undefined && <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-[#42a0f5]/40" />}
                          </div>
                       </motion.div>
                     ))
                   )}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                   <button 
                     onClick={() => {
                        const nova: Record<string, boolean> = {};
                        alunos.forEach((a: string) => nova[a] = true);
                        setPresencas(nova);
                     }}
                     className="flex-1 py-6 bg-black rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40 hover:bg-white/5 border border-white/5 transition-all"
                   >
                      Marcar Todos Presentes
                   </button>
                   <button 
                     onClick={() => alert('Frequência de laboratório salva com sucesso!')}
                     className="flex-[2] py-6 md:py-10 bg-[#42a0f5] text-black rounded-[2.5rem] md:rounded-[3.5rem] text-xs md:text-sm font-black uppercase tracking-[0.4em] shadow-glow-blue hover:scale-[1.01] transition-all flex items-center justify-center gap-4 border border-white/10"
                   >
                      <ClipboardCheck size={24} className="md:size-32" /> Finalizar Registro de Aula
                   </button>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 md:space-y-20 pb-32 px-4">
      <header className="max-w-4xl">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#42a0f5]/10 text-[#42a0f5] rounded-full mb-6 border border-[#42a0f5]/20 shadow-xl">
          <Globe size={20} className="animate-spin-slow" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] italic">Intelligence Lab System</span>
        </div>
        <h1 className="text-5xl md:text-9xl font-black tracking-tighter text-white mb-6 italic leading-none">Language <span className="text-[#42a0f5]">Lab</span></h1>
        <p className="text-white/40 text-lg md:text-3xl font-medium leading-relaxed italic border-l-8 border-[#42a0f5]/20 pl-6 md:pl-12 max-w-3xl">
          Gestão nominal por proficiência. Selecione o nível para detalhamento e chamada.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {languageLab.map((lab) => (
          <motion.div
            key={lab.id}
            whileHover={{ y: -15, scale: 1.02 }}
            onClick={() => setLabSelecionado(lab)}
            className="bg-[#0d0d0d] p-10 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/40 transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[400px] md:h-[500px]"
          >
             <div className="flex justify-between items-start relative z-10">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-[#42a0f5] text-black rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-4xl md:text-6xl font-black shadow-2xl group-hover:scale-110 transition-transform">
                  {lab.nivel.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-3">
                   <div className="px-5 py-2.5 bg-black rounded-2xl border border-white/5 flex items-center gap-2 shadow-inner">
                      <Clock size={16} className="text-[#42a0f5]" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">{lab.horarioInicio}</span>
                   </div>
                   <span className="px-4 py-1.5 bg-[#42a0f5]/20 text-[#42a0f5] text-[10px] font-black rounded-xl uppercase tracking-widest border border-[#42a0f5]/20">
                      {lab.diaSemana}
                   </span>
                </div>
             </div>

             <div className="relative z-10 space-y-3">
                <h3 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#42a0f5] transition-colors">{lab.nivel}</h3>
                <div className="flex items-center gap-4">
                   <div className="h-1 w-10 bg-[#42a0f5]/40" />
                   <p className="text-xs md:text-sm font-black text-white/30 uppercase tracking-[0.4em]">{lab.turma}</p>
                </div>
             </div>

             <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity relative z-10">
                <div className="flex items-center gap-3">
                   <Users size={22} className="text-[#42a0f5]" />
                   <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-white">{lab.listaAlunos?.length || 0} Matriculados</span>
                </div>
                <ChevronRight size={28} className="text-[#42a0f5] group-hover:translate-x-3 transition-transform" />
             </div>

             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#42a0f5]/5 rounded-full blur-[100px] group-hover:bg-[#42a0f5]/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
