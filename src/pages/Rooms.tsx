import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, UserCheck, ChevronDown, ClipboardCheck, Users, Clock, DoorOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala } from '../types';

const LISTA_DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, languageLab, atividadesAfter, horaAtual, periodos } = useEscola();
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [buscaAlunos, setBuscaAlunos] = useState('');

  const salasFiltradas = useMemo(() => {
    return salas.filter((sala) => {
      const coincideBusca = sala.nome.toLowerCase().includes(busca.toLowerCase()) || sala.numero.toString().includes(busca);
      return coincideBusca;
    });
  }, [salas, busca]);

  if (salaSelecionada) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8 pb-32"
      >
        {/* Header de Detalhes - Estilo Aba */}
        <div className="bg-[#0d1117] rounded-[3.5rem] border border-[#30363d] overflow-hidden shadow-2xl">
          <div className="p-10 bg-[#42a0f5] text-black flex flex-col md:flex-row items-center justify-between gap-8 relative">
             <button 
               onClick={() => setSalaSelecionada(null)}
               className="absolute top-8 right-8 w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"
             >
               <ChevronLeft size={24} className="mr-1" />
             </button>

             <div className="flex items-center gap-10">
                <div className="w-28 h-28 bg-black/10 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-inner">
                  {salaSelecionada.numero}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Ambiente & Ensalamento</p>
                  <h2 className="text-5xl font-black tracking-tighter italic leading-none">{salaSelecionada.nome}</h2>
                  <p className="text-lg font-bold opacity-70 mt-3 italic">{salaSelecionada.segmento}</p>
                </div>
             </div>

             <div className="flex gap-2 p-2 bg-black/5 rounded-[2rem] border border-black/10">
                {LISTA_DIAS.map(dia => (
                  <button
                    key={dia}
                    onClick={() => setDiaGrade(dia)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      diaGrade === dia ? "bg-black text-[#42a0f5] shadow-xl" : "text-black/40 hover:bg-black/5"
                    )}
                  >
                    {dia.slice(0, 3)}
                  </button>
                ))}
             </div>
          </div>

          <div className="p-10 space-y-10">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic tracking-tight text-white flex items-center gap-4">
                   <Clock className="text-[#42a0f5]" /> Grade de Horários
                </h3>
                <div className="relative group w-72">
                   <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5]" />
                   <input 
                    type="text"
                    placeholder="Filtrar alunos..."
                    value={buscaAlunos}
                    onChange={(e) => setBuscaAlunos(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-[#42a0f5]/10 shadow-inner outline-none"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {obterBlocosDeHorario(periodos).map(bloco => (
                  <BlocoHorarioSala 
                    key={bloco.indice}
                    bloco={bloco}
                    salaSelecionada={salaSelecionada}
                    diaGrade={diaGrade}
                    gradeCompleta={gradeCompleta}
                    languageLab={languageLab}
                    atividadesAfter={atividadesAfter}
                    buscaFiltro={buscaAlunos}
                  />
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-on-surface mb-3 italic">
            Salas <span className="text-[#42a0f5]">&</span> Ambientes
          </h1>
          <p className="text-on-surface-variant text-xl font-medium italic opacity-80">
            Selecione uma sala para visualizar o ensalamento completo e realizar chamadas.
          </p>
        </div>
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5] transition-colors" size={24} />
          <input
            type="text"
            placeholder="Pesquisar por número ou nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-surface-container-low border-none rounded-[2.5rem] text-on-surface font-black text-lg focus:ring-8 focus:ring-[#42a0f5]/5 shadow-2xl outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {salasFiltradas.map((sala) => {
          const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
          const ocupada = estadoSala?.estaOcupada || false;
          const aulaAtual = estadoSala?.aulaAtual;

          return (
            <motion.div
              key={sala.numero}
              whileHover={{ y: -12, scale: 1.02 }}
              onClick={() => setSalaSelecionada(sala)}
              className={cn(
                "bg-[#0d1117] rounded-[3.5rem] shadow-2xl p-10 cursor-pointer group border-2 transition-all relative overflow-hidden h-[340px] flex flex-col justify-between",
                ocupada ? "border-[#42a0f5]/40 shadow-[#42a0f5]/10" : "border-[#30363d] hover:border-[#42a0f5]/30"
              )}
            >
               <div className="flex justify-between items-start relative z-10">
                  <div className={cn(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-inner transition-colors",
                    ocupada ? "bg-[#42a0f5] text-black" : "bg-white/5 text-[#42a0f5] group-hover:bg-[#42a0f5] group-hover:text-black"
                  )}>
                    {sala.numero}
                  </div>
                  <div className={cn(
                    "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    ocupada ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" : "bg-white/5 text-on-surface-variant opacity-40"
                  )}>
                    {ocupada ? '● EM AULA' : 'LIVRE'}
                  </div>
               </div>

               <div className="relative z-10 mt-6">
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 italic group-hover:text-[#42a0f5] transition-colors">{sala.nome}</h3>
                  <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40">{sala.segmento}</p>
               </div>
               
               <div className="relative z-10 pt-6 border-t border-white/5">
                 {ocupada && aulaAtual ? (
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase text-[#42a0f5] tracking-widest mb-0.5">Professor</p>
                          <p className="text-sm font-bold text-white italic truncate max-w-[150px]">{aulaAtual.professor}</p>
                       </div>
                       <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                          <UserCheck size={18} className="text-[#42a0f5]" />
                       </div>
                    </div>
                 ) : (
                    <div className="flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Ver Grade</span>
                       <ChevronRight size={20} className="text-[#42a0f5] group-hover:translate-x-2 transition-transform" />
                    </div>
                 )}
               </div>

               {/* Efeito Visual */}
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#42a0f5]/5 rounded-full blur-[60px] group-hover:bg-[#42a0f5]/10 transition-all" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function BlocoHorarioSala({ bloco, salaSelecionada, diaGrade, gradeCompleta, languageLab, atividadesAfter, buscaFiltro }: any) {
  const [expandido, setExpandido] = useState(false);

  const range = `${bloco.inicio} - ${bloco.fim}`;
  const entradasDia = gradeCompleta.filter((e: any) => e.numeroSala === salaSelecionada.numero && e.diaSemana === diaGrade);
  const entradaRegular = entradasDia.find((e: any) => e.horario === range);
  
  const lab = languageLab.find((l: any) => l.sala.includes(salaSelecionada.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
  const after = atividadesAfter.find((a: any) => a.local.includes(salaSelecionada.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

  let entradaFinal: any = null;
  let alunosNoBloco: string[] = [];
  let tipo = 'regular';

  if (entradaRegular && (entradaRegular.tipo === 'after_school' || entradaRegular.tipo === 'language_lab')) {
     tipo = entradaRegular.tipo;
  } else if (after) tipo = 'after_school';
  else if (lab) tipo = 'language_lab';

  if (tipo === 'after_school' && (after || entradaRegular)) {
     entradaFinal = { materia: entradaRegular?.materia || after?.nome, prof: entradaRegular?.nomeProfessor || after?.nomeProfessor };
     alunosNoBloco = after?.listaAlunos || entradaRegular?.listaAlunos || [];
  } else if (tipo === 'language_lab' && (lab || entradaRegular)) {
     entradaFinal = { materia: entradaRegular?.materia || `Inglês: ${lab?.nivel}`, prof: entradaRegular?.nomeProfessor || lab?.professor };
     alunosNoBloco = lab?.listaAlunos || entradaRegular?.listaAlunos || [];
  } else if (entradaRegular) {
     entradaFinal = { materia: entradaRegular.materia, prof: entradaRegular.nomeProfessor };
     alunosNoBloco = entradaRegular.listaAlunos || [];
  }

  if (!entradaFinal) return (
     <div className="p-12 rounded-[3rem] bg-white/[0.02] border-2 border-dashed border-white/5 opacity-20 flex flex-col items-center justify-center gap-4 transition-all h-fit">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-2">{bloco.inicio} — {bloco.fim}</span>
        <p className="text-sm font-black uppercase tracking-[0.3em] italic">Disponível</p>
     </div>
  );

  const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(buscaFiltro.toLowerCase()));
  const isActive = entradaFinal.materia && entradaFinal.materia !== 'A DEFINIR';

  return (
     <motion.div 
       layout
       className={cn(
        "p-10 rounded-[3rem] border-2 transition-all flex flex-col gap-6 shadow-xl relative overflow-hidden group h-fit",
        !isActive ? "bg-white/[0.02] border-dashed border-white/5 opacity-20" :
        tipo === 'after_school' ? "bg-amber-500/[0.03] border-amber-500/20" : 
        tipo === 'language_lab' ? "bg-indigo-500/[0.03] border-indigo-500/20" : 
        "bg-white/[0.03] border-white/10",
        expandido && "border-[#42a0f5] bg-[#42a0f5]/5"
      )}
     >
        <div className="flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-[#42a0f5] animate-pulse shadow-[0_0_10px_rgba(66,160,245,0.5)]" : "bg-white/20")} />
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-50">{bloco.inicio} — {bloco.fim}</span>
           </div>
           {isActive && (
             <span className={cn(
               "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
               tipo === 'after_school' ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
               tipo === 'language_lab' ? "bg-indigo-500/20 text-indigo-500 border-indigo-500/20" : 
               "bg-[#42a0f5]/20 text-[#42a0f5] border-[#42a0f5]/20"
             )}>{tipo === 'regular' ? 'REGULAR' : tipo.replace('_', ' ').toUpperCase()}</span>
           )}
        </div>
        
        <div className="relative z-10">
           <h4 className="text-2xl font-black text-white italic tracking-tighter leading-none mb-2">{entradaFinal.materia}</h4>
           <div className="flex items-center gap-3 opacity-60">
              <UserCheck size={14} className="text-[#42a0f5]" />
              <p className="text-xs font-black italic">{entradaFinal.prof}</p>
           </div>
        </div>

        {isActive && (
          <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
             <button 
               onClick={() => setExpandido(!expandido)}
               className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#42a0f5] hover:opacity-80 transition-opacity"
             >
                <span className="flex items-center gap-2"><Users size={14} /> {alunosNoBloco.length} Alunos</span>
                <ChevronDown size={14} className={cn("transition-transform", expandido && "rotate-180")} />
             </button>
             
             <AnimatePresence>
               {expandido && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden space-y-4"
                 >
                    <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar grid gap-2">
                       {alunosFiltrados.length === 0 ? (
                          <p className="text-[10px] italic opacity-30 text-center py-4">Nenhum aluno encontrado.</p>
                       ) : (
                         alunosFiltrados.map((aluno, i) => (
                           <div key={i} className="text-[11px] font-black py-3 px-5 bg-white/[0.03] rounded-2xl flex items-center justify-between border border-white/5 hover:bg-[#42a0f5] hover:text-black transition-all">
                              <span className="italic">{aluno}</span>
                              <span className="text-[9px] opacity-30">#{i+1}</span>
                           </div>
                         ))
                       )}
                    </div>

                    <button 
                      onClick={() => alert('Abrindo painel de chamada para ' + entradaFinal.materia)}
                      className="w-full py-4 bg-[#42a0f5] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <ClipboardCheck size={16} /> Abrir Chamada
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}
     </motion.div>
  );
}
