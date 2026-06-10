import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { FileText, Search, UserCheck, Download, BarChart3, Plus, X, ChevronDown, Calendar, Filter, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { Aluno, ModeloFormulario, CampoFormulario, RegistroOcorrencia } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  salvarOcorrencia, 
  salvarModeloFormulario, 
  excluirModeloFormulario 
 } from '../services/dataService';
import { generateOccurrencesPDF, generateOccurrencesExcel, generateFichaOcorrenciaPDF } from '../lib/reportGenerator';
import FichaOcorrencia from '../components/FichaOcorrencia';
import { occurrenceService } from '../services/occurrenceService';
import { DailyOccurrenceRecord } from '../types';

// === Componente de Autopreenchimento de Aluno ===
function AutocompleteAluno({
  alunos,
  valor,
  aoSelecionar,
}: {
  alunos: Aluno[];
  valor: string;
  aoSelecionar: (aluno: Aluno) => void;
}) {
  const [busca, setBusca] = useState(valor);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sugestoes = busca.length >= 2
    ? alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    setBusca(valor);
  }, [valor]);

  useEffect(() => {
    const fechar = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    document.addEventListener('touchstart', fechar);
    return () => {
      document.removeEventListener('mousedown', fechar);
      document.removeEventListener('touchstart', fechar);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-all duration-300" size={18} />
        <input
          type="text"
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          placeholder="Comece a digitar o nome do aluno..."
          className="w-full bg-surface-container-high/50 border-2 border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:bg-surface-container-high placeholder:text-on-surface-variant/20"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2">
           <div className={cn("w-2 h-2 rounded-full transition-all duration-500", busca.length >= 2 ? "bg-primary shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-white/10")} />
        </div>
      </div>

      <AnimatePresence>
        {aberto && sugestoes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute z-[60] w-full mt-3 bg-[#121212] border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
          >
            {sugestoes.map(aluno => (
              <button
                key={aluno.id}
                onClick={() => { aoSelecionar(aluno); setBusca(aluno.nome); setAberto(false); }}
                className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 text-left"
              >
                <div>
                  <p className="text-sm font-black text-white">{aluno.nome}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                    {aluno.turma} · {aluno.numeroSala > 0 ? `Sala ${aluno.numeroSala.toString().padStart(2, '0')}` : 'Sem Sala'}
                  </p>
                </div>
                <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">{aluno.ano}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Página Principal de Formulários ===
const SERIES = [
  '6º Ano Fundamental', '7º Ano Fundamental', '8º Ano Fundamental', '9º Ano Fundamental',
  '1º Ano Médio', '2º Ano Médio', '3º Ano Médio'
];

export default function FormsPage() {
  const { 
    alunos, modelosFormulario, ocorrencias, 
    adicionarOcorrencia, atualizar, professoresCMS 
  } = useEscola();

  const { profile } = useAuth();

  const location = useLocation();

  const [abaAtiva, setAbaAtiva] = useState<'nova' | 'relatorios'>('nova');
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloFormulario | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [dadosFormulario, setDadosFormulario] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<RegistroOcorrencia | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [filtroRelatorio, setFiltroRelatorio] = useState<'diario' | 'semanal' | 'quinzenal' | 'mensal'>('diario');
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<RegistroOcorrencia | null>(null);
  const [tratandoOcorrenciaTipo, setTratandoOcorrenciaTipo] = useState<string | null>(null);

  // Prefill responsible/professor fields automatically
  useEffect(() => {
    if (modeloSelecionado && profile?.full_name) {
      setDadosFormulario(prev => {
        const novosDados = { ...prev };
        let mudou = false;
        
        modeloSelecionado.campos.forEach(campo => {
          const rotuloLower = campo.rotulo.toLowerCase().trim();
          const matches = [
            'responsável pelo registro',
            'responsavel pelo registro',
            'responsável',
            'responsavel',
            'professor',
            'professor(a)',
            'orientador',
            'orientador(a)'
          ];
          
          if (matches.includes(rotuloLower)) {
            if (!novosDados[campo.rotulo]) {
              novosDados[campo.rotulo] = profile.full_name;
              mudou = true;
            }
          }
        });
        
        return mudou ? novosDados : prev;
      });
    }
  }, [modeloSelecionado, profile]);

  // Estado do Construtor
  const [editandoModelo, setEditandoModelo] = useState<Partial<ModeloFormulario> | null>(null);



  const handleSelectTratativaPendente = (studentName: string, schoolYear: string, type: string, count: number) => {
    setTratandoOcorrenciaTipo(type);
    const studentObj = alunos.find(a => a.nome.trim().toLowerCase() === studentName.trim().toLowerCase());
    if (studentObj) {
      setAlunoSelecionado(studentObj);
    } else {
      setAlunoSelecionado({
        id: 'temp-' + new Date().getTime(),
        nome: studentName,
        turma: schoolYear || 'Não especificado',
        ano: schoolYear || 'Não especificado',
        numeroSala: 0
      });
    }

    const formModel = modelosFormulario.find(
      m => m.id === '11111111-1111-1111-1111-111111111111' || 
      m.nome.toLowerCase().includes('orientação') ||
      m.nome.toLowerCase().includes('disciplinar')
    );
    if (formModel) {
      setModeloSelecionado(formModel);
    }

    let tipoOcorrenciaMapped = 'Outros';
    const tipoCampo = formModel?.campos.find(c => c.rotulo === 'Tipo de Ocorrência');
    const opcoesDisponiveis = tipoCampo?.opcoes || [];
    
    // Tenta encontrar correspondência exata
    const matchExato = opcoesDisponiveis.find(
      opt => opt.trim().toLowerCase() === type.trim().toLowerCase()
    );
    
    if (matchExato) {
      tipoOcorrenciaMapped = matchExato;
    } else {
      // Regras de fallback inteligentes
      const normalizedType = type.toLowerCase();
      if (normalizedType.includes('celular')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('celular'));
        tipoOcorrenciaMapped = found || 'Uso Indevido de Celular';
      } else if (normalizedType.includes('aparelho') || normalizedType.includes('eletrônico')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('eletrônico') || o.toLowerCase().includes('aparelho'));
        tipoOcorrenciaMapped = found || 'Uso Indevido de Aparelhos Eletrônicos';
      } else if (normalizedType.includes('indisciplina') || normalizedType.includes('material') || normalizedType.includes('agressão')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('indisciplina'));
        tipoOcorrenciaMapped = found || 'Indisciplina Escolar';
      } else if (normalizedType.includes('uniforme')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('uniforme'));
        tipoOcorrenciaMapped = found || 'Descumprimento do Uniforme Escolar';
      } else if (normalizedType.includes('atraso')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('atraso') || o.toLowerCase().includes('atrasos'));
        tipoOcorrenciaMapped = found || 'Atrasos Reincidentes';
      } else if (normalizedType.includes('falta')) {
        const found = opcoesDisponiveis.find(o => o.toLowerCase().includes('falta'));
        tipoOcorrenciaMapped = found || 'Falta';
      } else {
        tipoOcorrenciaMapped = opcoesDisponiveis[opcoesDisponiveis.length - 1] || 'Outros';
      }
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR');
    const todayStr = today.toISOString().split('T')[0];

    let defaultDescription = '';

    if (type === 'Uso indevido de celular' || type === 'Uso Indevido de Celular') {
      defaultDescription = `Em ${dateStr}, o(a) aluno(a) ${studentName}, da série ${schoolYear}, foi atendido(a) pela equipe escolar para registro e orientação em razão do uso indevido de aparelho eletrônico (celular) no ambiente escolar.

Durante a tratativa, foram realizadas orientações acerca da importância do cumprimento das normas institucionais, da manutenção de uma postura adequada ao ambiente educacional e da colaboração para o bom desenvolvimento das atividades escolares.

Foi esclarecido ao(à) estudante que a Lei Federal nº 15.100, de 13 de janeiro de 2025, em seu Art. 2º, restringe a utilização de aparelhos eletrônicos portáteis pessoais, incluindo telefones celulares, pelos estudantes da Educação Básica durante as aulas, recreios e intervalos, ressalvadas as exceções previstas na própria legislação para fins pedagógicos, de acessibilidade, inclusão ou necessidades de saúde.

O(A) aluno(a) declarou estar ciente das orientações recebidas, bem como da legislação vigente e das normas estabelecidas pela instituição, comprometendo-se a adequar sua conduta às regras escolares.`;
    } else {
      defaultDescription = `O(a) aluno(a) ${studentName} acumula ${count} ocorrências de "${type}" registradas recentemente. Considerando a reincidência, foi realizada esta ata de tratativa e encaminhamento pedagógico em ${dateStr}.`;
    }

    const initialDados: Record<string, string> = {
      'Data': todayStr,
      'Tipo de Ocorrência': tipoOcorrenciaMapped,
      'Descrição': defaultDescription
    };

    if (profile?.full_name) {
      formModel?.campos.forEach(campo => {
        const rotuloLower = campo.rotulo.toLowerCase().trim();
        const matches = [
          'responsável pelo registro',
          'responsavel pelo registro',
          'responsável',
          'responsavel',
          'professor',
          'professor(a)',
          'orientador',
          'orientador(a)'
        ];
        if (matches.includes(rotuloLower)) {
          initialDados[campo.rotulo] = profile.full_name;
        }
      });
    }

    setDadosFormulario(initialDados);
  };

  useEffect(() => {
    if (modelosFormulario.length > 0 && !modeloSelecionado) {
      setModeloSelecionado(modelosFormulario[0]);
    }
  }, [modelosFormulario, modeloSelecionado]);

  useEffect(() => {
    if (location.state?.prefill && modelosFormulario.length > 0 && alunos.length > 0) {
      const { studentName, schoolYear, type, count } = location.state.prefill;
      setAbaAtiva('nova');
      handleSelectTratativaPendente(studentName, schoolYear, type, count);
      // Limpa o estado da rota para não re-preencher ao atualizar a página
      window.history.replaceState({}, document.title);
    }
  }, [location.state, modelosFormulario, alunos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloSelecionado || !alunoSelecionado) return;

    setSalvando(true);
    const occurrencePayload = {
      modeloFormularioId: modeloSelecionado.id,
      nomeModelo: modeloSelecionado.nome,
      dados: dadosFormulario,
      nomeAluno: alunoSelecionado.nome,
      turmaAluno: alunoSelecionado.turma,
      anoAluno: alunoSelecionado.ano,
      salaAluno: alunoSelecionado.numeroSala,
      professorAtual: profile?.full_name || 'Administração',
    };

    const savedRec = await salvarOcorrencia(occurrencePayload);

    if (savedRec) {
      setSubmittedRecord(savedRec);
      
      if (tratandoOcorrenciaTipo) {
        try {
          await occurrenceService.markRecordsAsTreated(alunoSelecionado.nome, tratandoOcorrenciaTipo);
        } catch (err) {
          console.error('Erro ao marcar registros como tratados:', err);
        }
      }
      atualizar();
      setEnviado(true);
      setTratandoOcorrenciaTipo(null);
    }
    setSalvando(false);
  };

  const limparFormulario = () => {
    setAlunoSelecionado(null);
    setDadosFormulario({});
    setEnviado(false);
    setTratandoOcorrenciaTipo(null);
    setSubmittedRecord(null);
  };

  // Filtrar ocorrências por período (Defensivo)
  const ocorrenciasBase = Array.isArray(ocorrencias) ? ocorrencias : [];
  
  const ocorrenciasFiltradas = ocorrenciasBase.filter(oc => {
    if (!oc.criadoEm) return false;
    const dataOc = new Date(oc.criadoEm);
    if (isNaN(dataOc.getTime())) return false;
    
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const inicioDataOc = new Date(dataOc);
    inicioDataOc.setHours(0, 0, 0, 0);

    const diffTime = inicioHoje.getTime() - inicioDataOc.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    switch (filtroRelatorio) {
      case 'diario': return diffDays === 0;
      case 'semanal': return diffDays < 7;
      case 'quinzenal': return diffDays < 15;
      case 'mensal': return diffDays < 30;
      default: return true;
    }
  });

  const contagemPorTipo: Record<string, number> = ocorrenciasFiltradas.reduce((acc, oc) => {
    const nome = oc.nomeModelo || 'Desconhecido';
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosRecorrentes: Record<string, number> = ocorrenciasFiltradas.reduce((acc, oc) => {
    const nome = oc.nomeAluno || 'Desconhecido';
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosOrdenados: [string, number][] = Object.entries(alunosRecorrentes)
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
    .slice(0, 5);

  const handleGeneratePDF = async () => {
    const dataToExport = ocorrenciasFiltradas.map(oc => ({
      student_name: oc.nomeAluno || 'Desconhecido',
      school_year: oc.anoAluno || 'Não informado',
      occurrence_type: oc.nomeModelo || 'Ata',
      report: Object.entries(oc.dados || {}).map(([k, v]) => `[${k}]: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'),
      created_at: oc.criadoEm
    }));
    const master30Days = ocorrenciasBase.map(oc => ({
      student_name: oc.nomeAluno || 'Desconhecido',
      school_year: oc.anoAluno || 'Não informado',
      occurrence_type: oc.nomeModelo || 'Ata',
      report: '',
      created_at: oc.criadoEm
    }));
    await generateOccurrencesPDF(dataToExport, filtroRelatorio, '', master30Days);
  };

  const handleGenerateExcel = () => {
    const dataToExport = ocorrenciasFiltradas.map(oc => ({
      student_name: oc.nomeAluno || 'Desconhecido',
      school_year: oc.anoAluno || 'Não informado',
      occurrence_type: oc.nomeModelo || 'Ata',
      report: Object.entries(oc.dados || {}).map(([k, v]) => `[${k}]: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'),
      created_at: oc.criadoEm
    }));
    const master30Days = ocorrenciasBase.map(oc => ({
      student_name: oc.nomeAluno || 'Desconhecido',
      school_year: oc.anoAluno || 'Não informado',
      occurrence_type: oc.nomeModelo || 'Ata',
      report: '',
      created_at: oc.criadoEm
    }));
    generateOccurrencesExcel(dataToExport, filtroRelatorio, '', master30Days);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-10">
      {/* Header Premium - WOW Effect */}
      <div className="relative mb-12 p-4 md:p-10 rounded-[3rem] overflow-hidden group border border-white/5 shadow-2xl">
        {/* Fundo Decorativo Dinâmico */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-600/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
        <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="w-24 h-24 bg-primary text-black rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 group-hover:rotate-0 transition-all duration-700 ease-out">
              <FileSpreadsheet size={48} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] bg-primary/10 px-3 py-1 rounded-full">Sistema Ativo</span>
                <div className="h-px w-12 bg-white/10" />
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-none">
                REGISTRO DE <br />
                <span className="text-primary drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">OCORRÊNCIA</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex gap-1 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
                {([
                  { id: 'nova', rotulo: 'Registrar' },
                  { id: 'relatorios', rotulo: 'Dashboards' },
                ] as const).map((aba) => (
                  <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                    className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      abaAtiva === aba.id ? "bg-primary text-black shadow-lg scale-105" : "text-on-surface-variant hover:text-on-surface")}>
                    {aba.rotulo}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-fit">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ambiente Seguro</span>
              </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* === ABA: NOVA OCORRÊNCIA === */}
        {abaAtiva === 'nova' && (
          <motion.div key="nova" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {Array.isArray(modelosFormulario) && modelosFormulario.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {modelosFormulario.map(modelo => (
                  <button key={modelo.id} onClick={() => { setModeloSelecionado(modelo); limparFormulario(); }}
                    className={cn("flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black transition-all border-2",
                      modeloSelecionado?.id === modelo.id ? "bg-primary text-on-surface-bright border-primary" : "bg-surface-container-lowest text-on-surface-variant border-transparent hover:border-primary/10")}>
                    {modelo.nome}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center bg-surface-container-lowest rounded-[2.5rem] editorial-shadow border-2 border-dashed border-primary/10">
                <FileSpreadsheet size={48} className="text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-black mb-2">Nenhum formulário ativo</h3>
                <p className="text-on-surface-variant text-sm mb-6 max-w-sm mx-auto">Solicite ao administrador a criação de um novo formulário dinâmico.</p>
              </div>
            )}

            {modeloSelecionado && !enviado && (
              <div className="max-w-4xl mx-auto w-full bg-surface-container-lowest rounded-[2.5rem] overflow-hidden editorial-shadow border border-outline-variant/10">
                  {/* Official Sesi Document Header Accent */}
                  <div className="relative w-full h-[100px] md:h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-4 md:px-8 select-none">
                    {/* Polígonos Geométricos */}
                    <div className="absolute top-0 left-0 w-[180px] md:w-[300px] h-full pointer-events-none">
                      <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                      <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                      <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
                    </div>
                    <div className="flex-1" />
                    {/* Logo Sesi */}
                    <div className="relative z-10">
                      <div className="flex flex-col items-end mr-2 md:mr-4">
                        <div className="flex items-center gap-1 md:gap-2 mr-1">
                          <span className="text-[9px] md:text-[11px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-[#0c2340]" />
                            <div className="w-1 md:w-2 h-2.5 md:h-3.5 rounded-full bg-[#0c2340]" />
                          </div>
                        </div>
                        <div className="text-[28px] md:text-[42px] font-bold text-[#0c2340] leading-none tracking-tight -mt-0.5 md:-mt-1 font-serif italic mr-2 md:mr-6 relative">
                          Ses<span className="relative">ı</span>
                        </div>
                        <div className="bg-[#fbbf24] text-[#0c2340] text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] px-2.5 md:px-4 py-1 md:py-2 mt-1 rounded-[6px] md:rounded-[8px] transform -skew-x-12 leading-none">
                          internacional
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-8 md:p-10 space-y-8">
                    <div className="mb-4">
                      <h2 className="text-xl font-black text-on-surface mb-1">{modeloSelecionado.nome}</h2>
                      <p className="text-on-surface-variant font-medium text-sm">{modeloSelecionado.descricao}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-8">
                    {modeloSelecionado.campos.map(campo => (
                      <div key={campo.id} className="space-y-4 bg-white/[0.02] p-4 md:p-8 rounded-[2.5rem] border border-white/[0.05] relative group/field">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-focus-within/field:bg-primary transition-all" />
                        
                        {campo.tipo !== 'sessao' && (
                          <label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] px-1 flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {campo.rotulo} {campo.obrigatorio && <span className="text-red-500">*</span>}
                          </label>
                        )}
                        {campo.tipo === 'sessao' && (
                          <div className="flex items-center gap-4 py-4">
                            <div className="h-px flex-1 bg-primary/20" />
                            <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] whitespace-nowrap">{campo.rotulo}</h3>
                            <div className="h-px flex-1 bg-primary/20" />
                          </div>
                        )}
                        {campo.tipo === 'autocomplete_aluno' && (
                          <div className="space-y-3">
                            <AutocompleteAluno alunos={alunos} valor={alunoSelecionado?.nome || ''} aoSelecionar={setAlunoSelecionado} />
                            {alunoSelecionado && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-3 pt-2">
                                {[
                                  { rotulo: 'Ano', valor: alunoSelecionado.ano },
                                  { rotulo: 'Turma', valor: alunoSelecionado.turma !== alunoSelecionado.ano ? alunoSelecionado.turma : null },
                                  { rotulo: 'Sala', valor: alunoSelecionado.numeroSala > 0 ? `Sala ${alunoSelecionado.numeroSala.toString().padStart(2, '0')}` : null },
                                ].filter(i => i.valor).map(info => (
                                  <div key={info.rotulo} className="bg-primary/10 p-4 px-6 rounded-2xl border border-primary/20 min-w-[120px]">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{info.rotulo}</p>
                                    <p className="text-sm font-black text-on-surface">{info.valor}</p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        )}
                        {campo.tipo === 'texto' && <input type="text" required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base" />}
                        
                        {campo.tipo === 'selecao' && campo.opcoes && (
                          <select required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base">
                            <option value="">Selecione uma opção...</option>
                            {campo.opcoes.map(opcao => <option key={opcao} value={opcao}>{opcao}</option>)}
                          </select>
                        )}
    
                        {campo.tipo === 'radio' && campo.opcoes && (
                          <div className="flex flex-wrap gap-3">
                            {campo.opcoes.map(opcao => (
                              <label key={opcao} className="cursor-pointer">
                                <input type="radio" name={campo.id} required={campo.obrigatorio} className="sr-only peer" onChange={() => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: opcao }))} checked={dadosFormulario[campo.rotulo] === opcao} />
                                <div className="px-6 py-4 rounded-2xl bg-surface-container-high text-on-surface-variant peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:ring-2 peer-checked:ring-primary font-black text-sm transition-all hover:bg-surface-container-highest">
                                  {opcao}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
    
                        {campo.tipo === 'checkbox' && campo.opcoes && (
                          <div className="flex flex-wrap gap-3">
                            {campo.opcoes.map(opcao => {
                              const valores = dadosFormulario[campo.rotulo] || [];
                              const estaSelecionado = valores.includes(opcao);
                              return (
                                <label key={opcao} className="cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" 
                                    onChange={e => {
                                      const novosValores = e.target.checked 
                                        ? [...valores, opcao]
                                        : valores.filter((v: string) => v !== opcao);
                                      setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: novosValores }));
                                    }} checked={estaSelecionado} />
                                  <div className="px-6 py-4 rounded-2xl bg-surface-container-high text-on-surface-variant peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:ring-2 peer-checked:ring-primary font-black text-sm transition-all hover:bg-surface-container-highest">
                                    {opcao}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
  
                        {campo.tipo === 'serie_escolar' && (
                          <select required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base">
                            <option value="">Selecione a série...</option>
                            {SERIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
  
                        {campo.tipo === 'data' && (
                          <input 
                            type="date" 
                            required={campo.obrigatorio} 
                            value={dadosFormulario[campo.rotulo] || ''} 
                            onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} 
                            className="campo-input-base" 
                          />
                        )}
  
                        {campo.tipo === 'area_texto' && (
                          <textarea 
                            required={campo.obrigatorio} 
                            value={dadosFormulario[campo.rotulo] || ''} 
                            onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} 
                            className="w-full bg-surface-container-high/50 border-2 border-white/5 rounded-[1.5rem] p-4 md:p-6 text-lg font-medium focus:ring-8 focus:ring-primary/5 focus:border-primary/40 focus:bg-surface-container-high transition-all min-h-[300px] shadow-inner editorial-leading text-white placeholder:text-on-surface-variant/20 outline-none" 
                            style={{ color: '#ffffff', caretColor: '#fbbf24' }}
                            placeholder="Descreva detalhadamente o ocorrido..." 
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end gap-4 pt-4">
                      <button type="button" onClick={limparFormulario} className="px-8 py-4 text-on-surface-variant font-bold text-sm">Limpar</button>
                      <button type="submit" disabled={!alunoSelecionado || salvando} className="btn-primary !px-12 !py-4">
                        {salvando ? 'Salvando...' : 'Registrar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {enviado && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-container-lowest p-10 md:p-16 rounded-[2.5rem] editorial-shadow text-center space-y-8 flex flex-col items-center justify-center border-2 border-emerald-500/20 max-w-2xl mx-auto"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                  <UserCheck size={40} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-emerald-500">Registrado com Sucesso!</h2>
                  <p className="text-on-surface-variant font-medium text-sm">O formulário de ata foi salvo no prontuário com sucesso.</p>
                </div>

                {submittedRecord && (
                  <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 text-left space-y-3 text-xs md:text-sm font-medium text-on-surface-variant max-w-md mx-auto">
                    <p><span className="font-bold text-white">Aluno:</span> {submittedRecord.nomeAluno}</p>
                    <p><span className="font-bold text-white">Série/Ano:</span> {submittedRecord.anoAluno || submittedRecord.turmaAluno || 'Não informado'}</p>
                    <p><span className="font-bold text-white">Formulário:</span> {submittedRecord.nomeModelo}</p>
                    {submittedRecord.dados && Object.keys(submittedRecord.dados).length > 0 && (
                      <p className="line-clamp-3">
                        <span className="font-bold text-white">Descrição:</span>{' '}
                        {(() => {
                          const descKey = Object.keys(submittedRecord.dados).find(
                            k => k.toLowerCase() === 'descrição' || k.toLowerCase() === 'descricao' || k.toLowerCase() === 'relato'
                          );
                          return descKey ? String(submittedRecord.dados[descKey]) : '';
                        })()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-2">
                  <button 
                    onClick={limparFormulario} 
                    className="flex-1 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer border border-white/10"
                  >
                    Novo Registro
                  </button>
                  <button 
                    onClick={async () => {
                      if (submittedRecord) {
                        const configAssinaturas = {
                          mostrarAluno: true,
                          nomeAluno: submittedRecord.nomeAluno,
                          mostrarResponsavel: true,
                          nomeResponsavel: '',
                          mostrarEmissor: true,
                          nomeEmissor: submittedRecord.professorAtual || 'Administração'
                        };
                        await generateFichaOcorrenciaPDF(submittedRecord, configAssinaturas, []);
                      }
                    }} 
                    disabled={!submittedRecord}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={14} /> Baixar PDF
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === ABA: RELATÓRIOS (DASHBOARDS) === */}
        {abaAtiva === 'relatorios' && (
          <motion.div key="relatorios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit">
              {['diario', 'semanal', 'quinzenal', 'mensal'].map(f => (
                <button key={f} onClick={() => setFiltroRelatorio(f as any)}
                  className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroRelatorio === f ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant")}>{f}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CardResumoMini titulo="Total" valor={ocorrenciasFiltradas.length} cor="primary" icone={FileText} />
              <CardResumoMini titulo="Frequente" valor={alunosOrdenados[0]?.[1] || 0} subtitulo={alunosOrdenados[0]?.[0] || '—'} cor="tertiary" icone={UserCheck} />
              <CardResumoMini titulo="Top Evento" valor={Object.entries(contagemPorTipo).sort((a,b)=>b[1]-a[1])[0]?.[1] || 0} subtitulo={Object.entries(contagemPorTipo).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'} cor="indigo" icone={BarChart3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                  <Download className="w-32 h-32" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Exportar em PDF</h3>
                <p className="text-blue-100 mb-8 max-w-sm">
                  Gere um documento formatado com o layout oficial para arquivamento ou envio. O arquivo é gerado dinamicamente e descartado após o download.
                </p>
                <button
                  onClick={handleGeneratePDF}
                  disabled={ocorrenciasFiltradas.length === 0}
                  className="w-full sm:w-auto justify-center bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileText className="w-5 h-5" />
                  Gerar Relatório PDF
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                  <FileSpreadsheet className="w-32 h-32" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Exportar Planilha</h3>
                <p className="text-emerald-100 mb-8 max-w-sm">
                  Exporte os dados em formato tabular (Excel/CSV) para análises avançadas, criação de gráficos ou integração com outros sistemas.
                </p>
                <button
                  onClick={handleGenerateExcel}
                  disabled={ocorrenciasFiltradas.length === 0}
                  className="w-full sm:w-auto justify-center bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Gerar Planilha (XLSX)
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-hidden">
                <div className="p-4 md:p-6 border-b flex items-center justify-between">
                    <h3 className="font-black">Eventos Recentes</h3>
                    <div className="flex gap-2">
                      {ocorrenciasFiltradas.length > 0 && <button onClick={handleGenerateExcel} className="btn-mini"><Download size={12}/> XLS</button>}
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {ocorrenciasFiltradas.length === 0 ? (
                      <div className="p-20 text-center space-y-3">
                        <BarChart3 size={40} className="text-on-surface-variant/20 mx-auto" />
                        <p className="text-on-surface-variant text-sm italic">Nenhum registro encontrado para este período.</p>
                      </div>
                    ) : (
                      ocorrenciasFiltradas.map(oc => (
                          <div key={oc.id} onClick={() => setOcorrenciaSelecionada(oc)} className="p-4 border-b border-surface-container-low flex items-center gap-4 hover:bg-primary/5 transition-all cursor-pointer">
                              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center"><FileText size={16}/></div>
                              <div className="flex-1">
                                  <p className="text-sm font-black">{oc.nomeAluno}</p>
                                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">{oc.nomeModelo} · {oc.turmaAluno}</p>
                              </div>
                              <p className="text-[10px] font-bold text-on-surface-variant">{new Date(oc.criadoEm).toLocaleDateString()}</p>
                          </div>
                      ))
                    )}
                </div>
            </div>
          </motion.div>
        )}

        {/* Construtor removido desta página a pedido do usuário - Movido para Painel Admin */}
      </AnimatePresence>

      {/* Modal de Detalhe da Ocorrência estilo Documento Oficial */}
      <AnimatePresence>
        {ocorrenciaSelecionada && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <FichaOcorrencia 
                ocorrencia={ocorrenciaSelecionada} 
                onClose={() => setOcorrenciaSelecionada(null)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CardResumoMini({ titulo, valor, subtitulo, cor, icone: Icone }: { titulo: string; valor: number; subtitulo?: string; cor: string; icone: any }) {
  const cores: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    tertiary: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };
  return (
    <div className="bg-surface-container-low p-4 md:p-6 rounded-[1.5rem] editorial-shadow flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cores[cor])}><Icone size={24}/></div>
      <div>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{titulo}</p>
        <p className="text-3xl font-black leading-none my-1">{valor}</p>
        {subtitulo && <p className="text-[9px] font-bold text-on-surface-variant truncate max-w-[120px]">{subtitulo}</p>}
      </div>
    </div>
  );
}

