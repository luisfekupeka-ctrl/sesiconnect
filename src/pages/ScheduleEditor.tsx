import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, DoorOpen, User, BookOpen, Clock, 
  Trash2, Copy, Check, AlertCircle, RefreshCw, ChevronLeft, Shield, Zap, LayoutGrid,
  Plus, Coffee, X, Palette, Edit3, ArrowDown, ArrowUp, ToggleLeft, ToggleRight,
  Users, Search, UserPlus, FileSpreadsheet
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeSala, salvarProfessorCMS } from '../services/dataService';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configuração robusta do worker do PDF.js usando UNPKG
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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

  // Estados principais
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [turmaEditavel, setTurmaEditavel] = useState('A DEFINIR');
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('6e7');

  // Modais
  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [modalCopiaSalasAberto, setModalCopiaSalasAberto] = useState(false);
  const [modalMateriasAberto, setModalMateriasAberto] = useState(false);
  const [modalCoresAberto, setModalCoresAberto] = useState(false);
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [modalPreviewAberto, setModalPreviewAberto] = useState(false);

  // Estados de Importação
  const [importandoGeral, setImportandoGeral] = useState(false);
  const [dadosPreview, setDadosPreview] = useState<{[key: string]: any[]}>({});
  const [mapeamentoSalas, setMapeamentoSalas] = useState<{[key: string]: string}>({});
  const [mapeamentoProfessores, setMapeamentoProfessores] = useState<{[key: string]: string}>({});
  const [professoresUnicosPreview, setProfessoresUnicosPreview] = useState<string[]>([]);
  const [processandoFinal, setProcessandoFinal] = useState(false);

  // Auxiliares
  const [novaMateria, setNovaMateria] = useState('');
  const [materias, setMaterias] = useState<string[]>(() => {
    try { const s = localStorage.getItem('sesi_materias'); return s ? JSON.parse(s) : MATERIAS_PADRAO; } catch { return MATERIAS_PADRAO; }
  });
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [dropdownProfAberto, setDropdownProfAberto] = useState<string | null>(null);
  const [filtroProf, setFiltroProf] = useState('');
  const [linhaFocada, setLinhaFocada] = useState<string | null>(null);
  const [buscaAluno, setBuscaAluno] = useState('');
  const [conteudoPlano, setConteudoPlano] = useState('');

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

  // Sincronização da Grade com a Sala e Dia
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

  // Handler para PDF
  const handleUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportandoGeral(true);
    setMensagem(null);

    const leitor = new FileReader();
    leitor.onload = async (ev) => {
      try {
        const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const previewMap: {[key: string]: any[]} = {};
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const fullText = textContent.items.map((item: any) => item.str).join(' ');

          const salaMatch = fullText.match(/Sala\s+(\d+)/i);
          const salaDetectada = salaMatch ? `Sala ${salaMatch[1]}` : `Documento Pág ${i}`;
          
          const aulas: any[] = [];
          // Procuramos por blocos de texto que tenham "-" (separador de prof/materia)
          // E tentamos associar a um dia da semana por posição ou contexto
          const blocos = fullText.split(/\s{2,}/); // Quebra por espaços grandes
          
          let diaAtual = 'SEGUNDA';
          blocos.forEach(bloco => {
            if (DIAS_SEMANA.includes(bloco.toUpperCase())) {
              diaAtual = bloco.toUpperCase();
            }
            
            if (bloco.includes('-')) {
              const partes = bloco.split('-').map(p => p.trim());
              if (partes.length >= 2) {
                aulas.push({
                  dia: diaAtual,
                  horario: 'A DEF',
                  materia: partes[1],
                  professor: partes[0]
                });
              }
            }
          });

          if (aulas.length > 0) previewMap[salaDetectada] = aulas;
        }

        const todosProfs = new Set<string>();
        Object.values(previewMap).forEach(aulas => aulas.forEach(a => { if (a.professor !== '—') todosProfs.add(a.professor); }));
        const autoMapProf: {[key: string]: string} = {};
        Array.from(todosProfs).forEach(p => {
          const m = professoresCMS.find(db => db.nome.toLowerCase() === p.toLowerCase());
          autoMapProf[p] = m ? m.nome : '';
        });

        setProfessoresUnicosPreview(Array.from(todosProfs).sort());
        setDadosPreview(previewMap);
        setMapeamentoSalas(Object.keys(previewMap).reduce((acc, c) => ({ ...acc, [c]: '' }), {}));
        setMapeamentoProfessores(autoMapProf);
        setModalPreviewAberto(true);
        setModalFotoAberto(false);
      } catch (err: any) {
        setMensagem({ tipo: 'erro', texto: "Erro PDF: " + err.message });
      } finally {
        setImportandoGeral(false);
      }
    };
    leitor.readAsArrayBuffer(file);
  };

  // Handler para Imagem (OCR)
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportandoGeral(true);
    
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'por');
      const previewMap: {[key: string]: any[]} = {};
      const aulas: any[] = [];
      
      const salaMatch = text.match(/Sala\s+(\d+)/i);
      const salaDetectada = salaMatch ? `Sala ${salaMatch[1]}` : "Foto";

      // Regex melhorada para capturar Nome - Matéria
      const linhasTexto = text.split('\n');
      let diaAtual = 'SEGUNDA';

      linhasTexto.forEach(linha => {
        const up = linha.toUpperCase();
        if (up.includes('SEGUNDA')) diaAtual = 'SEGUNDA';
        else if (up.includes('TERÇA') || up.includes('TERCA')) diaAtual = 'TERÇA';
        else if (up.includes('QUARTA')) diaAtual = 'QUARTA';
        else if (up.includes('QUINTA')) diaAtual = 'QUINTA';
        else if (up.includes('SEXTA')) diaAtual = 'SEXTA';

        if (linha.includes('-')) {
          const partes = linha.split('-').map(p => p.trim());
          if (partes.length >= 2 && partes[0].length > 3) {
            aulas.push({ dia: diaAtual, horario: 'Conferir', materia: partes[1], professor: partes[0] });
          }
        }
      });

      if (aulas.length > 0) previewMap[salaDetectada] = aulas;
      
      const todosProfs = new Set<string>();
      Object.values(previewMap).forEach(aulas => aulas.forEach(a => { if (a.professor !== '—') todosProfs.add(a.professor); }));
      const autoMapProf: {[key: string]: string} = {};
      Array.from(todosProfs).forEach(p => {
        const m = professoresCMS.find(db => db.nome.toLowerCase() === p.toLowerCase());
        autoMapProf[p] = m ? m.nome : '';
      });

      setProfessoresUnicosPreview(Array.from(todosProfs).sort());
      setDadosPreview(previewMap);
      setMapeamentoSalas(Object.keys(previewMap).reduce((acc, c) => ({ ...acc, [c]: '' }), {}));
      setMapeamentoProfessores(autoMapProf);
      setModalPreviewAberto(true);
      setModalFotoAberto(false);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: "Erro OCR: " + err.message });
    } finally {
      setImportandoGeral(false);
    }
  };

  // Handler para Excel (já existente)
  const handleUploadGradeGeral = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportandoGeral(true);
    setMensagem(null);

    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setTimeout(() => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: false, cellHTML: false, cellFormula: false });
          const previewMap: {[key: string]: any[]} = {};

          for (const nomeAba of wb.SheetNames) {
            const ws = wb.Sheets[nomeAba];
            if (!ws) continue;
            const turmaNome = nomeAba.replace(' SESI', '').trim();
            const rows: any[][] = [];
            for (let R = 0; R <= 20; R++) {
              const row = [];
              for (let C = 0; C <= 7; C++) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                row.push(cell ? cell.v : null);
              }
              rows.push(row);
            }

            const diasIndices = { 'SEGUNDA': 2, 'TERÇA': 3, 'QUARTA': 4, 'QUINTA': 5, 'SEXTA': 6 };
            const itensTurma: any[] = [];
            rows.forEach(row => {
              const horarioRaw = String(row[1] || '');
              if (horarioRaw.includes('-') && horarioRaw.includes(':')) {
                Object.entries(diasIndices).forEach(([dia, colIdx]) => {
                  const conteudo = String(row[colIdx] || '').trim();
                  if (conteudo && conteudo.length > 5) {
                    const partes = conteudo.split(/[\n\r]+/).map(p => p.trim());
                    const professor = partes[1]?.split(/\s*-\s*Sala/i)[0]?.trim() || '—';
                    itensTurma.push({ dia, horario: horarioRaw.trim(), materia: partes[0], professor });
                  }
                });
              }
            });
            if (itensTurma.length > 0) previewMap[turmaNome] = itensTurma;
          }

          const todosProfs = new Set<string>();
          Object.values(previewMap).forEach(aulas => aulas.forEach(a => { if (a.professor !== '—') todosProfs.add(a.professor); }));
          const autoMapProf: {[key: string]: string} = {};
          Array.from(todosProfs).forEach(p => {
            const m = professoresCMS.find(db => db.nome.toLowerCase() === p.toLowerCase());
            autoMapProf[p] = m ? m.nome : '';
          });

          setProfessoresUnicosPreview(Array.from(todosProfs).sort());
          setDadosPreview(previewMap);
          setMapeamentoSalas(Object.keys(previewMap).reduce((acc, c) => ({ ...acc, [c]: '' }), {}));
          setMapeamentoProfessores(autoMapProf);
          setModalPreviewAberto(true);
          setModalFotoAberto(false);
        } catch (err: any) {
          setMensagem({ tipo: 'erro', texto: "Falha: " + err.message });
        } finally {
          setImportandoGeral(false);
        }
      }, 200);
    };
    leitor.readAsArrayBuffer(file);
  };

  const [turmaExpandida, setTurmaExpandida] = useState<string | null>(null);

  const confirmarImportacaoFinal = async () => {
    setProcessandoFinal(true);
    try {
      const entradas: Omit<EntradaGradeSala, 'id'>[] = [];
      Object.entries(dadosPreview).forEach(([turma, aulas]) => {
        const salaNum = parseInt(mapeamentoSalas[turma]);
        if (salaNum > 0) {
          aulas.forEach(a => {
            entradas.push({
              numeroSala: salaNum, nomeSala: `Sala ${salaNum}`,
              anoTurma: turma, diaSemana: a.dia, horario: a.horario,
              nomeProfessor: mapeamentoProfessores[a.professor] || a.professor,
              materia: a.materia, turma, tipo: 'regular', listaAlunos: []
            });
          });
        }
      });
      const ok = await salvarGradeSala(entradas);
      if (ok) { setMensagem({ tipo: 'sucesso', texto: "Importado com sucesso!" }); atualizar(); setModalPreviewAberto(false); }
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally { setProcessandoFinal(false); }
  };

  const atualizarLinha = (id: string, campo: keyof LinhaGrade, valor: any) => {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const handleSalvar = async () => {
    if (!salaSelecionada) return;
    setSalvando(true); setMensagem(null);
    const entradas: Omit<EntradaGradeSala, 'id'>[] = linhas.map(l => ({
      anoTurma: turmaEditavel, numeroSala: salaSelecionada.numero, nomeSala: salaSelecionada.nome,
      diaSemana: diaSelecionado, horario: `${l.horarioInicio} - ${l.horarioFim}`,
      nomeProfessor: l.professor || '—', turma: turmaEditavel, materia: l.materia || 'A DEFINIR',
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
      <div className="flex-1 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-3">
              <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-tighter">Grade Editável</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">Editor <span className="text-primary">de Horários</span></h1>
            <p className="text-on-surface-variant font-medium mt-1 text-sm opacity-60">Configuração de aulas e professores.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalFotoAberto(true)} className="px-5 py-3 bg-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2 border border-primary/20 text-primary shadow-lg shadow-primary/5">
              <FileSpreadsheet size={16} /> Importar Excel
            </button>
            <button onClick={handleSalvar} disabled={!salaSelecionada || salvando} className={cn("btn-primary shadow-xl shadow-primary/20", salvando && "opacity-50 animate-pulse")}>
              {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Salvar
            </button>
          </div>
        </header>

        {/* Seletores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-[#30363d] space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><DoorOpen size={14} /> Seleção de Ambiente</label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {salas.map(s => (
                <button key={s.numero} onClick={() => setSalaSelecionada(s)} className={cn("aspect-square rounded-xl flex items-center justify-center transition-all border-2", salaSelecionada?.numero === s.numero ? "bg-primary border-primary text-black font-black" : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-primary/20")}>
                  {s.numero}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-[#30363d] flex flex-col justify-between">
            <div className="flex gap-2 mb-4">
               {DIAS_SEMANA.map(dia => (
                  <button key={dia} onClick={() => setDiaSelecionado(dia)} className={cn("flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all", diaSelecionado === dia ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-low border-transparent text-on-surface-variant")}>
                    {dia.slice(0, 3)}
                  </button>
               ))}
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-black uppercase opacity-40">Segmento</span>
               <div className="flex gap-2">
                  {['6e7', '8e9', 'medio'].map(s => (
                    <button key={s} onClick={() => setSegmentoSelecionado(s)} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all", segmentoSelecionado === s ? "bg-primary text-black" : "bg-surface-container-low text-on-surface-variant")}>
                      {s.toUpperCase()}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Grade de Horários */}
        <div className="bg-surface-container-lowest rounded-[3rem] border border-[#30363d] overflow-hidden">
          {salaSelecionada && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary text-black rounded-[1.5rem] flex items-center justify-center text-3xl font-black italic">{salaSelecionada.numero}</div>
                  <div>
                    <h2 className="text-2xl font-black italic">{salaSelecionada.nome}</h2>
                    <p className="text-[10px] text-on-surface-variant font-black uppercase mt-2">{diaSelecionado}</p>
                  </div>
                </div>
                <input type="text" value={turmaEditavel} onChange={e => setTurmaEditavel(e.target.value)} className="bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-black text-primary text-right w-40 outline-none" />
              </div>

              <div className="space-y-2">
                {linhas.map((linha, idx) => {
                  const ehIntervalo = linha.tipo === 'intervalo' || linha.tipo === 'almoco';
                  return (
                    <div key={linha.id} onClick={() => setLinhaFocada(linha.id)} className={cn("rounded-2xl transition-all border-2 p-4 grid grid-cols-[50px_1fr] md:grid-cols-[50px_180px_1fr_1fr_40px] items-center gap-4", linhaFocada === linha.id ? "border-primary bg-primary/5" : "bg-[#0d1117] border-transparent")}>
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                      <div className="text-xs font-black text-white/40">{linha.horarioInicio} - {linha.horarioFim}</div>
                      
                      {ehIntervalo ? (
                        <div className="col-span-1 md:col-span-2 text-[10px] font-black text-amber-500 uppercase text-center bg-amber-500/5 py-3 rounded-xl">{linha.materia}</div>
                      ) : (
                        <>
                          <div className="relative">
                            <input type="text" value={linha.materia} onChange={e => atualizarLinha(linha.id, 'materia', e.target.value)} placeholder="Matéria..." className="w-full bg-surface-container-low rounded-xl py-3 px-4 text-xs font-black outline-none" />
                          </div>
                          <div className="relative">
                            <input type="text" value={linha.professor === '—' ? '' : linha.professor} onChange={e => atualizarLinha(linha.id, 'professor', e.target.value)} placeholder="Professor..." className="w-full bg-surface-container-low rounded-xl py-3 px-4 text-xs font-black outline-none" />
                          </div>
                        </>
                      )}
                      <button onClick={() => setLinhaFocada(linha.id)} className="text-white/10 hover:text-primary p-2"><Users size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Ensalamento */}
      <AnimatePresence>
        {linhaAtiva && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full lg:w-[400px] bg-surface-container-lowest p-8 rounded-[3.5rem] border border-primary/30 h-[calc(100vh-160px)] sticky top-8 flex flex-col shadow-3xl">
             <div className="mb-8">
                <h3 className="text-2xl font-black italic text-white">{linhaAtiva.materia || 'A Definir'}</h3>
                <p className="text-xs font-bold text-on-surface-variant">{linhaAtiva.horarioInicio} - {linhaAtiva.horarioFim}</p>
             </div>
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={16} />
                <input type="text" placeholder="Pesquisar aluno..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl text-[10px] font-black outline-none" />
                {buscaAluno.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high rounded-2xl shadow-2xl z-50 p-2 overflow-hidden">
                    {alunos.filter(a => a.nome.toLowerCase().includes(buscaAluno.toLowerCase()) && !linhaAtiva.listaAlunos.includes(a.nome)).slice(0, 5).map(a => (
                      <button key={a.id} onClick={() => { atualizarLinha(linhaAtiva.id, 'listaAlunos', [...linhaAtiva.listaAlunos, a.nome]); setBuscaAluno(''); }} className="w-full flex items-center justify-between p-3 hover:bg-primary/10 rounded-xl transition-all">
                         <span className="text-[10px] font-black text-white">{a.nome}</span>
                         <UserPlus size={14} className="text-primary" />
                      </button>
                    ))}
                  </div>
                )}
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {linhaAtiva.listaAlunos.map((aluno, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#0d1117] rounded-2xl group">
                    <span className="text-xs font-black text-white truncate">{aluno}</span>
                    <button onClick={() => atualizarLinha(linhaAtiva.id, 'listaAlunos', linhaAtiva.listaAlunos.filter(a => a !== aluno))} className="text-red-500 p-1 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Excel */}
      <AnimatePresence>
        {modalFotoAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-primary/20 max-w-md w-full text-center space-y-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                {importandoGeral ? <RefreshCw size={40} className="animate-spin" /> : <FileSpreadsheet size={40} />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Opção Excel */}
                <label className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <input type="file" accept=".xlsx" className="hidden" onChange={handleUploadGradeGeral} />
                  <FileSpreadsheet size={32} className="text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Excel (.xlsx)</span>
                </label>

                {/* Opção PDF */}
                <label className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all">
                  <input type="file" accept=".pdf" className="hidden" onChange={handleUploadPDF} />
                  <LayoutGrid size={32} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">PDF Grade</span>
                </label>

                {/* Opção Foto */}
                <label className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  <Zap size={32} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Foto / Imagem</span>
                </label>
              </div>

              <button onClick={() => setModalFotoAberto(false)} className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-all">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Preview */}
      <AnimatePresence>
        {modalPreviewAberto && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0d1117] rounded-[4rem] border border-primary/30 max-w-5xl w-full h-[85vh] flex flex-col shadow-3xl overflow-hidden">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-primary/5">
                <h3 className="text-3xl font-black italic">Validar <span className="text-primary">Ensalamento</span></h3>
                <button onClick={() => setModalPreviewAberto(false)} className="p-4 bg-white/5 rounded-2xl text-red-500"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                      <LayoutGrid size={24} className="text-primary" /> 
                      Conferência de Grade por Turma
                    </h4>
                    <p className="text-[10px] font-black uppercase text-on-surface-variant bg-white/5 px-4 py-2 rounded-full">
                      Vincule cada turma a uma sala física e revise os horários detectados
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {Object.keys(dadosPreview).map(turma => {
                      const aulasTurma = dadosPreview[turma];
                      const estaExpandido = turmaExpandida === turma;

                      return (
                        <div key={turma} className={cn(
                          "bg-surface-container-low rounded-[3rem] border-2 transition-all overflow-hidden",
                          estaExpandido ? "border-primary bg-primary/5 shadow-2xl" : "border-white/5"
                        )}>
                          {/* Cabeçalho do Bloco */}
                          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-2xl font-black italic text-primary">
                                {turma.slice(0, 2)}
                              </div>
                              <div>
                                <h5 className="text-2xl font-black italic text-white leading-none">{turma}</h5>
                                <button onClick={() => setTurmaExpandida(estaExpandido ? null : turma)} 
                                  className="mt-2 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:opacity-70">
                                  {estaExpandido ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                  {estaExpandido ? 'Fechar Grade' : `Revisar ${aulasTurma.length} aulas detectadas`}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="flex-1 md:w-64">
                                <label className="text-[8px] font-black uppercase text-on-surface-variant block mb-2 ml-2 tracking-widest">Vincular Sala Física</label>
                                <select 
                                  value={mapeamentoSalas[turma]} 
                                  onChange={e => setMapeamentoSalas({...mapeamentoSalas, [turma]: e.target.value})}
                                  className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs font-black outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                                >
                                  <option value="">Selecione uma Sala...</option>
                                  {Array.from({length: 31}, (_, i) => i + 1).map(n => (
                                    <option key={n} value={n}>SALA {n}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Grade Visual (Expandida) - Otimizada para Edição */}
                          <AnimatePresence>
                            {estaExpandido && (
                              <div className="border-t border-white/5 bg-black/40 p-4 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                  {DIAS_SEMANA.map(dia => (
                                    <div key={dia} className="space-y-3">
                                      <div className="text-[10px] font-black uppercase text-primary/40 text-center tracking-widest pb-3 border-b border-white/5">{dia}</div>
                                      <div className="space-y-2">
                                        {aulasTurma.filter(a => a.dia === dia).map((a, idx) => {
                                          const realIdx = aulasTurma.indexOf(a);
                                          return (
                                            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2 hover:border-primary/30 transition-all">
                                              <div className="flex justify-between items-center">
                                                <input 
                                                  value={a.horario} 
                                                  onChange={e => {
                                                    const novas = [...aulasTurma];
                                                    novas[realIdx].horario = e.target.value;
                                                    setDadosPreview({...dadosPreview, [turma]: novas});
                                                  }}
                                                  className="bg-transparent border-none text-[8px] font-black text-on-surface-variant/40 outline-none w-16"
                                                />
                                                <select 
                                                  value={a.dia}
                                                  onChange={e => {
                                                    const novas = [...aulasTurma];
                                                    novas[realIdx].dia = e.target.value;
                                                    setDadosPreview({...dadosPreview, [turma]: novas});
                                                  }}
                                                  className="bg-transparent border-none text-[8px] font-black text-primary outline-none cursor-pointer"
                                                >
                                                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d.slice(0,3)}</option>)}
                                                </select>
                                                <button onClick={() => {
                                                  const novas = aulasTurma.filter((_, i) => i !== realIdx);
                                                  setDadosPreview({...dadosPreview, [turma]: novas});
                                                }} className="text-red-500/30 hover:text-red-500"><X size={10} /></button>
                                              </div>
                                              <input 
                                                value={a.materia}
                                                onChange={e => {
                                                  const novas = [...aulasTurma];
                                                  novas[realIdx].materia = e.target.value;
                                                  setDadosPreview({...dadosPreview, [turma]: novas});
                                                }}
                                                className="w-full bg-black/20 border-none rounded-lg p-2 text-[10px] font-black text-white italic outline-none"
                                              />
                                              <input 
                                                value={a.professor}
                                                onChange={e => {
                                                  const novas = [...aulasTurma];
                                                  novas[realIdx].professor = e.target.value;
                                                  setDadosPreview({...dadosPreview, [turma]: novas});
                                                }}
                                                className="w-full bg-transparent border-none p-1 text-[9px] font-bold text-primary italic outline-none"
                                              />
                                            </div>
                                          );
                                        })}
                                        <button 
                                          onClick={() => {
                                            const novas = [...aulasTurma, { dia, horario: '08:00', materia: 'NOVA AULA', professor: '' }];
                                            setDadosPreview({...dadosPreview, [turma]: novas});
                                          }}
                                          className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[8px] font-black uppercase text-white/20 hover:text-primary hover:border-primary/30 transition-all"
                                        >
                                          + Aula
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-surface-container-low rounded-[3.5rem] border border-white/5 p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Users size={24} /></div>
                    <div>
                      <h4 className="text-xl font-black uppercase italic text-white tracking-tighter">Reconciliação de Professores</h4>
                      <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Confirme o vínculo entre o nome do arquivo e o banco de dados</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {professoresUnicosPreview.map(prof => (
                      <div key={prof} className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4 hover:border-primary/20 transition-all">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black uppercase text-on-surface-variant tracking-widest">No Arquivo</span>
                          <span className="text-xs font-black text-white italic truncate">{prof}</span>
                        </div>
                        <div className="space-y-2">
                           <span className="text-[8px] font-black uppercase text-primary tracking-widest">Vincular ao Sistema</span>
                           <select 
                            value={mapeamentoProfessores[prof]} 
                            onChange={e => setMapeamentoProfessores({...mapeamentoProfessores, [prof]: e.target.value})}
                            className="w-full bg-surface-container-high border-none p-4 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                           >
                            <option value="">Ignorar ou Criar...</option>
                            {listaProfessoresNomes.map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="p-10 border-t border-white/5 flex justify-end">
                <button onClick={confirmarImportacaoFinal} disabled={processandoFinal} className="px-10 py-5 bg-primary text-black rounded-[2rem] font-black uppercase text-xs flex items-center gap-3 disabled:opacity-50">
                   {processandoFinal ? <RefreshCw className="animate-spin" /> : <Check />} Confirmar Tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Mensagem */}
      <AnimatePresence>
        {mensagem && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={cn("fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl z-[200]", mensagem.tipo === 'sucesso' ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
            {mensagem.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
