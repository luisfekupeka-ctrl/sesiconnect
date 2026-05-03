import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, GraduationCap, 
  ChevronRight, Calendar, CheckCircle2, XCircle, 
  Download, FileText, Share2, ClipboardCheck, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

export default function TeachersPage() {
  const { professores, horaAtual } = useEscola();
  const [busca, setBusca] = useState('');
  const [profSelecionado, setProfSelecionado] = useState<string | null>(null);
  const [aulaParaChamada, setAulaParaChamada] = useState<any | null>(null);
  const [chamada, setChamada] = useState<Record<string, boolean>>({});

  const professoresFiltrados = professores.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.materia.toLowerCase().includes(busca.toLowerCase())
  );

  const professorAtivo = professores.find(p => p.id === profSelecionado);

  const togglePresenca = (nome: string) => {
    setChamada(prev => ({ ...prev, [nome]: !prev[nome] }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-32">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
           <h1 className="text-5xl font-black tracking-tighter text-on-surface-bright italic">Corpo <span className="text-[#42a0f5]">Docente</span></h1>
           <p className="text-on-surface-variant text-lg font-medium italic opacity-80">Gestão de horários, ensalamento nominal e chamada digital.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5]" size={20} />
          <input
            type="text"
            placeholder="Buscar docente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#42a0f5]/10 shadow-inner"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {professoresFiltrados.map((prof) => (
          <motion.div
            key={prof.id}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setProfSelecionado(prof.id)}
            className={cn(
              "p-10 rounded-[3.5rem] bg-[#0d1117] shadow-2xl border-2 transition-all cursor-pointer group",
              profSelecionado === prof.id ? "border-[#42a0f5]" : "border-[#30363d] hover:border-[#42a0f5]/20"
            )}
          >
            <div className="flex items-center gap-8 mb-10">
               <div className="w-24 h-24 bg-[#42a0f5]/10 text-[#42a0f5] rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-inner">
                  {prof.nome[0]}
               </div>
               <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none mb-2">{prof.nome}</h3>
                  <p className="text-[11px] font-black uppercase text-[#42a0f5] tracking-[0.3em]">{prof.materia}</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className={cn("w-3 h-3 rounded-full animate-pulse shadow-lg", prof.status === 'em_aula' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-amber-500 shadow-amber-500/20")} />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Atual</span>
                  </div>
                  <span className="text-sm font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Disponível'}</span>
               </div>
               
               <div className="flex items-center gap-4 px-4 py-4 bg-white/2 rounded-2xl">
                  <MapPin size={18} className="text-[#42a0f5] shrink-0" />
                  <p className="text-sm font-bold text-on-surface-variant truncate italic">{prof.salaAtual ? `Lecionando na ${prof.salaAtual}` : 'Fora de Horário de Aula'}</p>
               </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#42a0f5]">Consultar Grade</span>
               <ChevronRight size={22} className="text-outline group-hover:translate-x-3 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAINEL DETALHADO DO PROFESSOR (MODAL SIDEBAR) */}
      <AnimatePresence>
        {profSelecionado && professorAtivo && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 150 }}
              className="w-full max-w-2xl bg-[#0d1117] h-full shadow-[-30px_0_100px_rgba(0,0,0,0.8)] border-l border-[#30363d] flex flex-col"
            >
               {/* Header Professor Premium */}
               <div className="p-12 bg-[#42a0f5] text-white relative">
                  <button onClick={() => setProfSelecionado(null)} className="absolute top-12 right-12 w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all text-3xl font-light shadow-lg">✕</button>
                  <div className="flex items-center gap-10">
                     <div className="w-32 h-32 bg-white/20 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-2xl">
                        {professorAtivo.nome[0]}
                     </div>
                     <div>
                        <h2 className="text-5xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                        <p className="text-[11px] font-black opacity-80 mt-4 uppercase tracking-[0.4em] italic">{professorAtivo.materia} • Docente SESI</p>
                     </div>
                  </div>
               </div>

               {/* Agenda do Dia com Foco em Chamada */}
               <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-surface-container-lowest">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                     <h3 className="text-3xl font-black italic tracking-tighter">Grade de Aulas do Dia</h3>
                     <div className="flex gap-4">
                        <button className="p-4 bg-surface-container-low rounded-2xl text-[#42a0f5] hover:bg-[#42a0f5]/10 transition-all shadow-inner"><Download size={20} /></button>
                        <button className="p-4 bg-surface-container-low rounded-2xl text-[#42a0f5] hover:bg-[#42a0f5]/10 transition-all shadow-inner"><Share2 size={20} /></button>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {professorAtivo.agendaDoDia.map((aula, i) => (
                        <div 
                          key={i} 
                          onClick={() => setAulaParaChamada(aula)}
                          className="p-10 bg-[#0d1117] rounded-[3.5rem] border border-[#30363d] group hover:border-[#42a0f5] hover:bg-[#42a0f5]/5 transition-all shadow-xl cursor-pointer"
                        >
                           <div className="flex justify-between items-start mb-8">
                              <div>
                                 <p className="text-[11px] font-black text-[#42a0f5] uppercase tracking-[0.3em] mb-2">{aula.horario}</p>
                                 <h4 className="text-3xl font-black text-white italic tracking-tighter group-hover:text-[#42a0f5] transition-colors">{aula.materia}</h4>
                              </div>
                              <span className="px-5 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-60 border border-white/5">Sala {aula.numeroSala}</span>
                           </div>
                           
                           <div className="flex items-center justify-between pt-8 border-t border-white/5">
                              <div className="flex items-center gap-3 text-on-surface-variant text-[11px] font-black uppercase tracking-widest italic">
                                 <Users size={16} className="text-[#42a0f5]" /> {aula.listaAlunos?.length || 0} Matriculados
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#42a0f5] opacity-0 group-hover:opacity-100 transition-all">
                                 Clique para Chamada <ChevronRight size={14} />
                              </div>
                           </div>
                        </div>
                     ))}
                     {professorAtivo.agendaDoDia.length === 0 && (
                        <div className="py-20 text-center opacity-20 italic font-black text-lg">Nenhuma aula agendada para hoje.</div>
                     )}
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CHAMADA DIGITAL (PADRÃO PREMIUM) */}
      <AnimatePresence>
        {aulaParaChamada && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-[#0d1117] w-full max-w-3xl rounded-[4.5rem] border border-[#30363d] overflow-hidden flex flex-col max-h-[92vh] shadow-[0_60px_200px_rgba(0,0,0,1)]"
            >
               <div className="p-12 bg-emerald-600 text-white relative">
                  <button onClick={() => { setAulaParaChamada(null); setChamada({}); }} className="absolute top-12 right-12 w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all text-4xl font-light shadow-lg">✕</button>
                  <div className="flex items-center gap-8">
                     <div className="w-24 h-24 bg-white/20 rounded-[3rem] flex items-center justify-center shadow-2xl">
                        <ClipboardCheck size={48} />
                     </div>
                     <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-2">Processo de Chamada Nominal</p>
                        <h2 className="text-5xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                        <p className="text-lg font-bold opacity-80 mt-4 italic">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 p-12 overflow-hidden flex flex-col bg-surface-container-lowest">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-3xl font-black italic tracking-tighter">Lista de Ensalamento</h3>
                     <div className="flex gap-6">
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                           <span className="text-[11px] font-black uppercase opacity-60 tracking-widest">Presente</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                           <span className="text-[11px] font-black uppercase opacity-60 tracking-widest">Ausente</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                     {(aulaParaChamada.listaAlunos || []).map((aluno: string, idx: number) => (
                        <motion.div 
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.02 }}
                           key={idx}
                           onClick={() => togglePresenca(aluno)}
                           className={cn(
                              "flex items-center justify-between p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all shadow-lg",
                              chamada[aluno] === false ? "bg-red-500/5 border-red-500/30" : 
                              chamada[aluno] === true ? "bg-emerald-500/5 border-emerald-500/30" : "bg-[#0d1117] border-transparent hover:border-white/5"
                           )}
                        >
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-[12px] font-black shadow-inner">
                                 {(idx + 1).toString().padStart(2, '0')}
                              </div>
                              <span className="text-2xl font-black italic text-on-surface-variant tracking-tight">{aluno}</span>
                           </div>
                           <div className="flex gap-4">
                              {chamada[aluno] === true && <CheckCircle2 className="text-emerald-500" size={32} />}
                              {chamada[aluno] === false && <XCircle className="text-red-500" size={32} />}
                              {chamada[aluno] === undefined && <div className="w-8 h-8 rounded-full border-2 border-white/5" />}
                           </div>
                        </motion.div>
                     ))}
                  </div>

                  <div className="mt-10 pt-10 border-t border-white/5 flex gap-6">
                     <button 
                        onClick={() => {
                           const nomes = aulaParaChamada.listaAlunos || [];
                           const novaChamada: Record<string, boolean> = {};
                           nomes.forEach((n: string) => novaChamada[n] = true);
                           setChamada(novaChamada);
                        }}
                        className="flex-1 py-6 bg-surface-container-low rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all shadow-inner"
                     >
                        Marcar Presença Geral
                     </button>
                     <button 
                        onClick={() => {
                           alert('Chamada salva com sucesso! Gerando relatório de presenças...');
                           setAulaParaChamada(null);
                           setChamada({});
                        }}
                        className="flex-1 py-6 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                        Finalizar Chamada
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
