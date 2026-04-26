import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Shield, Upload, Check, X, Plus, Search, Eye, Trash2,
  DoorOpen, Users, BookOpen, Clock, Calendar, UserPlus,
  MapPin, FileSpreadsheet, ClipboardList, BarChart3, RefreshCw, FileText,
  AlignLeft, List, ChevronDownSquare, CircleDot, CheckSquare, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import {
  salvarPeriodo, excluirPeriodo,
  salvarAluno, excluirAluno,
  salvarMonitor, excluirMonitor,
  salvarProfessorCMS, excluirProfessorCMS,
  salvarLocalCMS, excluirLocalCMS,
  salvarModeloFormulario, excluirModeloFormulario,
  salvarLanguageLab, excluirLanguageLab,
  salvarAtividadeAfter, excluirAtividadeAfter,
  salvarGradeMonitor, excluirGradeMonitor,
  salvarGradeSala
} from '../services/dataService';

// ============================================================
// TIPOS & CONSTANTES
// ============================================================
type AbaAdmin =
  | 'alunos' | 'professores' | 'gestao-monitores' | 'substituicoes'
  | 'locais' | 'grade-professores'
  | 'cronograma' | 'formularios' | 'language-lab' | 'after-school';

const ANOS_ESCOLARES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Ano EM', '2º Ano EM', '3º Ano EM'];
const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

const PALETA_CORES = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#D946EF', '#0EA5E9', '#84CC16', '#E11D48', '#7C3AED',
  '#059669', '#DC2626', '#2563EB', '#CA8A04', '#9333EA',
  '#DB2777', '#0891B2', '#EA580C', '#0D9488', '#4F46E5',
  '#C026D3', '#0284C7', '#65A30D', '#BE123C', '#6D28D9',
];

