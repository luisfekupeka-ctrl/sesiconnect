import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, DoorOpen, User, BookOpen, Clock, 
  Trash2, Copy, Check, AlertCircle, RefreshCw, ChevronLeft, Shield, Zap, LayoutGrid,
  Plus, Coffee, X, Palette, Edit3, ArrowDown, ArrowUp, ToggleLeft, ToggleRight,
  Users, Search, UserPlus
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeSala, salvarProfessorCMS } from '../services/dataService';
import { cn } from '../lib/utils';
import { Sala, EntradaGradeSala } from '../types';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

const PALETA_CORES = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#D946EF', '#0EA5E9', '#84CC16', '#E11D48', '#7C3AED',
  '#059669', '#DC2626', '#2563EB', '#CA8A04', '#9333EA',
  '#DB2777', '#0891B2', '#EA580C', '#0D9488', '#4F46E5',
  '#C026D3', '#0284C7', '#65A30D', '#BE123C', '#6D28D9',
];

const MATERIAS_PADRAO = [
  'Matemática', 'Português', 'Ciências', 'História', 'Geografia',
  'Educação Física', 'Artes', 'Inglês', 'Espanhol', 'Redação',
  'Física', 'Química', 'Biologia', 'Filosofia', 'Sociologia',
  'Literatura', 'Robótica', 'Informática', 'Música', 'Empreendedorismo',
];

interface LinhaGrade {
  id: string;
  horarioInicio: string;
  horarioFim: string;
  nome: string; 
  tipo: 'aula' | 'intervalo' | 'almoco' | 'after' | 'laboratorio_idiomas';
  materia: string;
  professor: string;
  listaAlunos: string[];
}

