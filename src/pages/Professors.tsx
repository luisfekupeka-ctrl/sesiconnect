import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, GraduationCap, 
  ChevronRight, Calendar, CheckCircle2, XCircle, 
  Download, FileText, Share2, ClipboardCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

export default function Professors() {
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
           <p className="text-on-surface-variant text-lg font-medium">Gestão de horários, ensalamento e chamada digital em tempo real.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5]" size={20} />
          <input
            type="text"
            placeholder="Buscar professor ou matéria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#42a0f5]/10 shadow-inner"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {professoresFiltrados.map((prof) => (
          <motion.div
            key={prof.id}
            whileHover={{ y: -5 }}
            onClick={() => setProfSelecionado(prof.id)}
            className={cn(
              "p-8 rounded-[3rem] bg-surface-container-lowest editorial-shadow border-2 transition-all cursor-pointer group",
              profSelecionado === prof.id ? "border-[#42a0f5]" : "border-transparent hover:border-[#42a0f5]/20"
            )}
          >
            <div className="flex items-center gap-6 mb-8">
               <div className="w-20 h-20 bg-[#42a0f5]/10 text-[#42a0f5] rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-inner">
                  {prof.nome[0]}
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">{prof.nome}</h3>
                  <p className="text-[10px] font-black uppercase text-[#42a0f5] tracking-widest">{prof.materia}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                  <div className="flex items-center gap-3">
                     <div className={cn("w-2 h-2 rounded-full animate-pulse", prof.status === 'em_aula' ? "bg-emerald-500" : "bg-amber-500")} />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Agora</span>
                  </div>
                  <span className="text-xs font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Disponível'}</span>
               </div>
               
               {prof.salaAtual && (
                  <div className="flex items-center gap-3 px-2">
                     <MapPin size={14} className="text-[#42a0f5]" />
                     <span className="text-xs font-bold text-on-surface-variant">Atuando na {prof.salaAtual}</span>
                  </div>
               )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#42a0f5]">Ver Agenda e Chamada</span>
               <ChevronRight size={18} className="text-outline group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAINEL DETALHADO DO PROFESSOR (MODAL SIDEBAR) */}
      <AnimatePresence>
        {profSelecionado && professorAtivo && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-[#0d1117] h-full shadow-[-20px_0_80px_rgba(0,0,0,0.5)] border-l border-[#30363d] flex flex-col"
            >
               {/* Header Professor */}
               <div className="p-10 bg-[#42a0f5] text-white relative">
                  <button onClick={() => setProfSelecionado(null)} className="absolute top-10 right-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">✕</button>
                  <div className="flex items-center gap-8">
                     <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl">
                        {professorAtivo.nome[0]}
                     </div>
                     <div>
                        <h2 className="text-4xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                        <p className="text-sm font-bold opacity-80 mt-2 uppercase tracking-widest">{professorAtivo.materia}</p>
                     </div>
                  </div>
               </div>

               {/* Agenda do Dia com Foco em Chamada */}
               <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black italic tracking-tighter">Agenda do Dia</h3>
                     <div className="flex gap-2">
                        <button className="p-3 bg-surface-container-low rounded-xl text-[#42a0f5] hover:bg-[#42a0f5]/10 transition-all"><Download size={18} /></button>
                        <button className="p-3 bg-surface-container-low rounded-xl text-[#42a0f5] hover:bg-[#42a0f5]/10 transition-all"><Share2 size={18} /></button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {professorAtivo.agendaDoDia.map((aula, i) => (
                        <div key={i} className="p-6 bg-surface-container-low/50 rounded-[2rem] border border-[#30363d] group hover:border-[#42a0f5]/30 transition-all">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <p className="text-[10px] font-black text-[#42a0f5] uppercase tracking-widest mb-1">{aula.horario}</p>
                                 <h4 className="text-xl font-black text-white italic truncate">{aula.materia}</h4>
                              </div>
                              <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-60">Sala {aula.numeroSala}</span>
                           </div>
                           
                           <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-black uppercase">
                                 <Users size={14} /> {aula.listaAlunos?.length || 0} Alunos Ensalados
                              </div>
                              <button 
                                onClick={() => setAulaParaChamada(aula)}
                                className="px-5 py-2.5 bg-[#42a0f5] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                              >
                                 <ClipboardCheck size={14} /> Fazer Chamada
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CHAMADA DIGITAL (OVERLAY) */}
      <AnimatePresence>
        {aulaParaChamada && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] w-full max-w-3xl rounded-[4rem] border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
            >
               <div className="p-10 bg-emerald-600 text-white relative">
                  <button onClick={() => { setAulaParaChamada(null); setChamada({}); }} className="absolute top-10 right-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">✕</button>
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center">
                        <ClipboardCheck size={40} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-1">Chamada Digital Ativa</p>
                        <h2 className="text-4xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                        <p className="text-sm font-bold opacity-80 mt-2">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 p-10 overflow-hidden flex flex-col bg-surface">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-2xl font-black italic tracking-tighter">Lista de Presença</h3>
                     <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black uppercase opacity-60">Presente</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500" />
                           <span className="text-[10px] font-black uppercase opacity-60">Ausente</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                     {(aulaParaChamada.listaAlunos || []).map((aluno: string, idx: number) => (
                        <div 
                           key={idx}
                           onClick={() => togglePresenca(aluno)}
                           className={cn(
                              "flex items-center justify-between p-5 rounded-[2rem] border-2 cursor-pointer transition-all",
                              chamada[aluno] === false ? "bg-red-500/5 border-red-500/20 shadow-inner" : 
                              chamada[aluno] === true ? "bg-emerald-500/5 border-emerald-500/20 shadow-md" : "bg-surface-container-low border-transparent"
                           )}
                        >
                           <div className="flex items-center gap-5">
                              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-[10px] font-black">
                                 {idx + 1}
                              </div>
                              <span className="text-lg font-black italic text-on-surface-variant">{aluno}</span>
                           </div>
                           <div className="flex gap-2">
                              {chamada[aluno] === true && <CheckCircle2 className="text-emerald-500" size={24} />}
                              {chamada[aluno] === false && <XCircle className="text-red-500" size={24} />}
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                     <button 
                        onClick={() => {
                           const nomes = aulaParaChamada.listaAlunos || [];
                           const novaChamada: Record<string, boolean> = {};
                           nomes.forEach((n: string) => novaChamada[n] = true);
                           setChamada(novaChamada);
                        }}
                        className="flex-1 py-4 bg-surface-container-low rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                     >
                        Presença para Todos
                     </button>
                     <button 
                        onClick={() => {
                           alert('Chamada salva com sucesso! Gerando relatório...');
                           setAulaParaChamada(null);
                        }}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all"
                     >
                        Finalizar e Salvar
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
