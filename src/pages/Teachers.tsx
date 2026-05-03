import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Search, Clock, MapPin, ChevronLeft, 
  CheckCircle2, XCircle, ClipboardCheck, Users,
  ArrowRight, Calendar, Download, Share2, GraduationCap, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function TeachersPage() {
  const { professores, gradeCompleta, languageLab, atividadesAfter } = useEscola();
  const [busca, setBusca] = useState('');
  const [profSelecionadoId, setProfSelecionadoId] = useState<string | null>(null);
  const [diaFiltro, setDiaFiltro] = useState('SEGUNDA');
  const [aulaParaChamada, setAulaParaChamada] = useState<any | null>(null);
  const [chamada, setChamada] = useState<Record<string, boolean>>({});
  const [buscaAlunos, setBuscaAlunos] = useState('');

  const professoresFiltrados = professores.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.materia.toLowerCase().includes(busca.toLowerCase())
  );

  const professorAtivo = professores.find(p => p.id === profSelecionadoId);

  const aulasDoDia = useMemo(() => {
    if (!professorAtivo) return [];
    return gradeCompleta.filter(aula => 
      aula.nomeProfessor.toLowerCase() === professorAtivo.nome.toLowerCase() &&
      aula.diaSemana.toUpperCase() === diaFiltro
    ).sort((a, b) => a.horario.localeCompare(b.horario));
  }, [professorAtivo, diaFiltro, gradeCompleta]);

  // Busca automática da lista de alunos (Ensalamento)
  const listaAlunosFinal = useMemo(() => {
    if (!aulaParaChamada) return [];
    
    // Tenta por vínculo direto
    if (aulaParaChamada.vinculado_id) {
      const fonte = languageLab.find(l => l.id === aulaParaChamada.vinculado_id) || 
                    atividadesAfter.find(a => a.id === aulaParaChamada.vinculado_id);
      if (fonte) return fonte.listaAlunos || [];
    }

    // Fallback por tipo/sala/horário
    const horarioInicio = aulaParaChamada.horario?.split('-')[0]?.trim() || '';
    if (aulaParaChamada.tipo === 'after_school') {
      const match = atividadesAfter.find(a => 
        a.local.includes(aulaParaChamada.numeroSala?.toString()) && 
        a.horarioInicio <= horarioInicio &&
        a.dias.includes(diaFiltro)
      );
      if (match) return match.listaAlunos || [];
    } else if (aulaParaChamada.tipo === 'language_lab') {
      const match = languageLab.find(l => 
        l.sala.includes(aulaParaChamada.numeroSala?.toString()) &&
        l.horarioInicio <= horarioInicio &&
        l.diaSemana === diaFiltro
      );
      if (match) return match.listaAlunos || [];
    }

    return aulaParaChamada.listaAlunos || [];
  }, [aulaParaChamada, languageLab, atividadesAfter, diaFiltro]);

  const alternarPresenca = (aluno: string) => {
    setChamada(prev => ({
      ...prev,
      [aluno]: prev[aluno] === undefined ? true : prev[aluno] === true ? false : true
    }));
  };

  // Sub-página: Chamada Digital (Lista Vertical)
  if (aulaParaChamada) {
    const alunos = listaAlunosFinal;
    const filtrados = alunos.filter((a: string) => a.toLowerCase().includes(buscaAlunos.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 bg-emerald-600 text-white relative">
             <button onClick={() => { setAulaParaChamada(null); setChamada({}); setBuscaAlunos(''); }} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-black text-[#10b981] rounded-2xl flex items-center justify-center"><ClipboardCheck size={24} /></div>
                <div>
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-80 mb-1">Frequência Vertical</p>
                   <h2 className="text-xl md:text-3xl font-black tracking-tighter italic leading-none">{aulaParaChamada.materia}</h2>
                   <p className="text-[10px] md:text-sm font-bold opacity-80 mt-1 italic">Sala {aulaParaChamada.numeroSala} • {aulaParaChamada.horario}</p>
                </div>
             </div>
          </div>
          <div className="p-6 md:p-8 space-y-6 bg-surface-container-lowest">
             <div className="flex items-center justify-between gap-4">
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-black uppercase opacity-60">P</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[8px] font-black uppercase opacity-60">F</span>
                   </div>
                </div>
                <div className="relative group w-48 md:w-64">
                   <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                   <input type="text" placeholder="Filtrar lista..." value={buscaAlunos} onChange={(e) => setBuscaAlunos(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/5 rounded-xl text-[10px] font-black outline-none" />
                </div>
             </div>
             
             {/* Lista Vertical de Alunos */}
             <div className="flex flex-col gap-2">
                {filtrados.map((aluno: string, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    key={aluno} onClick={() => alternarPresenca(aluno)}
                    className={cn("p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer group/item",
                      chamada[aluno] === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                      chamada[aluno] === false ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-black border-white/5 text-white/70 hover:border-white/20")}
                  >
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-black opacity-20">{i+1}</span>
                       <span className="text-sm font-black italic tracking-tight">{aluno}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       {chamada[aluno] === true && <CheckCircle2 size={18} />}
                       {chamada[aluno] === false && <XCircle size={18} />}
                       {chamada[aluno] === undefined && <div className="w-5 h-5 rounded-full border border-white/10 group-hover/item:border-white/20" />}
                    </div>
                  </motion.div>
                ))}
             </div>

             <div className="flex gap-4 pt-4 border-t border-white/5">
                <button onClick={() => { const n: any = {}; alunos.forEach((a: any) => n[a] = true); setChamada(n); }} className="flex-1 py-3 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/5">Todos</button>
                <button onClick={() => { alert('Salvo!'); setAulaParaChamada(null); }} className="flex-[2] py-3 bg-emerald-500 text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-glow-emerald flex items-center justify-center gap-2">Finalizar Chamada</button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Sub-página: Perfil do Professor (Lista Vertical de Aulas)
  if (professorAtivo) {
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
           <div className="p-6 md:p-8 bg-[#42a0f5] text-black relative">
              <button onClick={() => setProfSelecionadoId(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-black text-[#42a0f5] rounded-2xl flex items-center justify-center text-3xl font-black">{professorAtivo.nome[0]}</div>
                 <div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none">{professorAtivo.nome}</h2>
                    <p className="text-sm font-bold opacity-70 mt-1 italic">{professorAtivo.materia}</p>
                 </div>
              </div>
           </div>
           <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                 <h3 className="text-xl font-black italic tracking-tighter text-white">Cronograma</h3>
                 <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                    {DIAS_SEMANA.map(dia => (
                       <button key={dia} onClick={() => setDiaFiltro(dia)}
                         className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                           diaFiltro === dia ? "bg-[#42a0f5] text-black shadow-md" : "text-white/40 hover:bg-white/5")}>
                          {dia.slice(0, 3)}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Lista Vertical de Aulas */}
              <div className="flex flex-col gap-3">
                 {aulasDoDia.map((aula, i) => (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={i} onClick={() => setAulaParaChamada(aula)}
                      className="p-5 bg-[#0d0d0d] rounded-2xl border-2 border-white/5 hover:border-[#42a0f5] transition-all group cursor-pointer flex items-center justify-between shadow-premium"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-10 h-10 bg-black rounded-xl border border-white/5 flex items-center justify-center text-[10px] font-black text-[#42a0f5]">#{i+1}</div>
                          <div>
                             <p className="text-[8px] font-black text-[#42a0f5] uppercase tracking-[0.3em] mb-0.5">{aula.horario}</p>
                             <h4 className="text-base font-black text-white italic tracking-tighter group-hover:text-[#42a0f5]">{aula.materia}</h4>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="px-2 py-1 bg-black rounded-md border border-white/5 text-[8px] font-black uppercase opacity-60">Sala {aula.numeroSala}</div>
                          <ChevronRight size={18} className="text-[#42a0f5] opacity-0 group-hover:opacity-100 transition-all" />
                       </div>
                    </motion.div>
                 ))}
                 {aulasDoDia.length === 0 && (
                    <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Sem aulas.</div>
                 )}
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-xl">
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Corpo <span className="text-[#42a0f5]">Docente</span></h1>
           <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">Gestão de agendas e chamadas.</p>
        </div>
        <div className="relative group w-full lg:w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#42a0f5]" size={18} />
          <input type="text" placeholder="Achar professor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl text-white font-black text-xs focus:ring-4 focus:ring-[#42a0f5]/5 outline-none" />
        </div>
      </header>
      
      {/* Lista Vertical de Professores */}
      <div className="flex flex-col gap-3">
        {professoresFiltrados.map((prof) => (
          <motion.div key={prof.id} whileHover={{ x: 5 }} onClick={() => setProfSelecionadoId(prof.id)}
            className="p-5 rounded-2xl bg-[#0d0d0d] shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/50 transition-all cursor-pointer group flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-6 relative z-10">
               <div className="w-12 h-12 bg-black text-[#42a0f5] rounded-xl flex items-center justify-center text-xl font-black group-hover:bg-[#42a0f5] group-hover:text-black transition-all">{prof.nome[0]}</div>
               <div>
                  <h3 className="text-lg font-black text-white italic tracking-tighter leading-tight group-hover:text-[#42a0f5]">{prof.nome}</h3>
                  <span className="text-[8px] font-black text-[#42a0f5] uppercase tracking-widest">{prof.materia}</span>
               </div>
            </div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-black rounded-xl border border-white/5">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", prof.status === 'em_aula' ? "bg-emerald-500" : "bg-[#fbbf24]")} />
                  <span className="text-[10px] font-black text-white italic">{prof.status === 'em_aula' ? 'Em Aula' : 'Pausa'}</span>
               </div>
               <ChevronRight size={20} className="text-[#42a0f5] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
