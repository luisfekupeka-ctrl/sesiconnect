import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, QrCode as QrIcon, FileText, CheckCircle2, Clock, 
  AlertTriangle, Shield, Search, Filter, Download, 
  MapPin, Calendar, Check, X, RefreshCw, ChevronDown, ChevronUp,
  FileCheck, ShieldAlert, ArrowRight, Eye, Edit3, Trash2, Info, 
  ExternalLink, Users, UserCheck, UserX, ShieldCheck, Mail, Send,
  Copy, CheckCheck, Sparkles, MessageSquare, AlertCircle, Building2,
  Share2, CornerDownRight, User, Hash, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { SolicitacaoCFTV, StatusCftv, SolicitanteRecord, StatusSolicitante } from '../types';
import { ModalQRCodeCFTV } from '../components/ModalQRCodeCFTV';
import { gerarPdfSolicitacaoCFTV } from '../lib/cftvPdfGenerator';
import { cftvEmailService } from '../services/cftvEmailService';

// Sugestões rápidas de Câmeras para preenchimento ágil
const SUGESTOES_CAMERAS = [
  'CAM-01 Portaria Principal',
  'CAM-02 Pátio Central',
  'CAM-03 Corredor Bloco A',
  'CAM-04 Corredor Bloco B',
  'CAM-05 Refeitório / Cantina',
  'CAM-06 Quadra Poliesportiva',
  'CAM-07 Estacionamento',
  'CAM-08 Biblioteca'
];

// Modelos rápidos de Parecer Técnico
const TEMPLATES_PARECER = [
  {
    rotulo: 'Imagens Localizadas e Arquivadas',
    status: 'Atendido' as StatusCftv,
    texto: 'Imagens localizadas e analisadas com sucesso. A gravação do período indicado foi exportada e armazenada no diretório seguro de vigilância escolar.'
  },
  {
    rotulo: 'Fatos Confirmados - Encaminhado à Direção',
    status: 'Atendido' as StatusCftv,
    texto: 'Imagens analisadas. Foi constatada a ocorrência relatada com identificação dos envolvidos. O material foi formalmente encaminhado à Coordenação e Direção.'
  },
  {
    rotulo: 'Sem Movimentação Anormal no Período',
    status: 'Finalizado' as StatusCftv,
    texto: 'Após análise detalhada das câmeras do local no intervalo indicado, não foram constatadas movimentações anormais ou atos compatíveis com o relato.'
  },
  {
    rotulo: 'Ponto Cego / Sem Cobertura Direta',
    status: 'Finalizado' as StatusCftv,
    texto: 'As câmeras do setor não cobrem o ângulo exato do fato relatado (ponto cego/obstrução visual). Não foi possível obter imagens conclusivas.'
  },
  {
    rotulo: 'Intervalo Excessivo / Falta de Precisão',
    status: 'Cancelado' as StatusCftv,
    texto: 'Solicitação cancelada devido à imprecisão de horário e local. Solicita-se nova abertura delimitando o intervalo para até 1 hora.'
  }
];

