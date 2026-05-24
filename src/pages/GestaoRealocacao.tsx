import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Calendar as CalendarIcon, BookOpen, UserMinus, FileSignature, CheckCircle2, AlertCircle, RefreshCw, DoorOpen, Users, ChevronRight, FileDown, ShieldCheck, ArrowLeft, FileText, Check, Info, ChevronDown, Coffee, Filter, Trash2, LayoutGrid, User, Clock, ChevronLeft, Printer, X, Plus } from 'lucide-react';
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
  salvarEventoEscola,
  salvarRealocacoes,
  excluirEvento
} from '../services/motorRealocacao';

export default function GestaoRealocacao() {
  const { professores, gradeCompleta, gradeBase, salas, periodos, atualizar } = useEscola();
  const [professoresConfig, setProfessoresConfig] = useState<ProfessorConfig[]>([]);
  const [historico, setHistorico] = useState<ResultadoRealocacao[]>([]);

  // ESTADO DO WIZARD REFORMULADO
  const [step, setStep] = useState(1);
  const [datasSelecionadas, setDatasSelecionadas] = useState<string[]>([new Date().toISOString().split('T')[0]]);
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  
  // Fluxos Principais
  // PROFESSOR = Falta de Professor, SALA = Modo Prova / Ensalamento
  const [tipoFluxo, setTipoFluxo] = useState<'SALA' | 'PROFESSOR' | null>(null);
  
  // Salas selecionadas (para fluxo Sala/Prova)
  const [salasSelecionadas, setSalasSelecionadas] = useState<number[]>([]);
  
  // Professor Alvo (para fluxo Professor Faltou)
  const [profFaltouId, setProfFaltouId] = useState<string>('');
  
  // Horários / Períodos das Provas
  const [horariosSel, setHorariosSel] = useState<string[]>([]);
  
  // Fiscal geral pré-selecionado (opcional)
  const [profFixoProva, setProfFixoProva] = useState('');
  
  // Regra de substituição para fluxo Professor Faltou
  const [regraSub, setRegraSub] = useState<'LIVRE' | 'MESMO_ANO' | 'DIRECIONADA'>('LIVRE');
  const [profDirecionado, setProfDirecionado] = useState('');

  const [resultados, setResultados] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroHistorico, setFiltroHistorico] = useState<'TODOS' | 'RASCUNHOS'>('TODOS');
  
  const [anoSelecionadoProva, setAnoSelecionadoProva] = useState('');
  
  // Visualização de PDF/Impressão
  const [mostrarPdfEnsalamento, setMostrarPdfEnsalamento] = useState(false);

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

  // Adicionar data à lista
  const adicionarData = () => {
    if (novaData && !datasSelecionadas.includes(novaData)) {
      setDatasSelecionadas(prev => [...prev, novaData].sort());
    }
  };

  // Remover data da lista
  const removerData = (dt: string) => {
    if (datasSelecionadas.length > 1) {
      setDatasSelecionadas(prev => prev.filter(d => d !== dt));
    }
  };

  // Seleção rápida de salas por ano
  const selecionarTodasDoAno = (anoPrefixo: string) => {
    setAnoSelecionadoProva(anoPrefixo);
    if (!anoPrefixo) {
      setSalasSelecionadas([]);
      return;
    }
    const salasDoAno = salas
      .filter(s => {
        if (anoPrefixo === 'Médio') {
          return (s.ano || '').toLowerCase().includes('médio') || (s.ano || '').toLowerCase().includes('série') || (s.nome || '').toLowerCase().includes('médio') || (s.nome || '').toLowerCase().includes('série');
        }
        return (s.ano || '').includes(anoPrefixo) || (s.nome || '').includes(anoPrefixo);
      })
      .map(s => s.numero);
    
    setSalasSelecionadas(salasDoAno);
  };

  // Seleção rápida de todas as salas do Ensino Médio
  const selecionarTodasEnsinoMedio = () => {
    const salasEM = salas
      .filter(s => s.segmento === 'Ensino Médio')
      .map(s => s.numero);
    
    const todasMarcadas = salasEM.every(num => salasSelecionadas.includes(num));
    if (todasMarcadas) {
      setSalasSelecionadas(prev => prev.filter(num => !salasEM.includes(num)));
    } else {
      setSalasSelecionadas(prev => Array.from(new Set([...prev, ...salasEM])));
    }
  };

  const alternarSala = (numero: number) => {
    setSalasSelecionadas(prev => 
      prev.includes(numero) ? prev.filter(n => n !== numero) : [...prev, numero]
    );
  };

  const mudarSubstituto = (index: number, novoNome: string) => {
    setResultados(prev => prev.map((item, idx) =>
      idx === index ? { ...item, professorSubstituto: novoNome } : item
    ));
  };

  // Lógica principal de cruzamento de horários (Modo Prova e Falta de Professor)
  const handleCalcular = () => {
    setCarregando(true);
    setTimeout(() => {
      let resGeral: ResultadoRealocacao[] = [];

      for (const dataItem of datasSelecionadas) {
        const dataObj = new Date(dataItem + 'T00:00:00');
        const diasSemanaMap = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
        const diaSemanaItem = diasSemanaMap[dataObj.getDay()];

        if (tipoFluxo === 'SALA') {
          // --- MODO PROVA / ENSALAMENTO MULTI-SALAS ---
          for (const salaNum of salasSelecionadas) {
            const salaObj = salas.find(s => Number(s.numero) === Number(salaNum));
            const nomeSala = salaObj ? salaObj.nome : `Sala ${salaNum}`;
            const segmentoSala = salaObj ? salaObj.segmento : '6º e 7º';

            // Determina o fiscal fixo para todos os horários desta sala
            let fiscalUnicoDaSala = profFixoProva;
            if (!fiscalUnicoDaSala) {
                // Tenta pegar o professor original do primeiro horário selecionado (ou qualquer horário válido)
                for (const h of horariosSel) {
                  const entradaH = gradeBase.find(g => 
                    Number(g.numeroSala) === Number(salaNum) && 
                    String(g.diaSemana || '').toUpperCase().trim() === diaSemanaItem.toUpperCase().trim() && 
                    g.horario === h &&
                    g.nomeProfessor !== 'LIVRE'
                  );
                  if (entradaH) {
                    fiscalUnicoDaSala = entradaH.nomeProfessor;
                    break;
                  }
                }
                if (!fiscalUnicoDaSala) fiscalUnicoDaSala = 'A DEFINIR';
            }

            for (const h of horariosSel) {
              // Encontra a aula original cadastrada para esta sala e horário
              const entradaOriginal = gradeBase.find(g => 
                Number(g.numeroSala) === Number(salaNum) && 
                String(g.diaSemana || '').toUpperCase().trim() === diaSemanaItem.toUpperCase().trim() && 
                g.horario === h
              );

              const originalTeacher = entradaOriginal ? entradaOriginal.nomeProfessor : 'LIVRE';
              const originalMateria = entradaOriginal ? entradaOriginal.materia : 'Janela';
              const turmaNome = entradaOriginal ? entradaOriginal.turma : (salaObj ? `${salaObj.ano} ${salaObj.nome}` : `Sala ${salaNum}`);

              // O fiscal sugerido é o fiscal ÚNICO determinado acima!
              let fiscalSugerido = fiscalUnicoDaSala;

              resGeral.push({
                id: `ensalamento-${Math.random()}`,
                eventoId: 'modo-prova-salas',
                tipo: 'PROVA',
                professorOriginal: originalTeacher,
                professorSubstituto: fiscalSugerido,
                turma: turmaNome,
                horario: h,
                segmento: segmentoSala,
                acao: `Prova (${originalMateria})`,
                status: 'RASCUNHO',
                dia: dataItem
              });
            }
          }
        } else {
          // --- FLUXO AUSÊNCIA DE PROFESSOR (PROFESSOR FALTOU) ---
          for (const h of horariosSel) {
            const aulaAfetada = gradeBase.find(a =>
              a.nomeProfessor === profFaltouId &&
              a.diaSemana === diaSemanaItem &&
              a.horario === h
            );

            if (!aulaAfetada) continue;

            // Busca professores livres na hora
            let substitutosValidos = professoresConfig.filter(c => {
              const ocupado = gradeBase.some(g =>
                g.nomeProfessor === c.nome &&
                g.diaSemana === diaSemanaItem &&
                g.horario === h
              );
              return !ocupado && c.nome !== profFaltouId;
            });

            // Aplicar regras
            if (regraSub === 'DIRECIONADA' && profDirecionado) {
              const profAlvo = professoresConfig.find(c => c.nome === profDirecionado);
              if (profAlvo) {
                const ocupado = gradeBase.some(g => g.nomeProfessor === profAlvo.nome && g.diaSemana === diaSemanaItem && g.horario === h);
                if (!ocupado) substitutosValidos = [profAlvo];
              }
            } else if (regraSub === 'MESMO_ANO') {
              const professoresDoAno = new Set(gradeBase.filter(g => g.turma === aulaAfetada.turma).map(g => g.nomeProfessor));
              const filtrados = substitutosValidos.filter(s => professoresDoAno.has(s.nome));
              if (filtrados.length > 0) substitutosValidos = filtrados;
            }

            const substituto = substitutosValidos.length > 0 ? substitutosValidos[0].nome : 'A DEFINIR';

            resGeral.push({
              id: `falta-${Math.random()}`,
              eventoId: 'falta-id',
              tipo: 'FALTA',
              professorOriginal: profFaltouId,
              professorSubstituto: substituto,
              turma: aulaAfetada.turma,
              horario: h,
              segmento: aulaAfetada.segmento || 'Especializado',
              acao: `Falta de ${profFaltouId}`,
              status: 'RASCUNHO',
              dia: dataItem
            });
          }
        }
      }

      setResultados(resGeral);
      setStep(4);
      setCarregando(false);
    }, 800);
  };

  // Salvar registro de realocação histórico
  const handleFinalizar = async (isDraft: boolean) => {
    setCarregando(true);
    const status: StatusEvento = isDraft ? 'RASCUNHO' : 'EFETIVADO';

    try {
      for (const dataItem of datasSelecionadas) {
        const resultadosDoDia = resultados.filter(r => r.dia === dataItem);
        if (resultadosDoDia.length === 0) continue;

        const eventoId = await salvarEventoEscola({
          tipo: tipoFluxo === 'SALA' ? 'PROVA' : 'FALTA',
          dia: dataItem,
          horarios: horariosSel,
          professor: tipoFluxo === 'PROFESSOR' ? profFaltouId : `Salas: ${salasSelecionadas.join(',')}`,
          status
        });

        if (eventoId) {
          await salvarRealocacoes(resultadosDoDia.map(r => ({ ...r, eventoId, status })));
        }
      }

      alert(isDraft ? 'Ensalamento salvo nos rascunhos!' : 'Ensalamento oficial registrado!');
      setStep(1);
      setResultados([]);
      setSalasSelecionadas([]);
      setHorariosSel([]);
      setProfFixoProva('');
      carregarDados();
      atualizar();
    } catch (e) {
      alert('Erro ao salvar as informações.');
    } finally {
      setCarregando(false);
    }
  };

  // Cores dinâmicas de acordo com o ano da sala
  const obterCorAno = (turma: string) => {
    if (turma.includes('6º')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (turma.includes('7º')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (turma.includes('8º')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (turma.includes('9º')) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
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
              <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Ensalamento e Provas</p>
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
              <h2 className="text-2xl md:text-3xl font-black text-on-surface-bright italic">1. Selecione as Datas</h2>
              <p className="text-on-surface-variant text-xs md:text-sm font-medium mt-2">Escolha um ou vários dias para aplicar o ensalamento / prova.</p>
            </header>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end bg-surface-container-low p-6 rounded-[2rem] border border-blue-800/20">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-accent-amber ml-2">Escolher Nova Data</label>
                  <input 
                    type="date" 
                    value={novaData} 
                    onChange={e => setNovaData(e.target.value)}
                    className="w-full bg-surface-container-high p-4 rounded-xl font-bold text-lg text-on-surface border border-blue-850 outline-none" 
                  />
                </div>
                <button 
                  onClick={adicionarData}
                  className="px-6 py-4 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-2">Datas Selecionadas</label>
                <div className="flex flex-wrap gap-2">
                  {datasSelecionadas.map(d => {
                    const dataObj = new Date(d + 'T00:00:00');
                    const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                    const diaNome = diasSemana[dataObj.getDay()];
                    return (
                      <div key={d} className="flex items-center gap-2 bg-blue-900/30 border border-blue-800/60 px-4 py-2 rounded-xl text-sm font-black text-white">
                        <span>{new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')} ({diaNome})</span>
                        {datasSelecionadas.length > 1 && (
                          <button onClick={() => removerData(d)} className="text-red-400 hover:text-red-300 ml-1 transition-colors cursor-pointer">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button onClick={() => { setTipoFluxo('SALA'); setStep(3); }} className="group p-8 rounded-[2rem] bg-surface-container-low border-2 border-blue-800 hover:border-accent-amber transition-all text-left flex flex-col gap-6 shadow-xl cursor-pointer">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileSignature size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Modo Prova / Ensalamento por Salas</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Escolher várias salas ao mesmo tempo, cruzar horários das aulas e gerar folha de ensalamento PDF.</p>
                </div>
              </button>
              <button onClick={() => { setTipoFluxo('PROFESSOR'); setStep(3); }} className="group p-8 rounded-[2rem] bg-surface-container-low border-2 border-blue-800 hover:border-accent-amber transition-all text-left flex flex-col gap-6 shadow-xl cursor-pointer">
                <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><User size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Ausência de Professor</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Registrar falta de um professor e cobrir automaticamente suas aulas livres no dia.</p>
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
                {tipoFluxo === 'SALA' ? (
                  /* MODO PROVA: SELECIONAR VÁRIAS SALAS SIMULTANEAMENTE */
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Selecione o Ano / Série</label>
                    
                    <select 
                      value={anoSelecionadoProva} 
                      onChange={e => selecionarTodasDoAno(e.target.value)} 
                      className="w-full p-5 rounded-2xl bg-surface-container-low border-2 border-blue-800 text-on-surface font-black text-xl outline-none focus:border-accent-amber transition-all shadow-xl"
                    >
                      <option value="">Selecione o Ano...</option>
                      <option value="6º">6º Ano</option>
                      <option value="7º">7º Ano</option>
                      <option value="8º">8º Ano</option>
                      <option value="9º">9º Ano</option>
                      <option value="Médio">Ensino Médio (1ª a 3ª Série)</option>
                    </select>

                    {salasSelecionadas.length > 0 ? (
                      <div className="text-[10px] text-amber-500 font-bold ml-2">
                        {salasSelecionadas.length} salas vinculadas automaticamente.
                      </div>
                    ) : anoSelecionadoProva && (
                      <div className="text-[10px] text-red-400 font-bold ml-2">
                        Nenhuma sala vinculada automaticamente. Selecione manualmente:
                      </div>
                    )}

                    {anoSelecionadoProva && (
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {salas.map(s => (
                           <button 
                             key={s.numero}
                             onClick={() => alternarSala(s.numero)}
                             className={cn("px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                               salasSelecionadas.includes(s.numero) ? "bg-amber-600 border-amber-500 text-white" : "bg-surface-container-high border-white/10 text-on-surface-variant hover:border-white/30"
                             )}
                           >
                             {s.numero}
                           </button>
                        ))}
                      </div>
                    )}

                    {/* Seleção do Fiscal */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-black uppercase text-amber-600 ml-2 tracking-widest flex items-center gap-2"><User size={12} /> Fiscal de Prova Principal (Opcional)</label>
                      <select value={profFixoProva} onChange={e => setProfFixoProva(e.target.value)} className="w-full p-4 rounded-xl bg-surface-container-high border-none text-on-surface font-black outline-none shadow-md">
                        <option value="">Manter Professor Original da Aula...</option>
                        {professores.map(p => (
                          <option key={p.id} value={p.nome}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* FLUXO PROFESSOR FALTOU */
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Quem Faltou?</label>
                      <select 
                        value={profFaltouId} 
                        onChange={e => setProfFaltouId(e.target.value)} 
                        className="w-full p-5 rounded-2xl bg-surface-container-low border-2 border-blue-800 text-on-surface font-black text-xl outline-none focus:border-accent-amber transition-all shadow-xl"
                      >
                        <option value="">Selecione o Professor...</option>
                        {professores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-blue-400 ml-2 tracking-widest flex items-center gap-2"><RefreshCw size={12} /> Regra de Reposição</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button onClick={() => setRegraSub('LIVRE')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'LIVRE' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                          <RefreshCw size={18} />
                          <div className="flex flex-col"><span className="text-[10px] font-black uppercase">Análise Livre</span></div>
                        </button>
                        <button onClick={() => setRegraSub('MESMO_ANO')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'MESMO_ANO' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                          <Users size={18} />
                          <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-tighter">Priorizar Mesmo Ano/Turma</span></div>
                        </button>
                        <button onClick={() => setRegraSub('DIRECIONADA')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-md", regraSub === 'DIRECIONADA' ? "bg-blue-800 border-blue-600 text-white" : "bg-surface-container-high border-transparent text-on-surface opacity-60")}>
                          <UserMinus size={18} />
                          <div className="flex flex-col"><span className="text-[10px] font-black uppercase">Direcionar a Professor</span></div>
                        </button>
                      </div>
                      
                      {regraSub === 'DIRECIONADA' && (
                        <select value={profDirecionado} onChange={e => setProfDirecionado(e.target.value)} className="w-full mt-3 p-4 rounded-xl bg-surface-container-high border-none text-on-surface font-black text-xs shadow-md">
                          <option value="">Escolher Substituto Principal...</option>
                          {professores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DE AULAS/HORÁRIOS */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-on-surface-variant ml-2 flex items-center gap-2"><Clock size={12} /> Selecione as Aulas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from(new Set(
                    tipoFluxo === 'SALA'
                      ? (() => {
                          const segmentos = salas.filter(s => salasSelecionadas.includes(s.numero)).map(s => {
                            const a = (s.ano || '').toLowerCase();
                            if (a.includes('6') || a.includes('7')) return '6e7';
                            if (a.includes('8') || a.includes('9')) return '8e9';
                            if (a.includes('médio') || a.includes('medio') || a.includes('série') || a.includes('serie') || a.includes('1ª') || a.includes('2ª') || a.includes('3ª')) return 'medio';
                            return '6e7';
                          });
                          let segsUnicos = Array.from(new Set(segmentos));
                          if (segsUnicos.length === 0 && anoSelecionadoProva) {
                            if (anoSelecionadoProva === 'Médio') segsUnicos = ['medio'];
                            else if (anoSelecionadoProva.includes('8') || anoSelecionadoProva.includes('9')) segsUnicos = ['8e9'];
                            else segsUnicos = ['6e7'];
                          }
                          const pAlvo = periodos.filter(p => segsUnicos.includes(p.segmento));
                          return pAlvo.map(p => `${p.horarioInicio.slice(0, 5)} - ${p.horarioFim.slice(0, 5)}`);
                        })()
                      : gradeBase
                          .filter(g => {
                            const dataItem = datasSelecionadas[0];
                            const dataObj = new Date(dataItem + 'T00:00:00');
                            const diasSemanaMap = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
                            const diaSemanaItem = diasSemanaMap[dataObj.getDay()];
                            const diaMatch = String(g.diaSemana || '').toUpperCase().trim() === String(diaSemanaItem || '').toUpperCase().trim();
                            const targetMatch = profFaltouId ? String(g.nomeProfessor || '').toUpperCase().trim() === String(profFaltouId || '').toUpperCase().trim() : true;
                            return diaMatch && targetMatch;
                          })
                          .map(g => g.horario)
                  ))
                  .sort()
                  .map(horario => {
                    const dataItem = datasSelecionadas[0] || new Date().toISOString().split('T')[0];
                    const dataObj = new Date(dataItem + 'T00:00:00');
                    const diasSemanaMap = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
                    const diaSemanaItem = diasSemanaMap[dataObj.getDay()];
                    
                    const aulasNoHorario = tipoFluxo === 'SALA' 
                      ? gradeBase.filter(g => 
                          salasSelecionadas.map(Number).includes(Number(g.numeroSala)) && 
                          g.horario === horario && 
                          String(g.diaSemana || '').toUpperCase().trim() === diaSemanaItem.toUpperCase().trim()
                        )
                      : [];

                    return (
                      <button key={horario} onClick={() => setHorariosSel(prev => prev.includes(horario) ? prev.filter(h => h !== horario) : [...prev, horario])}
                        className={cn("p-6 rounded-2xl text-left transition-all border-2 flex flex-col gap-2 shadow-lg", 
                          horariosSel.includes(horario) ? "bg-amber-700 text-white border-amber-600 scale-95 shadow-inner" : "bg-surface-container-high border-blue-800/50 text-on-surface hover:border-blue-500")}
                      >
                        <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">{horario}</div>
                        {tipoFluxo === 'SALA' && aulasNoHorario.length > 0 ? (
                          <div className="text-xs font-medium space-y-1 mt-1 opacity-90">
                            {aulasNoHorario.map((aula, idx) => (
                              <div key={idx} className="flex justify-between items-center gap-2 border-b border-white/10 pb-1 mb-1 last:border-0">
                                <span className="truncate">S.{aula.numeroSala}: {aula.materia}</span>
                                <span className="text-[9px] uppercase font-bold truncate max-w-[80px]">({aula.nomeProfessor})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xl font-black italic">Horário de Aula</div>
                        )}
                        <div className="text-[9px] font-black uppercase text-blue-400 mt-auto pt-2">Clique para Selecionar</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white border-2 border-transparent hover:border-white/10 transition-all flex items-center justify-center gap-2"><ChevronLeft size={16} /> Voltar</button>
              <button 
                onClick={handleCalcular} 
                disabled={(tipoFluxo === 'SALA' ? salasSelecionadas.length === 0 : !profFaltouId) || horariosSel.length === 0}
                className="flex-[2] py-6 bg-blue-800 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] border border-blue-700 hover:bg-blue-700 shadow-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                Calcular Ensalamento <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] editorial-shadow border border-blue-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-on-surface-bright italic">4. Grade de Ensalamento</h2>
                <p className="text-on-surface-variant text-xs md:text-sm font-medium mt-2">Revise as atribuições de fiscais/substitutos e gere o PDF Oficial colorido.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarPdfEnsalamento(true)}
                  className="px-6 py-4 bg-amber-700 hover:bg-amber-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase transition-all shadow-xl cursor-pointer"
                >
                  <Printer size={16} /> Gerar PDF Colorido
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-blue-800/50 shadow-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] text-left">
                    <th className="p-5">Data/Dia</th>
                    <th className="p-5">Horário</th>
                    <th className="p-5">Turma/Sala</th>
                    <th className="p-5">Aula/Original</th>
                    <th className="p-5">Fiscal/Substituto</th>
                    <th className="p-5">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resultados.map((r, i) => {
                    const semProfessor = r.professorSubstituto === 'A DEFINIR';
                    return (
                      <tr key={i} className={cn("text-sm font-medium transition-colors", semProfessor ? "bg-red-900/30" : "hover:bg-surface-container-low/50 even:bg-surface-container-low/20")}>
                        <td className="p-5 font-black text-on-surface-bright">
                          <div className="flex flex-col">
                            <span>{r.dia ? new Date(r.dia + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                          </div>
                        </td>
                        <td className="p-5 font-black text-on-surface-bright">{r.horario}</td>
                        <td className="p-5 text-on-surface">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border", obterCorAno(r.turma))}>
                              {r.turma}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 text-on-surface-variant">{r.professorOriginal}</td>
                        <td className="p-5">
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
                        </td>
                        <td className="p-5">
                          <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-blue-900/30 text-accent-amber">
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
                className="flex-1 py-6 bg-surface-container-high text-on-surface rounded-3xl font-black uppercase text-xs tracking-[0.1em] border border-blue-800 hover:bg-blue-900/50 transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                <FileText size={16} /> Salvar nos Rascunhos
              </button>
              <button
                onClick={() => handleFinalizar(false)}
                disabled={carregando}
                className="flex-[2] py-6 bg-blue-850 hover:bg-blue-800 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all flex justify-center items-center gap-2 border border-blue-700 cursor-pointer"
              >
                {carregando ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} Efetivar Registro Histórico
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE ENSALAMENTO TIMBRADO E COLORIDO (PADRÃO SESI A4) */}
      <AnimatePresence>
        {mostrarPdfEnsalamento && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print-modal-container">
            {/* Print directives */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body {
                  background: white !important;
                  color: black !important;
                }
                body * {
                  visibility: hidden !important;
                }
                .print-section, .print-section * {
                  visibility: visible !important;
                }
                .print-section {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }
                .print-modal-container {
                  background: transparent !important;
                  padding: 0 !important;
                  overflow: visible !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}} />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl my-8 print:my-0 print:rounded-none print-card-content border border-slate-200 print-section"
            >
              {/* Header Oficial do Sesi */}
              <div className="relative w-full h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-8 select-none">
                <div className="absolute top-0 left-0 w-[300px] h-full pointer-events-none">
                  <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                  <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                  <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
                </div>
                <div className="flex-1" />
                <div className="relative z-10 select-none scale-105">
                  <div className="flex flex-col items-end mr-4">
                    <div className="flex items-center gap-2 mr-1">
                      <span className="text-[11px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                      {/* Ponto ícone estilizado do Sesi Internacional */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0c2340]" />
                        <div className="w-2 h-3.5 rounded-full bg-[#0c2340]" />
                      </div>
                    </div>
                    <div className="text-[42px] font-bold text-[#0c2340] leading-none tracking-tight -mt-1 font-serif italic mr-6 relative">
                      Ses<span className="relative">ı</span>
                    </div>
                    <div className="bg-[#fbbf24] text-[#0c2340] text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 mt-1.5 rounded-[8px] transform -skew-x-12 leading-none">
                      internacional
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ações */}
              <div className="absolute top-4 right-4 z-20 flex gap-2 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm cursor-pointer"
                  title="Imprimir Ensalamento"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setMostrarPdfEnsalamento(false)}
                  className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Conteúdo Imprimível do Ensalamento */}
              <div className="p-8 md:p-12 space-y-8 print:p-8 font-sans">
                <div className="text-center border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-extrabold uppercase tracking-widest text-[#0c2340]">Mapa de Ensalamento de Provas</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Smart Sub · Relatório de Fiscais e Reposições</p>
                </div>

                {/* Resumo da Escala */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Período Letivo</span>
                    <span className="text-sm font-bold text-slate-800 text-slate-900">
                      {datasSelecionadas.map(d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Aulas / Horários</span>
                    <span className="text-sm font-bold text-slate-900">{horariosSel.join(', ')}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Salas Planejadas</span>
                    <span className="text-sm font-bold text-slate-900">{tipoFluxo === 'SALA' ? salasSelecionadas.length : 'Falta Docente'}</span>
                  </div>
                </div>

                {/* Grade Colorida do Ensalamento */}
                <div className="space-y-4">
                  {tipoFluxo === 'SALA' ? (
                    <div className="space-y-8">
                      {datasSelecionadas.map(d => {
                        const resultadosDia = resultados.filter(r => r.dia === d);
                        if (resultadosDia.length === 0) return null;

                        const horariosUnicos = Array.from(new Set(resultadosDia.map(r => r.horario))).sort();
                        const turmasUnicas = Array.from(new Set(resultadosDia.map(r => String(r.turma)))).sort();

                        return (
                          <div key={d} className="space-y-4 break-after-page">
                            <div className="flex items-center justify-between border-b pb-2 border-[#0c2340]/20">
                              <h3 className="text-sm font-black text-[#0c2340] uppercase tracking-wider">
                                Escala do Dia: {new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </h3>
                            </div>
                            
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-200">
                                    <th className="p-4 text-[10px] font-black text-[#0c2340] uppercase tracking-wider border-r border-slate-200 w-[140px]">
                                      Turma / Sala
                                    </th>
                                    {horariosUnicos.map(horario => (
                                      <th key={horario} className="p-4 text-[10px] font-black text-[#0c2340] uppercase tracking-wider text-center border-r border-slate-200 last:border-r-0">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <Clock size={12} className="opacity-50" />
                                          <span>{horario}</span>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {turmasUnicas.map((turma: string) => (
                                    <tr key={turma} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="p-4 font-black text-slate-800 text-xs border-r border-slate-200 bg-slate-50/50">
                                        <div className="flex items-center justify-center">
                                          <span className="px-3 py-1 bg-slate-200 text-slate-800 text-[10px] font-black rounded-lg border border-slate-300">
                                            {turma}
                                          </span>
                                        </div>
                                      </td>
                                      {horariosUnicos.map(horario => {
                                        const res = resultadosDia.find(r => r.horario === horario && r.turma === turma);
                                        if (!res) {
                                          return (
                                            <td key={horario} className="p-4 text-center text-slate-300 border-r border-slate-200 last:border-r-0 bg-slate-50/20 italic text-[10px]">
                                              -
                                            </td>
                                          );
                                        }

                                        const is6o = turma.includes('6º') || turma.includes('6 ');
                                        const is7o = turma.includes('7º') || turma.includes('7 ');
                                        const is8o = turma.includes('8º') || turma.includes('8 ');
                                        const is9o = turma.includes('9º') || turma.includes('9 ');

                                        const cellBg = is6o ? "bg-cyan-50/60" : is7o ? "bg-blue-50/60" : is8o ? "bg-amber-50/60" : is9o ? "bg-orange-50/60" : "bg-purple-50/60";
                                        const borderCol = is6o ? "bg-cyan-500" : is7o ? "bg-blue-500" : is8o ? "bg-amber-500" : is9o ? "bg-orange-500" : "bg-purple-500";

                                        return (
                                          <td key={horario} className={cn("p-4 border-r border-slate-200 last:border-r-0 text-center relative overflow-hidden transition-all", cellBg)}>
                                            <div className={cn("absolute top-0 left-0 w-1 h-full", borderCol)} />
                                            <div className="pl-1">
                                              <span className="block text-xs font-black text-slate-900">
                                                {res.professorSubstituto}
                                              </span>
                                              <span className="block text-[8px] font-bold text-slate-400 mt-0.5">
                                                Orig: {res.professorOriginal}
                                              </span>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-[#0c2340] uppercase tracking-wider border-b pb-2">Distribuição de Salas e Horários</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resultados.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between shadow-sm relative overflow-hidden text-slate-900"
                          >
                            <div className="absolute top-0 left-0 w-2 h-full bg-slate-400" />
                            <div className="pl-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.horario}</span>
                                <span className="text-[10px] font-black uppercase bg-white px-2 py-0.5 rounded-md border text-slate-700">
                                  {item.dia ? new Date(item.dia + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-end">
                                <div>
                                  <h4 className="text-lg font-extrabold tracking-tight">{item.turma}</h4>
                                  <p className="text-xs font-semibold text-slate-500">Professor Original: {item.professorOriginal}</p>
                                </div>
                                
                                <div className="text-right">
                                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Substituto</span>
                                  <span className="text-sm font-black bg-white text-slate-900 px-3 py-1 rounded-lg border shadow-sm border-black/5 block mt-0.5">
                                    {item.professorSubstituto}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé e Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <div className="w-full border-b border-slate-300 h-10" />
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Assinatura da Coordenação</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-full border-b border-slate-300 h-10" />
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Data do Ensalamento</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
