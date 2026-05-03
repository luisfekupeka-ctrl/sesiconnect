import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, ChevronLeft, 
  CheckCircle2, XCircle, ClipboardCheck, Users,
  ArrowRight, Calendar, Download, Share2
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

  // Sub-página: Chamada Digital
  if (aulaParaChamada) {
    const alunos = aulaParaChamada.listaAlunos || [];
    const filtrados = alunos.filter((a: string) => a.toLowerCase().includes(buscaAlunos.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-32">
        <div className="bg-[#0d1117] rounded-[4.5rem] border border-[#30363d] overflow-hidden shadow-2xl">
          <div className="p-12 bg-emerald-600 text-white relative">
             <button 
               onClick={() => { setAulaParaChamada(null); setChamada({}); setBuscaAlunos(''); }}
               className="absolute top-10 right-10 w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all shadow-xl"
             >
               <ChevronLeft size={28} className="mr-1" />
             </button>
             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 bg-white/10 rounded-[3rem] flex items-center justify-center shadow-inner border border-white/5">
                   <ClipboardCheck size={64} />
                </div>
                <div>
                   <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-2">Registro de Frequência Digital</p>
                   <h2 className="text-6xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                   <p className="text-xl font-bold opacity-80 mt-4 italic">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                </div>
             </div>
          </div>

          <div className="p-12 space-y-12 bg-surface-container-lowest">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex gap-8">
                   <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Presente</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Ausente</span>
                   </div>
                </div>
                <div className="relative group w-full md:w-80">
                   <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-emerald-500" />
                   <input 
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={buscaAlunos}
                    onChange={(e) => setBuscaAlunos(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-white/5 border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-emerald-500/10 shadow-inner outline-none"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtrados.map((aluno: string, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={aluno}
                    onClick={() => setChamada(prev => ({ ...prev, [aluno]: !prev[aluno] }))}
                    className={cn(
                      "p-8 rounded-[3rem] border-2 cursor-pointer transition-all shadow-xl flex items-center justify-between group/item",
                      chamada[aluno] === false ? "bg-red-500/5 border-red-500/30" : 
                      chamada[aluno] === true ? "bg-emerald-500/5 border-emerald-500/30" : "bg-[#0d1117] border-[#30363d] hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-black">
                          {(idx + 1).toString().padStart(2, '0')}
                       </div>
                       <span className="text-xl font-black italic tracking-tight">{aluno}</span>
                    </div>
                    <div>
                       {chamada[aluno] === true && <CheckCircle2 className="text-emerald-500" size={36} />}
                       {chamada[aluno] === false && <XCircle className="text-red-500" size={36} />}
                       {chamada[aluno] === undefined && <div className="w-9 h-9 rounded-full border-2 border-white/10 group-hover/item:border-white/20 transition-colors" />}
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
                  className="flex-1 py-8 bg-surface-container-low rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all shadow-inner border border-white/5"
                >
                   Presente Geral
                </button>
                <button 
                  onClick={() => {
                     alert('Frequência registrada!');
                     setAulaParaChamada(null);
                  }}
                  className="flex-1 py-8 bg-emerald-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-500 transition-all border border-emerald-400/20"
                >
                   Finalizar Chamada Digital
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Sub-página: Perfil do Professor
  if (professorAtivo) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-32">
        <div className="bg-[#0d1117] rounded-[4.5rem] border border-[#30363d] overflow-hidden shadow-2xl">
           <div className="p-12 bg-[#42a0f5] text-black relative">
              <button 
                onClick={() => setProfSelecionadoId(null)}
                className="absolute top-10 right-10 w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"
              >
                <ChevronLeft size={28} className="mr-1" />
              </button>
              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="w-36 h-36 bg-black/10 rounded-[3.5rem] flex items-center justify-center text-7xl font-black shadow-inner border border-black/5">
                    {professorAtivo.nome[0]}
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className="px-4 py-1 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5">Docente Sesi</span>
                       <div className={cn("w-3 h-3 rounded-full animate-pulse", professorAtivo.status === 'em_aula' ? "bg-emerald-600" : "bg-amber-600")} />
                    </div>
                    <h2 className="text-7xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                    <p className="text-2xl font-bold opacity-70 mt-4 italic">{professorAtivo.materia}</p>
                 </div>
              </div>
           </div>

           <div className="p-12 space-y-12 bg-surface-container-lowest">
              <div className="flex items-center justify-between">
                 <h3 className="text-4xl font-black italic tracking-tighter text-white">Agenda do Dia</h3>
                 <div className="flex gap-4">
                    <button className="p-5 bg-white/5 rounded-2xl text-[#42a0f5] hover:bg-white/10 transition-all border border-white/5"><Download size={24} /></button>
                    <button className="p-5 bg-white/5 rounded-2xl text-[#42a0f5] hover:bg-white/10 transition-all border border-white/5"><Share2 size={24} /></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {professorAtivo.agendaDoDia.map((aula, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setAulaParaChamada(aula)}
                      className="p-12 bg-[#0d1117] rounded-[4rem] border-2 border-[#30363d] hover:border-[#42a0f5] transition-all group cursor-pointer flex flex-col justify-between h-[320px]"
                    >
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[11px] font-black text-[#42a0f5] uppercase tracking-[0.4em] mb-2">{aula.horario}</p>
                             <h4 className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#42a0f5] transition-colors">{aula.materia}</h4>
                          </div>
                          <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest opacity-60">Sala {aula.numeroSala}</div>
                       </div>
                       
                       <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-white/40 text-[11px] font-black uppercase tracking-[0.2em] italic group-hover:text-white transition-colors">
                             <Users size={18} className="text-[#42a0f5]" /> {aula.listaAlunos?.length || 0} Matriculados
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#42a0f5] opacity-0 group-hover:opacity-100 transition-all">
                             Chamada Nominal <ArrowRight size={18} />
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 {professorAtivo.agendaDoDia.length === 0 && (
                    <div className="col-span-full py-32 text-center opacity-20 italic font-black text-2xl border-4 border-dashed border-[#30363d] rounded-[5rem]">Livre de aulas hoje.</div>
                 )}
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 pb-32 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="max-w-3xl">
           <h1 className="text-7xl font-black tracking-tighter text-white mb-6 italic leading-none">Corpo <span className="text-[#42a0f5]">Docente</span></h1>
           <p className="text-on-surface-variant text-2xl font-medium leading-relaxed italic opacity-80 border-l-4 border-[#42a0f5]/30 pl-8">
             Portal centralizado para gestão de ensalamento nominal, frequência digital e consulta de agendas semanais.
           </p>
        </div>
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5] transition-colors" size={24} />
          <input
            type="text"
            placeholder="Pesquisar professor ou matéria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-[#0d1117] border-2 border-[#30363d] rounded-[2.5rem] text-white font-black text-lg focus:ring-8 focus:ring-[#42a0f5]/5 shadow-2xl outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {professoresFiltrados.map((prof) => (
          <motion.div
            key={prof.id}
            whileHover={{ y: -15, scale: 1.02 }}
            onClick={() => setProfSelecionadoId(prof.id)}
            className="p-12 rounded-[4rem] bg-[#0d1117] shadow-2xl border-2 border-[#30363d] hover:border-[#42a0f5]/50 transition-all cursor-pointer group flex flex-col justify-between h-[450px] relative overflow-hidden"
          >
            <div className="flex items-center gap-8 relative z-10">
               <div className="w-28 h-28 bg-[#42a0f5]/10 text-[#42a0f5] rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-inner group-hover:bg-[#42a0f5] group-hover:text-black transition-all">
                  {prof.nome[0]}
               </div>
               <div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none mb-3 group-hover:text-[#42a0f5] transition-colors">{prof.nome}</h3>
                  <span className="px-4 py-1.5 bg-[#42a0f5]/20 text-[#42a0f5] text-[10px] font-black rounded-xl uppercase tracking-widest border border-[#42a0f5]/20">{prof.materia}</span>
               </div>
            </div>

            <div className="space-y-6 relative z-10">
               <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className={cn("w-3 h-3 rounded-full animate-pulse shadow-lg", prof.status === 'em_aula' ? "bg-emerald-500" : "bg-amber-500")} />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Status</span>
                  </div>
                  <span className="text-sm font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Disponível'}</span>
               </div>
               
               <div className="flex items-center gap-4 px-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <MapPin size={20} className="text-[#42a0f5]" />
                  <p className="text-sm font-bold text-on-surface-variant truncate italic">{prof.salaAtual ? `Lecionando na ${prof.salaAtual}` : 'Sem aula no momento'}</p>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10 opacity-40 group-hover:opacity-100 transition-all">
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Visualizar Perfil</span>
               <ArrowRight size={24} className="text-[#42a0f5] group-hover:translate-x-3 transition-transform" />
            </div>

            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#42a0f5]/5 rounded-full blur-[100px] group-hover:bg-[#42a0f5]/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
