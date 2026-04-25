import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, DoorOpen, User, BookOpen, Clock, 
  Trash2, Copy, Check, AlertCircle, RefreshCw, ChevronLeft, Shield, Zap, LayoutGrid,
  Plus, Coffee, X, Palette, Edit3, ArrowDown, ArrowUp, ToggleLeft, ToggleRight
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

// ============================================================
// Tipos locais para a grade editável
// ============================================================
interface LinhaGrade {
  id: string;
  horarioInicio: string;
  horarioFim: string;
  nome: string;  // "1ª Aula", "Intervalo", etc
  tipo: 'aula' | 'intervalo' | 'almoco' | 'after' | 'laboratorio_idiomas';
  materia: string;
  professor: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ScheduleEditor() {
  const { 
    salas, gradeCompleta, periodos, 
    professoresCMS, atualizar 
  } = useEscola();

  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Turma editável por sala
  const [turmaEditavel, setTurmaEditavel] = useState('A DEFINIR');
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('6e7');

  // Modais
  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [modalCopiaSalasAberto, setModalCopiaSalasAberto] = useState(false);
  const [modalMateriasAberto, setModalMateriasAberto] = useState(false);
  const [modalCoresAberto, setModalCoresAberto] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');

  // Matérias
  const [materias, setMaterias] = useState<string[]>(() => {
    try { const s = localStorage.getItem('sesi_materias'); return s ? JSON.parse(s) : MATERIAS_PADRAO; } catch { return MATERIAS_PADRAO; }
  });

  // Dropdowns
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [dropdownProfAberto, setDropdownProfAberto] = useState<string | null>(null);
  const [filtroProf, setFiltroProf] = useState('');

  const [autenticado, setAutenticado] = useState(true);
  const [pin, setPin] = useState('');
  const [erroPin, setErroPin] = useState(false);

  useEffect(() => { localStorage.setItem('sesi_materias', JSON.stringify(materias)); }, [materias]);
  const listaProfessoresNomes = professoresCMS.map(p => p.nome).sort();

  const getCorProf = useCallback((nome: string) => {
    const prof = professoresCMS.find(p => p.nome === nome);
    if (prof) return prof.cor;
    // Fallback based on name hash if not found
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
  }, [professoresCMS]);

  const atualizarCorProfessor = async (nome: string, cor: string) => {
    const profExistente = professoresCMS.find(p => p.nome === nome);
    const ok = await salvarProfessorCMS({
      id: profExistente?.id || 'novo',
      nome,
      cor
    });
    if (ok) atualizar();
  };

  const handleAutenticar = (e: React.FormEvent) => {
    e.preventDefault();
    setAutenticado(true);
  };

  useEffect(() => {
    if (!salaSelecionada && salas.length > 0) {
      setSalaSelecionada(salas[0]);
    }
  }, [salas, salaSelecionada]);

  // Carregar linhas da sala/dia
  useEffect(() => {
    if (salaSelecionada) {
      setTurmaEditavel(salaSelecionada.ano || 'A DEFINIR');

      // Filtrar períodos pelo segmento selecionado
      const periodosFiltrados = periodos.filter(p => p.segmento === segmentoSelecionado);

      // Se não houver períodos para o segmento, usar o que tiver ou manter vazio
      const periodosAlvo = periodosFiltrados.length > 0 ? periodosFiltrados : periodos;

      // Usar períodos base como template
      const novasLinhas: LinhaGrade[] = periodosAlvo.map((p, i) => ({
        id: `l-${i}`,
        horarioInicio: p.horarioInicio.slice(0, 5),
        horarioFim: p.horarioFim.slice(0, 5),
        nome: p.nome,
        tipo: p.tipo as any,
        materia: p.tipo === 'intervalo' ? 'INTERVALO' : p.tipo === 'almoco' ? 'ALMOÇO' : '',
        professor: p.tipo === 'intervalo' || p.tipo === 'almoco' ? '—' : '',
      }));

      // Sobrescrever com dados existentes da grade
      const existentes = gradeCompleta.filter(
        e => e.numeroSala === salaSelecionada.numero && e.diaSemana === diaSelecionado
      );

      existentes.forEach(e => {
        const partes = e.horario.split('-').map(t => t.trim().slice(0, 5));
        const idx = novasLinhas.findIndex(l => l.horarioInicio === partes[0] && l.horarioFim === partes[1]);
        if (idx >= 0) {
          novasLinhas[idx].materia = e.materia;
          novasLinhas[idx].professor = e.nomeProfessor;
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

  // ============================================================
  // Edição das linhas
  // ============================================================
  const atualizarLinha = (id: string, campo: keyof LinhaGrade, valor: string) => {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const toggleIntervalo = (id: string) => {
    setLinhas(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (l.tipo === 'aula' || l.tipo === 'after' || l.tipo === 'laboratorio_idiomas') {
        return { ...l, tipo: 'intervalo', materia: 'INTERVALO', professor: '—' };
      } else {
        return { ...l, tipo: 'aula', materia: '', professor: '' };
      }
    }));
  };

  const adicionarLinha = () => {
    const ultima = linhas[linhas.length - 1];
    setLinhas(prev => [...prev, {
      id: `l-novo-${Date.now()}`,
      horarioInicio: ultima?.horarioFim || '08:00',
      horarioFim: '',
      nome: `${prev.length + 1}º Horário`,
      tipo: 'aula',
      materia: '',
      professor: '',
    }]);
  };

  const removerLinha = (id: string) => {
    setLinhas(prev => prev.filter(l => l.id !== id));
  };

  const moverLinha = (id: string, direcao: 'cima' | 'baixo') => {
    setLinhas(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx < 0) return prev;
      const novaPos = direcao === 'cima' ? idx - 1 : idx + 1;
      if (novaPos < 0 || novaPos >= prev.length) return prev;
      const copia = [...prev];
      [copia[idx], copia[novaPos]] = [copia[novaPos], copia[idx]];
      return copia;
    });
  };

  // ============================================================
  // Salvar
  // ============================================================
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
      tipo: l.tipo === 'laboratorio_idiomas' ? 'laboratorio_idiomas' : l.tipo === 'after' ? 'after' : 'regular'
    }));
    const ok = await salvarGradeSala(entradas);
    setMensagem(ok ? { tipo: 'sucesso', texto: 'Grade salva!' } : { tipo: 'erro', texto: 'Erro ao salvar.' });
    if (ok) atualizar();
    setSalvando(false);
  };

