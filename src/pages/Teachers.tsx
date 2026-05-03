import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, ChevronLeft, 
  CheckCircle2, XCircle, ClipboardCheck, Users,
  ArrowRight, Calendar, Download, Share2, GraduationCap, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

export default function TeachersPage() {
  const { professores } = useEscola();
  const [busca, setBusca] = useState('');
  const [profSelecionadoId, setProfSelecionadoId] = useState<string | null>(null);
  const [aulaParaChamada, setAulaParaChamada] = useState<any | null>(null);
  const [chamada, setChamada] = useState<Record<string, boolean>>({});
  const [buscaAlunos, setBuscaAlunos] = useState('');

  const professoresFiltrados = professores.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.materia.toLowerCase().includes(busca.toLowerCase())
  );

  const professorAtivo = professores.find(p => p.id === profSelecionadoId);

  const alternarPresenca = (aluno: string) => {
    setChamada(prev => ({
      ...prev,
      [aluno]: prev[aluno] === undefined ? true : prev[aluno] === true ? false : true
    }));
  };

  if (aulaParaChamada) {
    const alunos = aulaParaChamada.listaAlunos || [];
    const filtrados = alunos.filter((a: string) => a.toLowerCase().includes(buscaAlunos.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-10 bg-emerald-600 text-white relative">
             <button onClick={() => { setAulaParaChamada(null); setChamada({}); setBuscaAlunos(''); }} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black text-[#10b981] rounded-2xl flex items-center justify-center"><ClipboardCheck size={32} /></div>
                <div>
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-80 mb-1">Frequência Digital</p>
                   <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                   <p className="text-xs md:text-sm font-bold opacity-80 mt-1 italic">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                </div>
             </div>
          </div>
          <div className="p-6 md:p-10 space-y-8 bg-surface-container-lowest">
             <div className="flex items-center justify-between gap-4">
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black uppercase opacity-60">P</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-[9px] font-black uppercase opacity-60">F</span>
                   </div>
                </div>
                <div className="relative group w-48 md:w-64">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                   <input type="text" placeholder="Filtrar..." value={buscaAlunos} onChange={(e) => setBuscaAlunos(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black border border-white/5 rounded-xl text-[11px] font-black outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtrados.map((aluno: string, i: number) => (
                  <div key={aluno} onClick={() => alternarPresenca(aluno)}
                    className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer text-sm font-black italic",
                      chamada[aluno] === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                      chamada[aluno] === false ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-[#0d0d0d] border-white/5 hover:border-white/20")}>
                    <span>{aluno}</span>
                    <div className="flex items-center gap-2">{chamada[aluno] === true && <CheckCircle2 size={18} />}{chamada[aluno] === false && <XCircle size={18} />}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-4 pt-6 border-t border-white/5">
                <button onClick={() => { const n: any = {}; alunos.forEach((a: any) => n[a] = true); setChamada(n); }} className="flex-1 py-4 bg-black rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5 hover:bg-white/5">Todos Presentes</button>
                <button onClick={() => { alert('Frequência salva!'); setAulaParaChamada(null); }} className="flex-[2] py-4 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-emerald transition-all flex items-center justify-center gap-2"><ClipboardCheck size={18} /> Finalizar Chamada</button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (professorAtivo) {
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-premium">
           <div className="p-6 md:p-10 bg-[#42a0f5] text-black relative">
              <button onClick={() => setProfSelecionadoId(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-8">
                 <div className="w-20 h-20 bg-black text-[#42a0f5] rounded-2xl flex items-center justify-center text-4xl font-black">{professorAtivo.nome[0]}</div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="px-3 py-0.5 bg-black/10 rounded-md text-[8px] font-black uppercase tracking-widest border border-black/5">Docente Sesi</span>
                       <div className={cn("w-2 h-2 rounded-full animate-pulse", professorAtivo.status === 'em_aula' ? "bg-emerald-600" : "bg-[#fbbf24]")} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                    <p className="text-sm md:text-xl font-bold opacity-70 mt-1 italic">{professorAtivo.materia}</p>
                 </div>
              </div>
           </div>
           <div className="p-6 md:p-10 space-y-10 bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <h3 className="text-xl md:text-3xl font-black italic tracking-tighter text-white">Agenda do Dia</h3>
                 <div className="flex gap-2">
                    <button className="p-3 bg-black rounded-xl text-[#42a0f5] border border-white/5"><Download size={18} /></button>
                    <button className="p-3 bg-black rounded-xl text-[#42a0f5] border border-white/5"><Share2 size={18} /></button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {professorAtivo.agendaDoDia.map((aula, i) => (
                    <div key={i} onClick={() => setAulaParaChamada(aula)}
                      className="p-8 bg-[#0d0d0d] rounded-[2rem] border-2 border-white/5 hover:border-[#42a0f5] transition-all group cursor-pointer flex flex-col justify-between h-[220px] shadow-premium">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[9px] font-black text-[#42a0f5] uppercase tracking-[0.3em] mb-1">{aula.horario}</p>
                             <h4 className="text-xl font-black text-white italic tracking-tighter group-hover:text-[#42a0f5]">{aula.materia}</h4>
                          </div>
                          <div className="px-2 py-1 bg-black rounded-md border border-white/5 text-[8px] font-black uppercase opacity-60">Sala {aula.numeroSala}</div>
                       </div>
                       <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[#42a0f5] opacity-0 group-hover:opacity-100 transition-all">Iniciar Chamada <ArrowRight size={16} /></div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
           <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#42a0f5]/10 text-[#42a0f5] rounded-full mb-3 border border-[#42a0f5]/20">
             <GraduationCap size={14} />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Staff Management</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Corpo <span className="text-[#42a0f5]">Docente</span></h1>
           <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">Gestão de agendas e frequência.</p>
        </div>
        <div className="relative group w-full lg:w-[350px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#42a0f5]" size={20} />
          <input type="text" placeholder="Achar professor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-6 py-4 md:py-5 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl md:rounded-[1.5rem] text-white font-black text-sm focus:ring-4 focus:ring-[#42a0f5]/5 outline-none" />
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {professoresFiltrados.map((prof) => (
          <motion.div key={prof.id} whileHover={{ y: -5 }} onClick={() => setProfSelecionadoId(prof.id)}
            className="p-8 rounded-[2.5rem] bg-[#0d0d0d] shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/50 transition-all cursor-pointer group flex flex-col justify-between h-[360px] relative overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
               <div className="w-16 h-16 bg-black text-[#42a0f5] rounded-2xl flex items-center justify-center text-3xl font-black transition-all group-hover:bg-[#42a0f5] group-hover:text-black">{prof.nome[0]}</div>
               <div>
                  <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-tight group-hover:text-[#42a0f5]">{prof.nome}</h3>
                  <span className="px-3 py-1 bg-[#42a0f5]/10 text-[#42a0f5] text-[8px] font-black rounded-lg uppercase tracking-widest border border-[#42a0f5]/10">{prof.materia}</span>
               </div>
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                     <div className={cn("w-2 h-2 rounded-full animate-pulse", prof.status === 'em_aula' ? "bg-emerald-500" : "bg-[#fbbf24]")} />
                     <span className="text-[8px] font-black uppercase opacity-40 italic">Status</span>
                  </div>
                  <span className="text-sm font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Pausa'}</span>
               </div>
               <div className="flex items-center gap-3 px-2 opacity-60">
                  <MapPin size={16} className="text-[#42a0f5]" />
                  <p className="text-[11px] font-bold text-white/50 truncate italic">{prof.salaAtual || 'Sem alocação'}</p>
               </div>
            </div>
            <div className="mt-4 pt-6 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 relative z-10 transition-all">
               <span className="text-[8px] font-black uppercase tracking-widest text-white">Visualizar Perfil</span>
               <ChevronRight size={20} className="text-[#42a0f5]" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#42a0f5]/5 rounded-full blur-[60px]" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
