import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, QrCode as QrIcon, FileText, CheckCircle2, Clock, 
  AlertTriangle, Shield, Search, Filter, Download, 
  MapPin, Calendar, Check, X, RefreshCw, ChevronDown, 
  FileCheck, ShieldAlert, ArrowRight, Eye, Edit3, Trash2, Info, 
  ExternalLink, Users, UserCheck, UserX, ShieldCheck, Mail, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { SolicitacaoCFTV, StatusCftv, SolicitanteRecord, StatusSolicitante } from '../types';
import { ModalQRCodeCFTV } from '../components/ModalQRCodeCFTV';
import { gerarPdfSolicitacaoCFTV } from '../lib/cftvPdfGenerator';
import { cftvEmailService } from '../services/cftvEmailService';

export default function GestaoCamerasCFTV() {
  const { user, profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === 'admin' || authProfile?.role === 'super_admin';
  const isSuperAdmin = authProfile?.role === 'super_admin';

  // Abas do Painel ADM: 'chamados' | 'solicitantes'
  const [tabAdm, setTabAdm] = useState<'chamados' | 'solicitantes'>('chamados');

  // Estados dos Chamados
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCFTV[]>([]);
  const [carregandoChamados, setCarregandoChamados] = useState(false);
  const [filtroStatusChamado, setFiltroStatusChamado] = useState<string>('todos');
  const [buscaChamado, setBuscaChamado] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Estados da Lista de Solicitantes (Aprovação Super Admin)
  const [solicitantes, setSolicitantes] = useState<SolicitanteRecord[]>([]);
  const [carregandoSolicitantes, setCarregandoSolicitantes] = useState(false);
  const [filtroStatusSolicitante, setFiltroStatusSolicitante] = useState<string>('todos');
  const [buscaSolicitante, setBuscaSolicitante] = useState<string>('');
  const [processandoAcaoSolicitante, setProcessandoAcaoSolicitante] = useState<string | null>(null);

  // Modal de Análise e Parecer Técnico
  const [solicitacaoEmEdicao, setSolicitacaoEmEdicao] = useState<SolicitacaoCFTV | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusCftv>('Em Espera');
  const [parecerAnalise, setParecerAnalise] = useState('');
  const [camerasAnalisadas, setCamerasAnalisadas] = useState('');
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
  const [notificarEmailSolicitante, setNotificarEmailSolicitante] = useState(true);
  const [salvandoParecer, setSalvandoParecer] = useState(false);

  // Buscar todas as solicitações
  const buscarSolicitacoes = async () => {
    setCarregandoChamados(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações CFTV:', err);
    } finally {
      setCarregandoChamados(false);
    }
  };

  // Buscar todos os solicitantes cadastrados
  const buscarSolicitantes = async () => {
    setCarregandoSolicitantes(true);
    try {
      const { data, error } = await supabase
        .from('solicitantes_cftv')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitantes(data || []);
    } catch (err) {
      console.error('Erro ao carregar solicitantes:', err);
    } finally {
      setCarregandoSolicitantes(false);
    }
  };

  useEffect(() => {
    buscarSolicitacoes();
    buscarSolicitantes();
  }, []);

  // Alterar Status de Aprovação do Solicitante (Super Admin)
  const handleAlterarStatusSolicitante = async (solicitanteId: string, novoStatus: StatusSolicitante) => {
    setProcessandoAcaoSolicitante(solicitanteId);
    try {
      const targetSol = solicitantes.find(s => s.id === solicitanteId);
      const updates = {
        status: novoStatus,
        aprovado_por_nome: authProfile?.full_name || 'Super Admin',
        aprovado_por_id: user?.id || null,
        aprovado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('solicitantes_cftv')
        .update(updates)
        .eq('id', solicitanteId);

      if (error) throw error;

      // Se for aprovado, dispara e-mail de notificação
      if (novoStatus === 'aprovado' && targetSol) {
        await cftvEmailService.notificarAprovacaoSolicitante({
          ...targetSol,
          status: 'aprovado'
        });
      }

      buscarSolicitantes();
    } catch (err: any) {
      alert(`Erro ao alterar status do solicitante: ${err.message}`);
    } finally {
      setProcessandoAcaoSolicitante(null);
    }
  };

  // Excluir Solicitante
  const handleExcluirSolicitante = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover o cadastro de ${nome}?`)) return;
    try {
      const { error } = await supabase
        .from('solicitantes_cftv')
        .delete()
        .eq('id', id);

      if (error) throw error;
      buscarSolicitantes();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // Salvar Parecer / Atualizar Chamado
  const handleSalvarParecer = async () => {
    if (!solicitacaoEmEdicao) return;

    if (novoStatus === 'Cancelado' && !justificativaCancelamento.trim()) {
      alert('Para cancelar a solicitação, informe a justificativa do cancelamento.');
      return;
    }

    setSalvandoParecer(true);
    try {
      const updates: Partial<SolicitacaoCFTV> = {
        status: novoStatus,
        parecer_analise: parecerAnalise.trim() || null,
        cameras_analisadas: camerasAnalisadas.trim() || null,
        justificativa_cancelamento: novoStatus === 'Cancelado' ? justificativaCancelamento.trim() : null,
        analisado_por_nome: authProfile?.full_name || 'Equipe CFTV',
        analisado_por_id: user?.id || null,
        analisado_em: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .update(updates)
        .eq('id', solicitacaoEmEdicao.id)
        .select()
        .single();

      if (error) throw error;

      // Envia devolutiva por e-mail se a opção estiver marcada
      if (notificarEmailSolicitante && data) {
        await cftvEmailService.notificarDevolutivaChamado(data);
      }

      setSolicitacaoEmEdicao(null);
      buscarSolicitacoes();
    } catch (err: any) {
      alert(`Erro ao salvar parecer: ${err.message}`);
    } finally {
      setSalvandoParecer(false);
    }
  };

  // Excluir chamado
  const handleExcluirChamado = async (id: string, protocolo: string) => {
    if (!confirm(`Deseja excluir permanentemente a solicitação ${protocolo}?`)) return;
    try {
      const { error } = await supabase
        .from('solicitacoes_cftv')
        .delete()
        .eq('id', id);

      if (error) throw error;
      buscarSolicitacoes();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // Métricas de Chamados
  const metricasChamados = useMemo(() => {
    const total = solicitacoes.length;
    const emEspera = solicitacoes.filter(s => s.status === 'Em Espera').length;
    const emAnalise = solicitacoes.filter(s => s.status === 'Em Análise').length;
    const atendidos = solicitacoes.filter(s => s.status === 'Atendido' || s.status === 'Finalizado').length;
    const cancelados = solicitacoes.filter(s => s.status === 'Cancelado').length;
    return { total, emEspera, emAnalise, atendidos, cancelados };
  }, [solicitacoes]);

  // Métricas de Solicitantes
  const metricasSolicitantes = useMemo(() => {
    const total = solicitantes.length;
    const pendentes = solicitantes.filter(s => s.status === 'pendente').length;
    const aprovados = solicitantes.filter(s => s.status === 'aprovado').length;
    const bloqueados = solicitantes.filter(s => s.status === 'bloqueado').length;
    return { total, pendentes, aprovados, bloqueados };
  }, [solicitantes]);

  // Lista Filtrada de Chamados
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter(s => {
      if (filtroStatusChamado !== 'todos' && s.status !== filtroStatusChamado) return false;
      if (buscaChamado.trim()) {
        const termo = buscaChamado.toLowerCase();
        const bateProtocolo = s.numero_protocolo?.toLowerCase().includes(termo);
        const bateNome = s.solicitante_nome?.toLowerCase().includes(termo);
        const bateEmail = s.solicitante_email?.toLowerCase().includes(termo);
        const bateLocal = s.ambiente?.toLowerCase().includes(termo);
        const bateAndar = s.andar?.toLowerCase().includes(termo);
        const bateRelato = s.descricao_fatos?.toLowerCase().includes(termo);
        const bateTipo = s.tipo_ocorrencia?.toLowerCase().includes(termo);
        return bateProtocolo || bateNome || bateEmail || bateLocal || bateAndar || bateRelato || bateTipo;
      }
      return true;
    });
  }, [solicitacoes, filtroStatusChamado, buscaChamado]);

  // Lista Filtrada de Solicitantes
  const solicitantesFiltrados = useMemo(() => {
    return solicitantes.filter(s => {
      if (filtroStatusSolicitante !== 'todos' && s.status !== filtroStatusSolicitante) return false;
      if (buscaSolicitante.trim()) {
        const termo = buscaSolicitante.toLowerCase();
        const bateNome = s.nome?.toLowerCase().includes(termo);
        const bateEmail = s.email?.toLowerCase().includes(termo);
        const bateCargo = s.cargo?.toLowerCase().includes(termo);
        return bateNome || bateEmail || bateCargo;
      }
      return true;
    });
  }, [solicitantes, filtroStatusSolicitante, buscaSolicitante]);

  const renderStatusBadge = (status: StatusCftv) => {
    switch (status) {
      case 'Em Espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
            <Clock size={14} className="animate-spin-slow" /> Em Espera
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
            <RefreshCw size={14} className="animate-spin" /> Em Análise
          </span>
        );
      case 'Atendido':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 size={14} /> Atendido / Imagens Localizadas
          </span>
        );
      case 'Finalizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold">
            <FileCheck size={14} /> Finalizado
          </span>
        );
      case 'Cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
            <X size={14} /> Cancelado / Recusado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sub-page-container max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho do Painel Administrativo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-glow-yellow">
              <Camera size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Painel de Gestão e Aprovação de Câmeras (CFTV)
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                Área administrativa para análise de filmagens, aprovação de professores e emissão de pareceres
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/cameras"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-3 !px-4 text-xs font-bold flex items-center gap-1.5"
            title="Abrir o Portal Externo onde os solicitantes preenchem o chamado"
          >
            <ExternalLink size={16} /> Ver Portal Público
          </a>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="btn-primary !py-3 !px-4 text-xs font-bold flex items-center gap-2 shadow-glow-yellow"
          >
            <QrIcon size={18} />
            Gerar QR Code / Cartaz
          </button>
        </div>
      </div>

      {/* Navegação entre Abas do ADM */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setTabAdm('chamados')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all",
            tabAdm === 'chamados'
              ? "bg-primary text-black shadow-glow-yellow"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <Camera size={18} />
          Solicitações de Imagens ({solicitacoes.length})
        </button>

        <button
          onClick={() => setTabAdm('solicitantes')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all relative",
            tabAdm === 'solicitantes'
              ? "bg-primary text-black shadow-glow-yellow"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <Users size={18} />
          Aprovação de Solicitantes ({solicitantes.length})
          {metricasSolicitantes.pendentes > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse ml-1">
              {metricasSolicitantes.pendentes} pendente{metricasSolicitantes.pendentes > 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GESTÃO DE SOLICITAÇÕES DE IMAGENS                                  */}
      {/* ========================================================================= */}
      {tabAdm === 'chamados' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="bg-surface border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
              <p className="text-2xl font-black text-white">{metricasChamados.total}</p>
            </div>

            <div className="bg-surface border border-amber-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Em Espera
              </span>
              <p className="text-2xl font-black text-amber-400">{metricasChamados.emEspera}</p>
            </div>

            <div className="bg-surface border border-blue-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <RefreshCw size={12} /> Em Análise
              </span>
              <p className="text-2xl font-black text-blue-400">{metricasChamados.emAnalise}</p>
            </div>

            <div className="bg-surface border border-emerald-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} /> Atendidos
              </span>
              <p className="text-2xl font-black text-emerald-400">{metricasChamados.atendidos}</p>
            </div>

            <div className="bg-surface border border-red-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <X size={12} /> Cancelados
              </span>
              <p className="text-2xl font-black text-red-400">{metricasChamados.cancelados}</p>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={buscaChamado}
                  onChange={(e) => setBuscaChamado(e.target.value)}
                  placeholder="Buscar por protocolo, solicitante, e-mail, local, relato..."
                  className="campo-input !pl-11 !py-3 text-xs"
                />
              </div>

              <button
                onClick={buscarSolicitacoes}
                className="btn-secondary !py-3 !px-4 text-xs font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={carregandoChamados ? "animate-spin" : ""} />
                Atualizar Chamados
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {['todos', 'Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatusChamado(st)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                    filtroStatusChamado === st
                      ? "bg-primary text-black border-primary font-black shadow-glow-yellow"
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                  )}
                >
                  {st === 'todos' ? 'Todos os Status' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Solicitações */}
          {carregandoChamados ? (
            <div className="text-center py-16 text-zinc-400">
              <RefreshCw size={36} className="animate-spin mx-auto mb-3 text-primary" />
              Carregando solicitações de CFTV...
            </div>
          ) : solicitacoesFiltradas.length === 0 ? (
            <div className="bg-surface border border-white/5 rounded-3xl p-16 text-center text-zinc-400 space-y-3">
              <Camera size={48} className="mx-auto text-zinc-600" />
              <p className="text-base font-bold text-white">Nenhuma solicitação encontrada</p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Não foram encontradas solicitações com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoesFiltradas.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-white/10 rounded-3xl p-6 space-y-5 transition-all hover:border-primary/40 shadow-xl"
                >
                  {/* Header do Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-sm bg-black/60 border border-amber-500/30 px-3 py-1 rounded-xl text-primary">
                        {item.numero_protocolo}
                      </span>
                      {renderStatusBadge(item.status)}
                      <span className="text-xs text-white font-bold">
                        {item.solicitante_nome} ({item.solicitante_cargo})
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {item.solicitante_email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                      <button
                        onClick={() => {
                          setSolicitacaoEmEdicao(item);
                          setNovoStatus(item.status);
                          setParecerAnalise(item.parecer_analise || '');
                          setCamerasAnalisadas(item.cameras_analisadas || '');
                          setJustificativaCancelamento(item.justificativa_cancelamento || '');
                        }}
                        className="btn-primary !py-2 !px-3.5 text-xs flex items-center gap-1.5 shadow-glow-yellow"
                      >
                        <Edit3 size={14} /> Analisar / Parecer
                      </button>

                      <button
                        onClick={() => gerarPdfSolicitacaoCFTV(item)}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                      >
                        <Download size={14} /> PDF
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleExcluirChamado(item.id, item.numero_protocolo)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Informações da Ocorrência */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Local & Andar</span>
                      <p className="text-white font-bold">{item.ambiente} ({item.andar})</p>
                      {item.ponto_referencia && <p className="text-zinc-400 text-[11px]">Ref: {item.ponto_referencia}</p>}
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Data & Horário</span>
                      <p className="text-white font-bold">
                        {item.data_fato ? new Date(item.data_fato + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'}
                      </p>
                      <p className="text-zinc-400 text-[11px] font-mono">
                        {item.horario_inicio} às {item.horario_termino} ({item.tipo_intervalo})
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Classificação</span>
                      <p className="text-white font-bold">{item.tipo_ocorrencia}</p>
                      <p className="text-zinc-400 text-[11px] truncate">Finalidade: {item.motivo_solicitacao}</p>
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Envolvidos & Objetos</span>
                      <p className="text-zinc-300 text-[11px] truncate">
                        {item.envolvidos_nomes_turmas || 'Não informados'}
                      </p>
                      {item.envolvidos_caracteristicas && (
                        <p className="text-zinc-400 text-[10px] truncate">Visuais: {item.envolvidos_caracteristicas}</p>
                      )}
                    </div>
                  </div>

                  {/* Relato */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-xs text-zinc-300 space-y-1">
                    <span className="text-zinc-400 font-bold block text-[11px]">Relato do Solicitante:</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{item.descricao_fatos}</p>
                  </div>

                  {/* Parecer Registrado */}
                  {item.parecer_analise && (
                    <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl text-xs space-y-1 text-blue-200">
                      <span className="font-bold text-blue-300 block text-[11px]">
                        Parecer da Equipe CFTV ({item.analisado_por_nome || 'Operador'}):
                      </span>
                      {item.cameras_analisadas && (
                        <p className="text-[11px] text-zinc-300"><strong>Câmeras Analisadas:</strong> {item.cameras_analisadas}</p>
                      )}
                      <p className="whitespace-pre-wrap">{item.parecer_analise}</p>
                    </div>
                  )}

                  {item.status === 'Cancelado' && item.justificativa_cancelamento && (
                    <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-2xl text-xs space-y-1 text-red-200">
                      <span className="font-bold text-red-300 block text-[11px]">Justificativa do Cancelamento:</span>
                      <p className="whitespace-pre-wrap">{item.justificativa_cancelamento}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: APROVAÇÃO DE SOLICITANTES (SUPER ADMIN)                           */}
      {/* ========================================================================= */}
      {tabAdm === 'solicitantes' && (
        <div className="space-y-6">
          {/* Métricas de Solicitantes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total de Solicitantes</span>
              <p className="text-2xl font-black text-white">{metricasSolicitantes.total}</p>
            </div>

            <div className="bg-surface border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Aguardando Aprovação
              </span>
              <p className="text-2xl font-black text-amber-400">{metricasSolicitantes.pendentes}</p>
            </div>

            <div className="bg-surface border border-emerald-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck size={12} /> Aprovados
              </span>
              <p className="text-2xl font-black text-emerald-400">{metricasSolicitantes.aprovados}</p>
            </div>

            <div className="bg-surface border border-red-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <UserX size={12} /> Bloqueados
              </span>
              <p className="text-2xl font-black text-red-400">{metricasSolicitantes.bloqueados}</p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={buscaSolicitante}
                  onChange={(e) => setBuscaSolicitante(e.target.value)}
                  placeholder="Buscar por nome do professor, cargo ou e-mail institucional..."
                  className="campo-input !pl-11 !py-3 text-xs"
                />
              </div>

              <button
                onClick={buscarSolicitantes}
                className="btn-secondary !py-3 !px-4 text-xs font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={carregandoSolicitantes ? "animate-spin" : ""} />
                Atualizar Lista
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'todos', rotulo: 'Todos' },
                { id: 'pendente', rotulo: 'Pendentes' },
                { id: 'aprovado', rotulo: 'Aprovados' },
                { id: 'bloqueado', rotulo: 'Bloqueados' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFiltroStatusSolicitante(item.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                    filtroStatusSolicitante === item.id
                      ? "bg-primary text-black border-primary font-black shadow-glow-yellow"
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                  )}
                >
                  {item.rotulo}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela / Cards de Solicitantes */}
          {carregandoSolicitantes ? (
            <div className="text-center py-16 text-zinc-400">
              <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-primary" />
              Carregando lista de solicitantes...
            </div>
          ) : solicitantesFiltrados.length === 0 ? (
            <div className="bg-surface border border-white/5 rounded-3xl p-16 text-center text-zinc-400 space-y-3">
              <Users size={48} className="mx-auto text-zinc-600" />
              <p className="text-base font-bold text-white">Nenhum solicitante cadastrado</p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Quando professores e colaboradores solicitarem acesso via e-mail no portal de câmeras, eles aparecerão aqui para liberação do Super Admin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitantesFiltrados.map((sol) => (
                <div
                  key={sol.id}
                  className="bg-surface border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary/40 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-base shrink-0",
                      sol.status === 'aprovado' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      sol.status === 'pendente' ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    )}>
                      {sol.nome?.charAt(0) || 'U'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white">{sol.nome}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {sol.cargo}
                        </span>
                        {sol.status === 'aprovado' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Check size={12} /> Aprovado
                          </span>
                        )}
                        {sol.status === 'pendente' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Clock size={12} /> Pendente
                          </span>
                        )}
                        {sol.status === 'bloqueado' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                            <X size={12} /> Bloqueado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                        <span className="font-mono text-zinc-300">{sol.email}</span>
                        <span>•</span>
                        <span>Cadastrado em {new Date(sol.created_at).toLocaleDateString('pt-BR')}</span>
                        {sol.aprovado_por_nome && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">Aprovado por: {sol.aprovado_por_nome}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Super Admin */}
                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    {sol.status !== 'aprovado' && (
                      <button
                        onClick={() => handleAlterarStatusSolicitante(sol.id, 'aprovado')}
                        disabled={processandoAcaoSolicitante === sol.id}
                        className="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5 shadow-glow-yellow"
                      >
                        <UserCheck size={14} />
                        {processandoAcaoSolicitante === sol.id ? 'Aprovando...' : 'Aprovar Acesso'}
                      </button>
                    )}

                    {sol.status !== 'bloqueado' && (
                      <button
                        onClick={() => handleAlterarStatusSolicitante(sol.id, 'bloqueado')}
                        disabled={processandoAcaoSolicitante === sol.id}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 text-zinc-300 hover:text-red-400"
                        title="Bloquear solicitante"
                      >
                        <UserX size={14} /> Bloquear
                      </button>
                    )}

                    {sol.status === 'bloqueado' && (
                      <button
                        onClick={() => handleAlterarStatusSolicitante(sol.id, 'pendente')}
                        disabled={processandoAcaoSolicitante === sol.id}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 text-zinc-300"
                        title="Voltar para análise pendente"
                      >
                        <Clock size={14} /> Reavaliar
                      </button>
                    )}

                    <button
                      onClick={() => handleExcluirSolicitante(sol.id, sol.nome)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Excluir cadastro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ANÁLISE E PARECER TÉCNICO COM DEVOLUTIVA POR E-MAIL              */}
      {/* ========================================================================= */}
      {solicitacaoEmEdicao && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 my-8"
            >
              {/* Header do Modal */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Análise e Parecer Técnico CFTV</h2>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {solicitacaoEmEdicao.numero_protocolo} • Solicitante: {solicitacaoEmEdicao.solicitante_nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSolicitacaoEmEdicao(null)}
                  className="p-2 text-on-surface-variant hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Status da Solicitação *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {(['Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'] as StatusCftv[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNovoStatus(st)}
                      className={cn(
                        "py-3 px-2 rounded-2xl text-xs font-bold border transition-all text-center",
                        novoStatus === st
                          ? "bg-primary text-black border-primary shadow-glow-yellow font-black"
                          : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Câmeras Analisadas */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Câmeras Analisadas
                </label>
                <input
                  type="text"
                  value={camerasAnalisadas}
                  onChange={(e) => setCamerasAnalisadas(e.target.value)}
                  placeholder="Ex: CAM-04 Pátio Central, CAM-08 Corredor Bloco B"
                  className="campo-input"
                />
              </div>

              {/* Parecer da Análise */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Parecer Técnico / Resposta para o Solicitante
                </label>
                <textarea
                  rows={4}
                  value={parecerAnalise}
                  onChange={(e) => setParecerAnalise(e.target.value)}
                  placeholder="Ex: Imagens localizadas na câmera 04 entre 08:15 e 08:22. Gravação exportada e salva no diretório de segurança..."
                  className="campo-input text-xs leading-relaxed"
                />
              </div>

              {/* Justificativa de Cancelamento se Cancelado */}
              {novoStatus === 'Cancelado' && (
                <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-red-300 uppercase tracking-wider">
                    Justificativa do Cancelamento / Recusa *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={justificativaCancelamento}
                    onChange={(e) => setJustificativaCancelamento(e.target.value)}
                    placeholder="Ex: Horário muito amplo e sem movimentação no local indicado. Solicitação cancelada por falta de precisão..."
                    className="campo-input text-xs leading-relaxed !border-red-500/40"
                  />
                </div>
              )}

              {/* Checkbox Devolutiva por E-mail */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span className="text-xs text-white font-bold">
                    Enviar Devolutiva Automática por E-mail
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificarEmailSolicitante}
                  onChange={(e) => setNotificarEmailSolicitante(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setSolicitacaoEmEdicao(null)}
                  className="btn-secondary !py-2.5 !px-5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarParecer}
                  disabled={salvandoParecer}
                  className="btn-primary !py-2.5 !px-6 text-xs flex items-center gap-2 shadow-glow-yellow"
                >
                  {salvandoParecer ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar Parecer e Devolutiva
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Modal QR Code */}
      <ModalQRCodeCFTV
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