  const handleCopiarParaSalas = async (nums: number[]) => {
    if (!salaSelecionada) return;
    setSalvando(true); setModalCopiaSalasAberto(false);
    const entradas: Omit<EntradaGradeSala, 'id'>[] = [];
    nums.forEach(num => {
      const dest = salas.find(s => s.numero === num);
      if (!dest) return;
      linhas.forEach(l => {
        entradas.push({ anoTurma: turmaEditavel, numeroSala: dest.numero, nomeSala: dest.nome, diaSemana: diaSelecionado, horario: `${l.horarioInicio} - ${l.horarioFim}`, nomeProfessor: l.professor || '—', turma: turmaEditavel, materia: l.materia || 'A DEFINIR', tipo: l.tipo === 'laboratorio_idiomas' ? 'laboratorio_idiomas' : l.tipo === 'after' ? 'after' : 'regular' });
      });
    });
    const ok = await salvarGradeSala(entradas);
    setMensagem(ok ? { tipo: 'sucesso', texto: `Replicado para ${nums.length} salas!` } : { tipo: 'erro', texto: 'Erro.' });
    if (ok) atualizar();
    setSalvando(false);
  };

  const handleCopiarParaDias = async (dias: string[]) => {
    if (!salaSelecionada) return;
    setSalvando(true); setModalCopiaAberto(false);
    const entradas: Omit<EntradaGradeSala, 'id'>[] = [];
    dias.forEach(d => {
      linhas.forEach(l => {
        entradas.push({ anoTurma: turmaEditavel, numeroSala: salaSelecionada.numero, nomeSala: salaSelecionada.nome, diaSemana: d, horario: `${l.horarioInicio} - ${l.horarioFim}`, nomeProfessor: l.professor || '—', turma: turmaEditavel, materia: l.materia || 'A DEFINIR', tipo: l.tipo === 'laboratorio_idiomas' ? 'laboratorio_idiomas' : l.tipo === 'after' ? 'after' : 'regular' });
      });
    });
    const ok = await salvarGradeSala(entradas);
    setMensagem(ok ? { tipo: 'sucesso', texto: `Replicado para ${dias.length} dias!` } : { tipo: 'erro', texto: 'Erro.' });
    if (ok) atualizar();
    setSalvando(false);
  };

