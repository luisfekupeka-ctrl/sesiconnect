import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Calendar as CalendarIcon, BookOpen, UserMinus, FileSignature, CheckCircle2, AlertCircle, RefreshCw, DoorOpen, Users, ChevronRight, FileDown, ShieldCheck, ArrowLeft, FileText, Check, Info, ChevronDown, Coffee, Filter, Trash2, LayoutGrid, User, Clock, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import {
  ProfessorConfig,
  ResultadoRealocacao,
  StatusEvento,
} from '../types';
import {
  buscarProfessoresConfig,
  buscarRealocacoes,
  calcularModoProva,
  calcularModoProvaLote,
  calcularCenarioFalta,
  salvarEventoEscola,
  salvarRealocacoes,
  aprovarRascunho,
  excluirEvento
} from '../services/motorRealocacao';
const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const SEGMENTOS = ['6º e 7º', '8º e 9º', 'Ensino Médio'];

export default function GestaoRealocacao() {
  const { professores, gradeCompleta, salas, periodos } = useEscola();
  const [professoresConfig, setProfessoresConfig] = useState<ProfessorConfig[]>([]);
  const [historico, setHistorico] = useState<ResultadoRealocacao[]>([]);

  // ESTADO DO WIZARD
  const [step, setStep] = useState(1);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [diaSel, setDiaSel] = useState('');
  const [tipoFluxo, setTipoFluxo] = useState<'SALA' | 'PROFESSOR' | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [segmentoSel, setSegmentoSel] = useState<string>('6º e 7º');
  const [horariosSel, setHorariosSel] = useState<string[]>([]);
  const [profFixoProva, setProfFixoProva] = useState('');
  const [isModoProva, setIsModoProva] = useState(false);
  const [isModoLote, setIsModoLote] = useState(false);
  const [datasSelecionadas, setDatasSelecionadas] = useState<string[]>([]);
  
  // REGRAS DE SUBSTITUIÇÃO
  const [regraSub, setRegraSub] = useState<'LIVRE' | 'MESMO_ANO' | 'DIRECIONADA'>('LIVRE');
  const [profDirecionado, setProfDirecionado] = useState('');

  // Sincroniza o dia da semana com a data selecionada
  useEffect(() => {
    if (dataSelecionada) {
      const data = new Date(dataSelecionada + 'T00:00:00');
      const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
      setDiaSel(dias[data.getDay()]);
      // Por padrão, se não estiver em modo lote, a lista de datas é só a selecionada
      if (!isModoLote) setDatasSelecionadas([dataSelecionada]);
    }
  }, [dataSelecionada, isModoLote]);

  const [resultados, setResultados] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroHistorico, setFiltroHistorico] = useState<'TODOS' | 'RASCUNHOS'>('TODOS');

  // Lógica de Horários Consecutivos para Modo Prova
  const verificarConsecutividade = () => {
    if (horariosSel.length <= 1) return true;
    const sorted = [...horariosSel].sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      const fimAtual = sorted[i].split(' - ')[1];
      const inicioProximo = sorted[i + 1].split(' - ')[0];
      if (fimAtual !== inicioProximo) return false;
    }
    return true;
  };

  const horariosSaoConsecutivos = verificarConsecutividade();

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const config = await buscarProfessoresConfig();
    if (config.length === 0) {
      const fallbackConfig = professores.map(p => ({
        id: p.id,
        nome: p.nome,
        disciplina: p.materia,
        cargaMaximaDia: 6,
        area: 'Outras' as const
      }));
      setProfessoresConfig(fallbackConfig);
    } else {
      setProfessoresConfig(config);
    }

    const rec = await buscarRealocacoes();
    setHistorico(rec);
  }

  const mudarSubstituto = (index: number, novoNome: string) => {
    setResultados(prev => prev.map((item, idx) =>
      idx === index ? { ...item, professorSubstituto: novoNome } : item
    ));
  };

  const handleCalcular = () => {
    setCarregando(true);
    setTimeout(async () => {
      let resGeral: ResultadoRealocacao[] = [];
      
      const diasParaProcessar = isModoLote ? datasSelecionadas : [dataSelecionada];

      for (const dataItem of diasParaProcessar) {
        const dataObj = new Date(dataItem + 'T00:00:00');
        const diaSemanaItem = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'][dataObj.getDay()];
        
        let resDia: ResultadoRealocacao[] = [];

        if (tipoFluxo === 'SALA' && isModoProva && isModoLote) {
          resDia = calcularModoProvaLote(segmentoSel, horariosSel, diaSemanaItem, gradeCompleta, professoresConfig);
        } else if (tipoFluxo === 'SALA' && isModoProva) {
          resDia = calcularModoProva(profFixoProva, Number(targetId), horariosSel, diaSemanaItem, segmentoSel, gradeCompleta, professoresConfig, { regra: regraSub, professorAlvo: profDirecionado });
        } else if (tipoFluxo === 'SALA') {
          horariosSel.forEach(h => {
            const entradaOriginal = gradeCompleta.find(g => g.numeroSala === Number(targetId) && g.diaSemana === diaSemanaItem && g.horario === h);
            if (entradaOriginal) {
              const subsHorario = calcularCenarioFalta(diaSemanaItem, [h], entradaOriginal.nomeProfessor, segmentoSel, gradeCompleta, professoresConfig);
              resDia = [...resDia, ...subsHorario];
            }
          });
        } else {
          resDia = calcularCenarioFalta(diaSemanaItem, horariosSel, targetId, segmentoSel, gradeCompleta, professoresConfig, { regra: regraSub, professorAlvo: profDirecionado });
        }

        // Adiciona a data aos resultados para exibição
        resGeral = [...resGeral, ...resDia.map(r => ({ ...r, dia: dataItem }))];
      }

      setResultados(resGeral);
      setStep(4);
      setCarregando(false);
    }, 800);
  };

  const handleFinalizar = async (isDraft: boolean) => {
    setCarregando(true);
    const status: StatusEvento = isDraft ? 'RASCUNHO' : 'EFETIVADO';
    
    try {
      const diasParaProcessar = isModoLote ? datasSelecionadas : [dataSelecionada];

      for (const dataItem of diasParaProcessar) {
        const resultadosDoDia = resultados.filter(r => r.dia === dataItem);
        if (resultadosDoDia.length === 0) continue;

        const eventoId = await salvarEventoEscola({
          tipo: isModoProva ? 'PROVA' : 'FALTA',
          dia: dataItem,
          horarios: horariosSel,
          professor: tipoFluxo === 'PROFESSOR' ? targetId : (isModoLote ? `Lote: ${segmentoSel}` : profFixoProva),
          status
        });

        if (eventoId) {
          await salvarRealocacoes(resultadosDoDia.map(r => ({ ...r, eventoId, status })));
        }
      }

      alert(isDraft ? 'Rascunhos salvos com sucesso!' : 'Realocações efetivadas com sucesso!');
      setStep(1);
      setResultados([]);
      setIsModoLote(false);
      setDatasSelecionadas([]);
      carregarDados();
    } catch (e) {
      alert(isDraft ? 'Erro ao salvar rascunho.' : 'Erro ao efetivar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header className="bg-surface p-10 rounded-[3.5rem] editorial-shadow border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-800 rounded-3xl flex items-center justify-center shadow-2xl border border-blue-700">
              <CalendarIcon className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Smart Sub</h1>
              <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Inteligência em Realocação</p>
            </div>
          </div>
            
          <div className="flex items-center gap-4 bg-surface-container-high p-2 rounded-3xl self-start md:self-center">
            <button onClick={() => setFiltroHistorico('TODOS')} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all", filtroHistorico === 'TODOS' ? "bg-blue-800 text-white shadow-lg" : "text-on-surface-variant hover:text-white")}>Todos</button>
            <button onClick={() => setFiltroHistorico('RASCUNHOS')} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all", filtroHistorico === 'RASCUNHOS' ? "bg-blue-800 text-white shadow-lg" : "text-on-surface-variant hover:text-white")}>Rascunhos</button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] editorial-shadow border border-blue-800">
            <header className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-on-surface-bright italic">1. Selecione a Data</h2>
              <p className="text-on-surface-variant text-xs md:text-sm font-medium mt-2">Escolha qualquer dia do ano para gerenciar as substituições.</p>
            </header>
            
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-amber">Calendário</label>
                  <button 
                    onClick={() => setIsModoLote(!isModoLote)}
                    className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", isModoLote ? "bg-amber-700 text-white shadow-lg" : "bg-white/5 text-on-surface-variant")}
                  >
                    <LayoutGrid size={12} /> {isModoLote ? 'Semana de Provas' : 'Dia Único'}
                  </button>
                </div>

                {isModoLote ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant ml-2 uppercase">Início</label>
                      <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} className="w-full bg-surface-container-low p-5 rounded-2xl font-black text-xl text-on-surface border-2 border-blue-800 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant ml-2 uppercase">Fim</label>
                      <input type="date" onChange={e => {
                        const start = new Date(dataSelecionada + 'T00:00:00');
                        const end = new Date(e.target.value + 'T00:00:00');
                        const list = [];
                        let curr = start;
                        while(curr <= end) {
                          list.push(curr.toISOString().split('T')[0]);
                          curr.setDate(curr.getDate() + 1);
                        }
                        setDatasSelecionadas(list);
                      }} className="w-full bg-surface-container-low p-5 rounded-2xl font-black text-xl text-on-surface border-2 border-blue-800 outline-none" />
                    </div>
                    <div className="sm:col-span-2 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                       <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2"><CheckCircle2 size={12} /> {datasSelecionadas.length} dias selecionados para realocação em lote.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => {
                    const input = document.getElementById('calendario-principal') as HTMLInputElement;
                    if (input) input.showPicker();
                  }}>
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-accent-amber transition-colors">
                      <CalendarIcon size={32} />
                    </div>
                    <input 
                      id="calendario-principal"
                      type="date" 
                      value={dataSelecionada} 
                      onChange={e => setDataSelecionada(e.target.value)}
                      className="w-full bg-surface-container-low p-6 md:p-8 pl-20 md:pl-24 rounded-[1.5rem] md:rounded-[2rem] font-black text-2xl md:text-4xl text-on-surface border-2 border-blue-800 group-hover:border-accent-amber transition-all outline-none shadow-inner cursor-pointer"
                    />
                    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex flex-col items-end">
                      <span className="bg-amber-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase shadow-xl group-hover:bg-amber-600 transition-colors">
                        {diaSel}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-on-surface-variant italic ml-2">As provas geralmente ocorrem em períodos de múltiplos dias.</p>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)} 
              className="w-full mt-8 py-7 bg-blue-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] border border-blue-700 hover:bg-blue-700 shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              Próximo Passo <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] editorial-shadow border border-blue-800">
            <h2 className="text-2xl md:text-3xl font-black mb-8 text-on-surface-bright italic">2. Tipo de Fluxo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button onClick={() => { setTipoFluxo('SALA'); setIsModoProva(false); setIsModoLote(false); setStep(3); }} className="group p-8 rounded-[2rem] bg-surface-container-low border-2 border-blue-800 hover:border-accent-amber transition-all text-left flex flex-col gap-6 shadow-xl">
                <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><LayoutGrid size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Por Sala</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Realocar professores que atendem uma sala/turma específica.</p>
                </div>
              </button>
              <button onClick={() => { setTipoFluxo('PROFESSOR'); setIsModoProva(false); setIsModoLote(false); setStep(3); }} className="group p-8 rounded-[2rem] bg-surface-container-low border-2 border-blue-800 hover:border-accent-amber transition-all text-left flex flex-col gap-6 shadow-xl">
                <div className="w-12 h-12 bg-amber-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><User size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Professor Faltou</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Ausência de um professor e cobrir todos os horários dele.</p>
                </div>
              </button>
              <button onClick={() => { setTipoFluxo('SALA'); setIsModoProva(true); setIsModoLote(true); setStep(3); }} className="group p-8 rounded-[2rem] bg-amber-900/20 border-2 border-amber-600 hover:border-amber-400 transition-all text-left flex flex-col gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 right-4"><Coffee className="text-amber-500/30" size={40} /></div>
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileSignature size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Modo Prova (Lote)</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Configurar salas por Segmento/Ano e manter fiscais fixos.</p>
                </div>
              </button>
            </div>
            <button onClick={() => setStep(1)} className="w-full mt-10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white flex items-center justify-center gap-2"><ChevronLeft size={14} /> Voltar</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] editorial-shadow border border-blue-800">
            <h2 className="text-2xl md:text-3xl font-black mb-8 text-on-surface-bright italic">3. Configuração</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">{isModoLote ? 'Selecionar Segmento' : 'Identificar Alvo'}</label>
                  {isModoLote ? (
                    <select 
                      value={segmentoSel} 
                      onChange={e => setSegmentoSel(e.target.value)} 
                      className="w-full p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-surface-container-low border-2 border-blue-800 text-on-surface font-black text-xl outline-none focus:border-accent-amber transition-all shadow-xl"
                    >
                      {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <select 
                      value={targetId} 
                      onChange={e => setTargetId(e.target.value)} 
                      className="w-full p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-surface-container-low border-2 border-blue-800 text-on-surface font-black text-xl outline-none focus:border-accent-amber transition-all shadow-xl"
                    >
                      <option value="">Selecione o Alvo...</option>
                      {tipoFluxo === 'SALA' ? salas.map(s => <option key={s.numero} value={s.numero}>Sala {s.numero}</option>) : professores.map(p => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                    </select>
                  )}
                </div>
                
                <div className={cn("p-6 md:p-8 rounded-[2rem] border-2 transition-all space-y-6 shadow-2xl", 
                  tipoFluxo === 'SALA' ? (horariosSaoConsecutivos && horariosSel.length > 1 ? "bg-amber-500/5 border-amber-500/30" : "bg-surface-container-low border-transparent opacity-50") : "bg-blue-500/5 border-blue-500/30")}>
                  
                  {tipoFluxo === 'SALA' && (
                    <label className="flex items-center gap-4 cursor-pointer mb-2">
                      <input type="checkbox" disabled={!horariosSaoConsecutivos || horariosSel.length <= 1} checked={isModoProva} onChange={e => setIsModoProva(e.target.checked)} className="w-6 h-6 accent-amber-700" />
                      <span className="font-black text-amber-500 uppercase tracking-widest text-sm">Modo Prova</span>
                    </label>
                  )}

                  {(tipoFluxo === 'PROFESSOR' || (tipoFluxo === 'SALA' && isModoProva)) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                      {tipoFluxo === 'SALA' && isModoProva && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-amber-600 ml-2 tracking-widest flex items-center gap-2"><User size={12} /> Escolha o Fiscal</label>
                          <select value={profFixoProva} onChange={e => setProfFixoProva(e.target.value)} className="w-full p-4 rounded-2xl bg-surface-container-high border-none text-on-surface font-black outline-none shadow-md">
                            <option value="">Selecione o Fiscal...</option>
                            {Array.from(new Set(
                              gradeCompleta
                                .filter(g => {
                                  const diaMatch = String(g.diaSemana || '').toUpperCase().trim() === String(diaSel || '').toUpperCase().trim();
                                  return diaMatch && g.numeroSala === Number(targetId) && horariosSel.includes(g.horario);
                                })
                                .map(g => g.nomeProfessor)
                            )).map(nome => (
                              <option key={nome} value={nome}>{nome}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-blue-400 ml-2 tracking-widest flex items-center gap-2"><RefreshCw size={12} /> Regras de Substituição</label>
                        <div className="grid grid-cols-1 gap-3">
                          <button onClick={() => setRegraSub('LIVRE')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'LIVRE' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                            <RefreshCw size={18} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase">Análise Livre</span>
                            </div>
                          </button>
                          <button onClick={() => setRegraSub('MESMO_ANO')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'MESMO_ANO' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                            <Users size={18} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-tighter">Priorizar Mesmo Ano/Turma</span>
                            </div>
                          </button>
                          <button onClick={() => setRegraSub('DIRECIONADA')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'DIRECIONADA' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                            <UserMinus size={18} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase">Direcionar a Professor</span>
                            </div>
                          </button>
                        </div>
                        
                        {regraSub === 'DIRECIONADA' && (
                          <select value={profDirecionado} onChange={e => setProfDirecionado(e.target.value)} className="w-full mt-3 p-4 rounded-2xl bg-surface-container-high border-none text-on-surface font-black text-xs shadow-md">
                            <option value="">Escolher Substituto Principal...</option>
                            {professores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                  {tipoFluxo === 'SALA' && !horariosSaoConsecutivos && <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1 animate-pulse"><Info size={12} /> Selecione horários seguidos para ativar o Modo Prova.</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-on-surface-variant ml-2 flex items-center gap-2"><Clock size={12} /> Selecione as Aulas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from(new Set(
                    gradeCompleta
                      .filter(g => {
                        const diaMatch = String(g.diaSemana || '').toUpperCase().trim() === String(diaSel || '').toUpperCase().trim();
                        const targetMatch = isModoLote 
                          ? g.segmento === segmentoSel
                          : (tipoFluxo === 'SALA' 
                              ? g.numeroSala === Number(targetId)
                              : String(g.nomeProfessor || '').toUpperCase().trim() === String(targetId || '').toUpperCase().trim());
                        return diaMatch && targetMatch;
                      })
                      .map(g => g.horario)
                  ))
                  .sort()
                  .map(horario => (
                    <button key={horario} onClick={() => setHorariosSel(prev => prev.includes(horario) ? prev.filter(h => h !== horario) : [...prev, horario])}
                      className={cn("p-6 rounded-2xl text-left transition-all border-2 flex flex-col gap-2 shadow-lg", 
                        horariosSel.includes(horario) ? "bg-amber-700 text-white border-amber-600 scale-95 shadow-inner" : "bg-surface-container-high border-blue-800/50 text-on-surface hover:border-blue-500")}
                    >
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">{horario}</div>
                      <div className="text-xl font-black italic">Horário de Prova</div>
                      <div className="text-[9px] font-black uppercase text-blue-400">Clique para Selecionar</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white border-2 border-transparent hover:border-white/10 transition-all flex items-center justify-center gap-2"><ChevronLeft size={16} /> Voltar</button>
              <button 
                onClick={handleCalcular} 
                disabled={!targetId || horariosSel.length === 0}
                className="flex-[2] py-6 bg-blue-800 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] border border-blue-700 hover:bg-blue-700 shadow-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                Calcular Realocação <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] editorial-shadow border border-blue-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-on-surface-bright italic">4. Conferência Final</h2>
                <p className="text-on-surface-variant text-xs md:text-sm font-medium mt-2">Revise as substituições sugeridas pelo algoritmo e ajuste se necessário.</p>
              </div>
              <div className="px-5 py-3 bg-amber-700/10 border border-amber-700/30 rounded-2xl flex items-center gap-3">
                 <ShieldCheck className="text-amber-500" size={18} />
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{regraSub === 'LIVRE' ? 'Análise Livre' : 'Análise Direcionada'}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-blue-800/50 shadow-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] text-left">
                    <th className="p-5">Data/Dia</th>
                    <th className="p-5">Horário</th>
                    <th className="p-5">Turma/Sala</th>
                    <th className="p-5">Original</th>
                    <th className="p-5">Substituto</th>
                    <th className="p-5">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resultados.map((r, i) => {
                    const temConflitoNaGrade = gradeCompleta.some(g => 
                      g.nomeProfessor === r.professorSubstituto && 
                      g.diaSemana === diaSel && 
                      g.horario === r.horario &&
                      g.numeroSala !== Number(targetId)
                    );

                    const semProfessor = r.professorSubstituto === 'A DEFINIR';

                    return (
                      <tr key={i} className={cn("text-sm font-medium transition-colors", semProfessor ? "bg-red-900/30" : "hover:bg-surface-container-low/50 even:bg-surface-container-low/20")}>
                        <td className="p-5 font-black text-on-surface-bright">
                          <div className="flex flex-col">
                            <span>{r.dia ? new Date(r.dia + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                            <span className="text-[8px] text-blue-400 uppercase tracking-widest">{r.diaSemana || diaSel}</span>
                          </div>
                        </td>
                        <td className="p-5 font-black text-on-surface-bright">{r.horario}</td>
                        <td className="p-5 text-on-surface">
                          <div className="flex flex-col">
                            <span>{r.turma}</span>
                            <span className="text-[8px] opacity-60 uppercase">{r.tipo === 'PROVA' ? `Sala ${targetId || 'Lote'}` : ''}</span>
                          </div>
                        </td>
                        <td className="p-5 text-on-surface-variant line-through">{r.professorOriginal}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="relative group/swap">
                              <select
                                value={r.professorSubstituto}
                                onChange={(e) => mudarSubstituto(i, e.target.value)}
                                className={cn("font-black px-3 py-2 rounded-xl outline-none appearance-none cursor-pointer pr-10 border transition-all shadow-md",
                                  semProfessor ? "bg-red-900/40 text-red-400 border-red-700 animate-pulse" : "bg-blue-900/30 hover:bg-blue-900/50 text-on-surface-bright border-blue-800")}
                              >
                                {semProfessor && <option value="A DEFINIR">SELECIONAR...</option>}
                                {professores.map(p => (
                                  <option key={p.id} value={p.nome} className="text-on-surface bg-surface">{p.nome}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-amber pointer-events-none opacity-60" />
                            </div>
                            {temConflitoNaGrade && (
                              <div className="group relative">
                                <AlertCircle size={14} className="text-red-500 animate-pulse cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                  Este professor já está em aula nesta sala!
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase bg-blue-900/30 text-accent-amber",
                            temConflitoNaGrade && "bg-red-900/30 text-red-400"
                          )}>
                            {r.acao}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-10">
              <button
                onClick={() => handleFinalizar(true)}
                disabled={carregando}
                className="flex-1 py-6 bg-surface-container-high text-on-surface rounded-3xl font-black uppercase text-xs tracking-[0.1em] border border-blue-800 hover:bg-blue-900/50 transition-all flex justify-center items-center gap-2"
              >
                <FileText size={16} />
                Salvar como Rascunho
              </button>
              <button
                onClick={() => handleFinalizar(false)}
                disabled={carregando}
                className="flex-[2] py-6 bg-amber-700 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-amber-600 transition-all flex justify-center items-center gap-2 border border-amber-600"
              >
                {carregando ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Efetivar Grade Oficial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
