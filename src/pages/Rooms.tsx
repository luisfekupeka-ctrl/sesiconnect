import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoorOpen, Clock, Users, GraduationCap, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala } from '../types';

const DIAS_SEMANA_NOMES: Record<string, string> = {
  'DOMINGO': 'Dom', 'SEGUNDA': 'Seg', 'TERÇA': 'Ter', 'QUARTA': 'Qua', 'QUINTA': 'Qui', 'SEXTA': 'Sex', 'SÁBADO': 'Sáb'
};
const LISTA_DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, languageLab, atividadesAfter, horaAtual, periodos } = useEscola();
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'livres' | 'ocupadas'>('todas');
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));
  const [salaGradeModal, setSalaGradeModal] = useState<Sala | null>(null);
  const [buscaAlunosModal, setBuscaAlunosModal] = useState('');

  const salasFiltradas = useMemo(() => {
    return salas.filter((sala) => {
      const coincideBusca = sala.nome.toLowerCase().includes(busca.toLowerCase()) || sala.numero.toString().includes(busca);
      const estadoSala = estadoEscola.salas.find((s) => s.numeroSala === sala.numero);
      const ocupada = estadoSala?.estaOcupada || false;
      const coincideStatus = filtroStatus === 'todas' || (filtroStatus === 'ocupadas' && ocupada) || (filtroStatus === 'livres' && !ocupada);
      return coincideBusca && coincideStatus;
    });
  }, [salas, busca, filtroStatus, estadoEscola.salas]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">Salas</h1>
          <p className="text-on-surface-variant text-lg font-medium">Consulte a grade semanal e o ensalamento nominal de cada ambiente.</p>
        </div>
        <div className="relative group w-full lg:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por número ou nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-[2rem] text-on-surface font-black text-sm focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {salasFiltradas.map((sala) => {
          const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
          const ocupada = estadoSala?.estaOcupada || false;

          return (
            <motion.div
              key={sala.numero}
              whileHover={{ y: -8 }}
              onClick={() => setSalaGradeModal(sala)}
              className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow p-8 cursor-pointer group border-2 border-transparent hover:border-primary/20 transition-all"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center text-3xl font-black">
                    {sala.numero}
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                    ocupada ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    {ocupada ? 'Ocupada' : 'Livre'}
                  </div>
               </div>
               <h3 className="text-2xl font-black text-on-surface tracking-tighter leading-tight mb-1 italic">{sala.nome}</h3>
               <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{sala.segmento}</p>
               
               <div className="mt-8 pt-6 border-t border-surface-container-low flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Ver Grade Semanal
                  </span>
                  <ChevronRight size={18} className="text-outline group-hover:translate-x-1 transition-transform" />
               </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {salaGradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] w-full max-w-5xl rounded-[3rem] border border-[#30363d] editorial-shadow overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-10 bg-primary text-on-surface-bright relative">
                <button onClick={() => setSalaGradeModal(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">✕</button>
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl font-black">
                     {salaGradeModal.numero}
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Consulta de Ensalamento Semanal</p>
                     <h2 className="text-4xl font-black tracking-tighter italic leading-none">{salaGradeModal.nome}</h2>
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col p-8 md:p-10 space-y-8">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-2 p-1.5 bg-surface rounded-2xl border border-[#30363d] overflow-x-auto no-scrollbar">
                       {LISTA_DIAS.map(dia => (
                          <button
                            key={dia}
                            onClick={() => setDiaGrade(dia)}
                            className={cn(
                              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                              diaGrade === dia ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-white/5"
                            )}
                          >
                            {dia}
                          </button>
                       ))}
                    </div>
                    <div className="relative group min-w-[280px]">
                       <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                       <input 
                        type="text"
                        placeholder="Pesquisar aluno na grade..."
                        value={buscaAlunosModal}
                        onChange={(e) => setBuscaAlunosModal(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-surface border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 shadow-inner"
                       />
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 custom-scrollbar">
                    {obterBlocosDeHorario(periodos).map(bloco => {
                       const range = `${bloco.inicio} - ${bloco.fim}`;
                       const entradasDia = gradeCompleta.filter(e => e.numeroSala === salaGradeModal.numero && e.diaSemana === diaGrade);
                       const entradaRegular = entradasDia.find(e => e.horario === range);
                       const lab = languageLab.find(l => l.sala.includes(salaGradeModal.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
                       const after = atividadesAfter.find(a => a.local.includes(salaGradeModal.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

                       let entradaFinal: any = null;
                       let alunosNoBloco: string[] = [];
                       let tipo = 'regular';

                       if (entradaRegular && (entradaRegular.tipo === 'after' || entradaRegular.tipo === 'laboratorio_idiomas')) {
                          tipo = entradaRegular.tipo === 'after' ? 'after' : 'language';
                       } else if (after) tipo = 'after';
                       else if (lab) tipo = 'language';

                       if (tipo === 'after' && (after || entradaRegular)) {
                          entradaFinal = { materia: entradaRegular?.materia || after?.nome, prof: entradaRegular?.nomeProfessor || after?.nomeProfessor };
                          alunosNoBloco = after?.listaAlunos || entradaRegular?.listaAlunos || [];
                       } else if (tipo === 'language' && (lab || entradaRegular)) {
                          entradaFinal = { materia: entradaRegular?.materia || `Inglês: ${lab?.nivel}`, prof: entradaRegular?.nomeProfessor || lab?.professor };
                          alunosNoBloco = lab?.listaAlunos || entradaRegular?.listaAlunos || [];
                       } else if (entradaRegular) {
                          entradaFinal = { materia: entradaRegular.materia, prof: entradaRegular.nomeProfessor };
                          alunosNoBloco = entradaRegular.listaAlunos || [];
                       }

                       if (!entradaFinal) return (
                          <div key={bloco.indice} className="p-6 rounded-[2rem] bg-surface/30 border border-[#30363d] opacity-30 flex flex-col gap-2">
                             <span className="text-[10px] font-black uppercase opacity-50">{bloco.inicio} — {bloco.fim}</span>
                             <p className="text-xs font-black uppercase">Sala Livre</p>
                          </div>
                       );

                       return (
                          <div key={bloco.indice} className={cn(
                            "p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4",
                            tipo === 'after' ? "bg-amber-500/5 border-amber-500/20" : 
                            tipo === 'language' ? "bg-indigo-500/5 border-indigo-500/20" : "bg-surface border-[#30363d]"
                          )}>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase opacity-40">{bloco.inicio} — {bloco.fim}</span>
                                <span className={cn(
                                  "text-[8px] font-black px-2 py-0.5 rounded-md",
                                  tipo === 'after' ? "bg-amber-500/20 text-amber-500" :
                                  tipo === 'language' ? "bg-indigo-500/20 text-indigo-500" : "bg-primary/20 text-primary"
                                )}>{tipo.toUpperCase()}</span>
                             </div>
                             <div>
                                <p className="text-lg font-black text-white italic truncate">{entradaFinal.materia}</p>
                                <p className="text-xs font-bold text-on-surface-variant">{entradaFinal.prof}</p>
                             </div>
                             
                             <div className="pt-4 border-t border-white/5 space-y-2">
                                <p className="text-[9px] font-black uppercase opacity-40">Alunos ({alunosNoBloco.length})</p>
                                <div className="max-h-[100px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                                   {alunosNoBloco
                                     .filter(a => a.toLowerCase().includes(buscaAlunosModal.toLowerCase()))
                                     .map((aluno, i) => (
                                       <div key={i} className="text-[9px] font-bold py-1.5 px-3 bg-white/5 rounded-xl">
                                          {aluno}
                                       </div>
                                   ))}
                                   {alunosNoBloco.length > 0 && buscaAlunosModal && alunosNoBloco.filter(a => a.toLowerCase().includes(buscaAlunosModal.toLowerCase())).length === 0 && (
                                      <p className="text-[8px] italic opacity-40 text-center py-2">Nenhum aluno encontrado.</p>
                                   )}
                                </div>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