  // Segurança removida a pedido do usuário

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 pb-20" onClick={() => { setDropdownAberto(null); setDropdownProfAberto(null); }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-3">
            <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-tighter">Grade Editável</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Editor de Horários</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Tudo editável: horários, matérias, professores, intervalos e cores.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setModalCoresAberto(true)} className="btn-secondary"><Palette size={14} /> Cores</button>
          <button onClick={() => setModalMateriasAberto(true)} className="btn-secondary"><BookOpen size={14} /> Matérias</button>
          <button onClick={() => window.history.back()} className="btn-secondary"><ChevronLeft size={14} /> Voltar</button>
          <button onClick={handleSalvar} disabled={!salaSelecionada || salvando}
            className={cn("btn-primary", salvando && "opacity-50 animate-pulse")}>
            {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Seletores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-[2rem] editorial-shadow space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><DoorOpen size={14} /> Sala / Local</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {salas.map(s => (
              <button key={s.numero} onClick={() => setSalaSelecionada(s)}
                className={cn("aspect-square rounded-xl flex flex-col items-center justify-center transition-all border-2",
                  salaSelecionada?.numero === s.numero ? "bg-primary border-primary text-on-primary scale-110 z-10" : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-primary/30 hover:bg-hover")}>
                <span className="text-xs font-black">{s.numero}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[2rem] editorial-shadow space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3"><LayoutGrid size={14} /> Segmento do Horário</label>
            <div className="flex gap-2">
              {[
                { id: '6e7', label: '6º/7º' },
                { id: '8e9', label: '8º/9º' },
                { id: 'medio', label: 'Médio' }
              ].map(seg => (
                <button key={seg.id} onClick={() => setSegmentoSelecionado(seg.id)}
                  className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                    segmentoSelecionado === seg.id ? "bg-primary border-primary text-on-primary" : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-primary/20")}>
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3"><Calendar size={14} /> Dia da Semana</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => (
                <button key={dia} onClick={() => setDiaSelecionado(dia)}
                  className={cn("flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                    diaSelecionado === dia ? "bg-primary/5 border-primary text-primary" : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-primary/20")}>
                  {dia.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[2rem] editorial-shadow space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><Palette size={14} /> Legenda de Cores</label>
          <div className="max-h-[160px] overflow-y-auto scrollbar-hide pt-2">
            {professoresCMS.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant italic">Nenhum professor cadastrado.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {professoresCMS.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-container-low/50 border border-transparent">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.cor }} />
                    <span className="text-[10px] font-bold truncate">{p.nome.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {mensagem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("p-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest",
              mensagem.tipo === 'sucesso' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>
            {mensagem.tipo === 'sucesso' ? <Check size={18} /> : <AlertCircle size={18} />} {mensagem.texto}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== GRADE ====== */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-visible">
        {!salaSelecionada ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant/30"><DoorOpen size={40} /></div>
            <p className="text-on-surface-variant font-black text-sm uppercase tracking-widest">Selecione uma sala</p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            {/* Cabeçalho EDITÁVEL */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-low">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-on-surface-bright rounded-2xl flex items-center justify-center text-xl font-black">{salaSelecionada.numero}</div>
                <div>
                  <h2 className="text-lg font-black">{salaSelecionada.nome}</h2>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{diaSelecionado}</p>
                </div>
              </div>
              <div className="text-right">
                <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Ano / Turma</label>
                <input type="text" value={turmaEditavel} onChange={e => setTurmaEditavel(e.target.value)}
                  className="bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl px-3 py-2 text-sm font-black text-primary text-right w-32 transition-all outline-none" />
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/10">
              <p className="w-full text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 mb-1"><Zap size={12} /> Ações</p>
              <button onClick={() => setModalCopiaAberto(true)} className="mini-btn"><Copy size={11} /> Copiar p/ Dias</button>
              <button onClick={() => setModalCopiaSalasAberto(true)} className="mini-btn"><LayoutGrid size={11} /> Aplicar Salas</button>
              <button onClick={() => setLinhas(prev => prev.map(l => (l.tipo === 'intervalo' || l.tipo === 'almoco') ? l : { ...l, materia: '', professor: '' }))}
                className="mini-btn hover:!bg-red-500 hover:!text-on-surface-bright"><Trash2 size={11} /> Limpar Aulas</button>
              <button onClick={adicionarLinha} className="mini-btn hover:!bg-emerald-500 hover:!text-on-surface-bright"><Plus size={11} /> Adicionar Horário</button>
            </div>

            {/* LINHAS DA GRADE — TUDO EDITÁVEL */}
            <div className="space-y-1.5">
              {linhas.map((linha, idx) => {
                const ehIntervalo = linha.tipo === 'intervalo' || linha.tipo === 'almoco';
                const profNome = linha.professor && linha.professor !== '—' ? linha.professor : '';
                const profCor = profNome ? getCorProf(profNome) : 'transparent';

                return (
                  <motion.div key={linha.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                    className={cn("rounded-xl transition-all overflow-visible group",
                      ehIntervalo ? "bg-amber-500/5 border border-amber-500/15" : "hover:bg-primary/3 border border-transparent hover:border-outline-variant/10")}
                    style={!ehIntervalo && profCor !== 'transparent' ? { borderLeftWidth: '4px', borderLeftColor: profCor } : {}}>

                    <div className="grid grid-cols-[auto_1fr] xl:grid-cols-[40px_70px_6px_70px_auto_100px_1fr_1fr_auto] items-center gap-2 p-3">
                      {/* Número */}
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                        ehIntervalo ? "bg-amber-500/10 text-amber-600" : "bg-surface-container-high text-on-surface-variant")}>
                        {ehIntervalo ? <Coffee size={13} /> : idx + 1}
                      </div>

                      {/* Horário INÍCIO (editável) */}
                      <input type="time" value={linha.horarioInicio}
                        onChange={e => atualizarLinha(linha.id, 'horarioInicio', e.target.value)}
                        className="bg-transparent border-b border-dashed border-outline-variant/20 focus:border-primary text-xs font-black text-center py-1 outline-none w-[70px]" />
                      
                      <span className="text-[10px] text-on-surface-variant/40 font-black text-center">—</span>

                      {/* Horário FIM (editável) */}
                      <input type="time" value={linha.horarioFim}
                        onChange={e => atualizarLinha(linha.id, 'horarioFim', e.target.value)}
                        className="bg-transparent border-b border-dashed border-outline-variant/20 focus:border-primary text-xs font-black text-center py-1 outline-none w-[70px]" />

                      {/* Toggle Intervalo */}
                      <button onClick={() => toggleIntervalo(linha.id)} title={ehIntervalo ? 'Voltar para Aula' : 'Marcar como Intervalo'}
                        className={cn("p-1.5 rounded-lg transition-all shrink-0",
                          ehIntervalo ? "bg-amber-500/20 text-amber-600 hover:bg-red-500/20 hover:text-red-500" : "text-on-surface-variant/25 hover:text-amber-500 hover:bg-amber-500/10")}>
                        {ehIntervalo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>

                      {ehIntervalo ? (
                        /* Intervalo — nome editável */
                        <div className="col-span-1 xl:col-span-3">
                          <input type="text" value={linha.materia}
                            onChange={e => atualizarLinha(linha.id, 'materia', e.target.value)}
                            className="w-full bg-amber-500/10 rounded-lg py-2 px-3 text-xs font-black text-amber-700 uppercase tracking-widest text-center outline-none border border-transparent focus:border-amber-500/30"
                            placeholder="INTERVALO" />
                        </div>
                      ) : (
                        <>
                          {/* TIPO DE AULA */}
                          <select 
                            value={linha.tipo} 
                            onChange={e => atualizarLinha(linha.id, 'tipo', e.target.value)}
                            className="bg-surface-container-low border border-transparent focus:border-primary rounded-lg py-2 px-2 text-[10px] font-black uppercase outline-none transition-all cursor-pointer text-on-surface-variant"
                          >
                            <option value="aula">Regular</option>
                            <option value="laboratorio_idiomas">Language</option>
                            <option value="after">After</option>
                          </select>
                          {/* Matéria — dropdown */}
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <BookOpen size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 z-10 pointer-events-none" />
                            <input type="text" placeholder="Matéria..." value={linha.materia}
                              onChange={e => atualizarLinha(linha.id, 'materia', e.target.value)}
                              onFocus={() => { setDropdownAberto(linha.id); setDropdownProfAberto(null); }}
                              className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-lg py-2 pl-8 pr-3 text-xs font-bold outline-none transition-all" />
                            {dropdownAberto === linha.id && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/10 z-50 max-h-48 overflow-y-auto">
                                {materias.filter(m => !linha.materia || m.toLowerCase().includes(linha.materia.toLowerCase())).map(m => (
                                  <button key={m} onClick={() => { atualizarLinha(linha.id, 'materia', m); setDropdownAberto(null); }}
                                    className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-hover transition-all">{m}</button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Professor — dropdown com cor */}
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            {profCor !== 'transparent' ? (
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full z-10 pointer-events-none border border-white shadow-sm" style={{ backgroundColor: profCor }} />
                            ) : (
                              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 z-10 pointer-events-none" />
                            )}
                            <input type="text" placeholder="Professor..."
                              value={linha.professor === '—' ? '' : linha.professor}
                              onChange={e => { atualizarLinha(linha.id, 'professor', e.target.value); setFiltroProf(e.target.value); }}
                              onFocus={() => { setDropdownProfAberto(linha.id); setDropdownAberto(null); setFiltroProf(linha.professor === '—' ? '' : linha.professor); }}
                              className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-lg py-2 pl-8 pr-3 text-xs font-bold outline-none transition-all" />
                            {dropdownProfAberto === linha.id && listaProfessoresNomes.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/10 z-50 max-h-48 overflow-y-auto">
                                {listaProfessoresNomes.filter(n => !filtroProf || n.toLowerCase().includes(filtroProf.toLowerCase())).map(nome => (
                                  <button key={nome} onClick={() => { atualizarLinha(linha.id, 'professor', nome); setDropdownProfAberto(null); }}
                                    className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-hover transition-all flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: getCorProf(nome) }} />
                                    {nome}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Ações da linha */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button onClick={() => moverLinha(linha.id, 'cima')} className="p-1 text-on-surface-variant/30 hover:text-primary"><ArrowUp size={11} /></button>
                        <button onClick={() => moverLinha(linha.id, 'baixo')} className="p-1 text-on-surface-variant/30 hover:text-primary"><ArrowDown size={11} /></button>
                        <button onClick={() => removerLinha(linha.id)} className="p-1 text-on-surface-variant/30 hover:text-red-500"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Botão adicionar no final */}
              <button onClick={adicionarLinha}
                className="w-full py-3 border-2 border-dashed border-outline-variant/15 rounded-xl text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                <Plus size={12} /> Adicionar Horário
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====== MODAL: Cores ====== */}
      <AnimatePresence>
        {modalCoresAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalCoresAberto(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow max-w-lg w-full space-y-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <Palette size={24} className="text-primary" />
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">Cores dos Professores</h3>
                  <p className="text-xs text-on-surface-variant">Clique numa cor para alterar.</p>
                </div>
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-3">
                {professoresCMS.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8">Nenhum professor cadastrado no banco.</p>
                ) : professoresCMS.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-bright font-black text-sm shrink-0 shadow-lg" style={{ backgroundColor: p.cor }}>{p.nome.charAt(0)}</div>
                    <p className="flex-1 text-sm font-bold truncate">{p.nome}</p>
                    <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
                      {PALETA_CORES.slice(0, 15).map(cor => (
                        <button key={cor} onClick={() => atualizarCorProfessor(p.nome, cor)}
                          className={cn("w-5 h-5 rounded-full transition-all hover:scale-125 border-2", p.cor === cor ? "border-on-surface scale-110" : "border-transparent")}
                          style={{ backgroundColor: cor }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setModalCoresAberto(false)} className="w-full py-3 text-on-surface-variant font-bold text-sm">Fechar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====== MODAL: Matérias ====== */}
      <AnimatePresence>
        {modalMateriasAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalMateriasAberto(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow max-w-md w-full space-y-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black tracking-tighter">Matérias</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Nova matéria..." value={novaMateria} onChange={e => setNovaMateria(e.target.value)}
                  className="campo-input flex-1 !py-3 !text-xs" onKeyDown={e => {
                    if (e.key === 'Enter' && novaMateria.trim()) { setMaterias(prev => [...prev, novaMateria.trim()]); setNovaMateria(''); }
                  }} />
                <button onClick={() => { if (novaMateria.trim()) { setMaterias(prev => [...prev, novaMateria.trim()]); setNovaMateria(''); } }}
                  className="btn-primary !px-4"><Plus size={14} /></button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {materias.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg group">
                    <span className="text-xs font-bold">{m}</span>
                    <button onClick={() => setMaterias(prev => prev.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setModalMateriasAberto(false)} className="w-full py-3 text-on-surface-variant font-bold text-sm">Fechar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====== MODAL: Copiar Salas ====== */}
      <AnimatePresence>
        {modalCopiaSalasAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow max-w-2xl w-full space-y-6">
              <h3 className="text-2xl font-black tracking-tighter">Aplicar para salas</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2">
                {salas.filter(s => s.numero !== salaSelecionada?.numero).map(s => (
                  <button key={s.numero} onClick={() => handleCopiarParaSalas([s.numero])} className="p-3 bg-surface-container-low hover:bg-primary/20 rounded-xl text-xs font-black transition-all">{s.numero}</button>
                ))}
              </div>
              <button onClick={() => handleCopiarParaSalas(salas.filter(s => s.numero !== salaSelecionada?.numero).map(s => s.numero))} className="w-full py-4 bg-primary text-on-surface-bright rounded-2xl text-[10px] font-black uppercase tracking-widest">Aplicar em TODAS</button>
              <button onClick={() => setModalCopiaSalasAberto(false)} className="w-full py-2 text-on-surface-variant font-bold text-xs">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====== MODAL: Copiar Dias ====== */}
      <AnimatePresence>
        {modalCopiaAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow max-w-md w-full space-y-6">
              <h3 className="text-2xl font-black tracking-tighter">Copiar {diaSelecionado}</h3>
              <div className="grid grid-cols-2 gap-2">
                {DIAS_SEMANA.filter(d => d !== diaSelecionado).map(dia => (
                  <button key={dia} onClick={() => handleCopiarParaDias([dia])} className="p-4 bg-surface-container-low hover:bg-primary/10 hover:text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">{dia}</button>
                ))}
                <button onClick={() => handleCopiarParaDias(DIAS_SEMANA.filter(d => d !== diaSelecionado))} className="col-span-2 p-4 bg-primary text-on-surface-bright rounded-2xl text-[10px] font-black uppercase tracking-widest">Toda a Semana</button>
              </div>
              <button onClick={() => setModalCopiaAberto(false)} className="w-full py-4 text-on-surface-variant font-bold text-sm">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