// ============================================================
// HELPER: Ler Excel simples (coluna de nomes)
// ============================================================
function lerNomesExcel(arquivo: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = (e) => {
      try {
        const dados = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(dados, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws);
        // Pegar primeira coluna que tiver dados (nome, Nome, etc.)
        const nomes = json.map((row: any) => {
          return String(row['nome'] || row['Nome'] || row['NOME'] || Object.values(row)[0] || '').trim();
        }).filter(Boolean);
        resolve(nomes);
      } catch { reject(new Error('Erro ao ler Excel')); }
    };
    leitor.onerror = () => reject(new Error('Erro'));
    leitor.readAsArrayBuffer(arquivo);
  });
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Admin() {
  const navigate = useNavigate();
  const {
    salas, alunos, gradeCompleta, monitores, periodos,
    professoresCMS, locaisCMS, modelosFormulario, ocorrencias,
    languageLab, atividadesAfter, gradeMonitores, atualizar
  } = useEscola();

  const [abaAtiva, setAbaAtiva] = useState<AbaAdmin>('alunos');
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [anoFiltro, setAnoFiltro] = useState('Todos');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Segurança removida a pedido do usuário
  const [autenticado, setAutenticado] = useState(true);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erroLogin, setErroLogin] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAutenticado(true);
  };

  // Modais
  const [editandoAluno, setEditandoAluno] = useState<any>(null);
  const [editandoMonitor, setEditandoMonitor] = useState<any>(null);
  const [editandoPeriodo, setEditandoPeriodo] = useState<any>(null);
  const [editandoLocal, setEditandoLocal] = useState<any>(null);
  const [editandoProfessor, setEditandoProfessor] = useState<any>(null);
  const [editandoModelo, setEditandoModelo] = useState<any>(null);
  const [editandoGrade, setEditandoGrade] = useState<any>(null);
  const [editandoLanguageLab, setEditandoLanguageLab] = useState<any>(null);
  const [editandoAfter, setEditandoAfter] = useState<any>(null);
  const [editandoGradeMonitor, setEditandoGradeMonitor] = useState<any>(null);

  // Helpers
  const doSave = async (action: Promise<boolean>, close: Function) => {
    setCarregando(true);
    const ok = await action;
    if (ok) { atualizar(); close(null); setMsg({ tipo: 'ok', texto: 'Salvo com sucesso!' }); }
    else { setMsg({ tipo: 'erro', texto: 'Erro ao salvar.' }); }
    setCarregando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const doDelete = async (action: Promise<boolean>) => {
    setCarregando(true);
    await action;
    atualizar();
    setCarregando(false);
  };

  // Listas derivadas
  const listaProfessores = Array.from(new Set(
    gradeCompleta.map(e => e.nomeProfessor).filter(n => n && n !== '—' && n !== 'A DEFINIR')
  )).sort();

  const alunosBase = Array.isArray(alunos) ? alunos : [];
  const alunosFiltrados = alunosBase.filter(a => {
    const mb = !busca || a.nome.toLowerCase().includes(busca.toLowerCase());
    const ma = anoFiltro === 'Todos' || a.ano === anoFiltro;
    return mb && ma;
  });

  // Upload Excel de nomes simples
  const handleUploadNomes = async (tipo: 'alunos' | 'professores' | 'monitores', anoAlvo?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e: any) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;
      setCarregando(true);
      try {
        const nomes = await lerNomesExcel(arquivo);
        let ok = 0;

        if (tipo === 'alunos' && anoAlvo) {
          for (const nome of nomes) {
            const sucesso = await salvarAluno({ nome, turma: anoAlvo, ano: anoAlvo, numeroSala: 0 });
            if (sucesso) ok++;
          }
          setMsg({ tipo: 'ok', texto: `${ok} alunos importados para ${anoAlvo}!` });
        } else if (tipo === 'monitores') {
          for (const nome of nomes) {
            const sucesso = await salvarMonitor({ nome, materia: '', turno: 'manha', horarioInicio: '08:00', horarioFim: '12:00', tipo: 'fixo', status: 'ativo', localPermanencia: '', localAlmoco: '' });
            if (sucesso) ok++;
          }
          setMsg({ tipo: 'ok', texto: `${ok} monitores importados!` });
        } else if (tipo === 'professores') {
          for (let i = 0; i < nomes.length; i++) {
            const nome = nomes[i];
            const cor = PALETA_CORES[i % PALETA_CORES.length];
            const sucesso = await salvarProfessorCMS({ nome, cor });
            if (sucesso) ok++;
          }
          setMsg({ tipo: 'ok', texto: `${ok} professores cadastrados com cores únicas!` });
        }
        atualizar();
      } catch (err: any) {
        setMsg({ tipo: 'erro', texto: err.message });
      }
      setCarregando(false);
      setTimeout(() => setMsg(null), 4000);
    };
    input.click();
  };

  // Login Screen Removida a pedido do usuário



  // ============================================================
  // TAB CONFIG
  // ============================================================
  const abas: { id: AbaAdmin; rotulo: string; icone: any; badge?: number }[] = [
    { id: 'alunos', rotulo: 'Alunos', icone: Users, badge: (alunos || []).length },
    { id: 'professores', rotulo: 'Professores Base', icone: UserPlus, badge: (professoresCMS || []).length },
    { id: 'grade-professores', rotulo: 'Grade e Escala', icone: Calendar },
    { id: 'gestao-monitores', rotulo: 'Gestão Monitores', icone: ClipboardList, badge: (monitores || []).length },
    { id: 'locais', rotulo: 'Locais / Salas', icone: MapPin, badge: (locaisCMS || []).length },
    { id: 'language-lab', rotulo: 'Language Lab', icone: BookOpen, badge: (languageLab || []).length },
    { id: 'after-school', rotulo: 'After School', icone: Clock, badge: (atividadesAfter || []).length },
    { id: 'cronograma', rotulo: 'Horários Base', icone: Clock, badge: (periodos || []).length },
    { id: 'formularios', rotulo: 'Formulários', icone: FileSpreadsheet, badge: (modelosFormulario || []).length },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 rounded-full mb-4 font-black text-xs uppercase tracking-widest">
            <Shield size={14} /> Master CMS
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Central de Cadastros</h1>
          <p className="text-on-surface-variant font-medium mt-2">Cadastre listas, configure grades e crie formulários.</p>
        </header>

        {/* Feedback */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn("p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2",
                msg.tipo === 'ok' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>
              {msg.tipo === 'ok' ? <Check size={16} /> : <X size={16} />} {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface-container-low rounded-2xl">
          {abas.map(a => (
            <button key={a.id} onClick={() => { setAbaAtiva(a.id); setBusca(''); setAnoFiltro('Todos'); }}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                abaAtiva === a.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-hover")}>
              <a.icone size={13} />
              {a.rotulo}
              {a.badge !== undefined && <span className={cn("ml-0.5 px-1.5 py-0.5 rounded-full text-[7px]", abaAtiva === a.id ? "bg-primary/10 text-primary" : "bg-surface-container-high")}>{a.badge}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ===================== ALUNOS ===================== */}
          {abaAtiva === 'alunos' && (
            <motion.div key="alunos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Gestão de Alunos" subtitulo="Suba uma lista Excel de nomes por ano escolar."
                acao={<button onClick={() => setEditandoAluno({ id: 'novo', nome: '', turma: '', ano: '6º Ano', numeroSala: 0 })} className="btn-primary"><Plus size={14} /> Novo Aluno</button>}>

                {/* Filtros por ano */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                    <input type="text" placeholder="Buscar aluno..." value={busca} onChange={e => setBusca(e.target.value)} className="campo-input pl-10" />
                  </div>
                  {['Todos', ...ANOS_ESCOLARES].map(ano => (
                    <button key={ano} onClick={() => setAnoFiltro(ano)}
                      className={cn("px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        anoFiltro === ano ? "bg-primary text-on-surface-bright" : "bg-surface-container-low text-on-surface-variant hover:bg-primary/10")}>
                      {ano}
                    </button>
                  ))}
                </div>

                {/* Cards por ano com botão upload */}
                {anoFiltro === 'Todos' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ANOS_ESCOLARES.map(ano => {
                      const lista = alunos.filter(a => a.ano === ano);
                      return (
                        <div key={ano} className="bg-surface-container-low p-5 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-primary" />
                              <h3 className="text-sm font-black text-primary">{ano}</h3>
                            </div>
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{lista.length}</span>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto mb-3 scrollbar-hide">
                            {lista.length === 0 ? (
                              <p className="text-[10px] text-on-surface-variant italic">Nenhum aluno</p>
                            ) : lista.filter(a => !busca || a.nome.toLowerCase().includes(busca.toLowerCase())).map(a => (
                              <div key={a.id} className="flex items-center justify-between text-xs py-1 group">
                                <span className="font-medium truncate mr-2">{a.nome}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                  <button onClick={() => setEditandoAluno(a)} className="p-1 hover:text-primary"><Eye size={10} /></button>
                                  <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirAluno(a.id)); }}
                                    className="p-1 text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => handleUploadNomes('alunos', ano)}
                            className="w-full py-2 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center justify-center gap-1.5">
                            <Upload size={12} /> Subir Lista Excel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-1">
                    {alunosFiltrados.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl group">
                        <span className="text-sm font-bold">{a.nome}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setEditandoAluno(a)} className="p-2 bg-surface-container-high rounded-lg shadow-sm hover:text-primary"><Eye size={12} /></button>
                          <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirAluno(a.id)); }} className="p-2 bg-surface-container-high rounded-lg shadow-sm hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Painel>

            </motion.div>
          )}

          {/* ===================== PROFESSORES ===================== */}
          {abaAtiva === 'professores' && (
            <motion.div key="prof" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Base de Professores" subtitulo="Gerencie os professores e suas assinaturas visuais (cores)."
                acao={<button onClick={() => setEditandoProfessor({ id: 'novo', nome: '', cor: '#3B82F6' })} className="btn-primary"><Plus size={14} /> Novo Professor</button>}>
                <div className="relative mb-6">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                  <input type="text" placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} className="campo-input pl-10" />
                </div>

                {professoresCMS.length === 0 ? (
                  <VazioMsg texto="Nenhum professor cadastrado no banco de dados." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professoresCMS.filter(p => !busca || p.nome.toLowerCase().includes(busca.toLowerCase())).map(p => {
                      const aulas = gradeCompleta.filter(g => g.nomeProfessor === p.nome);
                      return (
                        <div key={p.id} className="bg-surface-container-low p-5 rounded-2xl border-l-4 group transition-all hover:bg-surface-container-high" style={{ borderLeftColor: p.cor }}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-bright font-black shadow-lg" style={{ backgroundColor: p.cor }}>{p.nome.charAt(0)}</div>
                              <div>
                                <p className="text-sm font-black truncate max-w-[150px]">{p.nome}</p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{p.especialidade || 'Docente'}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => setEditandoProfessor(p)} className="p-1.5 bg-surface-container-high rounded-lg shadow-sm hover:text-primary"><Eye size={12} /></button>
                              <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirProfessorCMS(p.id)); }} className="p-1.5 bg-surface-container-high rounded-lg shadow-sm hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-3">
                            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{aulas.length} aulas na grade</span>
                            <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.cor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Painel>

            </motion.div>
          )}

          {/* ===================== LOCAIS ===================== */}
          {abaAtiva === 'locais' && (
            <motion.div key="locais" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Espaços e Locais" subtitulo="Adicione salas de aula ou locais extras como Arena, Quadras e Pátio."
                acao={<button onClick={() => setEditandoLocal({ id: 'novo', nome: '', numero: '', tipo: 'sala' })} className="btn-primary"><Plus size={14} /> Novo Local</button>}>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {locaisCMS.length === 0 ? (
                    <div className="col-span-full">
                      <VazioMsg texto="Nenhum local cadastrado. Use as salas padrão ou adicione novos espaços." />
                    </div>
                  ) : locaisCMS.map(l => (
                    <div key={l.id} className="bg-surface-container-low p-5 rounded-[2rem] hover:bg-surface-container-high transition-all group border border-transparent hover:border-primary/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl",
                          l.tipo === 'sala' ? "bg-primary text-on-surface-bright" : "bg-amber-500 text-on-surface-bright")}>
                          {l.numero || l.nome.charAt(0)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setEditandoLocal(l)} className="p-2 bg-surface-container-high rounded-xl shadow-sm hover:text-primary"><Eye size={12} /></button>
                          <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirLocalCMS(l.id)); }} className="p-2 bg-surface-container-high rounded-xl shadow-sm hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <h3 className="text-sm font-black">{l.nome}</h3>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                        {l.tipo} {l.capacidade ? `· ${l.capacidade} alunos` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </Painel>

            </motion.div>
          )}

          {/* ===================== GRADE E ESCALA (SALAS + PROFS) ===================== */}
          {abaAtiva === 'grade-professores' && (
            <motion.div key="grade-prof" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Bloco 1: Acesso ao Editor */}
              <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-emerald-600">Grade de Aulas</h2>
                  <p className="text-sm font-medium text-emerald-700/80 mt-1 max-w-xl">
                    A escala dos professores é montada automaticamente quando você preenche a grade das salas. Clique abaixo para abrir o painel de edição visual (por Dia da Semana).
                  </p>
                </div>
                <button onClick={() => navigate('/schedule-editor')} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20">
                  <Calendar size={18} /> Montar Grade das Salas
                </button>
              </div>

              {/* Bloco 2: Visualização da Escala Pronta */}
              <Painel titulo="Escala de Professores Gerada" subtitulo="Abaixo estão as aulas que o sistema já agrupou para cada professor.">
                {listaProfessores.length === 0 ? <VazioMsg texto="Nenhum professor na grade ainda. Comece montando a grade no botão acima." /> : (
                  <div className="space-y-6">
                    {listaProfessores.filter((n: string) => !busca || n.toLowerCase().includes(busca.toLowerCase())).map(nome => {
                      const aulas = gradeCompleta.filter(g => g.nomeProfessor === nome);
                      const diasComAula = Array.from(new Set(aulas.map(a => a.diaSemana)));
                      return (
                        <div key={nome} className="bg-surface-container-low p-5 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">{(nome as string).charAt(0)}</div>
                            <div>
                              <p className="text-sm font-black">{nome}</p>
                              <p className="text-[10px] text-on-surface-variant">{aulas.length} aulas · {diasComAula.join(', ')}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {DIAS_SEMANA.map(dia => {
                              const aulasDia = aulas.filter(a => a.diaSemana === dia);
                              return (
                                <div key={dia} className="text-center">
                                  <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1">{dia.slice(0, 3)}</p>
                                  {aulasDia.length === 0 ? (
                                    <p className="text-[9px] text-on-surface-variant/30">—</p>
                                  ) : aulasDia.map((a, i) => (
                                    <div key={i} onClick={() => setEditandoGrade(a)} className="bg-surface-container-highest rounded-lg p-1.5 text-[8px] mb-1 shadow-sm cursor-pointer hover:ring-1 hover:ring-primary transition-all">
                                      <p className="font-bold text-primary">{a.horario?.split('-')[0]?.trim()}</p>
                                      <p className="text-on-surface-variant">{a.materia || '—'}</p>
                                      <p className="font-medium">S{a.numeroSala}</p>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Painel>
            </motion.div>
          )}

          {/* ===================== GESTÃO DE MONITORES ===================== */}
          {abaAtiva === 'gestao-monitores' && (
            <motion.div key="gestao-monitores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">

              {/* Passo 1: Cadastro */}
              <div>
                <Painel titulo="Passo 1: Quem são os Monitores?" subtitulo="Primeiro, certifique-se de que o monitor existe no banco (Nome, Tipo e Horário Base)."
                  acao={<button onClick={() => setEditandoMonitor({ id: 'novo', nome: '', materia: '', diaSemana: 'SEGUNDA', turno: 'manha', horarioInicio: '08:00', horarioFim: '12:00', tipo: 'fixo', status: 'ativo', localPermanencia: '', localAlmoco: '' })} className="btn-primary"><Plus size={14} /> Cadastrar Monitor</button>}>

                  <div className="relative mb-6">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                    <input type="text" placeholder="Buscar monitor..." value={busca} onChange={e => setBusca(e.target.value)} className="campo-input pl-10" />
                  </div>

                  {Array.isArray(monitores) && monitores.length === 0 ? (
                    <VazioMsg texto="Nenhum monitor cadastrado ainda." />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(Array.isArray(monitores) ? monitores : []).filter(m => {
                        const b = busca.toLowerCase();
                        return !busca || (m.nome?.toLowerCase() || '').includes(b);
                      }).map(m => (
                        <div key={m.id} className="bg-surface-container-low p-5 rounded-2xl group transition-all hover:bg-surface-container-high border border-transparent hover:border-primary/10">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black", m.tipo === 'volante' ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary")}>
                                {m.nome.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black truncate max-w-[150px]">{m.nome}</p>
                                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none mb-1">{m.tipo}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => setEditandoMonitor(m)} className="p-1.5 bg-surface-container-high rounded-lg shadow-sm hover:text-primary"><Eye size={12} /></button>
                              <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirMonitor(m.id)); }} className="p-1.5 bg-surface-container-high rounded-lg shadow-sm hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-outline-variant/10">
                            <span className="text-[10px] font-bold text-on-surface-variant">Trabalha das {m.horarioInicio} às {m.horarioFim}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Painel>
              </div>

              {/* Passo 2: Escala (Fixa) */}
              <div>
                <Painel titulo="Passo 2: Onde eles vão ficar? (Plantões Fixos)" subtitulo="Com o monitor cadastrado, adicione a escala. A escala é fixa: uma vez montada, vale para sempre até que você a exclua."
                  acao={<button onClick={() => setEditandoGradeMonitor({ id: 'novo', monitorNome: '', diaSemana: 'FIXO', horarioInicio: '08:00', horarioFim: '09:30', posto: '', corEtiqueta: '#3B82F6' })} className="btn-primary"><Plus size={14} /> Alocar em um Posto</button>}>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradeMonitores.length === 0 ? <VazioMsg texto="Nenhuma escala detalhada cadastrada. Adicione postos no botão acima." /> :
                      gradeMonitores.map(gm => (
                        <div key={gm.id} className="bg-surface-container-low p-4 rounded-2xl border-l-4 group" style={{ borderLeftColor: gm.corEtiqueta || '#3B82F6' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-black">{gm.monitorNome}</p>
                              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{gm.posto}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => setEditandoGradeMonitor(gm)} className="p-1.5 bg-surface-container-high rounded-lg hover:text-primary"><Eye size={12} /></button>
                              <button onClick={() => { if (confirm('Excluir este plantão?')) doDelete(excluirGradeMonitor(gm.id)); }} className="p-1.5 bg-surface-container-high rounded-lg hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-on-surface-variant">
                            <span>{gm.diaSemana}</span>
                            <span>{gm.horarioInicio} - {gm.horarioFim}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </Painel>
              </div>

              <ModalForm aberto={!!editandoMonitor} onClose={() => setEditandoMonitor(null)}
                titulo={editandoMonitor?.id === 'novo' ? 'Cadastrar Monitor' : 'Editar Monitor'}
                onSalvar={() => {
                  const payload = {
                    ...editandoMonitor,
                    status: 'ativo',
                    turno: 'manha',
                    diaSemana: 'SEGUNDA',
                    localPermanencia: '',
                    localAlmoco: ''
                  };
                  doSave(salvarMonitor(payload), setEditandoMonitor);
                }} carregando={carregando}>
                {editandoMonitor && (
                  <div className="space-y-4">
                    <CampoTexto label="Nome do monitor" value={editandoMonitor.nome} onChange={v => setEditandoMonitor({ ...editandoMonitor, nome: v })} />
                    <CampoSelect label="Tipo" value={editandoMonitor.tipo || 'fixo'} options={['fixo', 'volante']} onChange={v => setEditandoMonitor({ ...editandoMonitor, tipo: v as any })} />

                    <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3 block">Horário de Trabalho (Padrão)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <CampoTexto label="Entrada" value={editandoMonitor.horarioInicio} onChange={v => setEditandoMonitor({ ...editandoMonitor, horarioInicio: v })} tipo="time" />
                        <CampoTexto label="Saída" value={editandoMonitor.horarioFim} onChange={v => setEditandoMonitor({ ...editandoMonitor, horarioFim: v })} tipo="time" />
                      </div>
                    </div>

                    <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3 block">Horário de Almoço (Padrão)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <CampoTexto label="Início Almoço" value={editandoMonitor.almocoInicio || ''} onChange={v => setEditandoMonitor({ ...editandoMonitor, almocoInicio: v })} tipo="time" />
                        <CampoTexto label="Fim Almoço" value={editandoMonitor.almocoFim || ''} onChange={v => setEditandoMonitor({ ...editandoMonitor, almocoFim: v })} tipo="time" />
                      </div>
                    </div>
                  </div>
                )}
              </ModalForm>
            </motion.div>
          )}

          <ModalForm aberto={!!editandoGradeMonitor} onClose={() => setEditandoGradeMonitor(null)}
            titulo={editandoGradeMonitor?.id === 'novo' ? 'Novo Plantão' : 'Editar Plantão'}
            onSalvar={() => doSave(salvarGradeMonitor(editandoGradeMonitor), setEditandoGradeMonitor)} carregando={carregando}>
            {editandoGradeMonitor && (
              <div className="space-y-4">
                <CampoSelect label="Monitor" value={editandoGradeMonitor.monitorNome} options={monitores.map(m => m.nome)} onChange={v => setEditandoGradeMonitor({ ...editandoGradeMonitor, monitorNome: v })} />
                <CampoTexto label="Posto / Local" value={editandoGradeMonitor.posto} onChange={v => setEditandoGradeMonitor({ ...editandoGradeMonitor, posto: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <CampoTexto label="Início" value={editandoGradeMonitor.horarioInicio} onChange={v => setEditandoGradeMonitor({ ...editandoGradeMonitor, horarioInicio: v })} tipo="time" />
                  <CampoTexto label="Fim" value={editandoGradeMonitor.horarioFim} onChange={v => setEditandoGradeMonitor({ ...editandoGradeMonitor, horarioFim: v })} tipo="time" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 block">Cor da Etiqueta</label>
                  <div className="flex gap-2">
                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map(c => (
                      <button key={c} onClick={() => setEditandoGradeMonitor({ ...editandoGradeMonitor, corEtiqueta: c })}
                        className={cn("w-6 h-6 rounded-full border-2", editandoGradeMonitor.corEtiqueta === c ? "border-on-surface" : "border-transparent")}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalForm>

          {/* ===================== LANGUAGE LAB ===================== */}
          {abaAtiva === 'language-lab' && (
            <motion.div key="language-lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Ensalamento Language Lab" subtitulo="Gerencie as aulas de inglês, níveis e salas do laboratório."
                acao={<button onClick={() => setEditandoLanguageLab({ id: 'novo', turma: '', nivel: '', professor: '', sala: '', horarioInicio: '08:00', horarioFim: '09:30', diaSemana: 'SEGUNDA' })} className="btn-primary"><Plus size={14} /> Nova Aula Inglês</button>}>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {languageLab.length === 0 ? <VazioMsg texto="Nenhuma aula de Language Lab cadastrada." /> :
                    languageLab.map(lab => (
                      <div key={lab.id} className="bg-surface-container-low p-5 rounded-[2rem] border border-primary/10 group hover:bg-primary/5 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="px-3 py-1 bg-primary text-on-surface-bright rounded-full text-[10px] font-black uppercase tracking-widest">
                            {lab.nivel}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditandoLanguageLab(lab)} className="p-1.5 bg-surface-container-high rounded-lg hover:text-primary"><Eye size={12} /></button>
                            <button onClick={() => { if (confirm('Excluir aula?')) doDelete(excluirLanguageLab(lab.id)); }} className="p-1.5 bg-surface-container-high rounded-lg hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <h3 className="text-sm font-black">{lab.turma}</h3>
                        <p className="text-[11px] font-bold text-on-surface-variant mt-1">{lab.professor} · {lab.sala}</p>
                        <div className="mt-4 pt-3 border-t border-outline-variant/10 flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                          <span className="text-primary">{lab.diaSemana}</span>
                          <span className="text-on-surface-variant">{lab.horarioInicio} - {lab.horarioFim}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </Painel>
            </motion.div>
          )}

          {/* ===================== CRONOGRAMA ===================== */}
          {abaAtiva === 'cronograma' && (
            <motion.div key="cron" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Painel titulo="Horários Base da Escola" subtitulo="Defina os períodos: aulas, intervalos, almoço, after school."
                acao={<button onClick={() => setEditandoPeriodo({ id: 'novo', nome: '', horarioInicio: '', horarioFim: '', tipo: 'aula' })} className="btn-primary"><Plus size={14} /> Novo Período</button>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {['6º e 7º', '8º e 9º', 'Ensino Médio'].map(seg => {
                    const periodosSeg = (periodos || []).filter(p => p.segmento === seg);
                    return (
                      <div key={seg} className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4 px-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-xl font-black tracking-tighter uppercase">{seg}</h3>
                        </div>
                        <div className="bg-surface-container-low/40 rounded-[2rem] p-4 flex-1 border border-outline-variant/10 space-y-3">
                          {periodosSeg.map(p => (
                            <div key={p.id} className="bg-surface-container-highest p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                  p.tipo === 'aula' ? "bg-emerald-500/10 text-emerald-600" :
                                    p.tipo === 'intervalo' ? "bg-red-500/10 text-red-600" :
                                      p.tipo === 'almoco' ? "bg-amber-500/10 text-amber-600" : "bg-indigo-500/10 text-indigo-600"
                                )}>
                                  {p.tipo}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => setEditandoPeriodo(p)} className="p-1 hover:text-primary transition-colors"><Eye size={12} /></button>
                                  <button onClick={() => { if (confirm('Excluir?')) doDelete(excluirPeriodo(p.id)); }} className="p-1 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              <p className="text-sm font-black text-on-surface leading-tight">{p.nome}</p>
                              <p className="text-[10px] font-bold text-on-surface-variant font-mono mt-1">
                                {p.horarioInicio?.slice(0, 5)} — {p.horarioFim?.slice(0, 5)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Seção Especializada */}
                {(periodos || []).some(p => p.segmento === 'Especializado' || !p.segmento) && (
                  <div className="mt-12 pt-8 border-t border-outline-variant/10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 px-2 tracking-[0.2em]">Monitoria & Outros</h3>
                    <div className="flex flex-wrap gap-4">
                      {(periodos || []).filter(p => !['6º e 7º', '8º e 9º', 'Ensino Médio'].includes(p.segmento || '')).map(p => (
                        <div key={p.id} onClick={() => setEditandoPeriodo(p)} className="bg-surface-container-low p-4 rounded-2xl min-w-[180px] border border-transparent hover:border-primary/20 cursor-pointer transition-all">
                          <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{p.nome}</p>
                          <p className="text-[10px] font-bold mt-1">{p.horarioInicio?.slice(0, 5)} - {p.horarioFim?.slice(0, 5)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Painel>
              <ModalForm aberto={!!editandoPeriodo} onClose={() => setEditandoPeriodo(null)}
                titulo={editandoPeriodo?.id === 'novo' ? 'Novo Período' : 'Editar Período'}
                onSalvar={() => doSave(salvarPeriodo(editandoPeriodo), setEditandoPeriodo)} carregando={carregando}>
                {editandoPeriodo && <>
                  <CampoTexto label="Nome (Ex: 1ª Aula)" value={editandoPeriodo.nome} onChange={v => setEditandoPeriodo({ ...editandoPeriodo, nome: v })} />
                  <div className="grid grid-cols-2 gap-4">
                    <CampoTexto label="Início" value={editandoPeriodo.horarioInicio} onChange={v => setEditandoPeriodo({ ...editandoPeriodo, horarioInicio: v })} tipo="time" />
                    <CampoTexto label="Fim" value={editandoPeriodo.horarioFim} onChange={v => setEditandoPeriodo({ ...editandoPeriodo, horarioFim: v })} tipo="time" />
                  </div>
                  <CampoSelect label="Tipo" value={editandoPeriodo.tipo} options={['aula', 'intervalo', 'almoco', 'permanencia', 'after']} onChange={v => setEditandoPeriodo({ ...editandoPeriodo, tipo: v as any })} />
                  <CampoSelect label="Segmento (Filtro)" value={editandoPeriodo.segmento || ''} options={['', '6º e 7º', '8º e 9º', 'Ensino Médio']} onChange={v => setEditandoPeriodo({ ...editandoPeriodo, segmento: v || undefined })} />
                </>}
              </ModalForm>
            </motion.div>
          )}

          {/* ===================== FORMULÁRIOS ===================== */}
          {abaAtiva === 'formularios' && (
            <motion.div key="forms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Construtor de Formulários" subtitulo="Crie e gerencie modelos de formulários dinâmicos."
                acao={<button onClick={() => setEditandoModelo({ id: 'novo', nome: 'Novo Formulário', descricao: '', campos: [{ id: 'f1', tipo: 'autocomplete_aluno', rotulo: 'Aluno', obrigatorio: true }] })} className="btn-primary"><Plus size={14} /> Novo Modelo</button>}>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {modelosFormulario.length === 0 ? <VazioMsg texto="Nenhum modelo criado." /> :
                    modelosFormulario.map(m => (
                      <div key={m.id} className="bg-surface-container-low p-6 rounded-[2.5rem] editorial-shadow group border border-primary/5 hover:bg-primary/5 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-sm font-black">{m.nome}</h3>
                            <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">{m.descricao}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditandoModelo(m)} className="p-1.5 bg-surface-container-high rounded-lg hover:text-primary"><Eye size={12} /></button>
                            <button onClick={() => { if (confirm('Excluir modelo?')) doDelete(excluirModeloFormulario(m.id)); }} className="p-1.5 bg-surface-container-high rounded-lg hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-outline-variant/10">
                          {m.campos.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-surface-container-high rounded text-[8px] font-black uppercase tracking-tighter text-on-surface-variant">{c.rotulo}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="font-black text-sm">Relatório de Envios (Ocorrências)</h3>
                    <div className="flex gap-2">
                      <a href="/formularios" className="btn-mini">Ver Dashboard Geral →</a>
                    </div>
                  </div>
                  <div className="divide-y divide-surface-container-low max-h-[400px] overflow-y-auto">
                    {ocorrencias.length === 0 ? <VazioMsg texto="Nenhuma ocorrência registrada ainda." /> :
                      ocorrencias.map(oc => (
                        <div key={oc.id} className="p-4 hover:bg-primary/5 transition-colors flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><FileText size={16} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">{oc.nomeAluno}</p>
                            <p className="text-[9px] text-on-surface-variant font-bold uppercase">{oc.nomeModelo} · {oc.turmaAluno}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black">{new Date(oc.criadoEm).toLocaleDateString()}</p>
                            <p className="text-[9px] text-on-surface-variant font-medium italic truncate max-w-[100px]">{oc.professorAtual || '—'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Painel>

              {/* Modal Builder de Formulário */}
              <ModalForm aberto={!!editandoModelo} onClose={() => setEditandoModelo(null)} largo
                titulo={editandoModelo?.id === 'novo' ? 'Novo Modelo de Formulário' : 'Editar Modelo de Formulário'}
                onSalvar={() => doSave(salvarModeloFormulario(editandoModelo), setEditandoModelo)} carregando={carregando}>
                {editandoModelo && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Lado Esquerdo: Configurações Gerais */}
                    <div className="md:col-span-4 space-y-6">
                      <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Informações Gerais</h4>
                        <CampoTexto label="Nome do Formulário" value={editandoModelo.nome} onChange={v => setEditandoModelo({ ...editandoModelo, nome: v })} />
                        <CampoTexto label="Descrição / Instruções" value={editandoModelo.descricao} onChange={v => setEditandoModelo({ ...editandoModelo, descricao: v })} />
                      </div>

                      <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Quick Add: Clique para Adicionar</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { tipo: 'texto', rotulo: 'Texto', icone: AlignLeft },
                            { tipo: 'area_texto', rotulo: 'Longo', icone: List },
                            { tipo: 'selecao', rotulo: 'Lista', icone: ChevronDownSquare },
                            { tipo: 'radio', rotulo: 'Escolha', icone: CircleDot },
                            { tipo: 'checkbox', rotulo: 'Caixas', icone: CheckSquare },
                            { tipo: 'serie_escolar', rotulo: 'Série', icone: GraduationCap },
                            { tipo: 'autocomplete_aluno', rotulo: 'Aluno', icone: Users },
                          ].map(t => (
                            <button key={t.tipo} onClick={() => setEditandoModelo({ ...editandoModelo, campos: [...(editandoModelo.campos || []), { id: `f-${Date.now()}`, tipo: t.tipo as any, rotulo: t.rotulo, obrigatorio: false }] })}
                              className="flex flex-col items-center justify-center p-3 bg-surface-container-highest rounded-2xl hover:bg-primary/10 hover:text-primary transition-all gap-1 text-center">
                              <t.icone size={18} />
                              <span className="text-[9px] font-black uppercase">{t.rotulo}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Lista de Campos */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estrutura do Formulário ({editandoModelo.campos?.length || 0} campos)</h4>
                      </div>

                      <div className="space-y-3">
                        {editandoModelo.campos?.length === 0 ? (
                          <div className="p-12 text-center border-2 border-dashed border-outline-variant/20 rounded-3xl opacity-40">
                            <Plus size={24} className="mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">Adicione campos usando o painel ao lado</p>
                          </div>
                        ) : (
                          editandoModelo.campos?.map((campo: any, idx: number) => (
                            <div key={campo.id} className="p-5 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4 relative group hover:border-primary/20 transition-all">
                              <button onClick={() => setEditandoModelo({ ...editandoModelo, campos: editandoModelo.campos.filter((c: any) => c.id !== campo.id) })}
                                className="absolute top-4 right-4 p-1.5 text-on-surface-variant/30 hover:text-red-500 bg-surface-container-highest rounded-lg transition-colors"><Trash2 size={14} /></button>

                              <div className="flex gap-4 items-start">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1 block">Rótulo / Pergunta</label>
                                    <input type="text" value={campo.rotulo} onChange={e => {
                                      const novos = [...editandoModelo.campos];
                                      novos[idx].rotulo = e.target.value;
                                      setEditandoModelo({ ...editandoModelo, campos: novos });
                                    }} className="bg-surface-container-highest px-4 py-3 rounded-xl text-xs font-black w-full outline-none focus:ring-2 ring-primary/20" placeholder="Ex: Motivo da falta" />
                                  </div>

                                  <div>
                                    <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1 block">Tipo de Resposta</label>
                                    <select value={campo.tipo} onChange={e => {
                                      const novos = [...editandoModelo.campos];
                                      novos[idx].tipo = e.target.value as any;
                                      setEditandoModelo({ ...editandoModelo, campos: novos });
                                    }} className="bg-surface-container-highest px-4 py-3 rounded-xl text-xs font-black w-full outline-none">
                                      <option value="texto">Texto Curto</option>
                                      <option value="area_texto">Texto Longo</option>
                                      <option value="selecao">Seleção (Dropdown)</option>
                                      <option value="radio">Múltipla Escolha (Radio)</option>
                                      <option value="checkbox">Caixas de Seleção</option>
                                      <option value="serie_escolar">Série Escolar (Padrão)</option>
                                      <option value="autocomplete_aluno">Aluno (Base de Dados)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {['selecao', 'radio', 'checkbox'].includes(campo.tipo) && (
                                <div className="pt-2">
                                  <label className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">Opções (separe por vírgula)</label>
                                  <input type="text" placeholder="Opção 1, Opção 2, Opção 3..." value={campo.opcoes?.join(', ') || ''}
                                    onChange={e => {
                                      const novos = [...editandoModelo.campos];
                                      novos[idx].opcoes = e.target.value.split(',').map(s => s.trim());
                                      setEditandoModelo({ ...editandoModelo, campos: novos });
                                    }} className="bg-surface-container-highest px-4 py-3 rounded-xl text-[10px] font-bold w-full outline-none border border-primary/5 focus:border-primary/20" />
                                </div>
                              )}

                              <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <div className="relative">
                                    <input type="checkbox" checked={campo.obrigatorio} onChange={e => {
                                      const novos = [...editandoModelo.campos];
                                      novos[idx].obrigatorio = e.target.checked;
                                      setEditandoModelo({ ...editandoModelo, campos: novos });
                                    }} className="sr-only peer" />
                                    <div className="w-8 h-4 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-all"></div>
                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-surface-container-low rounded-full peer-checked:left-4.5 transition-all"></div>
                                  </div>
                                  <span className="text-[9px] font-black uppercase text-on-surface-variant">Obrigatório</span>
                                </label>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ModalForm>
            </motion.div>
          )}



          {/* ===================== AFTER SCHOOL ===================== */}
          {abaAtiva === 'after-school' && (
            <motion.div key="after" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <Painel titulo="Atividades After School" subtitulo="Gerencie as atividades extras, esportes e oficinas do contraturno."
                acao={<button onClick={() => setEditandoAfter({ id: 'novo', nome: '', categoria: 'Esporte', horarioInicio: '16:00', horarioFim: '17:30', local: '', dias: ['SEGUNDA'], nomeProfessor: '', descricao: '', quantidadeAlunos: 0, grupoAlunos: '', vagas: 20 })} className="btn-primary"><Plus size={14} /> Nova Atividade</button>}>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(atividadesAfter || []).length === 0 ? <VazioMsg texto="Nenhuma atividade cadastrada." /> :
                    atividadesAfter.map(ativ => (
                      <div key={ativ.id} className="bg-surface-container-low p-6 rounded-[2.5rem] border border-amber-500/10 group hover:bg-amber-500/5 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="px-3 py-1 bg-amber-500 text-on-surface-bright rounded-full text-[10px] font-black uppercase tracking-widest">
                            {ativ.categoria}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditandoAfter(ativ)} className="p-1.5 bg-surface-container-high rounded-lg hover:text-primary"><Eye size={12} /></button>
                            <button onClick={() => { if (confirm('Excluir atividade?')) doDelete(excluirAtividadeAfter(ativ.id)); }} className="p-1.5 bg-surface-container-high rounded-lg hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <h3 className="text-sm font-black">{ativ.nome}</h3>
                        <p className="text-[11px] font-bold text-on-surface-variant mt-1">{ativ.nomeProfessor} · {ativ.local}</p>
                        <div className="mt-4 flex flex-wrap gap-1">
                          {ativ.dias.map(d => (
                            <span key={d} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[7px] font-black uppercase">{d.slice(0, 3)}</span>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/10 flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-amber-600">{ativ.horarioInicio} - {ativ.horarioFim}</span>
                          <span className="text-on-surface-variant">{ativ.quantidadeAlunos} / {ativ.vagas || '∞'} Alunos</span>
                        </div>
                      </div>
                    ))}
                </div>
              </Painel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAIS CENTRALIZADOS */}
        <ModalForm aberto={!!editandoAluno} onClose={() => setEditandoAluno(null)}
          titulo={editandoAluno?.id === 'novo' ? 'Cadastrar Aluno' : 'Editar Aluno'}
          onSalvar={() => doSave(salvarAluno(editandoAluno), setEditandoAluno)} carregando={carregando}>
          {editandoAluno && <>
            <CampoTexto label="Nome Completo" value={editandoAluno.nome} onChange={v => setEditandoAluno({ ...editandoAluno, nome: v })} />
            <CampoSelect label="Ano" value={editandoAluno.ano} options={ANOS_ESCOLARES} onChange={v => setEditandoAluno({ ...editandoAluno, ano: v, turma: v })} />
          </>}
        </ModalForm>

        <ModalForm aberto={!!editandoProfessor} onClose={() => setEditandoProfessor(null)}
          titulo={editandoProfessor?.id === 'novo' ? 'Cadastrar Professor' : 'Editar Professor'}
          onSalvar={() => doSave(salvarProfessorCMS(editandoProfessor), setEditandoProfessor)} carregando={carregando}>
          {editandoProfessor && (
            <div className="space-y-6">
              <CampoTexto label="Nome Completo" value={editandoProfessor.nome} onChange={v => setEditandoProfessor({ ...editandoProfessor, nome: v })} />
              <CampoTexto label="Especialidade / Matéria" value={editandoProfessor.especialidade} onChange={v => setEditandoProfessor({ ...editandoProfessor, especialidade: v })} />
              <div>
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 block">Cor Personalizada</label>
                <div className="grid grid-cols-10 gap-2">
                  {PALETA_CORES.map(cor => (
                    <button key={cor} onClick={() => setEditandoProfessor({ ...editandoProfessor, cor })}
                      className={cn("w-6 h-6 rounded-full transition-all hover:scale-125 border-2",
                        editandoProfessor.cor === cor ? "border-on-surface scale-110 shadow-lg" : "border-transparent")}
                      style={{ backgroundColor: cor }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </ModalForm>

        <ModalForm aberto={!!editandoLocal} onClose={() => setEditandoLocal(null)}
          titulo={editandoLocal?.id === 'novo' ? 'Cadastrar Local' : 'Editar Local'}
          onSalvar={() => doSave(salvarLocalCMS(editandoLocal), setEditandoLocal)} carregando={carregando}>
          {editandoLocal && (
            <div className="space-y-4">
              <CampoTexto label="Nome do Local" value={editandoLocal.nome} onChange={v => setEditandoLocal({ ...editandoLocal, nome: v })} />
              <CampoTexto label="Número (se houver)" value={editandoLocal.numero?.toString() || ''} onChange={v => setEditandoLocal({ ...editandoLocal, numero: v ? parseInt(v) : undefined })} tipo="number" />
              <CampoSelect label="Ano Escolar / Turma" value={editandoLocal.segmento || ''} options={ANOS_ESCOLARES} onChange={v => setEditandoLocal({ ...editandoLocal, segmento: v })} />
              <CampoTexto label="Tipo (sala, quadra, etc)" value={editandoLocal.tipo} onChange={v => setEditandoLocal({ ...editandoLocal, tipo: v })} />
              <CampoTexto label="Capacidade" value={editandoLocal.capacidade?.toString() || ''} onChange={v => setEditandoLocal({ ...editandoLocal, capacidade: v ? parseInt(v) : undefined })} tipo="number" />
            </div>
          )}
        </ModalForm>

        <ModalForm aberto={!!editandoLanguageLab} onClose={() => setEditandoLanguageLab(null)}
          titulo={editandoLanguageLab?.id === 'novo' ? 'Nova Aula Inglês' : 'Editar Aula Inglês'}
          onSalvar={() => doSave(salvarLanguageLab(editandoLanguageLab), setEditandoLanguageLab)} carregando={carregando}>
          {editandoLanguageLab && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Turma (Ex: 9º Ano A)" value={editandoLanguageLab.turma} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, turma: v })} />
                <CampoTexto label="Nível (Ex: B1 Intermediate)" value={editandoLanguageLab.nivel} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, nivel: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Professor" value={editandoLanguageLab.professor} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, professor: v })} />
                <CampoTexto label="Sala / Local" value={editandoLanguageLab.sala} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, sala: v })} />
              </div>
              <CampoSelect label="Dia da Semana" value={editandoLanguageLab.diaSemana} options={DIAS_SEMANA} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, diaSemana: v })} />
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Início" value={editandoLanguageLab.horarioInicio} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, horarioInicio: v })} tipo="time" />
                <CampoTexto label="Fim" value={editandoLanguageLab.horarioFim} onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, horarioFim: v })} tipo="time" />
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20">
                <SeletorAlunos
                  alunos={alunosBase}
                  selecionados={editandoLanguageLab.listaAlunos || []}
                  onChange={v => setEditandoLanguageLab({ ...editandoLanguageLab, listaAlunos: v })}
                />
              </div>
            </div>
          )}
        </ModalForm>
        <ModalForm aberto={!!editandoGrade} onClose={() => setEditandoGrade(null)}
          titulo="Editar Horário de Aula"
          onSalvar={() => doSave(salvarGradeSala([editandoGrade]), setEditandoGrade)} carregando={carregando}>
          {editandoGrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Professor" value={editandoGrade.nomeProfessor} onChange={v => setEditandoGrade({ ...editandoGrade, nomeProfessor: v })} />
                <CampoTexto label="Matéria" value={editandoGrade.materia} onChange={v => setEditandoGrade({ ...editandoGrade, materia: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoSelect label="Dia" value={editandoGrade.diaSemana} options={DIAS_SEMANA} onChange={v => setEditandoGrade({ ...editandoGrade, diaSemana: v })} />
                <CampoTexto label="Horário (Ex: 07:30)" value={editandoGrade.horario} onChange={v => setEditandoGrade({ ...editandoGrade, horario: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Turma" value={editandoGrade.turma} onChange={v => setEditandoGrade({ ...editandoGrade, turma: v })} />
                <CampoTexto label="Número da Sala" value={editandoGrade.numeroSala?.toString()} tipo="number" onChange={v => setEditandoGrade({ ...editandoGrade, numeroSala: parseInt(v) })} />
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20">
                <SeletorAlunos
                  alunos={alunosBase}
                  selecionados={editandoGrade.listaAlunos || []}
                  onChange={v => setEditandoGrade({ ...editandoGrade, listaAlunos: v })}
                />
              </div>
            </div>
          )}
        </ModalForm>

        <ModalForm aberto={!!editandoAfter} onClose={() => setEditandoAfter(null)}
          titulo={editandoAfter?.id === 'novo' ? 'Nova Atividade After School' : 'Editar Atividade After School'}
          onSalvar={() => doSave(salvarAtividadeAfter(editandoAfter), setEditandoAfter)} carregando={carregando}>
          {editandoAfter && (
            <div className="space-y-4">
              <CampoTexto label="Nome da Atividade" value={editandoAfter.nome} onChange={v => setEditandoAfter({ ...editandoAfter, nome: v })} />
              <CampoSelect label="Categoria" value={editandoAfter.categoria} options={['Esporte', 'Oficina', 'Reforço', 'Outro']} onChange={v => setEditandoAfter({ ...editandoAfter, categoria: v })} />
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Professor" value={editandoAfter.nomeProfessor} onChange={v => setEditandoAfter({ ...editandoAfter, nomeProfessor: v })} />
                <CampoTexto label="Local" value={editandoAfter.local} onChange={v => setEditandoAfter({ ...editandoAfter, local: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Horário de Início" value={editandoAfter.horarioInicio} tipo="time" onChange={v => setEditandoAfter({ ...editandoAfter, horarioInicio: v })} />
                <CampoTexto label="Horário de Término" value={editandoAfter.horarioFim} tipo="time" onChange={v => setEditandoAfter({ ...editandoAfter, horarioFim: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoTexto label="Alunos Matriculados" value={editandoAfter.quantidadeAlunos?.toString() || '0'} tipo="number" onChange={v => setEditandoAfter({ ...editandoAfter, quantidadeAlunos: parseInt(v) })} />
                <CampoTexto label="Vagas Totais" value={editandoAfter.vagas?.toString() || '20'} tipo="number" onChange={v => setEditandoAfter({ ...editandoAfter, vagas: parseInt(v) })} />
              </div>
              <div>
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 block">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <label key={dia} className="flex items-center gap-2 bg-surface-container p-2 rounded-lg text-xs font-bold cursor-pointer">
                      <input type="checkbox" checked={editandoAfter.dias?.includes(dia)} onChange={e => {
                        const dias = e.target.checked
                          ? [...(editandoAfter.dias || []), dia]
                          : (editandoAfter.dias || []).filter((d: string) => d !== dia);
                        setEditandoAfter({ ...editandoAfter, dias });
                      }} className="rounded text-primary" />
                      {dia}
                    </label>
                  ))}
                </div>
              </div>
              <CampoTexto label="Descrição / Detalhes" value={editandoAfter.descricao || ''} onChange={v => setEditandoAfter({ ...editandoAfter, descricao: v })} />

              <div className="mt-6 pt-4 border-t border-outline-variant/20">
                <SeletorAlunos
                  alunos={alunosBase}
                  selecionados={editandoAfter.listaAlunos || []}
                  onChange={v => setEditandoAfter({ ...editandoAfter, listaAlunos: v })}
                />
              </div>
            </div>
          )}
        </ModalForm>
      </motion.div>
    </>
  );
}

// ============================================================
// SUB-COMPONENTES REUTILIZÁVEIS
// ============================================================

function Painel({ titulo, subtitulo, acao, children }: { titulo: string; subtitulo?: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">{titulo}</h2>
          {subtitulo && <p className="text-sm text-on-surface-variant">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </div>
  );
}

function VazioMsg({ texto }: { texto: string }) {
  return (
    <div className="p-12 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
      <p className="text-on-surface-variant font-medium text-sm">{texto}</p>
    </div>
  );
}

function CardResumo({ icone: Icone, titulo, valor, cor }: { icone: any; titulo: string; valor: number; cor: string }) {
  const cores: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };
  return (
    <div className="bg-surface-container-low p-5 rounded-2xl flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cores[cor])}><Icone size={24} /></div>
      <div>
        <p className="text-2xl font-black">{valor}</p>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{titulo}</p>
      </div>
    </div>
  );
}

function ModalForm({ aberto, onClose, titulo, onSalvar, carregando, children, largo = false }: {
  aberto: boolean; onClose: () => void; titulo: string; onSalvar: () => void; carregando: boolean; children: React.ReactNode; largo?: boolean;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={cn("bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow w-full space-y-5", largo ? "max-w-4xl" : "max-w-lg")} onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-black tracking-tighter">{titulo}</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">{children}</div>
        <div className="flex gap-4 pt-4 border-t">
          <button onClick={onClose} className="flex-1 py-4 text-on-surface-variant font-bold text-sm">Cancelar</button>
          <button onClick={onSalvar} disabled={carregando}
            className="flex-1 py-4 bg-primary text-on-surface-bright rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50">
            {carregando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CampoTexto({ label, value, onChange, tipo = 'text' }: { label: string; value: string; onChange: (v: string) => void; tipo?: string }) {
  return (
    <div>
      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 block">{label}</label>
      <input type={tipo} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={label}
        className="campo-input" />
    </div>
  );
}

function CampoSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 block">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="campo-input">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SeletorAlunos({ alunos, selecionados, onChange }: { alunos: any[]; selecionados: string[]; onChange: (selecionados: string[]) => void }) {
  const [busca, setBusca] = useState('');

  const alunosFiltrados = alunos.filter(a =>
    !busca ||
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.turma && a.turma.toLowerCase().includes(busca.toLowerCase()))
  );

  const toggleAluno = (id: string) => {
    if (selecionados.includes(id)) {
      onChange(selecionados.filter(s => s !== id));
    } else {
      onChange([...selecionados, id]);
    }
  };

  return (
    <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container-lowest">
      <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 block flex justify-between">
          <span>Selecionar Alunos Matriculados</span>
          <span className="text-primary">{selecionados.length} selecionados</span>
        </label>
        <input
          type="text"
          placeholder="Buscar aluno por nome ou turma..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full text-xs p-2 rounded bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
        {alunosFiltrados.length === 0 ? (
          <p className="text-xs text-center p-4 text-on-surface-variant">Nenhum aluno encontrado.</p>
        ) : (
          alunosFiltrados.map(a => (
            <label key={a.id} className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selecionados.includes(a.id)}
                onChange={() => toggleAluno(a.id)}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold">{a.nome}</span>
                <span className="text-[9px] font-black text-on-surface-variant tracking-widest uppercase">{a.turma}</span>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}