export default function GestaoCamerasCFTV() {
  const { user, profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === 'admin' || authProfile?.role === 'super_admin';
  const isSuperAdmin = authProfile?.role === 'super_admin';

  // Abas do Painel ADM: 'chamados' | 'devolutivas' | 'solicitantes'
  const [tabAdm, setTabAdm] = useState<'chamados' | 'devolutivas' | 'solicitantes'>('chamados');

  // Estados dos Chamados
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCFTV[]>([]);
  const [carregandoChamados, setCarregandoChamados] = useState(false);
  const [filtroStatusChamado, setFiltroStatusChamado] = useState<string>('todos');
  const [filtroDevolutiva, setFiltroDevolutiva] = useState<'todos' | 'com_devolutiva' | 'sem_devolutiva'>('todos');
  const [buscaChamado, setBuscaChamado] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiadoProtocolo, setCopiadoProtocolo] = useState<string | null>(null);

  // Estados da Lista de Solicitantes (Aprovação Super Admin)
  const [solicitantes, setSolicitantes] = useState<SolicitanteRecord[]>([]);
  const [carregandoSolicitantes, setCarregandoSolicitantes] = useState(false);
  const [filtroStatusSolicitante, setFiltroStatusSolicitante] = useState<string>('todos');
  const [buscaSolicitante, setBuscaSolicitante] = useState<string>('');
  const [processandoAcaoSolicitante, setProcessandoAcaoSolicitante] = useState<string | null>(null);

  // Modal de Detalhes da Solicitação (Visualização Completa)
  const [solicitacaoDetalhes, setSolicitacaoDetalhes] = useState<SolicitacaoCFTV | null>(null);

  // Modal de Análise e Parecer Técnico com 2 Abas
  const [solicitacaoEmEdicao, setSolicitacaoEmEdicao] = useState<SolicitacaoCFTV | null>(null);
  const [tabModal, setTabModal] = useState<'parecer' | 'email'>('parecer');
  const [novoStatus, setNovoStatus] = useState<StatusCftv>('Em Espera');
  const [parecerAnalise, setParecerAnalise] = useState('');
  const [camerasAnalisadas, setCamerasAnalisadas] = useState('');
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
  const [assuntoEmail, setAssuntoEmail] = useState('');
  const [mensagemEmailCustom, setMensagemEmailCustom] = useState('');
  const [notificarEmailSolicitante, setNotificarEmailSolicitante] = useState(true);
  const [salvandoParecer, setSalvandoParecer] = useState(false);
  const [enviandoEmailAvulso, setEnviandoEmailAvulso] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState<string | null>(null);

  // Relato expandido por card
  const [relatosExpandidos, setRelatosExpandidos] = useState<Record<string, boolean>>({});

  const toggleExpandirRelato = (id: string) => {
    setRelatosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopiarProtocolo = (protocolo: string) => {
    navigator.clipboard.writeText(protocolo);
    setCopiadoProtocolo(protocolo);
    setTimeout(() => setCopiadoProtocolo(null), 2000);
  };

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

  // Abrir Modal de Edição/Parecer
  const abrirModalAnalise = (item: SolicitacaoCFTV, abaInicial: 'parecer' | 'email' = 'parecer') => {
    setSolicitacaoEmEdicao(item);
    setTabModal(abaInicial);
    setNovoStatus(item.status);
    setParecerAnalise(item.parecer_analise || '');
    setCamerasAnalisadas(item.cameras_analisadas || '');
    setJustificativaCancelamento(item.justificativa_cancelamento || '');
    setAssuntoEmail(`[SESI CFTV] Atualização da Solicitação ${item.numero_protocolo} - Status: ${item.status}`);
    setMensagemEmailCustom('');
    setFeedbackEmail(null);
  };

  // Atualiza o assunto do e-mail automaticamente quando muda o status
  useEffect(() => {
    if (solicitacaoEmEdicao) {
      setAssuntoEmail(`[SESI CFTV] Atualização da Solicitação ${solicitacaoEmEdicao.numero_protocolo} - Status: ${novoStatus}`);
    }
  }, [novoStatus, solicitacaoEmEdicao]);

  // Alterar Status de Aprovação do Solicitante (Admin / Super Admin)
  const handleAlterarStatusSolicitante = async (solicitanteId: string, novoStatusSol: StatusSolicitante) => {
    setProcessandoAcaoSolicitante(solicitanteId);
    try {
      const targetSol = solicitantes.find(s => s.id === solicitanteId);
      const updates = {
        status: novoStatusSol,
        aprovado_por_nome: authProfile?.full_name || 'Administrador',
        aprovado_por_id: user?.id || null,
        aprovado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('solicitantes_cftv')
        .update(updates)
        .eq('id', solicitanteId);

      if (error) throw error;

      // Dispara e-mail de notificação de forma assíncrona e segura
      if (novoStatusSol === 'aprovado' && targetSol) {
        try {
          await cftvEmailService.notificarAprovacaoSolicitante({
            ...targetSol,
            status: 'aprovado'
          });
        } catch (mailErr) {
          console.warn('Aviso ao disparar e-mail de aprovação:', mailErr);
        }
      }

      await buscarSolicitantes();
      alert(`✅ Solicitante ${targetSol?.nome || ''} foi ${novoStatusSol === 'aprovado' ? 'APROVADO' : novoStatusSol === 'bloqueado' ? 'BLOQUEADO' : 'redefinido para PENDENTE'} com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
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
        analisado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Se marcada a opção de e-mail, registra a devolutiva
      if (notificarEmailSolicitante) {
        updates.devolutiva_enviada_em = new Date().toISOString();
        updates.devolutiva_enviada_por = authProfile?.full_name || 'Equipe CFTV';
      }

      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .update(updates)
        .eq('id', solicitacaoEmEdicao.id)
        .select()
        .single();

      if (error) throw error;

      // Envia devolutiva por e-mail se a opção estiver marcada
      if (notificarEmailSolicitante && data) {
        await cftvEmailService.notificarDevolutivaChamado({
          ...data,
          parecer_analise: parecerAnalise.trim() || undefined,
          justificativa_cancelamento: justificativaCancelamento.trim() || undefined
        });
      }

      setSolicitacaoEmEdicao(null);
      buscarSolicitacoes();
    } catch (err: any) {
      alert(`Erro ao salvar parecer: ${err.message}`);
    } finally {
      setSalvandoParecer(false);
    }
  };

  // Enviar Devolutiva por E-mail Avulsa (da aba 2 do modal)
  const handleEnviarDevolutivaEmailDireto = async () => {
    if (!solicitacaoEmEdicao) return;

    setEnviandoEmailAvulso(true);
    setFeedbackEmail(null);
    try {
      // 1. Atualiza registro com timestamp da devolutiva
      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .update({
          status: novoStatus,
          parecer_analise: parecerAnalise.trim() || solicitacaoEmEdicao.parecer_analise,
          cameras_analisadas: camerasAnalisadas.trim() || solicitacaoEmEdicao.cameras_analisadas,
          justificativa_cancelamento: novoStatus === 'Cancelado' ? justificativaCancelamento.trim() : null,
          devolutiva_enviada_em: new Date().toISOString(),
          devolutiva_enviada_por: authProfile?.full_name || 'Equipe CFTV',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoEmEdicao.id)
        .select()
        .single();

      if (error) throw error;

      // 2. Dispara e-mail via serviço
      await cftvEmailService.notificarDevolutivaChamado({
        ...data,
        parecer_analise: (parecerAnalise.trim() || solicitacaoEmEdicao.parecer_analise || '') + (mensagemEmailCustom ? `\n\n[Mensagem Adicional]: ${mensagemEmailCustom}` : '')
      });

      setFeedbackEmail('✅ E-mail de devolutiva enviado com sucesso para ' + solicitacaoEmEdicao.solicitante_email);
      buscarSolicitacoes();
      setTimeout(() => {
        setSolicitacaoEmEdicao(null);
      }, 1800);
    } catch (err: any) {
      setFeedbackEmail('❌ Erro ao enviar e-mail: ' + err.message);
    } finally {
      setEnviandoEmailAvulso(false);
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
    const comDevolutiva = solicitacoes.filter(s => !!s.devolutiva_enviada_em).length;
    const pendenteDevolutiva = solicitacoes.filter(s => (s.status === 'Atendido' || s.status === 'Finalizado' || s.status === 'Cancelado') && !s.devolutiva_enviada_em).length;
    return { total, emEspera, emAnalise, atendidos, cancelados, comDevolutiva, pendenteDevolutiva };
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
      if (filtroDevolutiva === 'com_devolutiva' && !s.devolutiva_enviada_em) return false;
      if (filtroDevolutiva === 'sem_devolutiva' && s.devolutiva_enviada_em) return false;
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
  }, [solicitacoes, filtroStatusChamado, filtroDevolutiva, buscaChamado]);

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
            <Clock size={13} className="animate-spin-slow text-amber-400" /> Em Espera
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
            <RefreshCw size={13} className="animate-spin text-blue-400" /> Em Análise
          </span>
        );
      case 'Atendido':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 size={13} className="text-emerald-400" /> Atendido
          </span>
        );
      case 'Finalizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold">
            <FileCheck size={13} className="text-purple-400" /> Finalizado
          </span>
        );
      case 'Cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
            <X size={13} className="text-red-400" /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sub-page-container max-w-7xl mx-auto space-y-6 pb-20">
      {/* Cabeçalho do Painel Administrativo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-glow-yellow">
              <Camera size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Painel de Gestão e Análise de Câmeras (CFTV)
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                Triagem de ocorrências, laudos técnicos, aprovação de professores e devolutivas por e-mail
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/cameras"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2.5 !px-4 text-xs font-bold flex items-center gap-1.5"
            title="Abrir o Portal Externo onde os solicitantes preenchem o chamado"
          >
            <ExternalLink size={15} /> Ver Portal do Solicitante
          </a>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="btn-primary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 shadow-glow-yellow"
          >
            <QrIcon size={16} />
            Gerar QR Code / Cartaz
          </button>
        </div>
      </div>

      {/* Navegação entre Abas do ADM */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setTabAdm('chamados')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
            tabAdm === 'chamados'
              ? "bg-primary text-black shadow-glow-yellow font-black"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <Camera size={18} />
          Solicitações de Imagens ({solicitacoes.length})
        </button>

        <button
          onClick={() => setTabAdm('devolutivas')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap relative",
            tabAdm === 'devolutivas'
              ? "bg-primary text-black shadow-glow-yellow font-black"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <Mail size={18} />
          Central de Devolutivas por E-mail
          {metricasChamados.pendenteDevolutiva > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse ml-1">
              {metricasChamados.pendenteDevolutiva} pendente{metricasChamados.pendenteDevolutiva > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setTabAdm('solicitantes')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap relative",
              tabAdm === 'solicitantes'
                ? "bg-primary text-black shadow-glow-yellow font-black"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GESTÃO DE SOLICITAÇÕES DE IMAGENS                                  */}
      {/* ========================================================================= */}
      {tabAdm === 'chamados' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="bg-surface border border-white/10 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
              <p className="text-2xl font-black text-white">{metricasChamados.total}</p>
            </div>

            <div className="bg-surface border border-amber-500/20 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Em Espera
              </span>
              <p className="text-2xl font-black text-amber-400">{metricasChamados.emEspera}</p>
            </div>

            <div className="bg-surface border border-blue-500/20 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <RefreshCw size={12} /> Em Análise
              </span>
              <p className="text-2xl font-black text-blue-400">{metricasChamados.emAnalise}</p>
            </div>

            <div className="bg-surface border border-emerald-500/20 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} /> Atendidos
              </span>
              <p className="text-2xl font-black text-emerald-400">{metricasChamados.atendidos}</p>
            </div>

            <div className="bg-surface border border-red-500/20 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <X size={12} /> Cancelados
              </span>
              <p className="text-2xl font-black text-red-400">{metricasChamados.cancelados}</p>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="bg-surface border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                Atualizar Lista
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {['todos', 'Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatusChamado(st)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
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

          {/* Lista de Solicitações (Design Aprimorado) */}
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
                Não foram encontradas solicitações com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoesFiltradas.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 transition-all hover:border-primary/40 shadow-xl"
                >
                  {/* Header do Card com Destaques Visuais */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => handleCopiarProtocolo(item.numero_protocolo)}
                        className="font-mono font-black text-xs sm:text-sm bg-black/80 border border-amber-500/30 px-3 py-1.5 rounded-xl text-primary flex items-center gap-1.5 hover:bg-amber-500/10 transition-colors"
                        title="Clique para copiar protocolo"
                      >
                        {copiadoProtocolo === item.numero_protocolo ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {item.numero_protocolo}
                      </button>

                      {renderStatusBadge(item.status)}

                      {/* Devolutiva Badge */}
                      {item.devolutiva_enviada_em ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={`Devolutiva enviada em ${new Date(item.devolutiva_enviada_em).toLocaleString('pt-BR')}`}>
                          <Mail size={12} /> Devolutiva Enviada
                        </span>
                      ) : (item.status === 'Atendido' || item.status === 'Finalizado' || item.status === 'Cancelado') ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          <Mail size={12} /> Pendente Devolutiva
                        </span>
                      ) : null}

                      {/* Solicitante */}
                      <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-xl border border-white/5 text-xs text-white">
                        <User size={13} className="text-amber-400" />
                        <span className="font-bold">{item.solicitante_nome}</span>
                        <span className="text-zinc-400 text-[11px]">({item.solicitante_cargo})</span>
                        <a href={`mailto:${item.solicitante_email}`} className="text-zinc-400 hover:text-white font-mono text-[11px] ml-1">
                          &lt;{item.solicitante_email}&gt;
                        </a>
                      </div>
                    </div>

                    {/* Ações do Card */}
                    <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
                      <button
                        onClick={() => abrirModalAnalise(item, 'parecer')}
                        className="btn-primary !py-2 !px-3.5 text-xs flex items-center gap-1.5 shadow-glow-yellow font-bold"
                      >
                        <Edit3 size={14} /> Analisar / Parecer
                      </button>

                      <button
                        onClick={() => abrirModalAnalise(item, 'email')}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 hover:text-amber-400 font-bold"
                        title="Enviar ou rever devolutiva por e-mail"
                      >
                        <Mail size={14} /> Devolutiva E-mail
                      </button>

                      <button
                        onClick={() => setSolicitacaoDetalhes(item)}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 text-zinc-300 hover:text-white"
                        title="Visualizar ficha cadastral completa da solicitação"
                      >
                        <Eye size={14} /> Ficha Completa
                      </button>

                      <button
                        onClick={() => gerarPdfSolicitacaoCFTV(item)}
                        className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                        title="Baixar Laudo Oficial em PDF"
                      >
                        <Download size={14} /> PDF
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleExcluirChamado(item.id, item.numero_protocolo)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Excluir solicitação"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid de 4 Blocos de Informações Detalhadas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Bloco 1: Local & Andar */}
                    <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <MapPin size={12} className="text-amber-400" />
                          <span>Local & Andar</span>
                        </div>
                        <p className="text-white font-black text-sm">
                          {item.ambiente}
                        </p>
                        <p className="text-amber-400 text-xs font-semibold">
                          Andar: {item.andar}
                        </p>
                      </div>
                      {item.ponto_referencia && (
                        <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-300">
                          <span className="text-zinc-500 font-bold">Ref:</span> {item.ponto_referencia}
                        </div>
                      )}
                    </div>

                    {/* Bloco 2: Data & Horário */}
                    <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Calendar size={12} className="text-primary" />
                          <span>Data & Horário</span>
                        </div>
                        <p className="text-white font-black text-sm">
                          {item.data_fato ? new Date(item.data_fato + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'}
                        </p>
                        <p className="text-zinc-200 font-mono text-xs font-bold">
                          {item.horario_inicio} às {item.horario_termino}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Intervalo:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          item.tipo_intervalo === 'Exato' ? "bg-emerald-500/20 text-emerald-300" :
                          item.tipo_intervalo === 'Aproximado' ? "bg-blue-500/20 text-blue-300" :
                          "bg-amber-500/20 text-amber-300"
                        )}>
                          {item.tipo_intervalo}
                        </span>
                      </div>
                    </div>

                    {/* Bloco 3: Classificação & Finalidade */}
                    <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <ShieldAlert size={12} className="text-amber-400" />
                          <span>Classificação</span>
                        </div>
                        <p className="text-white font-black text-xs leading-tight">
                          {item.tipo_ocorrencia}
                          {item.tipo_ocorrencia_outro && <span className="text-zinc-400 block font-normal">({item.tipo_ocorrencia_outro})</span>}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-300">
                        <span className="text-zinc-500 font-bold block text-[10px]">Finalidade:</span>
                        <span className="text-zinc-300 line-clamp-2">{item.motivo_solicitacao}</span>
                      </div>
                    </div>

                    {/* Bloco 4: Envolvidos & Deslocamento */}
                    <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Users size={12} className="text-blue-400" />
                          <span>Envolvidos & Objetos</span>
                        </div>
                        <p className="text-zinc-200 text-xs font-bold truncate">
                          {item.envolvidos_nomes_turmas || 'Turmas/nomes não informados'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-zinc-300">
                        {item.envolvidos_caracteristicas && (
                          <p className="text-zinc-400 truncate text-[10px]">
                            <strong className="text-zinc-500">Visuais:</strong> {item.envolvidos_caracteristicas}
                          </p>
                        )}
                        {item.envolvidos_sentido_fuga && (
                          <p className="text-zinc-400 truncate text-[10px]">
                            <strong className="text-zinc-500">Sentido:</strong> {item.envolvidos_sentido_fuga}
                          </p>
                        )}
                        {item.objetos_envolvidos && (
                          <p className="text-zinc-400 truncate text-[10px]">
                            <strong className="text-zinc-500">Bens:</strong> {item.objetos_envolvidos}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relato do Solicitante */}
                  <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-xs text-zinc-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-bold flex items-center gap-1.5 text-[11px]">
                        <MessageSquare size={13} className="text-amber-400" /> Relato Detalhado do Solicitante:
                      </span>
                      {item.descricao_fatos.length > 200 && (
                        <button
                          onClick={() => toggleExpandirRelato(item.id)}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold"
                        >
                          {relatosExpandidos[item.id] ? (
                            <>Recolher <ChevronUp size={12} /></>
                          ) : (
                            <>Ver completo <ChevronDown size={12} /></>
                          )}
                        </button>
                      )}
                    </div>
                    <p className={cn(
                      "leading-relaxed whitespace-pre-wrap font-sans text-zinc-200",
                      !relatosExpandidos[item.id] && item.descricao_fatos.length > 200 && "line-clamp-3"
                    )}>
                      "{item.descricao_fatos}"
                    </p>
                  </div>

                  {/* Parecer Técnico e Câmeras Analisadas */}
                  {item.parecer_analise && (
                    <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-2xl text-xs space-y-2 text-blue-200">
                      <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                        <span className="font-bold text-blue-300 flex items-center gap-1.5 text-xs">
                          <ShieldCheck size={15} className="text-blue-400" /> Parecer Técnico ({item.analisado_por_nome || 'Equipe CFTV'})
                        </span>
                        {item.analisado_em && (
                          <span className="text-[10px] text-blue-300/80 font-mono">
                            {new Date(item.analisado_em).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {item.cameras_analisadas && (
                        <p className="text-xs text-blue-300 font-medium">
                          <strong>Câmeras Verificadas:</strong> {item.cameras_analisadas}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-zinc-200 leading-relaxed">{item.parecer_analise}</p>
                    </div>
                  )}

                  {/* Justificativa de Cancelamento */}
                  {item.status === 'Cancelado' && item.justificativa_cancelamento && (
                    <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-2xl text-xs space-y-1.5 text-red-200">
                      <span className="font-bold text-red-300 flex items-center gap-1 text-[11px]">
                        <AlertTriangle size={13} className="text-red-400" /> Justificativa do Cancelamento / Recusa:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed">{item.justificativa_cancelamento}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CENTRAL DE DEVOLUTIVAS POR E-MAIL                                   */}
      {/* ========================================================================= */}
      {tabAdm === 'devolutivas' && (
        <div className="space-y-6">
          {/* Métricas de Devolutivas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chamados Concluídos / Atendidos</span>
              <p className="text-2xl font-black text-white">{metricasChamados.atendidos + metricasChamados.cancelados}</p>
            </div>

            <div className="bg-surface border border-emerald-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Devolutivas Enviadas por E-mail
              </span>
              <p className="text-2xl font-black text-emerald-400">{metricasChamados.comDevolutiva}</p>
            </div>

            <div className="bg-surface border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={14} /> Pendentes de Envio de E-mail
              </span>
              <p className="text-2xl font-black text-amber-400">{metricasChamados.pendenteDevolutiva}</p>
            </div>
          </div>

          {/* Filtro Rápido de Devolutivas */}
          <div className="bg-surface border border-white/10 rounded-3xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-400 uppercase mr-2">Filtrar:</span>
              {[
                { id: 'todos', label: 'Todos os Chamados' },
                { id: 'sem_devolutiva', label: '⚠️ Pendentes de Envio de E-mail' },
                { id: 'com_devolutiva', label: '✅ Devolutivas Já Enviadas' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltroDevolutiva(f.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                    filtroDevolutiva === f.id
                      ? "bg-primary text-black border-primary font-black shadow-glow-yellow"
                      : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={buscarSolicitacoes}
              className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw size={14} className={carregandoChamados ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          {/* Lista de Chamados para Devolutiva */}
          <div className="space-y-4">
            {solicitacoesFiltradas.map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-white/10 rounded-3xl p-5 md:p-6 space-y-4 hover:border-primary/40 transition-all shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-black text-sm bg-black/80 border border-amber-500/30 px-3 py-1 rounded-xl text-primary">
                      {item.numero_protocolo}
                    </span>
                    {renderStatusBadge(item.status)}
                    <span className="text-xs text-white font-bold">{item.solicitante_nome}</span>
                    <span className="text-xs text-zinc-400 font-mono">&lt;{item.solicitante_email}&gt;</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirModalAnalise(item, 'email')}
                      className="btn-primary !py-2 !px-4 text-xs font-black flex items-center gap-1.5 shadow-glow-yellow"
                    >
                      <Mail size={14} />
                      {item.devolutiva_enviada_em ? 'Reenviar Devolutiva' : 'Compor e Enviar Devolutiva'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-zinc-500 uppercase font-bold text-[10px] block">Ocorrência</span>
                    <p className="text-white font-bold">{item.tipo_ocorrencia}</p>
                    <p className="text-zinc-400 text-[11px]">{item.ambiente} ({item.andar})</p>
                  </div>

                  <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-zinc-500 uppercase font-bold text-[10px] block">Data e Horário do Fato</span>
                    <p className="text-white font-bold">{item.data_fato}</p>
                    <p className="text-zinc-400 text-[11px] font-mono">{item.horario_inicio} às {item.horario_termino}</p>
                  </div>

                  <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-zinc-500 uppercase font-bold text-[10px] block">Status do E-mail</span>
                    {item.devolutiva_enviada_em ? (
                      <p className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={13} /> Enviado em {new Date(item.devolutiva_enviada_em).toLocaleDateString('pt-BR')}
                      </p>
                    ) : (
                      <p className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={13} /> Nenhum e-mail de devolutiva disparado
                      </p>
                    )}
                  </div>
                </div>

                {item.parecer_analise && (
                  <div className="bg-blue-950/20 border border-blue-500/20 p-3.5 rounded-2xl text-xs text-blue-200">
                    <span className="font-bold text-blue-300 block text-[11px] mb-1">Parecer Registrado:</span>
                    <p className="text-zinc-300 line-clamp-2">{item.parecer_analise}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: APROVAÇÃO DE SOLICITANTES (SUPER ADMIN)                           */}
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
          <div className="bg-surface border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
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

          {/* Lista de Solicitantes */}
          {carregandoSolicitantes ? (
            <div className="text-center py-16 text-zinc-400">
              <RefreshCw size={36} className="animate-spin mx-auto mb-3 text-primary" />
              Carregando solicitantes...
            </div>
          ) : solicitantesFiltrados.length === 0 ? (
            <div className="bg-surface border border-white/5 rounded-3xl p-16 text-center text-zinc-400 space-y-3">
              <Users size={48} className="mx-auto text-zinc-600" />
              <p className="text-base font-bold text-white">Nenhum solicitante cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solicitantesFiltrados.map((sol) => (
                <div
                  key={sol.id}
                  className={cn(
                    "bg-surface border rounded-3xl p-5 space-y-4 shadow-lg transition-all",
                    sol.status === 'pendente' ? "border-amber-500/40 bg-amber-950/10" :
                    sol.status === 'aprovado' ? "border-emerald-500/30" :
                    "border-red-500/30 bg-red-950/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{sol.nome}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          sol.status === 'pendente' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                          sol.status === 'aprovado' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                          "bg-red-500/20 text-red-300 border-red-500/30"
                        )}>
                          {sol.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-400 font-medium">{sol.cargo}</p>
                      <p className="text-xs text-zinc-400 font-mono">{sol.email}</p>
                    </div>

                    <div className="text-right text-[11px] text-zinc-500 font-mono">
                      {new Date(sol.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                    {sol.status !== 'aprovado' && (
                      <button
                        onClick={() => handleAlterarStatusSolicitante(sol.id, 'aprovado')}
                        disabled={processandoAcaoSolicitante === sol.id}
                        className="btn-primary !py-2 !px-3.5 text-xs font-black flex items-center gap-1.5 shadow-glow-yellow"
                        title="Liberar acesso para este solicitante abrir chamados"
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
      {/* MODAL DE ANÁLISE E PARECER TÉCNICO COM 2 ABAS (PARECER & E-MAIL)          */}
      {/* ========================================================================= */}
      {solicitacaoEmEdicao && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-surface border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 my-8 max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header do Modal com Abas */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                        Análise de CFTV
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-black/60 text-primary border border-amber-500/30">
                          {solicitacaoEmEdicao.numero_protocolo}
                        </span>
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Solicitante: <strong className="text-white">{solicitacaoEmEdicao.solicitante_nome}</strong> ({solicitacaoEmEdicao.solicitante_email})
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSolicitacaoEmEdicao(null)}
                  className="p-2 text-on-surface-variant hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navegação entre as 2 Abas do Modal */}
              <div className="grid grid-cols-2 gap-2 bg-surface-container-high p-1.5 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setTabModal('parecer')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                    tabModal === 'parecer'
                      ? "bg-primary text-black shadow-glow-yellow font-black"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <FileText size={15} /> 1. Parecer Técnico & Gravações
                </button>

                <button
                  type="button"
                  onClick={() => setTabModal('email')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative",
                    tabModal === 'email'
                      ? "bg-primary text-black shadow-glow-yellow font-black"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Mail size={15} /> 2. Devolutiva por E-mail
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                </button>
              </div>

              {/* ABA 1 DO MODAL: PARECER TÉCNICO */}
              {tabModal === 'parecer' && (
                <div className="space-y-5">
                  {/* Status Selector */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Definir Status do Chamado *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {(['Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'] as StatusCftv[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNovoStatus(st)}
                          className={cn(
                            "py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all text-center",
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
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Câmeras Analisadas / Verificadas
                    </label>
                    <input
                      type="text"
                      value={camerasAnalisadas}
                      onChange={(e) => setCamerasAnalisadas(e.target.value)}
                      placeholder="Ex: CAM-02 Pátio Central, CAM-04 Corredor Bloco B"
                      className="campo-input text-xs font-mono"
                    />
                    {/* Tags Rápidas de Câmeras */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Inserir:</span>
                      {SUGESTOES_CAMERAS.map((cam) => (
                        <button
                          key={cam}
                          type="button"
                          onClick={() => {
                            setCamerasAnalisadas(prev => prev ? `${prev}, ${cam}` : cam);
                          }}
                          className="text-[10px] bg-white/5 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 px-2 py-1 rounded-lg border border-white/5 transition-all"
                        >
                          + {cam}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parecer da Análise */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Parecer Técnico da Análise
                      </label>
                      <span className="text-[11px] text-zinc-500">Modelos prontos abaixo</span>
                    </div>

                    <textarea
                      rows={4}
                      value={parecerAnalise}
                      onChange={(e) => setParecerAnalise(e.target.value)}
                      placeholder="Descreva a conclusão da verificação das filmagens, horários confirmados, pessoas identificadas e destino do material..."
                      className="campo-input text-xs leading-relaxed"
                    />

                    {/* Modelos Rápidos de Parecer */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Modelos Rápidos de Parecer:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TEMPLATES_PARECER.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setParecerAnalise(tpl.texto);
                              setNovoStatus(tpl.status);
                            }}
                            className="text-left text-[11px] bg-zinc-950/70 hover:bg-white/5 p-2.5 rounded-xl border border-white/5 transition-all text-zinc-300 hover:text-white"
                          >
                            <span className="font-bold text-amber-400 block mb-0.5">{tpl.rotulo}</span>
                            <span className="text-zinc-400 line-clamp-2 text-[10px]">{tpl.texto}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Justificativa se Cancelado */}
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
                        placeholder="Informe com clareza o motivo do cancelamento (ex: falta de precisão no horário, ausência de fato nas imagens)..."
                        className="campo-input text-xs leading-relaxed !border-red-500/40"
                      />
                    </div>
                  )}

                  {/* Checkbox Devolutiva por E-mail */}
                  <div className="bg-black/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Mail size={18} className="text-amber-400" />
                      <div>
                        <span className="text-xs text-white font-bold block">
                          Enviar Devolutiva Automática por E-mail ao Salvar
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Dispara e-mail timbrado para {solicitacaoEmEdicao.solicitante_email}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificarEmailSolicitante}
                      onChange={(e) => setNotificarEmailSolicitante(e.target.checked)}
                      className="w-5 h-5 accent-amber-400 cursor-pointer rounded"
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setTabModal('email')}
                      className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-1.5"
                    >
                      <Mail size={14} /> Pré-visualizar E-mail →
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSolicitacaoEmEdicao(null)}
                        className="btn-secondary !py-2.5 !px-4 text-xs"
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        onClick={handleSalvarParecer}
                        disabled={salvandoParecer}
                        className="btn-primary !py-2.5 !px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-glow-yellow"
                      >
                        {salvandoParecer ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                        Salvar Parecer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2 DO MODAL: DEVOLUTIVA POR E-MAIL & LIVE PREVIEW */}
              {tabModal === 'email' && (
                <div className="space-y-5">
                  {feedbackEmail && (
                    <div className={cn(
                      "p-3.5 rounded-2xl text-xs flex items-center gap-2 border font-bold",
                      feedbackEmail.includes('✅') ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" : "bg-red-950/40 border-red-500/40 text-red-200"
                    )}>
                      <span>{feedbackEmail}</span>
                    </div>
                  )}

                  {/* Destinatário & Assunto */}
                  <div className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 uppercase font-bold text-[10px] block mb-1">Destinatário:</span>
                        <p className="text-white font-mono bg-black/60 p-2 rounded-xl border border-white/5 truncate">
                          {solicitacaoEmEdicao.solicitante_nome} &lt;{solicitacaoEmEdicao.solicitante_email}&gt;
                        </p>
                      </div>

                      <div>
                        <span className="text-zinc-500 uppercase font-bold text-[10px] block mb-1">Status Atual:</span>
                        <div className="pt-0.5">{renderStatusBadge(novoStatus)}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Assunto do E-mail
                      </label>
                      <input
                        type="text"
                        value={assuntoEmail}
                        onChange={(e) => setAssuntoEmail(e.target.value)}
                        className="campo-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Mensagem Adicional / Orientações para o Solicitante (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={mensagemEmailCustom}
                        onChange={(e) => setMensagemEmailCustom(e.target.value)}
                        placeholder="Ex: Favor comparecer à sala da Coordenação para retirar a ata correspondente..."
                        className="campo-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Live Preview do E-mail Timbrado SESI */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Prévia Visual do E-mail que o Solicitante Receberá:
                    </span>

                    <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                      {/* Topo do E-mail */}
                      <div className="text-center border-b border-slate-700/60 pb-3">
                        <h3 className="text-red-500 font-black text-lg tracking-wider">SESI CONNECT</h3>
                        <p className="text-slate-400 text-xs">Laudo e Devolutiva de Solicitação CFTV</p>
                      </div>

                      {/* Card Interno */}
                      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-600/50 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span className="text-xs text-slate-300 font-mono">
                            Protocolo: <strong className="text-white">{solicitacaoEmEdicao.numero_protocolo}</strong>
                          </span>
                          <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                            {novoStatus}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200">
                          Olá, <strong>{solicitacaoEmEdicao.solicitante_nome}</strong>,
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          A equipe de segurança e monitoramento atualizou o status da sua solicitação de imagens.
                        </p>

                        <div className="bg-[#0f172a] p-3.5 rounded-lg border-l-4 border-red-500 text-xs space-y-1.5">
                          <p className="font-bold text-slate-400 text-[10px] uppercase">Parecer Técnico da Análise:</p>
                          <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {parecerAnalise || solicitacaoEmEdicao.parecer_analise || justificativaCancelamento || 'Análise registrada pela equipe.'}
                          </p>
                          {(camerasAnalisadas || solicitacaoEmEdicao.cameras_analisadas) && (
                            <p className="text-sky-400 text-[11px] pt-1">
                              <strong>Câmeras Analisadas:</strong> {camerasAnalisadas || solicitacaoEmEdicao.cameras_analisadas}
                            </p>
                          )}
                          {mensagemEmailCustom && (
                            <p className="text-amber-300 text-[11px] pt-1 border-t border-slate-800">
                              <strong>Observação da Equipe:</strong> {mensagemEmailCustom}
                            </p>
                          )}
                        </div>

                        <div className="text-center pt-2">
                          <span className="inline-block bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg">
                            Acessar Portal e Baixar Laudo PDF
                          </span>
                        </div>
                      </div>

                      <p className="text-center text-[10px] text-slate-500">
                        SESI Connect - Sistema Integrado de Ocorrências e Segurança Escolar
                      </p>
                    </div>
                  </div>

                  {/* Ações da Aba de E-mail */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setTabModal('parecer')}
                      className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-1.5"
                    >
                      ← Voltar ao Parecer
                    </button>

                    <button
                      type="button"
                      onClick={handleEnviarDevolutivaEmailDireto}
                      disabled={enviandoEmailAvulso}
                      className="btn-primary !py-2.5 !px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-glow-yellow"
                    >
                      {enviandoEmailAvulso ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar Devolutiva por E-mail Agora
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO COMPLETA (FICHA CADASTRAL DA SOLICITAÇÃO)           */}
      {/* ========================================================================= */}
      {solicitacaoDetalhes && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-surface border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 my-8 max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-glow-yellow">
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Ficha Completa da Solicitação</span>
                    <h2 className="text-xl font-black text-white font-mono">{solicitacaoDetalhes.numero_protocolo}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => gerarPdfSolicitacaoCFTV(solicitacaoDetalhes)}
                    className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} /> Baixar PDF
                  </button>
                  <button
                    onClick={() => setSolicitacaoDetalhes(null)}
                    className="p-2 text-on-surface-variant hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-zinc-950/80 rounded-2xl border border-white/5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-bold">Status Atual:</span>
                  {renderStatusBadge(solicitacaoDetalhes.status)}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Criado em: {new Date(solicitacaoDetalhes.created_at).toLocaleString('pt-BR')}
                </div>
              </div>

              {/* 7 Seções Estruturadas */}
              <div className="space-y-4 text-xs">
                {/* 1. Solicitante */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} /> 1. Identificação do Solicitante
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-zinc-300">
                    <p><strong className="text-zinc-500">Nome:</strong> {solicitacaoDetalhes.solicitante_nome}</p>
                    <p><strong className="text-zinc-500">Cargo:</strong> {solicitacaoDetalhes.solicitante_cargo}</p>
                    <p className="font-mono"><strong className="text-zinc-500">E-mail:</strong> {solicitacaoDetalhes.solicitante_email}</p>
                  </div>
                </div>

                {/* 2. Data & Horário */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} /> 2. Data e Horário do Fato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-zinc-300">
                    <p><strong className="text-zinc-500">Data da Ocorrência:</strong> {solicitacaoDetalhes.data_fato}</p>
                    <p><strong className="text-zinc-500">Horário:</strong> {solicitacaoDetalhes.horario_inicio} às {solicitacaoDetalhes.horario_termino}</p>
                    <p><strong className="text-zinc-500">Tipo de Intervalo:</strong> {solicitacaoDetalhes.tipo_intervalo}</p>
                  </div>
                </div>

                {/* 3. Localização */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} /> 3. Local da Ocorrência
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-zinc-300">
                    <p><strong className="text-zinc-500">Andar:</strong> {solicitacaoDetalhes.andar}</p>
                    <p><strong className="text-zinc-500">Ambiente/Setor:</strong> {solicitacaoDetalhes.ambiente}</p>
                    <p><strong className="text-zinc-500">Ponto de Ref.:</strong> {solicitacaoDetalhes.ponto_referencia || 'Não informado'}</p>
                  </div>
                </div>

                {/* 4. Tipo de Ocorrência */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} /> 4. Tipo de Ocorrência
                  </h3>
                  <p className="text-white font-bold">
                    {solicitacaoDetalhes.tipo_ocorrencia}
                    {solicitacaoDetalhes.tipo_ocorrencia_outro && ` (${solicitacaoDetalhes.tipo_ocorrencia_outro})`}
                  </p>
                </div>

                {/* 5. Relato dos Fatos */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} /> 5. Relato Detalhado dos Fatos
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-200 bg-black/50 p-3.5 rounded-xl border border-white/5">
                    {solicitacaoDetalhes.descricao_fatos}
                  </p>
                </div>

                {/* 6. Envolvidos & Deslocamento */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} /> 6. Envolvidos, Características e Fuga
                  </h3>
                  <div className="space-y-1.5 pt-1 text-zinc-300">
                    <p><strong className="text-zinc-500">Nomes / Turmas:</strong> {solicitacaoDetalhes.envolvidos_nomes_turmas || 'Não informado'}</p>
                    <p><strong className="text-zinc-500">Características Visuais (Roupas/Mochila):</strong> {solicitacaoDetalhes.envolvidos_caracteristicas || 'Não informado'}</p>
                    <p><strong className="text-zinc-500">Sentido de Deslocamento / Fuga:</strong> {solicitacaoDetalhes.envolvidos_sentido_fuga || 'Não informado'}</p>
                    <p><strong className="text-zinc-500">Bens ou Objetos Envolvidos:</strong> {solicitacaoDetalhes.objetos_envolvidos || 'Não informado'}</p>
                  </div>
                </div>

                {/* 7. Finalidade & Parecer Técnico */}
                <div className="bg-surface-container-high p-4 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} /> 7. Finalidade & Parecer da Equipe CFTV
                  </h3>
                  <p><strong className="text-zinc-500">Finalidade da Solicitação:</strong> {solicitacaoDetalhes.motivo_solicitacao}</p>
                  {solicitacaoDetalhes.parecer_analise && (
                    <div className="mt-2 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
                      <p className="font-bold text-blue-300">Parecer Técnico:</p>
                      <p className="whitespace-pre-wrap text-zinc-200">{solicitacaoDetalhes.parecer_analise}</p>
                      {solicitacaoDetalhes.cameras_analisadas && (
                        <p className="text-sky-300 text-[11px] pt-1 font-mono">Câmeras: {solicitacaoDetalhes.cameras_analisadas}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    const item = solicitacaoDetalhes;
                    setSolicitacaoDetalhes(null);
                    abrirModalAnalise(item, 'parecer');
                  }}
                  className="btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-glow-yellow"
                >
                  <Edit3 size={15} /> Editar Parecer / Devolutiva
                </button>

                <button
                  onClick={() => setSolicitacaoDetalhes(null)}
                  className="btn-secondary !py-2.5 !px-5 text-xs"
                >
                  Fechar
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
