import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, Clock, Trash2, Plus, Coffee, X, 
  Settings, ChevronLeft, RefreshCw, Copy, Check, Info, MapPin, Briefcase, User
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeMonitores, limparGradeMonitorDia, salvarPeriodos, buscarPeriodos } from '../services/dataService';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import SeletorLocalPosto from '../components/SeletorLocalPosto';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

const MACRO_SETORES = [
  '🚗 S1',
  '🚗 S2',
  '🌳 Gramado',
  '🌳 Pátio Lateral',
  '🏫 Térreo',
  '📚 Biblioteca',
  '🏥 Enfermaria',
  '🏢 1º Andar',
  '🏢 2º Andar',
  '🛡️ Monitoria',
  '🏢 3º Andar',
  '🛡️ Volante 1',
  '🛡️ Volante 2',
  '🍽️ Almoço'
];

const PERIODOS_FALLBACK = [
  { id: 'p1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p2', nome: '2ª Aula', horarioInicio: '08:20', horarioFim: '09:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p3', nome: '3ª Aula', horarioInicio: '09:10', horarioFim: '10:00', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p-int', nome: 'Intervalo', horarioInicio: '10:00', horarioFim: '10:20', tipo: 'intervalo', segmento: 'monitoria' },
  { id: 'p4', nome: '4ª Aula', horarioInicio: '10:20', horarioFim: '11:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p5', nome: '5ª Aula', horarioInicio: '11:10', horarioFim: '12:00', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p-alm', nome: 'Almoço', horarioInicio: '12:00', horarioFim: '13:00', tipo: 'almoco', segmento: 'monitoria' },
  { id: 'p6', nome: '6ª Aula', horarioInicio: '13:00', horarioFim: '13:50', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p7', nome: '7ª Aula', horarioInicio: '13:50', horarioFim: '14:40', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p8', nome: '8ª Aula', horarioInicio: '14:40', horarioFim: '15:30', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p9', nome: '9ª Aula', horarioInicio: '15:30', horarioFim: '16:20', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p10', nome: '10ª Aula', horarioInicio: '16:20', horarioFim: '17:10', tipo: 'aula', segmento: 'monitoria' },
  { id: 'p11', nome: '11ª Aula', horarioInicio: '17:10', horarioFim: '18:00', tipo: 'aula', segmento: 'monitoria' }
];

function normalizarParaOrdenacao(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/º/g, "")
    .replace(/ª/g, "")
    .trim();
}

function obterMacroSetor(posto: string): string {
  const p = (posto || '').trim().toLowerCase();
  
  if (p === 'almoço' || p === 'almoco' || p === 'almoçando' || p === 'refeitório' || p === 'refeitorio') return '🍽️ Almoço';
  if (p === 'volante 1') return '🛡️ Volante 1';
  if (p === 'volante 2') return '🛡️ Volante 2';
  if (p === 'térreo' || p === 'terreo') return '🏫 Térreo';
  if (p === 'pátio lateral' || p === 'patio lateral') return '🌳 Pátio Lateral';
  if (p === '1º andar' || p === '1 andar') return '🏢 1º Andar';
  if (p === '2º andar' || p === '2 andar') return '🏢 2º Andar';
  if (p === '3º andar' || p === '3 andar') return '🏢 3º Andar';
  if (p === 's1') return '🚗 S1';
  if (p === 's2') return '🚗 S2';
  if (p === 'monitoria') return '🛡️ Monitoria';
  if (p === 'biblioteca') return '📚 Biblioteca';
  if (p === 'enfermaria') return '🏥 Enfermaria';

  if (p.includes('almoça') || p.includes('almoço')) return '🍽️ Almoço';

  const candidates: { sector: string; index: number }[] = [];

  const addCandidate = (sector: string, keywords: string[]) => {
    for (const kw of keywords) {
      const idx = p.indexOf(kw);
      if (idx !== -1) {
        candidates.push({ sector, index: idx });
      }
    }
  };

  addCandidate('🛡️ Volante 1', ['volante 2', 'volante2', 'apoio interno']);
  addCandidate('🛡️ Volante 2', ['volante 1', 'volante1', 'apoio externo']);
  addCandidate('🛡️ Monitoria', ['monitoria']);
  addCandidate('📚 Biblioteca', ['biblioteca', 'bliblioteca']);
  addCandidate('🏥 Enfermaria', ['enfermaria']);
  addCandidate('🚗 S1', ['s1']);
  addCandidate('🚗 S2', ['s2']);
  addCandidate('🏢 1º Andar', ['1º andar', '1 andar', 'primeiro andar']);
  addCandidate('🏢 2º Andar', ['2º andar', '2 andar', 'segundo andar']);
  addCandidate('🏢 3º Andar', ['3º andar', '3 andar', 'terceiro andar']);
  addCandidate('🌳 Pátio Lateral', ['patio', 'pátio', 'lateral', 'gramado', 'botânico', 'botanico']);
  addCandidate('🏫 Térreo', ['térreo', 'terreo']);

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.index - b.index);
    return candidates[0].sector;
  }

  return '🛡️ Monitoria';
}

