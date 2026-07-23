import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, Clock, Trash2, Plus, Coffee, X, 
  Settings, ChevronLeft, RefreshCw, Copy, Check, Info, MapPin, Briefcase
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeMonitores, limparGradeMonitorDia, salvarPeriodos, buscarPeriodos } from '../services/dataService';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import SeletorLocalPosto from '../components/SeletorLocalPosto';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

function normalizarParaOrdenacao(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/º/g, "")
    .replace(/ª/g, "")
    .trim();
}

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
    monitor: any;
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
  const [ordenacao, setOrdenacao] = useState<'nome' | 'local'>('local');

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

  const SEQUENCIA_LOCAIS = useMemo(() => [
    'S1',
    'S2',
    'GRAMADO',
    'PATIO LATERAL',
    'TERREO',
    'BIBLIOTECA',
    'ENFERMARIA',
    '1 ANDAR',
    '2 ANDAR',
    'MONITORIA',
    '3 ANDAR'
  ], []);

  const obterPesoLocal = (posto: string): number => {
    if (!posto) return 999;
    const p = normalizarParaOrdenacao(posto);
    const idx = SEQUENCIA_LOCAIS.findIndex(loc => p.includes(loc) || loc.includes(p));
    return idx === -1 ? 900 : idx;
  };

  const monitoresOrdenados = useMemo(() => {
    const lista = [...(monitores || [])];
    if (ordenacao === 'nome') {
      return lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      return lista.sort((a, b) => {
        const turnosA = gradeMonitores
          .filter(g => {
            if (g.monitorNome !== a.nome || g.diaSemana !== diaSelecionado) return false;
            const p = normalizarParaOrdenacao(g.posto || '');
            const f = normalizarParaOrdenacao(g.funcao || '');
            return p && p !== 'ALMOCO' && p !== 'REFEITORIO' && f !== 'ALMOCO' && f !== 'REFEITORIO' && !p.includes('ALMOC');
          })
          .sort((x, y) => x.horarioInicio.localeCompare(y.horarioInicio));

        const turnosB = gradeMonitores
          .filter(g => {
            if (g.monitorNome !== b.nome || g.diaSemana !== diaSelecionado) return false;
            const p = normalizarParaOrdenacao(g.posto || '');
            const f = normalizarParaOrdenacao(g.funcao || '');
            return p && p !== 'ALMOCO' && p !== 'REFEITORIO' && f !== 'ALMOCO' && f !== 'REFEITORIO' && !p.includes('ALMOC');
          })
          .sort((x, y) => x.horarioInicio.localeCompare(y.horarioInicio));

        // Ordena estritamente pelo peso do local (sem usar horario de inicio)
        const maxLen = Math.max(turnosA.length, turnosB.length);
        for (let i = 0; i < maxLen; i++) {
          const postoA = turnosA[i]?.posto || '';
          const postoB = turnosB[i]?.posto || '';

          const pesoA = obterPesoLocal(postoA);
          const pesoB = obterPesoLocal(postoB);

          if (pesoA !== pesoB) return pesoA - pesoB;
        }
        return a.nome.localeCompare(b.nome);
      });
    }
  }, [monitores, gradeMonitores, diaSelecionado, periodosMonitoria, ordenacao]);

  const maxLinhasPorLocal = useMemo(() => {
    let max = (monitores || []).length;
    for (const p of periodosMonitoria) {
      const count = (gradeMonitores || []).filter(
        g => g.diaSemana === diaSelecionado && g.horarioInicio.slice(0, 5) === p.horarioInicio.slice(0, 5)
      ).length;
      if (count + 1 > max) max = count + 1;
    }
    return max;
  }, [gradeMonitores, diaSelecionado, periodosMonitoria, monitores]);

  useEffect(() => {
    if (modalPeriodosAberto) {
      setPeriodosEditaveis(periodosMonitoria.map(p => ({ ...p })));
    }
  }, [modalPeriodosAberto, periodosMonitoria]);

  // Função para abrir o modal de alocação de uma célula
  const abrirAlocacao = (monitorOuSlot: any, periodo: any) => {
    let monitorObj = null;
    let slotExistente = null;

    if (monitorOuSlot?.id && monitorOuSlot?.monitorNome) {
      slotExistente = monitorOuSlot;
      monitorObj = (monitores || []).find(m => m.nome === slotExistente.monitorNome) || {
        nome: slotExistente.monitorNome,
        cor: slotExistente.corEtiqueta || '#3b82f6'
      };
    } else if (monitorOuSlot?.nome) {
      monitorObj = monitorOuSlot;
      slotExistente = gradeMonitores.find(
        g => g.monitorNome === monitorObj.nome && 
             g.diaSemana === diaSelecionado &&
             g.horarioInicio.slice(0, 5) === periodo.horarioInicio.slice(0, 5)
      );
    }

    setAlocacaoEditando({
      monitor: monitorObj,
      periodo,
      posto: slotExistente?.posto || 'TÉRREO',
      funcao: slotExistente?.funcao || 'Monitoria Geral',
      corEtiqueta: slotExistente?.corEtiqueta || monitorObj?.cor || '#3b82f6',
      tipo: (slotExistente?.funcao === 'ALMOÇO' || slotExistente?.posto === 'ALMOÇO') ? 'almoco' : 'servico'
    });
    setModalAlocacaoAberto(true);
  };

  // Salvar uma alocação específica
  const salvarAlocacao = async () => {
    if (!alocacaoEditando) return;
    setSalvando(true);
    setMensagem(null);

    const { monitor, periodo, posto, funcao, corEtiqueta } = alocacaoEditando;

    try {
      // 1. Pegar todos os turnos atuais do monitor no dia selecionado
      const turnosAtuais = gradeMonitores
        .filter(g => g.monitorNome === monitor.nome && g.diaSemana === diaSelecionado)
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
      const turnosAtualizados = turnosAtuais.filter(
        t => t.horarioInicio !== periodo.horarioInicio.slice(0, 5)
      );

      // 3. Adicionar o novo slot se posto/funcao forem preenchidos
      if (posto) {
        turnosAtualizados.push({
          monitorNome: monitor.nome,
          diaSemana: diaSelecionado,
          horarioInicio: periodo.horarioInicio.slice(0, 5),
          horarioFim: periodo.horarioFim.slice(0, 5),
          posto: posto,
          funcao: funcao || 'Monitoria Geral',
          corEtiqueta: corEtiqueta
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

  // Remover uma alocação específica
  const removerAlocacao = async () => {
    if (!alocacaoEditando) return;
    setSalvando(true);
    setMensagem(null);

    const { monitor, periodo } = alocacaoEditando;

    try {
      const turnosAtuais = gradeMonitores
        .filter(g => g.monitorNome === monitor.nome && g.diaSemana === diaSelecionado)
        .map(g => ({
          monitorNome: g.monitorNome,
          diaSemana: g.diaSemana,
          horarioInicio: g.horarioInicio.slice(0, 5),
          horarioFim: g.horarioFim.slice(0, 5),
          posto: g.posto,
          funcao: g.funcao,
          corEtiqueta: g.corEtiqueta
        }));

      const turnosRestantes = turnosAtuais.filter(
        t => t.horarioInicio !== periodo.horarioInicio.slice(0, 5)
      );

      // Se não sobrar nada, limpa o dia inteiro para esse monitor
      if (turnosRestantes.length === 0) {
        await limparGradeMonitorDia(monitor.nome, diaSelecionado);
      } else {
        await salvarGradeMonitores(turnosRestantes);
      }

      setMensagem({ tipo: 'sucesso', texto: 'Alocação removida!' });
      atualizar();
      setModalAlocacaoAberto(false);
    } catch (e) {
      console.error(e);
      setMensagem({ tipo: 'erro', texto: 'Erro ao remover.' });
    } finally {
      setSalvando(false);
    }
  };

  // Salvar Horários Padrões (Colunas)
  const salvarPeriodosMonitoria = async () => {
    setSalvando(true);
    try {
      const payloads = periodosEditaveis.map(p => ({
        ...p,
        segmento: 'monitoria'
      }));
      const ok = await salvarPeriodos(payloads);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Horários Padrões atualizados!' });
        atualizar();
        setModalPeriodosAberto(false);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar horários padrões.' });
      }
    } catch (e) {
      console.error(e);
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão.' });
    } finally {
      setSalvando(false);
    }
  };

  // Replicar escala inteira do dia para a semana
  const replicarDiaSemana = async () => {
    if (!confirm(`Deseja copiar toda a escala de ${diaSelecionado} para os outros dias da semana (Terça a Sexta)?`)) return;
    setSalvando(true);
    try {
      const escalaOrigem = gradeMonitores.filter(g => g.diaSemana === diaSelecionado);
      
      for (const dia of DIAS_SEMANA) {
        if (dia === diaSelecionado) continue;
        
        // Deleta e reinsere para cada dia
        const payloads = escalaOrigem.map(item => ({
          monitorNome: item.monitorNome,
          diaSemana: dia,
          horarioInicio: item.horarioInicio.slice(0, 5),
          horarioFim: item.horarioFim.slice(0, 5),
          posto: item.posto || 'TÉRREO',
          funcao: item.funcao || 'Monitoria Geral',
          corEtiqueta: item.corEtiqueta || '#3b82f6'
        }));

        // Limpa e salva para cada monitor correspondente
        const nomesMonitores = Array.from(new Set(payloads.map(p => p.monitorNome)));
        for (const nome of nomesMonitores) {
          await limparGradeMonitorDia(nome as string, dia);
        }
        if (payloads.length > 0) {
          await salvarGradeMonitores(payloads);
        }
      }

      setMensagem({ tipo: 'sucesso', texto: 'Escala replicada para a semana inteira!' });
      atualizar();
    } catch (e) {
      console.error(e);
      setMensagem({ tipo: 'erro', texto: 'Erro ao replicar escala.' });
    } finally {
      setSalvando(false);
    }
  };

  // Limpar escala do dia selecionado
  const limparEscalaDia = async () => {
    if (!confirm(`Deseja excluir TODA a escala de monitores do dia ${diaSelecionado}?`)) return;
    setSalvando(true);
    try {
      const nomesMonitores = Array.from(new Set(monitores.map(m => m.nome)));
      for (const nome of nomesMonitores) {
        await limparGradeMonitorDia(nome as string, diaSelecionado);
      }
      setMensagem({ tipo: 'sucesso', texto: 'Escala do dia limpa com sucesso!' });
      atualizar();
    } catch (e) {
      console.error(e);
      setMensagem({ tipo: 'erro', texto: 'Erro ao limpar escala.' });
    } finally {
      setSalvando(false);
    }
  };

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
            <p className="text-on-surface-variant font-medium mt-2 text-sm opacity-60">Planeje e realoque os postos dos monitores clicando nos cartões de horário.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setOrdenacao(ordenacao === 'nome' ? 'local' : 'nome')} 
              className="btn-secondary flex items-center gap-2 text-xs uppercase tracking-wider px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10"
            >
              <span>Filtro: {ordenacao === 'nome' ? 'Por Nome 👤' : 'Por Local 📍'}</span>
            </button>
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

        {/* Tabela de Grid de Cards */}
        <main className="bg-surface-container-lowest rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/40">
                  <th className="py-5 px-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest w-[220px] sticky left-0 bg-[#0a0a0a] z-20 border-r border-white/5">
                    Monitor
                  </th>
                  {periodosMonitoria.map(p => (
                    <th key={p.id} className="py-4 px-3 text-center border-l border-white/5 min-w-[150px]">
                      <div className="text-[10px] font-black text-primary uppercase tracking-wider">{p.nome}</div>
                      <div className="text-[9px] font-black text-white/40 tracking-widest mt-1">
                        {p.horarioInicio.slice(0, 5)} - {p.horarioFim.slice(0, 5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ordenacao === 'local' ? (
                  Array.from({ length: maxLinhasPorLocal }).map((_, rowIndex) => {
                    return (
                      <tr key={rowIndex} className="hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 text-[10px] font-black text-white/20 sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5 text-center min-w-[220px]">
                          #{rowIndex + 1}
                        </td>
                        {periodosMonitoria.map(p => {
                          const turnosPeriodo = (gradeMonitores || [])
                            .filter(g => g.diaSemana === diaSelecionado && g.horarioInicio.slice(0, 5) === p.horarioInicio.slice(0, 5))
                            .sort((a, b) => {
                              const pesoA = obterPesoLocal(a.posto);
                              const pesoB = obterPesoLocal(b.posto);
                              if (pesoA !== pesoB) return pesoA - pesoB;
                              return a.monitorNome.localeCompare(b.monitorNome);
                            });

                          const slot = turnosPeriodo[rowIndex];

                          if (slot) {
                            const mObj = (monitores || []).find(m => m.nome === slot.monitorNome) || { nome: slot.monitorNome, cor: slot.corEtiqueta || '#3b82f6' };
                            const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO' || slot.posto === 'REFEITÓRIO';
                            const blockColor = ehAlmoco ? '#fbbf24' : (slot.corEtiqueta || mObj.cor || '#3b82f6');

                            return (
                              <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                                <button
                                  onClick={() => abrirAlocacao(slot, p)}
                                  className="w-full text-left p-3 rounded-md border transition-all flex flex-col justify-center min-h-[60px] group/card hover:brightness-125"
                                  style={{ 
                                    backgroundColor: `${blockColor}22`,
                                    borderColor: `${blockColor}50`,
                                    borderLeft: `5px solid ${blockColor}`
                                  }}
                                >
                                  <div className="text-[10px] font-black text-white group-hover/card:text-white transition-all truncate uppercase flex items-center gap-1">
                                    {ehAlmoco ? <Coffee size={10} className="text-amber-400 shrink-0" /> : <MapPin size={10} className="shrink-0" style={{ color: blockColor }} />}
                                    {slot.posto}
                                  </div>
                                  <div className="text-[9px] font-bold text-white/90 truncate uppercase mt-0.5">
                                    {slot.monitorNome}
                                  </div>
                                  <div className="text-[8px] font-bold text-white/40 truncate uppercase mt-0.5">
                                    {slot.funcao}
                                  </div>
                                </button>
                              </td>
                            );
                          }

                          if (rowIndex >= turnosPeriodo.length) {
                            return (
                              <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                                <button
                                  onClick={() => abrirAlocacao(null, p)}
                                  className="w-full h-7 border border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.05] rounded-md flex items-center justify-center transition-all group/empty opacity-20 hover:opacity-100"
                                  title="Adicionar Horário"
                                >
                                  <Plus size={11} className="text-white/40 group-hover/empty:text-primary group-hover:rotate-90 transition-all" />
                                </button>
                              </td>
                            );
                          }

                          return (
                            <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                              <div className="min-h-[60px]" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : monitoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={periodosMonitoria.length + 1} className="py-20 text-center opacity-30 italic text-sm">
                      Nenhum monitor cadastrado no sistema.
                    </td>
                  </tr>
                ) : (
                  monitoresOrdenados.map(m => {
                    const cor = mapaCorMonitor[m.nome] || '#3b82f6';
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.01] transition-all">
                        {/* Monitor Profile Cell */}
                        <td className="py-4 px-6 sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5 min-w-[200px]">
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate leading-tight uppercase flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                              {m.nome}
                            </h4>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1 pl-4">
                              {m.tipo} · {m.turno}
                            </p>
                          </div>
                        </td>

                        {/* Slots Columns */}
                        {periodosMonitoria.map(p => {
                          const slot = gradeMonitores.find(
                            g => g.monitorNome === m.nome && 
                                 g.diaSemana === diaSelecionado &&
                                 g.horarioInicio.slice(0, 5) === p.horarioInicio.slice(0, 5)
                          );

                          const ehAlmoco = slot?.funcao === 'ALMOÇO' || slot?.posto === 'ALMOÇO' || slot?.posto === 'REFEITÓRIO';
                          const blockColor = ehAlmoco ? '#fbbf24' : (slot?.corEtiqueta || cor);

                          return (
                            <td key={p.id} className="p-2 border-l border-white/5 text-center align-middle">
                              {slot ? (
                                <button
                                  onClick={() => abrirAlocacao(m, p)}
                                  className="w-full text-left p-3 rounded-md border transition-all flex flex-col justify-center min-h-[60px] group/card hover:brightness-125"
                                  style={{ 
                                    backgroundColor: `${blockColor}22`,
                                    borderColor: `${blockColor}50`,
                                    borderLeft: `5px solid ${blockColor}`
                                  }}
                                >
                                  <div className="text-[10px] font-black text-white group-hover/card:text-white transition-all truncate uppercase flex items-center gap-1">
                                    {ehAlmoco ? <Coffee size={10} className="text-amber-400 shrink-0" /> : <MapPin size={10} className="shrink-0" style={{ color: blockColor }} />}
                                    {slot.posto}
                                  </div>
                                  <div className="text-[8px] font-bold text-white/70 truncate uppercase mt-1">
                                    {slot.funcao}
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={() => abrirAlocacao(m, p)}
                                  className="w-full h-7 border border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.02] rounded-md flex items-center justify-center transition-all group/empty opacity-20 hover:opacity-100"
                                >
                                  <Plus size={11} className="text-white/15 group-hover/empty:text-primary/60 group-hover:rotate-90 transition-all" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                    style={{ backgroundColor: `${alocacaoEditando.monitor.cor || '#3b82f6'}20`, color: alocacaoEditando.monitor.cor || '#3b82f6' }}>
                    {alocacaoEditando.monitor.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">
                      Alocar Turno: {alocacaoEditando.monitor.nome}
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
                {/* Tipo de Turno */}
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
                  <button 
                    type="button"
                    onClick={() => {
                      setAlocacaoEditando({
                        ...alocacaoEditando,
                        tipo: 'servico',
                        posto: 'TÉRREO',
                        funcao: 'Monitoria Geral'
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
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Local / Posto</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <SeletorLocalPosto 
                      value={alocacaoEditando.posto}
                      onChange={val => setAlocacaoEditando({ ...alocacaoEditando, posto: val })}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-3 px-10 text-xs font-bold text-white outline-none focus:border-primary/45 appearance-none cursor-pointer uppercase"
                    />
                  </div>
                </div>

                {/* Função input */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block ml-1">Função / Observação</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <input 
                      type="text" 
                      value={alocacaoEditando.funcao} 
                      placeholder="Ex: Monitoria Geral, Apoio no Portão..."
                      onChange={e => setAlocacaoEditando({ ...alocacaoEditando, funcao: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-10 text-xs font-bold text-white outline-none focus:border-primary/45 placeholder:opacity-20 uppercase" 
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 border-t border-white/5 pt-6 mt-6 shrink-0 justify-between">
                <button 
                  onClick={removerAlocacao}
                  className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-black uppercase text-red-400 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Remover
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={salvarAlocacao}
                    disabled={salvando}
                    className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
                  >
                    {salvando ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                  <button onClick={() => setModalAlocacaoAberto(false)} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                    Cancelar
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIGURAÇÃO DE HORÁRIOS PADRÕES */}
      <AnimatePresence>
        {modalPeriodosAberto && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setModalPeriodosAberto(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-3xl bg-surface-container-lowest border border-white/10 rounded-2xl p-6 md:p-8 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <Settings size={22} className="text-[#a855f7]" />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                      Configurar Distribuição de Horários
                    </h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                      Defina as colunas de horário padrão para a escala de monitoria
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalPeriodosAberto(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
                {periodosEditaveis.length === 0 ? (
                  <div className="py-12 text-center text-white/30 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">
                    Sem horários salvos. Adicione novos horários abaixo.
                  </div>
                ) : (
                  periodosEditaveis.map((p, idx) => (
                    <div key={p.id || idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group">
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
                          className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 px-3 text-xs font-bold text-primary outline-none focus:border-primary/30 uppercase text-white" />
                      </div>

                      {/* Tipo do período */}
                      <div className="shrink-0 w-full sm:w-36">
                        <select
                          value={p.tipo || 'aula'}
                          onChange={e => {
                            const novos = [...periodosEditaveis];
                            novos[idx].tipo = e.target.value as any;
                            setPeriodosEditaveis(novos);
                          }}
                          className="w-full bg-[#121212] border border-white/5 rounded-lg py-1.5 px-2 text-xs font-semibold text-white outline-none cursor-pointer"
                        >
                          <option value="aula">Aula / Turno</option>
                          <option value="intervalo">Intervalo / Recreio</option>
                          <option value="almoco">Almoço</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <button onClick={() => setPeriodosEditaveis(periodosEditaveis.filter((_, i) => i !== idx))} 
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-end sm:self-auto">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}

                <button 
                  onClick={() => setPeriodosEditaveis([...periodosEditaveis, {
                    id: `novo-per-${Date.now()}`,
                    horarioInicio: '08:00',
                    horarioFim: '08:45',
                    nome: 'NOVA AULA / TURNO',
                    segmento: 'monitoria',
                    tipo: 'aula'
                  }])}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Plus size={16} /> Adicionar Novo Período Modelo
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 border-t border-white/5 pt-6 shrink-0 justify-end">
                <button 
                  onClick={salvarPeriodosMonitoria} 
                  disabled={salvando}
                  className="btn-primary px-8 py-3 flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#a855f7' }}
                >
                  {salvando ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {salvando ? "Salvando..." : "Salvar Distribuição"}
                </button>
                <button onClick={() => setModalPeriodosAberto(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                  Cancelar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
