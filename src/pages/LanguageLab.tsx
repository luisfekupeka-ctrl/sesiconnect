import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, MapPin, Clock, Users, Search, ChevronLeft, User, CheckCircle2, BookOpen, Globe, XCircle, ClipboardCheck, ChevronRight } from 'lucide-react';
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
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-10 bg-[#42a0f5] text-black relative">
             <button onClick={() => { setLabSelecionado(null); setPresencas({}); }} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black text-[#42a0f5] rounded-2xl flex items-center justify-center text-3xl font-black">{labSelecionado.nivel.charAt(0)}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="px-2 py-0.5 bg-black/10 rounded-md text-[8px] font-black uppercase tracking-widest border border-black/5">Lab Dashboard</span>
                     <span className="text-black/60 font-black text-[10px] uppercase italic tracking-widest">{labSelecionado.diaSemana}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic leading-none">{labSelecionado.nivel}</h2>
                  <p className="text-sm md:text-xl font-bold opacity-70 mt-1 italic flex items-center gap-2"><BookOpen size={14} /> {labSelecionado.turma}</p>
                </div>
             </div>
          </div>
          <div className="p-6 md:p-10 space-y-10 bg-surface-container-lowest">
             <div className="grid grid-cols-3 gap-4 md:gap-6">
                <InfoBox label="Ambiente" value={labSelecionado.sala} icon={<MapPin size={14} />} />
                <InfoBox label="Docente" value={labSelecionado.professor} icon={<User size={14} />} />
                <InfoBox label="Horário" value={labSelecionado.horarioInicio} icon={<Clock size={14} />} />
             </div>
             <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                   <h3 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-3"><Users size={24} className="text-[#42a0f5]" /> Chamada Digital</h3>
                   <div className="relative group w-48 md:w-64">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="text" placeholder="Filtrar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black border border-white/5 rounded-xl text-[11px] font-black outline-none" />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                   {alunosFiltrados.map((aluno: string, i: number) => (
                     <div key={i} onClick={() => alternarPresenca(aluno)}
                        className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer text-sm font-black italic",
                        presencas[aluno] === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                        presencas[aluno] === false ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-black border-white/5 text-white/70")}>
                        <span>{aluno}</span>
                        <div className="flex items-center gap-2">{presencas[aluno] === true && <CheckCircle2 size={18} />}{presencas[aluno] === false && <XCircle size={18} />}</div>
                     </div>
                   ))}
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => { const n: any = {}; alunos.forEach((a: any) => n[a] = true); setPresencas(n); }} className="flex-1 py-4 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5 transition-all">Todos Presentes</button>
                   <button onClick={() => alert('Frequência salva!')} className="flex-[2] py-4 bg-[#42a0f5] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-blue transition-all flex items-center justify-center gap-2 border border-white/10"><ClipboardCheck size={18} /> Finalizar Registro</button>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#42a0f5]/10 text-[#42a0f5] rounded-full mb-3 border border-[#42a0f5]/20">
          <Globe size={14} className="animate-spin-slow" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Intelligence Lab System</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Language <span className="text-[#42a0f5]">Lab</span></h1>
        <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">Gestão nominal por proficiência.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {languageLab.map((lab) => (
          <motion.div key={lab.id} whileHover={{ y: -5 }} onClick={() => setLabSelecionado(lab)}
            className="bg-[#0d0d0d] p-8 rounded-[2.5rem] shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/40 transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[300px]">
             <div className="flex justify-between items-start relative z-10">
                <div className="w-16 h-16 bg-[#42a0f5] text-black rounded-2xl flex items-center justify-center text-3xl font-black transition-transform">{lab.nivel.charAt(0)}</div>
                <div className="flex flex-col items-end gap-1.5">
                   <div className="px-3 py-1 bg-black rounded-lg border border-white/5 text-[9px] font-black uppercase text-white tracking-widest">{lab.horarioInicio}</div>
                   <span className="px-2 py-0.5 bg-[#42a0f5]/20 text-[#42a0f5] text-[8px] font-black rounded-md uppercase tracking-widest">{lab.diaSemana}</span>
                </div>
             </div>
             <div className="relative z-10 space-y-1">
                <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#42a0f5] transition-colors">{lab.nivel}</h3>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{lab.turma}</p>
             </div>
             <div className="pt-6 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity relative z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-white">{lab.listaAlunos?.length || 0} Matriculados</span>
                <ChevronRight size={20} className="text-[#42a0f5]" />
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#42a0f5]/5 rounded-full blur-[50px]" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function InfoBox({ label, value, icon }: any) {
  return (
    <div className="p-4 bg-black rounded-2xl border border-white/5 flex flex-col gap-1">
       <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-1">{icon} {label}</p>
       <p className="text-sm md:text-lg font-black italic text-[#42a0f5] truncate">{value}</p>
    </div>
  );
}