export default function MonitorScheduleEditor() {
  const { monitores, gradeMonitores, periodos, atualizar } = useEscola();
  const navigate = useNavigate();

  const [diaSelecionado, setDiaSelecionado] = useState('SEGUNDA');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados dos Modais
  const [modalAlocacaoAberto, setModalAlocacaoAberto] = useState(false);
  const [modalPeriodosAberto, setModalPeriodosAberto] = useState(false);

  // Alocação ativa no Modal
  const [alocacaoEditando, setAlocacaoEditando] = useState<{
    idExistente?: string; // ID se for edição de escala existente
    monitorNome: string;
    periodo: any;
    posto: string;
    funcao: string;
    corEtiqueta: string;
    tipo: 'servico' | 'almoco';
  } | null>(null);

  // Lista local de períodos do segmento monitoria
  const periodosMonitoria = useMemo(() => {
    const filtrados = (periodos || []).filter(p => p.segmento === 'monitoria');
    return filtrados.length > 0 ? filtrados : PERIODOS_FALLBACK;
  }, [periodos]);

  // Lista local de períodos editáveis no modal
  const [periodosEditaveis, setPeriodosEditaveis] = useState<any[]>([]);

  const CORES_MONITOR = useMemo(() => [
    '#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6',
    '#EC4899','#06B6D4','#F97316','#14B8A6','#6366F1',
    '#D946EF','#0EA5E9','#84CC16','#E11D48','#7C3AED',
  ], []);

  const mapaCorMonitor = useMemo(() => {
    const mapa: Record<string, string> = {};
    const nomes = Array.from(new Set([
      ...(monitores || []).map(m => m.nome),
      ...(gradeMonitores || []).map(g => g.monitorNome),
    ])).sort();
    nomes.forEach((nome, i) => {
      const monitor = (monitores || []).find(m => m.nome === nome);
      const gradeEntry = (gradeMonitores || []).find(g => g.monitorNome === nome && g.corEtiqueta);
      mapa[nome] = monitor?.cor || gradeEntry?.corEtiqueta || CORES_MONITOR[i % CORES_MONITOR.length];
    });
    return mapa;
  }, [monitores, gradeMonitores, CORES_MONITOR]);

  useEffect(() => {
    if (modalPeriodosAberto) {
      setPeriodosEditaveis(periodosMonitoria.map(p => ({ ...p })));
    }
  }, [modalPeriodosAberto, periodosMonitoria]);

  // Função para abrir o modal de alocação/criação em uma célula do grid
  const abrirAlocacao = (slot: any | null, periodo: any, macroSetorPreDefinido?: string) => {
    if (slot) {
      // Editar alocação existente
      setAlocacaoEditando({
        idExistente: slot.id,
        monitorNome: slot.monitorNome,
        periodo,
        posto: slot.posto,
        funcao: slot.funcao,
        corEtiqueta: slot.corEtiqueta || mapaCorMonitor[slot.monitorNome] || '#3b82f6',
        tipo: (slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO') ? 'almoco' : 'servico'
      });
    } else {
      // Criar nova alocação
      // Limpa emojis ou ícones do nome do macroSetor para preencher o posto
      const postoPadrao = (macroSetorPreDefinido || '🏫 Térreo')
        .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
        .trim();

      setAlocacaoEditando({
        monitorNome: '', // Selecionar no dropdown do modal
        periodo,
        posto: postoPadrao,
        funcao: 'Monitoria Geral',
        corEtiqueta: '#3b82f6',
        tipo: 'servico'
      });
    }
    setModalAlocacaoAberto(true);
  };

  // Salvar uma alocação específica
  const salvarAlocacao = async () => {
    if (!alocacaoEditando) return;
    if (!alocacaoEditando.monitorNome) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um monitor para alocar!' });
      return;
    }
    setSalvando(true);
    setMensagem(null);

    const { idExistente, monitorNome, periodo, posto, funcao, corEtiqueta } = alocacaoEditando;

    try {
      // 1. Pegar todos os turnos atuais do monitor no dia selecionado
      const turnosAtuais = gradeMonitores
        .filter(g => g.monitorNome === monitorNome && g.diaSemana === diaSelecionado)
        .map(g => ({
          monitorNome: g.monitorNome,
          diaSemana: g.diaSemana,
          horarioInicio: g.horarioInicio.slice(0, 5),
          horarioFim: g.horarioFim.slice(0, 5),
          posto: g.posto,
          funcao: g.funcao,
          corEtiqueta: g.corEtiqueta
        }));

      // 2. Filtrar removendo o horário que estamos editando
      let turnosAtualizados = turnosAtuais.filter(
        t => t.horarioInicio !== periodo.horarioInicio.slice(0, 5)
      );

      // Se for edição, também removemos o slot existente na grade geral antes de salvar
      if (idExistente) {
        const slotOriginal = gradeMonitores.find(g => g.id === idExistente);
        if (slotOriginal && slotOriginal.monitorNome !== monitorNome) {
          // O monitor mudou! Precisamos também atualizar/limpar os turnos do monitor anterior naquele horário
          const turnosAnterior = gradeMonitores
            .filter(g => g.monitorNome === slotOriginal.monitorNome && g.diaSemana === diaSelecionado)
            .map(g => ({
              monitorNome: g.monitorNome,
              diaSemana: g.diaSemana,
              horarioInicio: g.horarioInicio.slice(0, 5),
              horarioFim: g.horarioFim.slice(0, 5),
              posto: g.posto,
              funcao: g.funcao,
              corEtiqueta: g.corEtiqueta
            }))
            .filter(t => t.horarioInicio !== periodo.horarioInicio.slice(0, 5));
          
          await salvarGradeMonitores(turnosAnterior); // Salva a lista limpa do monitor anterior
        }
      }

      // 3. Adicionar o novo slot se posto/funcao forem preenchidos
      if (posto) {
        turnosAtualizados.push({
          monitorNome: monitorNome,
          diaSemana: diaSelecionado,
          horarioInicio: periodo.horarioInicio.slice(0, 5),
          horarioFim: periodo.horarioFim.slice(0, 5),
          posto: posto,
          funcao: funcao || 'Monitoria Geral',
          corEtiqueta: corEtiqueta || mapaCorMonitor[monitorNome] || '#3b82f6'
        });
      }

      // 4. Salvar no Banco
      const ok = await salvarGradeMonitores(turnosAtualizados);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Escala atualizada!' });
        atualizar();
        setModalAlocacaoAberto(false);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar escala.' });
      }
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão.' });
    } finally {
      setSalvando(false);
    }
  };

  // Remover uma alocação específica do banco de dados
  const removerAlocacao = async () => {
    if (!alocacaoEditando) return;
    setSalvando(true);
    setMensagem(null);

    const { monitorNome, periodo } = alocacaoEditando;

    try {
      const turnosAtuais = gradeMonitores
        .filter(g => g.monitorNome === monitorNome && g.diaSemana === diaSelecionado)
        .map(g => ({
          monitorNome: g.monitorNome,
          diaSemana: g.diaSemana,
          horarioInicio: g.horarioInicio.slice(0, 5),
          horarioFim: g.horarioFim.slice(0, 5),
          posto: g.posto,
          funcao: g.funcao,
          corEtiqueta: g.corEtiqueta
        }));

      const turnosAtualizados = turnosAtuais.filter(
        t => t.horarioInicio !== periodo.horarioInicio.slice(0, 5)
      );

      const ok = await salvarGradeMonitores(turnosAtualizados);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Alocação removida!' });
        atualizar();
        setModalAlocacaoAberto(false);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao remover alocação.' });
      }
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao conectar ao servidor.' });
    } finally {
      setSalvando(false);
    }
  };

  // Replicar a escala do dia selecionado para Terça, Quarta, Quinta e Sexta
  const replicarDiaSemana = async () => {
    if (!window.confirm(`Deseja copiar toda a grade de ${diaSelecionado} para Terça, Quarta, Quinta e Sexta? (Escalas antigas nesses dias serão substituídas)`)) {
      return;
    }
    setSalvando(true);
    setMensagem(null);

    try {
      const turnosDiaOrigem = gradeMonitores.filter(g => g.diaSemana === diaSelecionado);
      
      if (turnosDiaOrigem.length === 0) {
        setMensagem({ tipo: 'erro', texto: 'Não há escalas montadas no dia de origem para copiar!' });
        setSalvando(false);
        return;
      }

      const diasDestino = ['TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'].filter(d => d !== diaSelecionado);

      // Limpa os dias de destino primeiro
      for (const dia of diasDestino) {
        await limparGradeMonitorDia('', dia); // Passando string vazia limpa tudo do dia
      }

      // Prepara lista nova de registros replicados
      const novosTurnosReplicados = [];
      for (const dia of diasDestino) {
        for (const t of turnosDiaOrigem) {
          novosTurnosReplicados.push({
            monitorNome: t.monitorNome,
            diaSemana: dia,
            horarioInicio: t.horarioInicio.slice(0, 5),
            horarioFim: t.horarioFim.slice(0, 5),
            posto: t.posto,
            funcao: t.funcao,
            corEtiqueta: t.corEtiqueta
          });
        }
      }

      const ok = await salvarGradeMonitores(novosTurnosReplicados);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Escala replicada com sucesso para toda a semana!' });
        atualizar();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao replicar grade.' });
      }
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'erro', texto: 'Erro na replicação de dados.' });
    } finally {
      setSalvando(false);
    }
  };

  // Limpar a escala de todo o dia selecionado
  const limparEscalaDia = async () => {
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja apagar TODAS as alocações de ${diaSelecionado}?`)) {
      return;
    }
    setSalvando(true);
    setMensagem(null);

    try {
      const ok = await limparGradeMonitorDia('', diaSelecionado);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: `Grade de ${diaSelecionado} limpa!` });
        atualizar();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao limpar grade.' });
      }
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao comunicar com o servidor.' });
    } finally {
      setSalvando(false);
    }
  };

  // Salvar a edição de horários padrões (as colunas do grid)
  const salvarNovosPeriodos = async () => {
    setSalvando(true);
    try {
      const ok = await salvarPeriodos(periodosEditaveis);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Horários padrões atualizados!' });
        atualizar();
        setModalPeriodosAberto(false);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar horários.' });
      }
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'erro', texto: 'Falha na rede ao salvar horários.' });
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem da grade para o dia selecionado
  const turnosDoDia = useMemo(() => {
    return (gradeMonitores || []).filter(g => g.diaSemana === diaSelecionado);
  }, [gradeMonitores, diaSelecionado]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-4 group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel ADM
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#a855f7]/10 text-[#a855f7] rounded-full mb-3 border border-[#a855f7]/20">
              <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Montar Escala Diária</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">Grade <span className="text-primary">de Escalas</span></h1>
            <p className="text-on-surface-variant font-medium mt-2 text-sm opacity-60">Planeje e realoque os postos dos monitores organizados por Local/Setor.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {mensagem && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                className={cn("px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase", 
                  mensagem.tipo === 'sucesso' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}>
                {mensagem.tipo === 'sucesso' ? <Check size={16} /> : <X size={16} />}
                {mensagem.texto}
              </motion.div>
            )}
            <button onClick={() => setModalPeriodosAberto(true)} className="btn-secondary flex items-center gap-2 text-xs uppercase tracking-wider px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
              <Settings size={16} className="text-[#a855f7]" />
              Distribuir Horários Padrões
            </button>
            <button onClick={replicarDiaSemana} disabled={salvando} className="btn-secondary flex items-center gap-2 text-xs uppercase tracking-wider px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
              <Copy size={16} className="text-[#fbbf24]" />
              Replicar para Semana
            </button>
            <button onClick={limparEscalaDia} disabled={salvando} className="btn-secondary flex items-center gap-2 text-xs uppercase tracking-wider px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400">
              <Trash2 size={16} />
              Limpar Dia
            </button>
          </div>
        </header>

        {/* Dia Selector */}
        <div className="flex bg-[#0d0d0d] p-1 rounded-2xl border border-white/5 gap-1 w-fit">
          {DIAS_SEMANA.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaSelecionado(dia)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
                diaSelecionado === dia
                  ? "bg-primary text-black font-bold shadow-md"
                  : "text-white/45 hover:bg-white/5 hover:text-white"
              )}
            >
              {dia}
            </button>
          ))}
        </div>

        {/* Tabela de Grid de Cards (ORGANIZADO POR LOCAL NAS LINHAS) */}
        <main className="bg-surface-container-lowest rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/40">
                  <th className="py-5 px-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest w-[200px] sticky left-0 bg-[#0a0a0a] z-20 border-r border-white/5">
                    Local / Setor
                  </th>
                  {periodosMonitoria.map(p => (
                    <th key={p.id} className="py-4 px-3 text-center border-l border-white/5 min-w-[170px]">
                      <div className="text-[10px] font-black text-primary uppercase tracking-wider">{p.nome}</div>
                      <div className="text-[9px] font-black text-white/40 tracking-widest mt-1">
                        {p.horarioInicio.slice(0, 5)} - {p.horarioFim.slice(0, 5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MACRO_SETORES.map(macro => {
                  return (
                    <tr key={macro} className="hover:bg-white/[0.01] transition-all">
                      {/* Macro Sector Label Cell */}
                      <td className="py-4 px-6 font-black text-xs text-white uppercase italic tracking-wider sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5 min-w-[200px]">
                        {macro}
                      </td>

                      {/* Columns Cells */}
                      {periodosMonitoria.map(p => {
                        // Filtra todos os monitores alocados neste setor e horário
                        const slotsAlocados = turnosDoDia.filter(g => 
                          obterMacroSetor(g.posto) === macro && 
                          g.horarioInicio.slice(0, 5) === p.horarioInicio.slice(0, 5)
                        );

                        return (
                          <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                            <div className="space-y-1.5 min-h-[60px] flex flex-col justify-center">
                              {/* Renderiza os monitores alocados no setor */}
                              {slotsAlocados.map(slot => {
                                const monitor = monitores.find(m => m.nome === slot.monitorNome);
                                const cor = mapaCorMonitor[slot.monitorNome] || '#3b82f6';
                                const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO' || slot.posto === 'REFEITÓRIO';
                                const blockColor = ehAlmoco ? '#fbbf24' : (slot.corEtiqueta || cor);

                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() => abrirAlocacao(slot, p, macro)}
                                    className="w-full text-left p-2 rounded-md border transition-all flex flex-col justify-center group/card hover:brightness-125"
                                    style={{ 
                                      backgroundColor: `${blockColor}22`,
                                      borderColor: `${blockColor}50`,
                                      borderLeft: `4px solid ${blockColor}`
                                    }}
                                  >
                                    <div className="text-[9.5px] font-black text-white truncate uppercase flex items-center gap-1">
                                      <User size={10} style={{ color: blockColor }} className="shrink-0" />
                                      {slot.monitorNome.split(' ')[0]}
                                    </div>
                                    <div className="text-[7.5px] font-bold text-white/50 truncate uppercase mt-0.5 leading-none">
                                      {slot.posto} · {slot.funcao}
                                    </div>
                                  </button>
                                );
                              })}

                              {/* Botão "+" para adicionar monitor neste local */}
                              <button
                                onClick={() => abrirAlocacao(null, p, macro)}
                                className="w-full py-1 border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/[0.02] rounded-md flex items-center justify-center transition-all group/empty text-white/20 hover:text-primary"
                              >
                                <Plus size={12} className="group-hover:rotate-90 transition-all" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* MODAL DE ALOCAÇÃO / REATRIBUIÇÃO DE CARDS */}
      <AnimatePresence>
        {modalAlocacaoAberto && alocacaoEditando && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setModalAlocacaoAberto(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-lg bg-surface-container-lowest border border-white/10 rounded-2xl p-6 md:p-8 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-sm font-black text-primary shrink-0">
                    {alocacaoEditando.monitorNome ? alocacaoEditando.monitorNome.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">
                      {alocacaoEditando.idExistente ? 'Editar Escala' : 'Alocar Turno'}
                    </h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                      Horário: {alocacaoEditando.periodo.nome} ({alocacaoEditando.periodo.horarioInicio} - {alocacaoEditando.periodo.horarioFim})
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalAlocacaoAberto(false)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                {/* Selecionar Monitor (Apenas na Criação ou se quiser trocar) */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Monitor</label>
                  <select 
                    value={alocacaoEditando.monitorNome} 
                    onChange={e => {
                      const mNome = e.target.value;
                      const monitorObj = monitores.find(m => m.nome === mNome);
                      setAlocacaoEditando({
                        ...alocacaoEditando,
                        monitorNome: mNome,
                        corEtiqueta: monitorObj?.cor || mapaCorMonitor[mNome] || '#3b82f6'
                      });
                    }}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-primary/45 cursor-pointer uppercase"
                  >
                    <option value="" disabled>SELECIONE UM MONITOR...</option>
                    {(monitores || []).map(m => (
                      <option key={m.id} value={m.nome}>{m.nome} ({m.turno})</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Turno */}
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
                  <button 
                    type="button"
                    onClick={() => {
                      setAlocacaoEditando({
                        ...alocacaoEditando,
                        tipo: 'servico',
                        posto: alocacaoEditando.posto === 'ALMOÇO' ? 'TÉRREO' : alocacaoEditando.posto,
                        funcao: alocacaoEditando.funcao === 'ALMOÇO' ? 'Monitoria Geral' : alocacaoEditando.funcao
                      });
                    }}
                    className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all",
                      alocacaoEditando.tipo === 'servico' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5"
                    )}
                  >
                    Serviço Ativo
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setAlocacaoEditando({
                        ...alocacaoEditando,
                        tipo: 'almoco',
                        posto: 'ALMOÇO',
                        funcao: 'ALMOÇO'
                      });
                    }}
                    className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all",
                      alocacaoEditando.tipo === 'almoco' ? "bg-amber-500/20 text-amber-500" : "text-white/40 hover:bg-white/5"
                    )}
                  >
                    <Coffee size={10} /> Pausa / Almoço
                  </button>
                </div>

                {/* Local selector */}
                {alocacaoEditando.tipo === 'servico' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Local / Posto Detalhado</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <SeletorLocalPosto 
                        value={alocacaoEditando.posto}
                        onChange={val => setAlocacaoEditando({ ...alocacaoEditando, posto: val })}
                        className="w-full bg-[#161616] border border-white/5 rounded-xl py-3 px-10 text-xs font-bold text-white outline-none focus:border-primary/45 appearance-none cursor-pointer uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Função / Atividade */}
                {alocacaoEditando.tipo === 'servico' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Atividade / Função</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <input 
                        type="text" 
                        value={alocacaoEditando.funcao} 
                        onChange={e => setAlocacaoEditando({ ...alocacaoEditando, funcao: e.target.value })}
                        placeholder="Ex: Portão Principal, Apoio, Circulando..."
                        className="w-full bg-[#161616] border border-white/5 rounded-xl py-3 px-10 text-xs font-bold text-white outline-none focus:border-primary/45"
                      />
                    </div>
                  </div>
                )}

                {/* Seletor de Cor customizada da etiqueta */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Cor do Card</label>
                  <div className="flex flex-wrap gap-2 bg-[#161616] p-3 rounded-xl border border-white/5">
                    {CORES_MONITOR.map(c => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setAlocacaoEditando({ ...alocacaoEditando, corEtiqueta: c })}
                        className={cn("w-6 h-6 rounded-full border-2 transition-all scale-95 hover:scale-110",
                          alocacaoEditando.corEtiqueta === c ? "border-white" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-2 border-t border-white/5 pt-4 mt-6 shrink-0 justify-between">
                {alocacaoEditando.idExistente ? (
                  <button 
                    onClick={removerAlocacao}
                    disabled={salvando}
                    className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-black uppercase text-red-400 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button onClick={() => setModalAlocacaoAberto(false)} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                    Cancelar
                  </button>
                  <button onClick={salvarAlocacao} disabled={salvando} className="px-5 py-3 bg-primary text-black rounded-xl text-xs font-black uppercase hover:brightness-110 transition-all flex items-center gap-2">
                    {salvando ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {alocacaoEditando.idExistente ? 'Salvar' : 'Alocar'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DISTRIBUIR HORÁRIOS PADRÕES */}
      <AnimatePresence>
        {modalPeriodosAberto && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setModalPeriodosAberto(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-3xl bg-surface-container-lowest border border-white/10 rounded-2xl p-6 md:p-8 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">
                      Distribuir Horários Padrões
                    </h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                      Configure a grade de aulas e intervalos da monitoria
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalPeriodosAberto(false)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/45 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Lista dos períodos configuráveis */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-6 custom-scrollbar">
                {periodosEditaveis.map((p, idx) => (
                  <div key={p.id || idx} className="flex flex-col lg:flex-row items-start lg:items-center gap-3 p-3 bg-black/45 rounded-xl border border-white/5">
                    {/* Index */}
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[10px] font-black text-white/30 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Horário inputs */}
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
                      <input type="time" value={p.horarioInicio} 
                        onChange={e => {
                          const novos = [...periodosEditaveis];
                          novos[idx].horarioInicio = e.target.value;
                          setPeriodosEditaveis(novos.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)));
                        }} 
                        className="bg-transparent text-xs font-black text-center text-white outline-none border-none w-24" />
                      <span className="text-white/20">—</span>
                      <input type="time" value={p.horarioFim} 
                        onChange={e => {
                          const novos = [...periodosEditaveis];
                          novos[idx].horarioFim = e.target.value;
                          setPeriodosEditaveis(novos);
                        }} 
                        className="bg-transparent text-xs font-black text-center text-white outline-none border-none w-24" />
                    </div>

                    {/* Nome do período */}
                    <div className="flex-1 w-full">
                      <input type="text" value={p.nome} placeholder="NOME DO PERÍODO/AULA" 
                        onChange={e => {
                          const novos = [...periodosEditaveis];
                          novos[idx].nome = e.target.value;
                          setPeriodosEditaveis(novos);
                        }}
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-xs font-bold text-white outline-none focus:border-[#a855f7]/30 uppercase" />
                    </div>

                    {/* Tipo tag */}
                    <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
                      <select value={p.tipo} 
                        onChange={e => {
                          const novos = [...periodosEditaveis];
                          novos[idx].tipo = e.target.value;
                          setPeriodosEditaveis(novos);
                        }}
                        className="bg-black/40 border border-white/5 rounded-lg py-2 px-3 text-[10px] font-black text-white/50 outline-none uppercase cursor-pointer"
                      >
                        <option value="aula">Aula</option>
                        <option value="intervalo">Intervalo</option>
                        <option value="almoco">Almoço</option>
                      </select>

                      {/* Excluir período */}
                      <button 
                        onClick={() => {
                          if (window.confirm('Deseja excluir este período padrão da grade?')) {
                            setPeriodosEditaveis(periodosEditaveis.filter((_, i) => i !== idx));
                          }
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => {
                    const novo = {
                      id: `p-new-${Date.now()}`,
                      nome: 'Nova Aula',
                      horarioInicio: '07:30',
                      horarioFim: '08:20',
                      tipo: 'aula',
                      segmento: 'monitoria'
                    };
                    setPeriodosEditaveis([...periodosEditaveis, novo].sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)));
                  }}
                  className="w-full py-3 bg-[#a855f7]/5 border border-dashed border-[#a855f7]/25 hover:bg-[#a855f7]/10 text-[#a855f7] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={16} /> Adicionar Novo Período
                </button>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex border-t border-white/5 pt-4 mt-6 shrink-0 justify-end gap-2">
                <button onClick={() => setModalPeriodosAberto(false)} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                  Cancelar
                </button>
                <button onClick={salvarNovosPeriodos} disabled={salvando} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2">
                  {salvando ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar Grade
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