export default function ScheduleEditor() {
  const { 
    salas, gradeCompleta, periodos, 
    professoresCMS, atualizar, locaisCMS, alunos
  } = useEscola();

  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [turmaEditavel, setTurmaEditavel] = useState('A DEFINIR');
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('6e7');

  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [modalCopiaSalasAberto, setModalCopiaSalasAberto] = useState(false);
  const [modalMateriasAberto, setModalMateriasAberto] = useState(false);
  const [modalCoresAberto, setModalCoresAberto] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');

  const [materias, setMaterias] = useState<string[]>(() => {
    try { const s = localStorage.getItem('sesi_materias'); return s ? JSON.parse(s) : MATERIAS_PADRAO; } catch { return MATERIAS_PADRAO; }
  });

  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [dropdownProfAberto, setDropdownProfAberto] = useState<string | null>(null);
  const [filtroProf, setFiltroProf] = useState('');

  // Estado para visualização do Ensalamento Lateral
  const [linhaFocada, setLinhaFocada] = useState<string | null>(null);
  const [buscaAluno, setBuscaAluno] = useState('');

  useEffect(() => { localStorage.setItem('sesi_materias', JSON.stringify(materias)); }, [materias]);
  const listaProfessoresNomes = professoresCMS.map(p => p.nome).sort();

  const getCorProf = useCallback((nome: string) => {
    const prof = professoresCMS.find(p => p.nome === nome);
    if (prof) return prof.cor;
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
  }, [professoresCMS]);

  const atualizarCorProfessor = async (nome: string, cor: string) => {
    const ok = await salvarProfessorCMS({ nome, cor });
    if (ok) atualizar();
  };

  useEffect(() => {
    if (!salaSelecionada && salas.length > 0) setSalaSelecionada(salas[0]);
  }, [salas, salaSelecionada]);

  useEffect(() => {
    if (salaSelecionada) {
      setTurmaEditavel(salaSelecionada.ano || 'A DEFINIR');
      const periodosFiltrados = periodos.filter(p => p.segmento === segmentoSelecionado);
      const periodosAlvo = periodosFiltrados.length > 0 ? periodosFiltrados : periodos;

      const novasLinhas: LinhaGrade[] = periodosAlvo.map((p, i) => ({
        id: `l-${i}`,
        horarioInicio: p.horarioInicio.slice(0, 5),
        horarioFim: p.horarioFim.slice(0, 5),
        nome: p.nome,
        tipo: p.tipo as any,
        materia: p.tipo === 'intervalo' ? 'INTERVALO' : p.tipo === 'almoco' ? 'ALMOÇO' : '',
        professor: p.tipo === 'intervalo' || p.tipo === 'almoco' ? '—' : '',
        listaAlunos: []
      }));

      const existentes = gradeCompleta.filter(
        e => e.numeroSala === salaSelecionada.numero && e.diaSemana === diaSelecionado
      );

      existentes.forEach(e => {
        const partes = e.horario.split('-').map(t => t.trim().slice(0, 5));
        const idx = novasLinhas.findIndex(l => l.horarioInicio === partes[0] && l.horarioFim === partes[1]);
        if (idx >= 0) {
          novasLinhas[idx].materia = e.materia;
          novasLinhas[idx].professor = e.nomeProfessor;
          novasLinhas[idx].listaAlunos = e.listaAlunos || [];
          if (e.materia === 'INTERVALO') novasLinhas[idx].tipo = 'intervalo';
          else if (e.materia === 'ALMOÇO') novasLinhas[idx].tipo = 'almoco';
          else if (e.tipo === 'laboratorio_idiomas') novasLinhas[idx].tipo = 'laboratorio_idiomas';
          else if (e.tipo === 'after') novasLinhas[idx].tipo = 'after';
          else novasLinhas[idx].tipo = 'aula';
        }
      });

      setLinhas(novasLinhas);
    }
  }, [salaSelecionada, diaSelecionado, gradeCompleta, periodos, segmentoSelecionado]);

  const atualizarLinha = (id: string, campo: keyof LinhaGrade, valor: any) => {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const toggleIntervalo = (id: string) => {
    setLinhas(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (l.tipo === 'aula' || l.tipo === 'after' || l.tipo === 'laboratorio_idiomas') {
        return { ...l, tipo: 'intervalo', materia: 'INTERVALO', professor: '—', listaAlunos: [] };
      } else {
        return { ...l, tipo: 'aula', materia: '', professor: '', listaAlunos: [] };
      }
    }));
  };

  const handleSalvar = async () => {
    if (!salaSelecionada) return;
    setSalvando(true); setMensagem(null);
    const entradas: Omit<EntradaGradeSala, 'id'>[] = linhas.map(l => ({
      anoTurma: turmaEditavel,
      numeroSala: salaSelecionada.numero,
      nomeSala: salaSelecionada.nome,
      diaSemana: diaSelecionado,
      horario: `${l.horarioInicio} - ${l.horarioFim}`,
      nomeProfessor: l.professor || '—',
      turma: turmaEditavel,
      materia: l.materia || 'A DEFINIR',
      tipo: l.tipo === 'laboratorio_idiomas' ? 'laboratorio_idiomas' : l.tipo === 'after' ? 'after' : 'regular',
      listaAlunos: l.listaAlunos
    }));
    const ok = await salvarGradeSala(entradas);
    setMensagem(ok ? { tipo: 'sucesso', texto: 'Grade salva!' } : { tipo: 'erro', texto: 'Erro ao salvar.' });
    if (ok) atualizar();
    setSalvando(false);
  };

  const linhaAtiva = useMemo(() => linhas.find(l => l.id === linhaFocada), [linhaFocada, linhas]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-32" onClick={() => { setDropdownAberto(null); setDropdownProfAberto(null); }}>
      
      {/* Coluna Esquerda: O Editor */}
      <div className="flex-1 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-3">
              <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-tighter">Grade Editável</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">Editor <span className="text-primary">de Horários</span></h1>
            <p className="text-on-surface-variant font-medium mt-1 text-sm opacity-60">Configuração de aulas, professores e ensalamento nominal.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModalCoresAberto(true)} className="btn-secondary"><Palette size={14} /></button>
            <button onClick={() => setModalMateriasAberto(true)} className="btn-secondary"><BookOpen size={14} /></button>
            <button onClick={handleSalvar} disabled={!salaSelecionada || salvando}
              className={cn("btn-primary shadow-xl shadow-primary/20", salvando && "opacity-50 animate-pulse")}>
              {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </header>

        {/* Seletores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-[#30363d] space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><DoorOpen size={14} /> Seleção de Ambiente</label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {salas.map(s => (
                <button key={s.numero} onClick={() => setSalaSelecionada(s)}
                  className={cn("aspect-square rounded-xl flex items-center justify-center transition-all border-2",
                    salaSelecionada?.numero === s.numero ? "bg-primary border-primary text-black font-black scale-105" : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-primary/20")}>
                  {s.numero}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-[#30363d] flex flex-col justify-between">
            <div className="flex gap-2 mb-4">
               {DIAS_SEMANA.map(dia => (
                  <button key={dia} onClick={() => setDiaSelecionado(dia)}
                    className={cn("flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                      diaSelecionado === dia ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-low border-transparent text-on-surface-variant")}>
                    {dia.slice(0, 3)}
                  </button>
               ))}
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Segmento Selecionado</span>
               <div className="flex gap-2">
                  {['6e7', '8e9', 'medio'].map(s => (
                    <button key={s} onClick={() => setSegmentoSelecionado(s)}
                      className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        segmentoSelecionado === s ? "bg-primary text-black" : "bg-surface-container-low text-on-surface-variant")}>
                      {s.toUpperCase()}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="bg-surface-container-lowest rounded-[3rem] border border-[#30363d] overflow-hidden">
          {salaSelecionada && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary text-black rounded-[1.5rem] flex items-center justify-center text-3xl font-black italic">{salaSelecionada.numero}</div>
                  <div>
                    <h2 className="text-2xl font-black italic leading-none">{salaSelecionada.nome}</h2>
                    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.3em] mt-2">{diaSelecionado}</p>
                  </div>
                </div>
                <div className="text-right">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Turma Base</label>
                  <input type="text" value={turmaEditavel} onChange={e => setTurmaEditavel(e.target.value)}
                    className="bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-black text-primary text-right w-40 outline-none" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <button onClick={() => setModalCopiaAberto(true)} className="px-5 py-3 bg-surface-container-low rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2 border border-transparent hover:border-primary/20"><Copy size={12} /> Copiar Dias</button>
                <button onClick={() => setModalCopiaSalasAberto(true)} className="px-5 py-3 bg-surface-container-low rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2 border border-transparent hover:border-primary/20"><LayoutGrid size={12} /> Aplicar Salas</button>
              </div>

              <div className="space-y-2">
                {linhas.map((linha, idx) => {
                  const ehIntervalo = linha.tipo === 'intervalo' || linha.tipo === 'almoco';
                  const profNome = linha.professor && linha.professor !== '—' ? linha.professor : '';
                  const profCor = profNome ? getCorProf(profNome) : 'transparent';
                  const focado = linhaFocada === linha.id;

                  return (
                    <motion.div key={linha.id}
                      onClick={() => setLinhaFocada(linha.id)}
                      className={cn("rounded-2xl transition-all border-2 overflow-visible",
                        focado ? "border-primary bg-primary/5" : ehIntervalo ? "bg-amber-500/5 border-transparent" : "bg-[#0d1117] border-transparent hover:border-white/5")}
                    >
                      <div className="grid grid-cols-[50px_1fr] md:grid-cols-[50px_80px_10px_80px_120px_1fr_1fr_40px] items-center gap-4 p-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0",
                          ehIntervalo ? "bg-amber-500/20 text-amber-500" : "bg-surface-container-high text-on-surface-variant")}>
                          {ehIntervalo ? <Coffee size={16} /> : idx + 1}
                        </div>

                        <input type="time" value={linha.horarioInicio} onChange={e => atualizarLinha(linha.id, 'horarioInicio', e.target.value)}
                          className="bg-transparent border-none text-xs font-black text-center py-2 outline-none w-full" />
                        <span className="text-[10px] text-on-surface-variant/20 font-black text-center hidden md:block">—</span>
                        <input type="time" value={linha.horarioFim} onChange={e => atualizarLinha(linha.id, 'horarioFim', e.target.value)}
                          className="bg-transparent border-none text-xs font-black text-center py-2 outline-none w-full" />

                        {ehIntervalo ? (
                           <div className="col-span-1 md:col-span-3">
                              <input type="text" value={linha.materia} onChange={e => atualizarLinha(linha.id, 'materia', e.target.value)}
                                className="w-full bg-amber-500/10 rounded-xl py-3 px-4 text-[10px] font-black text-amber-600 uppercase tracking-widest text-center outline-none" />
                           </div>
                        ) : (
                           <>
                              <select value={linha.tipo} onChange={e => atualizarLinha(linha.id, 'tipo', e.target.value as any)}
                                className="bg-surface-container-low border-none rounded-xl py-3 px-2 text-[10px] font-black uppercase outline-none cursor-pointer">
                                <option value="aula">Regular</option>
                                <option value="laboratorio_idiomas">Language</option>
                                <option value="after">After</option>
                              </select>
                              
                              <div className="relative">
                                 <input type="text" placeholder="Matéria..." value={linha.materia}
                                   onChange={e => atualizarLinha(linha.id, 'materia', e.target.value)}
                                   onFocus={() => { setDropdownAberto(linha.id); setDropdownProfAberto(null); }}
                                   className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-black outline-none italic" />
                                 {dropdownAberto === linha.id && (
                                   <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2">
                                     {materias.filter(m => !linha.materia || m.toLowerCase().includes(linha.materia.toLowerCase())).map(m => (
                                       <button key={m} onClick={() => { atualizarLinha(linha.id, 'materia', m); setDropdownAberto(null); }}
                                         className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary/10 rounded-lg">{m}</button>
                                     ))}
                                   </div>
                                 )}
                              </div>

                              <div className="relative">
                                 <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: profCor }} />
                                 <input type="text" placeholder="Professor..." value={linha.professor === '—' ? '' : linha.professor}
                                   onChange={e => { atualizarLinha(linha.id, 'professor', e.target.value); setFiltroProf(e.target.value); }}
                                   onFocus={() => { setDropdownProfAberto(linha.id); setDropdownAberto(null); setFiltroProf(linha.professor === '—' ? '' : linha.professor); }}
                                   className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-10 pr-4 text-xs font-black outline-none italic" />
                                 {dropdownProfAberto === linha.id && (
                                   <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2">
                                     {listaProfessoresNomes.filter(n => !filtroProf || n.toLowerCase().includes(filtroProf.toLowerCase())).map(nome => (
                                       <button key={nome} onClick={() => { atualizarLinha(linha.id, 'professor', nome); setDropdownProfAberto(null); }}
                                         className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary/10 rounded-lg flex items-center gap-3">
                                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCorProf(nome) }} />
                                         {nome}
                                       </button>
                                     ))}
                                   </div>
                                 )}
                              </div>
                           </>
                        )}
                        
                        <div className="flex justify-end gap-1">
                           <button onClick={() => toggleIntervalo(linha.id)} className={cn("p-2 rounded-lg transition-all", ehIntervalo ? "text-amber-500" : "text-white/10 hover:text-amber-500")}><Coffee size={16} /></button>
                           <button onClick={() => setLinhaFocada(linha.id)} className={cn("p-2 rounded-lg transition-all", focado ? "text-primary" : "text-white/10 hover:text-primary")}><Users size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Sidebar de Ensalamento Nominal */}
      <div className="w-full lg:w-[400px] shrink-0">
         <AnimatePresence mode="wait">
            {linhaAtiva && (
               <motion.div
                  key={linhaAtiva.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-surface-container-lowest p-8 rounded-[3.5rem] border border-primary/30 shadow-2xl sticky top-8 flex flex-col h-[calc(100vh-160px)]"
               >
                  <div className="mb-8">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-primary text-black rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20">
                           {linhas.indexOf(linhaAtiva) + 1}
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ensalamento Nominal</p>
                           <h3 className="text-2xl font-black italic tracking-tighter text-white">{linhaAtiva.materia || 'A Definir'}</h3>
                        </div>
                     </div>
                     <p className="text-xs font-bold text-on-surface-variant px-2">{linhaAtiva.horarioInicio} - {linhaAtiva.horarioFim} • {linhaAtiva.professor || 'Sem Professor'}</p>
                  </div>

                  {/* Gerenciamento de Alunos */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="relative group mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-all" size={16} />
                        <input 
                           type="text"
                           placeholder="Pesquisar para adicionar..."
                           value={buscaAluno}
                           onChange={(e) => setBuscaAluno(e.target.value)}
                           className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-[10px] font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />

                        {/* Dropdown de Adição Rápida */}
                        {buscaAluno.length >= 2 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high rounded-2xl shadow-2xl z-[60] border border-white/5 max-h-48 overflow-y-auto p-2">
                              {alunos
                                 .filter(a => a.nome.toLowerCase().includes(buscaAluno.toLowerCase()) && !linhaAtiva.listaAlunos.includes(a.nome))
                                 .slice(0, 5)
                                 .map(a => (
                                    <button 
                                       key={a.id}
                                       onClick={() => {
                                          const novaLista = [...linhaAtiva.listaAlunos, a.nome];
                                          atualizarLinha(linhaAtiva.id, 'listaAlunos', novaLista);
                                          setBuscaAluno('');
                                       }}
                                       className="w-full flex items-center justify-between p-3 hover:bg-primary/10 rounded-xl transition-all"
                                    >
                                       <span className="text-[10px] font-black text-white italic">{a.nome}</span>
                                       <UserPlus size={14} className="text-primary" />
                                    </button>
                                 ))
                              }
                           </div>
                        )}
                     </div>

                     <div className="flex items-center justify-between px-2 mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Alunos na Aula ({linhaAtiva.listaAlunos.length})</span>
                        <button 
                          onClick={() => atualizarLinha(linhaAtiva.id, 'listaAlunos', [])}
                          className="text-[9px] font-black uppercase text-red-500 hover:underline">Limpar</button>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {linhaAtiva.listaAlunos.map((aluno, i) => (
                           <div key={i} className="flex items-center justify-between p-4 bg-[#0d1117] rounded-2xl border border-transparent hover:border-primary/20 group transition-all">
                              <span className="text-xs font-black text-white italic truncate">{aluno}</span>
                              <button 
                                onClick={() => {
                                   const novaLista = linhaAtiva.listaAlunos.filter(a => a !== aluno);
                                   atualizarLinha(linhaAtiva.id, 'listaAlunos', novaLista);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                 <X size={14} />
                              </button>
                           </div>
                        ))}
                        {linhaAtiva.listaAlunos.length === 0 && (
                           <div className="py-20 text-center opacity-10 italic font-black text-xs uppercase tracking-widest">
                              Nenhum aluno neste horário
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            )}

            {!linhaAtiva && (
               <div className="bg-surface-container-lowest/50 p-12 rounded-[3.5rem] border border-dashed border-white/5 h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-on-surface-variant/20">
                     <Users size={40} />
                  </div>
                  <div>
                     <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest italic leading-relaxed">
                        Selecione um horário <br/> para gerenciar o ensalamento
                     </p>
                  </div>
               </div>
            )}
         </AnimatePresence>
      </div>

      {/* Modais Antigos Mantidos */}
      <AnimatePresence>
        {modalCoresAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setModalCoresAberto(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-[#30363d] max-w-lg w-full space-y-8" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black tracking-tighter italic">Cores dos Professores</h3>
              <div className="max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {professoresCMS.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xl" style={{ backgroundColor: p.cor }}>{p.nome.charAt(0)}</div>
                    <p className="flex-1 text-sm font-black italic">{p.nome}</p>
                    <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                      {PALETA_CORES.slice(0, 10).map(cor => (
                        <button key={cor} onClick={() => atualizarCorProfessor(p.nome, cor)}
                          className={cn("w-6 h-6 rounded-full transition-all border-2", p.cor === cor ? "border-white scale-110" : "border-transparent")}
                          style={{ backgroundColor: cor }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setModalCoresAberto(false)} className="w-full py-5 bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Fechar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalCopiaAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-[#30363d] max-w-md w-full space-y-8">
              <h3 className="text-3xl font-black tracking-tighter italic">Copiar para Dias</h3>
              <div className="grid grid-cols-2 gap-4">
                {DIAS_SEMANA.filter(d => d !== diaSelecionado).map(dia => (
                  <button key={dia} onClick={() => handleCopiarParaDias([dia])} className="p-6 bg-surface-container-low hover:bg-primary/10 hover:text-primary rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-primary/20">{dia}</button>
                ))}
                <button onClick={() => handleCopiarParaDias(DIAS_SEMANA.filter(d => d !== diaSelecionado))} className="col-span-2 p-6 bg-primary text-black rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Toda a Semana</button>
              </div>
              <button onClick={() => setModalCopiaAberto(false)} className="w-full py-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Matérias */}
      <AnimatePresence>
        {modalMateriasAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setModalMateriasAberto(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-[#30363d] max-w-md w-full space-y-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black tracking-tighter italic">Gestão de Matérias</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Adicionar nova..." value={novaMateria} onChange={e => setNovaMateria(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 text-xs font-black outline-none" />
                <button onClick={() => { if (novaMateria.trim()) { setMaterias(prev => [...prev, novaMateria.trim()]); setNovaMateria(''); } }}
                  className="px-6 bg-primary text-black rounded-2xl"><Plus size={18} /></button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {materias.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group">
                    <span className="text-xs font-bold italic">{m}</span>
                    <button onClick={() => setMaterias(prev => prev.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalCopiaSalasAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-[#30363d] max-w-2xl w-full space-y-8">
              <h3 className="text-3xl font-black tracking-tighter italic text-white">Aplicar para Outras Salas</h3>
              <div className="grid grid-cols-5 md:grid-cols-8 gap-3 max-h-80 overflow-y-auto p-2 custom-scrollbar">
                {salas.filter(s => s.numero !== salaSelecionada?.numero).map(s => (
                  <button key={s.numero} onClick={() => handleCopiarParaSalas([s.numero])} className="aspect-square bg-surface-container-low hover:bg-primary/20 rounded-2xl text-xs font-black transition-all border border-transparent hover:border-primary/30 flex items-center justify-center">{s.numero}</button>
                ))}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setModalCopiaSalasAberto(false)} className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                 <button onClick={() => handleCopiarParaSalas(salas.filter(s => s.numero !== salaSelecionada?.numero).map(s => s.numero))} className="flex-[2] py-5 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Aplicar em TODAS</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
