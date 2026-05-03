import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, ChevronLeft, 
  CheckCircle2, XCircle, ClipboardCheck, Users,
  ArrowRight, Calendar, Download, Share2, GraduationCap
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

  // Sub-página: Chamada Digital (Estilo Premium)
  if (aulaParaChamada) {
    const alunos = aulaParaChamada.listaAlunos || [];
    const filtrados = alunos.filter((a: string) => a.toLowerCase().includes(buscaAlunos.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-32 pt-2 md:pt-10 px-2 md:px-10 space-y-6 md:space-y-10">
        <div className="bg-[#0a0a0a] rounded-[2.5rem] md:rounded-[4.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-8 md:p-12 bg-[#059669] text-white relative">
             <button 
               onClick={() => { setAulaParaChamada(null); setChamada({}); setBuscaAlunos(''); }}
               className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all shadow-xl"
             >
               <ChevronLeft size={24} className="md:size-32" />
             </button>
             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-black text-[#10b981] rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-center shadow-inner border border-white/5">
                   <ClipboardCheck size={48} className="md:size-64" />
                </div>
                <div className="text-center md:text-left">
                   <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-1 md:mb-2">Portal de Frequência Digital</p>
                   <h2 className="text-3xl md:text-6xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                   <p className="text-sm md:text-xl font-bold opacity-80 mt-3 md:mt-4 italic">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                </div>
             </div>
          </div>

          <div className="p-6 md:p-12 space-y-10 md:space-y-12 bg-surface-container-lowest">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex gap-8">
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60">Presente</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60">Ausente</span>
                   </div>
                </div>
                <div className="relative group w-full md:w-96">
                   <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500" />
                   <input 
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={buscaAlunos}
                    onChange={(e) => setBuscaAlunos(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 md:py-6 bg-black border border-white/5 rounded-[2rem] text-xs md:text-sm font-black focus:ring-8 focus:ring-emerald-500/10 shadow-inner outline-none"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtrados.map((aluno: string, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={aluno}
                    onClick={() => setChamada(prev => ({ ...prev, [aluno]: !prev[aluno] }))}
                    className={cn(
                      "p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-2 cursor-pointer transition-all shadow-xl flex items-center justify-between group/item",
                      chamada[aluno] === false ? "bg-red-500/5 border-red-500/30" : 
                      chamada[aluno] === true ? "bg-emerald-500/5 border-emerald-500/30" : "bg-[#0d0d0d] border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-xs md:text-sm font-black">
                          {(idx + 1).toString().padStart(2, '0')}
                       </div>
                       <span className="text-lg md:text-2xl font-black italic tracking-tight">{aluno}</span>
                    </div>
                    <div>
                       {chamada[aluno] === true && <CheckCircle2 className="text-emerald-500" size={32} md:size={48} />}
                       {chamada[aluno] === false && <XCircle className="text-red-500" size={32} md:size={48} />}
                       {chamada[aluno] === undefined && <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-white/10 group-hover/item:border-white/20 transition-colors" />}
                    </div>
                  </motion.div>
                ))}
             </div>

             <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                <button 
                  onClick={() => {
                     const nova: Record<string, boolean> = {};
                     alunos.forEach((n: string) => nova[n] = true);
                     setChamada(nova);
                  }}
                  className="flex-1 py-6 md:py-8 bg-black rounded-[2rem] md:rounded-[3rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all shadow-inner border border-white/5"
                >
                   Presente Geral
                </button>
                <button 
                  onClick={() => {
                     alert('Frequência registrada com sucesso!');
                     setAulaParaChamada(null);
                  }}
                  className="flex-1 py-6 md:py-8 bg-[#10b981] text-black rounded-[2rem] md:rounded-[3rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-glow-emerald hover:scale-[1.02] transition-all border border-white/10"
                >
                   Finalizar Chamada
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Sub-página: Perfil do Professor (Estilo Premium Black/Blue/Yellow)
  if (professorAtivo) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-32 pt-2 md:pt-10 px-2 md:px-10 space-y-6 md:space-y-10">
        <div className="bg-[#0a0a0a] rounded-[2.5rem] md:rounded-[4.5rem] border border-white/5 overflow-hidden shadow-premium">
           <div className="p-8 md:p-12 bg-[#42a0f5] text-black relative">
              <button 
                onClick={() => setProfSelecionadoId(null)}
                className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"
              >
                <ChevronLeft size={24} className="md:size-32" />
              </button>
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                 <div className="w-24 h-24 md:w-40 md:h-40 bg-black text-[#42a0f5] rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center text-4xl md:text-8xl font-black shadow-inner border border-white/5">
                    {professorAtivo.nome[0]}
                 </div>
                 <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-4">
                       <span className="px-4 py-1 bg-black/10 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-black/5">Docente Sesi Connect</span>
                       <div className={cn("w-3 h-3 rounded-full animate-pulse", professorAtivo.status === 'em_aula' ? "bg-emerald-600" : "bg-[#fbbf24]")} />
                    </div>
                    <h2 className="text-4xl md:text-8xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                    <p className="text-lg md:text-3xl font-bold opacity-70 mt-3 md:mt-6 italic">{professorAtivo.materia}</p>
                 </div>
              </div>
           </div>

           <div className="p-6 md:p-12 space-y-10 md:space-y-16 bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                 <h3 className="text-2xl md:text-5xl font-black italic tracking-tighter text-white">Grade do Dia</h3>
                 <div className="flex gap-4">
                    <button className="p-4 md:p-6 bg-black rounded-2xl md:rounded-3xl text-[#42a0f5] hover:bg-white/5 transition-all border border-white/5 shadow-inner"><Download size={20} className="md:size-28" /></button>
                    <button className="p-4 md:p-6 bg-black rounded-2xl md:rounded-3xl text-[#42a0f5] hover:bg-white/5 transition-all border border-white/5 shadow-inner"><Share2 size={20} className="md:size-28" /></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                 {professorAtivo.agendaDoDia.map((aula, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setAulaParaChamada(aula)}
                      className="p-10 md:p-12 bg-[#0d0d0d] rounded-[3rem] md:rounded-[4rem] border-2 border-white/5 hover:border-[#42a0f5] transition-all group cursor-pointer flex flex-col justify-between h-[300px] md:h-[350px] shadow-premium"
                    >
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[10px] md:text-[11px] font-black text-[#42a0f5] uppercase tracking-[0.4em] mb-2">{aula.horario}</p>
                             <h4 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#42a0f5] transition-colors">{aula.materia}</h4>
                          </div>
                          <div className="px-4 py-2 bg-black rounded-xl border border-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 shadow-inner">Sala {aula.numeroSala}</div>
                       </div>
                       
                       <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-white/30 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] italic group-hover:text-white transition-colors">
                             <Users size={18} className="text-[#42a0f5]" /> {aula.listaAlunos?.length || 0} Matriculados
                          </div>
                          <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#42a0f5] opacity-0 group-hover:opacity-100 transition-all">
                             Iniciar Chamada <ArrowRight size={20} />
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 {professorAtivo.agendaDoDia.length === 0 && (
                    <div className="col-span-full py-32 text-center opacity-20 italic font-black text-xl md:text-3xl border-4 border-dashed border-white/5 rounded-[4rem] md:rounded-[5rem]">Agenda livre hoje.</div>
                 )}
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 md:space-y-24 pb-32 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="max-w-4xl">
           <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#42a0f5]/10 text-[#42a0f5] rounded-full mb-6 border border-[#42a0f5]/20 shadow-xl">
             <GraduationCap size={20} />
             <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] italic">Academic Staff Management</span>
           </div>
           <h1 className="text-5xl md:text-9xl font-black tracking-tighter text-white mb-6 italic leading-none">Corpo <span className="text-[#42a0f5]">Docente</span></h1>
           <p className="text-white/40 text-lg md:text-3xl font-medium leading-relaxed italic border-l-8 border-[#42a0f5]/20 pl-6 md:pl-12 max-w-3xl">
             Gestão de agendas, proficiência e registro de frequência. Selecione o docente para interações.
           </p>
        </div>
        <div className="relative group w-full lg:w-[450px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#42a0f5] transition-colors" size={24} />
          <input
            type="text"
            placeholder="Achar professor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-16 pr-8 py-6 md:py-8 bg-[#0a0a0a] border-2 border-white/5 rounded-[2.5rem] md:rounded-[3rem] text-white font-black text-lg md:text-xl focus:ring-8 focus:ring-[#42a0f5]/5 shadow-2xl outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
        {professoresFiltrados.map((prof) => (
          <motion.div
            key={prof.id}
            whileHover={{ y: -15, scale: 1.02 }}
            onClick={() => setProfSelecionadoId(prof.id)}
            className="p-10 md:p-14 rounded-[4rem] md:rounded-[5rem] bg-[#0d0d0d] shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/50 transition-all cursor-pointer group flex flex-col justify-between h-[450px] md:h-[550px] relative overflow-hidden"
          >
            <div className="flex items-center gap-8 md:gap-10 relative z-10">
               <div className="w-24 h-24 md:w-32 md:h-32 bg-black text-[#42a0f5] rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center text-4xl md:text-6xl font-black shadow-inner group-hover:bg-[#42a0f5] group-hover:text-black transition-all">
                  {prof.nome[0]}
               </div>
               <div>
                  <h3 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none mb-3 group-hover:text-[#42a0f5] transition-colors">{prof.nome}</h3>
                  <span className="px-5 py-1.5 bg-[#42a0f5]/10 text-[#42a0f5] text-[9px] md:text-[10px] font-black rounded-xl uppercase tracking-widest border border-[#42a0f5]/20">{prof.materia}</span>
               </div>
            </div>

            <div className="space-y-6 md:space-y-8 relative z-10">
               <div className="flex items-center justify-between p-6 md:p-8 bg-black rounded-[2.5rem] border border-white/5 shadow-inner">
                  <div className="flex items-center gap-4">
                     <div className={cn("w-3 h-3 md:w-4 md:h-4 rounded-full animate-pulse shadow-lg", prof.status === 'em_aula' ? "bg-emerald-500 shadow-emerald-500/30" : "bg-[#fbbf24] shadow-[#fbbf24]/30")} />
                     <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40 italic">Activity</span>
                  </div>
                  <span className="text-base md:text-xl font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Pausa'}</span>
               </div>
               
               <div className="flex items-center gap-4 px-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <MapPin size={22} className="text-[#42a0f5]" />
                  <p className="text-sm md:text-lg font-bold text-white/50 truncate italic">{prof.salaAtual ? `Alocado na ${prof.salaAtual}` : 'Sem alocação ativa'}</p>
               </div>
            </div>

            <div className="mt-8 pt-10 border-t border-white/5 flex items-center justify-between relative z-10 opacity-40 group-hover:opacity-100 transition-all">
               <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white">Visualizar Docente</span>
               <ArrowRight size={28} className="text-[#42a0f5] group-hover:translate-x-4 transition-transform" />
            </div>

            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#42a0f5]/5 rounded-full blur-[120px] group-hover:bg-[#42a0f5]/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
