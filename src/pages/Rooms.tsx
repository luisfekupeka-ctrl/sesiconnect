import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoorOpen, Clock, Users, GraduationCap, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala, EntradaGradeSala } from '../types';
import { registrarAtrasoProfessor } from '../services/dataService';

const DIAS_SEMANA_NOMES: Record<string, string> = {
  'DOMINGO': 'Dom',
  'SEGUNDA': 'Seg',
  'TERÇA': 'Ter',
  'QUARTA': 'Qua',
  'QUINTA': 'Qui',
  'SEXTA': 'Sex',
  'SÁBADO': 'Sáb'
};

const LISTA_DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, languageLab, atividadesAfter, horaAtual, carregando, alunos } = useEscola();
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'livres' | 'ocupadas'>('todas');
  const [filtroSegmento, setFiltroSegmento] = useState<string>('todos');
  const [salaGradeModal, setSalaGradeModal] = useState<Sala | null>(null);
  const [reportando, setReportando] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));
  const [salaExpandida, setSalaExpandida] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'regular' | 'after' | 'language'>('regular');

  const blocos = obterBlocosDeHorario();

  const salasFiltradas = salas.filter((sala) => {
    const coincideBusca =
      sala.nome.toLowerCase().includes(busca.toLowerCase()) ||
      sala.numero.toString().includes(busca);

    const coincideSegmento =
      filtroSegmento === 'todos' || sala.segmento === filtroSegmento;

    const estadoSala = estadoEscola.salas.find((s) => s.numeroSala === sala.numero);
    const ocupada = estadoSala?.estaOcupada || false;

    const coincideStatus =
      filtroStatus === 'todas' ||
      (filtroStatus === 'ocupadas' && ocupada) ||
      (filtroStatus === 'livres' && !ocupada);

    return coincideBusca && coincideSegmento && coincideStatus;
  });

  const handleReportarAtraso = async (sala: Sala, estado: any) => {
    if (!estado?.estaOcupada) return;
    
    setReportando(sala.numero);
    const ok = await registrarAtrasoProfessor({
      sala: sala.numero,
      professor: estado.professorAtual || 'Desconhecido',
      materia: estado.materiaAtual || '—',
      turma: estado.turmaAtual || sala.ano
    });

    if (ok) {
      alert(`Atraso de ${estado.professorAtual} reportado com sucesso!`);
    }
    setReportando(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Cabeçalho */}
      <header className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">Salas</h1>
            <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
              Base principal do sistema. Grade completa de horários por sala com blocos de 45 minutos.
            </p>
          </div>

          {/* Busca */}
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar sala..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm placeholder:text-outline"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
            {(['todas', 'livres', 'ocupadas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filtroStatus === f ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {f === 'todas' ? 'Todas' : f === 'livres' ? 'Livres' : 'Ocupadas'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
            {['todos', '6º e 7º', '8º e 9º', 'Ensino Médio', 'Especializado'].map(seg => (
              <button
                key={seg}
                onClick={() => setFiltroSegmento(seg)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                  filtroSegmento === seg ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <GraduationCap size={12} />
                {seg === 'todos' ? 'Todos' : seg}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-outline-variant/20 mx-2 self-center hidden sm:block" />

          <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl border border-primary/10">
            {[
              { id: 'regular', label: 'Regular', icon: GraduationCap },
              { id: 'after', label: 'After School', icon: Clock },
              { id: 'language', label: 'Language Lab', icon: Users }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id as any)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === m.id ? "bg-primary text-on-surface-bright shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid de Salas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {salasFiltradas.map((sala) => {
            const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
            const ocupada = estadoSala?.estaOcupada || false;
            const expandida = salaExpandida === sala.numero;

            return (
              <motion.div
                layout
                key={sala.numero}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest rounded-[2rem] editorial-shadow overflow-hidden border border-transparent hover:border-primary/10 transition-all"
              >
                {/* Cabeçalho do card */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tighter text-primary">{sala.numero.toString().padStart(2, '0')}</span>
                      <span className="text-[10px] font-black text-outline uppercase">{sala.ano}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      ocupada ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {ocupada ? 'Ocupada' : 'Livre'}
                    </div>
                  </div>

                  <h4 className="font-black text-lg tracking-tight text-on-surface mb-1 leading-tight">
                    {estadoSala?.nomeSala || sala.nome}
                  </h4>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">
                    {estadoSala?.tipoBlocoAtual === 'after' ? 'Atividade Extra' : sala.segmento}
                  </p>

                  {/* Atividade por Modo */}
                  {(() => {
                    let ocupadaNoModo = false;
                    let infoAtividade: any = null;

                    if (viewMode === 'regular') {
                      ocupadaNoModo = ocupada;
                      infoAtividade = estadoSala ? {
                        materia: estadoSala.materiaAtual,
                        professor: estadoSala.professorAtual,
                        turma: estadoSala.turmaAtual,
                        fim: estadoSala.horarioFim
                      } : null;
                    } else if (viewMode === 'after') {
                      // Buscar se há atividade de After agora nesta sala
                      const diaSemana = obterDiaSemana(horaAtual);
                      const agoraStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
                      const minAgora = (horaAtual.getHours() * 60) + horaAtual.getMinutes();

                      const ativ = atividadesAfter.find(a => 
                        a.local.includes(sala.numero.toString()) && 
                        a.dias.includes(diaSemana) &&
                        minAgora >= ((parseInt(a.horarioInicio.split(':')[0]) * 60) + parseInt(a.horarioInicio.split(':')[1])) &&
                        minAgora < ((parseInt(a.horarioFim.split(':')[0]) * 60) + parseInt(a.horarioFim.split(':')[1]))
                      );

                      if (ativ) {
                        ocupadaNoModo = true;
                        infoAtividade = {
                          materia: ativ.nome,
                          professor: ativ.nomeProfessor,
                          turma: ativ.grupoAlunos,
                          fim: ativ.horarioFim
                        };
                      }
                    } else if (viewMode === 'language') {
                      const diaSemana = obterDiaSemana(horaAtual);
                      const agoraStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
                      const minAgora = (horaAtual.getHours() * 60) + horaAtual.getMinutes();

                      const lab = languageLab.find(l => 
                        l.sala.includes(sala.numero.toString()) && 
                        l.diaSemana === diaSemana &&
                        minAgora >= ((parseInt(l.horarioInicio.split(':')[0]) * 60) + parseInt(l.horarioInicio.split(':')[1])) &&
                        minAgora < ((parseInt(l.horarioFim.split(':')[0]) * 60) + parseInt(l.horarioFim.split(':')[1]))
                      );

                      if (lab) {
                        ocupadaNoModo = true;
                        infoAtividade = {
                          materia: `Inglês: ${lab.nivel}`,
                          professor: lab.professor,
                          turma: lab.turma,
                          fim: lab.horarioFim
                        };
                      }
                    }

                    if (!ocupadaNoModo || !infoAtividade) return null;

                    return (
                      <div className={cn(
                        "p-4 rounded-xl space-y-2 mb-4",
                        viewMode === 'after' ? "bg-amber-500/10 border border-amber-500/20" : 
                        viewMode === 'language' ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-primary/5"
                      )}>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className={viewMode === 'after' ? "text-amber-600" : viewMode === 'language' ? "text-indigo-600" : "text-primary"} />
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            viewMode === 'after' ? "text-amber-600" : viewMode === 'language' ? "text-indigo-600" : "text-primary"
                          )}>
                            {viewMode === 'regular' ? 'Aula Regular' : viewMode === 'after' ? 'After School' : 'Language Lab'}
                          </span>
                        </div>
                        <p className="text-sm font-black text-on-surface">{infoAtividade.materia}</p>
                        <div className="flex items-center gap-2">
                          <Users size={11} className="text-on-surface-variant" />
                          <span className="text-[10px] font-bold text-on-surface-variant">{infoAtividade.professor}</span>
                        </div>
                        <span className="text-[9px] font-bold text-on-surface-variant">{infoAtividade.turma} • até {infoAtividade.fim}</span>
                      </div>
                    );
                  })()}

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSalaGradeModal(sala)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all"
                    >
                      <Clock size={14} />
                      Grade
                    </button>
                    <button 
                      onClick={() => handleReportarAtraso(sala, estadoSala)}
                      disabled={!ocupada || reportando === sala.numero}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        !ocupada ? "bg-surface-container-low text-outline cursor-not-allowed opacity-50" : 
                        "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}
                    >
                      <AlertTriangle size={12} />
                      {reportando === sala.numero ? '...' : 'Atraso'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal de Grade (Pop-up) */}
      <AnimatePresence>
        {salaGradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-md"
              onClick={() => setSalaGradeModal(null)}
            />
            <motion.div
              layoutId={`modal-${salaGradeModal.numero}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header Modal */}
              <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                      Sala {salaGradeModal.numero}
                    </span>
                    <span className="text-[10px] font-bold text-outline uppercase">{salaGradeModal.segmento}</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter text-on-surface">{salaGradeModal.nome}</h3>
                </div>
                <button 
                  onClick={() => setSalaGradeModal(null)}
                  className="w-12 h-12 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <Search className="rotate-45" size={24} />
                </button>
              </div>

              {/* Seletor de Dia */}
              <div className="px-8 py-4 bg-surface-container-lowest flex gap-2 overflow-x-auto no-scrollbar">
                {LISTA_DIAS.map(dia => (
                  <button
                    key={dia}
                    onClick={() => setDiaGrade(dia)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
                      diaGrade === dia ? "bg-primary text-on-surface-bright shadow-xl shadow-primary/20" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    {DIAS_SEMANA_NOMES[dia]}
                  </button>
                ))}
              </div>

              {/* Conteúdo Grade */}
              <div className="p-8 overflow-y-auto flex-1 bg-surface-container-lowest/50">
                {viewMode === 'regular' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {obterBlocosDeHorario().map(bloco => {
                      const range = `${bloco.inicio} - ${bloco.fim}`;
                      const entradasDia = gradeCompleta.filter(e => e.numeroSala === salaGradeModal.numero && e.diaSemana === diaGrade);
                      const entradaRegular = entradasDia.find(e => e.horario === range);
                      
                      const lab = languageLab.find(l => l.sala.includes(salaGradeModal.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
                      const after = atividadesAfter.find(a => a.local.includes(salaGradeModal.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

                      let entradaFinal: any = null;
                      let labelEnsalamento = '';
                      let listaAlunos: string = '';
                      let tipoBloco = 'regular';

                      // Determina o tipo a partir da grade, se existir
                      if (entradaRegular) {
                        tipoBloco = entradaRegular.tipo === 'after' ? 'after' : entradaRegular.tipo === 'laboratorio_idiomas' ? 'language' : 'regular';
                      } else {
                        if (after) tipoBloco = 'after';
                        else if (lab) tipoBloco = 'language';
                      }

                      if (tipoBloco === 'after' && (after || entradaRegular)) {
                        const prof = entradaRegular ? entradaRegular.nomeProfessor : after?.nomeProfessor;
                        const mat = entradaRegular ? entradaRegular.materia : after?.nome;
                        entradaFinal = { materia: mat, nomeProfessor: prof };
                        labelEnsalamento = after ? `After School • ${after.categoria}` : 'After School';
                        
                        if (after && after.listaAlunos && after.listaAlunos.length > 0) {
                          const alunosDoAfter = alunos.filter(a => after.listaAlunos.includes(a.id));
                          listaAlunos = `${alunosDoAfter.length} alunos inscritos: ${alunosDoAfter.map(a => a.nome.split(' ')[0]).join(', ')}`;
                        } else {
                          listaAlunos = 'Nenhum aluno nominalmente matriculado nesta atividade.';
                        }
                      } else if (tipoBloco === 'language' && (lab || entradaRegular)) {
                        const prof = entradaRegular ? entradaRegular.nomeProfessor : lab?.professor;
                        const mat = entradaRegular ? entradaRegular.materia : `Language Lab - ${lab?.nivel}`;
                        entradaFinal = { materia: mat, nomeProfessor: prof };
                        labelEnsalamento = lab ? `Language Lab • Nível ${lab.nivel}` : 'Language Lab';
                        
                        if (lab && lab.listaAlunos && lab.listaAlunos.length > 0) {
                          const alunosDoLab = alunos.filter(a => lab.listaAlunos.includes(a.id));
                          listaAlunos = `${alunosDoLab.length} alunos matriculados: ${alunosDoLab.map(a => a.nome.split(' ')[0]).join(', ')}`;
                        } else {
                          listaAlunos = 'Nenhum aluno nominalmente matriculado neste nível.';
                        }
                      } else if (entradaRegular) {
                        entradaFinal = entradaRegular;
                        if (entradaRegular.turma && entradaRegular.turma !== 'A DEFINIR') {
                          const alunosDaTurma = alunos.filter(a => a.turma === entradaRegular.turma || a.ano === entradaRegular.turma);
                          labelEnsalamento = `Ensalamento: ${entradaRegular.turma}`;
                          listaAlunos = alunosDaTurma.length > 0 
                            ? `${alunosDaTurma.length} alunos: ${alunosDaTurma.map(a => a.nome.split(' ')[0]).join(', ')}`
                            : 'Nenhum aluno cadastrado nesta turma';
                        }
                      }

                      const isAgora = estadoEscola.indiceBlocoAtual === bloco.indice && diaGrade === obterDiaSemana(horaAtual);

                      return (
                        <div key={bloco.indice} className={cn(
                          "p-5 rounded-3xl border-2 transition-all",
                          isAgora ? "bg-primary border-primary text-on-surface-bright shadow-xl shadow-primary/10" : 
                          entradaFinal ? (tipoBloco === 'after' ? 'bg-amber-500/10 border-amber-500/20' : tipoBloco === 'language' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-surface-container-low border-transparent shadow-sm') : "bg-surface-container-low/30 border-transparent opacity-40"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={cn("text-[10px] font-mono font-black", isAgora ? "text-on-surface-bright/60" : "text-outline")}>{bloco.inicio} — {bloco.fim}</span>
                            {isAgora && <div className="w-2 h-2 rounded-full bg-surface-container-low animate-pulse" />}
                          </div>
                          <p className={cn("text-sm font-black mb-1", isAgora ? "text-on-surface-bright" : (tipoBloco === 'after' ? 'text-amber-700' : tipoBloco === 'language' ? 'text-indigo-700' : 'text-on-surface'))}>
                            {entradaFinal?.materia || 'Sala Livre'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Users size={12} className={isAgora ? "text-on-surface-bright/60" : "text-on-surface-variant"} />
                            <p className={cn("text-[10px] font-bold", isAgora ? "text-on-surface-bright/80" : "text-on-surface-variant")}>
                              {entradaFinal?.nomeProfessor || '—'}
                            </p>
                          </div>
                          {labelEnsalamento && (
                            <div className="mt-3 pt-3 border-t border-outline-variant/10">
                              <p className={cn("text-[9px] font-black uppercase tracking-widest", isAgora ? "text-on-surface-bright/90" : (tipoBloco === 'after' ? 'text-amber-600' : tipoBloco === 'language' ? 'text-indigo-600' : 'text-primary'))}>
                                {labelEnsalamento}
                              </p>
                              <p className={cn("mt-1 text-[8px] font-medium leading-relaxed line-clamp-3", isAgora ? "text-on-surface-bright/70" : "text-on-surface-variant")}>
                                {listaAlunos}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : viewMode === 'after' ? (
                  <div className="space-y-4">
                    {atividadesAfter
                      .filter(a => a.local.includes(salaGradeModal.numero.toString()) && a.dias.includes(diaGrade))
                      .map(ativ => (
                        <div key={ativ.id} className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                              <Clock size={24} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-on-surface">{ativ.nome}</p>
                              <p className="text-xs text-on-surface-variant font-bold">{ativ.categoria} • {ativ.grupoAlunos}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{ativ.horarioInicio} — {ativ.horarioFim}</p>
                              <p className="text-[10px] text-on-surface-variant font-bold uppercase">{ativ.nomeProfessor}</p>
                            </div>
                            <div className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              {ativ.quantidadeAlunos} Alunos
                            </div>
                          </div>
                        </div>
                      ))}
                    {atividadesAfter.filter(a => a.local.includes(salaGradeModal.numero.toString()) && a.dias.includes(diaGrade)).length === 0 && (
                      <div className="py-20 text-center opacity-30">
                        <Clock size={48} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Sem atividades After School nesta sala</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {languageLab
                      .filter(l => l.sala.includes(salaGradeModal.numero.toString()) && l.diaSemana === diaGrade)
                      .map(lab => (
                        <div key={lab.id} className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
                              <Users size={24} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-on-surface">{lab.turma}</p>
                              <p className="text-xs text-on-surface-variant font-bold">Language Lab • {lab.nivel}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{lab.horarioInicio} — {lab.horarioFim}</p>
                              <p className="text-[10px] text-on-surface-variant font-bold uppercase">{lab.professor}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    {languageLab.filter(l => l.sala.includes(salaGradeModal.numero.toString()) && l.diaSemana === diaGrade).length === 0 && (
                      <div className="py-20 text-center opacity-30">
                        <Users size={48} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Sem aulas de Inglês nesta sala</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
