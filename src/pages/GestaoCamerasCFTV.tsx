import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, QrCode as QrIcon, FileText, CheckCircle2, Clock, 
  AlertTriangle, Shield, Search, Filter, Download, 
  MapPin, Calendar, Check, X, RefreshCw, ChevronDown, 
  FileCheck, ShieldAlert, ArrowRight, Eye, Edit3, Trash2, Info, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { SolicitacaoCFTV, StatusCftv } from '../types';
import { ModalQRCodeCFTV } from '../components/ModalQRCodeCFTV';
import { gerarPdfSolicitacaoCFTV } from '../lib/cftvPdfGenerator';

export default function GestaoCamerasCFTV() {
  const { user, profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === 'admin' || authProfile?.role === 'super_admin';

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCFTV[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Modal de Análise e Parecer Técnico
  const [solicitacaoEmEdicao, setSolicitacaoEmEdicao] = useState<SolicitacaoCFTV | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusCftv>('Em Espera');
  const [parecerAnalise, setParecerAnalise] = useState('');
  const [camerasAnalisadas, setCamerasAnalisadas] = useState('');
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
  const [salvandoParecer, setSalvandoParecer] = useState(false);

  // Buscar todas as solicitações para o painel administrativo
  const buscarSolicitacoes = async () => {
    setCarregando(true);
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
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarSolicitacoes();
  }, []);

  // Salvar Parecer / Mudar Status
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

      const { error } = await supabase
        .from('solicitacoes_cftv')
        .update(updates)
        .eq('id', solicitacaoEmEdicao.id);

      if (error) throw error;

      setSolicitacaoEmEdicao(null);
      buscarSolicitacoes();
    } catch (err: any) {
      alert(`Erro ao salvar parecer: ${err.message}`);
    } finally {
      setSalvandoParecer(false);
    }
  };

  // Excluir chamado
  const handleExcluir = async (id: string, protocolo: string) => {
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

  // Métricas
  const metricas = useMemo(() => {
    const total = solicitacoes.length;
    const emEspera = solicitacoes.filter(s => s.status === 'Em Espera').length;
    const emAnalise = solicitacoes.filter(s => s.status === 'Em Análise').length;
    const atendidos = solicitacoes.filter(s => s.status === 'Atendido' || s.status === 'Finalizado').length;
    const cancelados = solicitacoes.filter(s => s.status === 'Cancelado').length;
    return { total, emEspera, emAnalise, atendidos, cancelados };
  }, [solicitacoes]);

  // Lista Filtrada
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter(s => {
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
      if (buscaTexto.trim()) {
        const termo = buscaTexto.toLowerCase();
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
  }, [solicitacoes, filtroStatus, buscaTexto]);

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
      {/* Cabeçalho */}
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
                Área administrativa para análise de filmagens, emissão de pareceres e atendimento de solicitações
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

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-surface border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
          <p className="text-2xl font-black text-white">{metricas.total}</p>
        </div>

        <div className="bg-surface border border-amber-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Em Espera
          </span>
          <p className="text-2xl font-black text-amber-400">{metricas.emEspera}</p>
        </div>

        <div className="bg-surface border border-blue-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <RefreshCw size={12} /> Em Análise
          </span>
          <p className="text-2xl font-black text-blue-400">{metricas.emAnalise}</p>
        </div>

        <div className="bg-surface border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} /> Atendidos
          </span>
          <p className="text-2xl font-black text-emerald-400">{metricas.atendidos}</p>
        </div>

        <div className="bg-surface border border-red-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
            <X size={12} /> Cancelados
          </span>
          <p className="text-2xl font-black text-red-400">{metricas.cancelados}</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Buscar por protocolo, solicitante, e-mail, local, relato..."
              className="campo-input !pl-11 !py-3 text-xs"
            />
          </div>

          <button
            onClick={buscarSolicitacoes}
            className="btn-secondary !py-3 !px-4 text-xs font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
            Atualizar Solicitações
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {['todos', 'Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                filtroStatus === st
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
      {carregando ? (
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
                      onClick={() => handleExcluir(item.id, item.numero_protocolo)}
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

              {/* Pistas adicionais */}
              {(item.envolvidos_sentido_fuga || item.objetos_envolvidos) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
                  {item.envolvidos_sentido_fuga && (
                    <p className="text-zinc-300">
                      <strong className="text-zinc-400">Sentido de Fuga:</strong> {item.envolvidos_sentido_fuga}
                    </p>
                  )}
                  {item.objetos_envolvidos && (
                    <p className="text-zinc-300">
                      <strong className="text-zinc-400">Objetos Envolvidos:</strong> {item.objetos_envolvidos}
                    </p>
                  )}
                </div>
              )}

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

      {/* Modal de Análise e Parecer Técnico */}
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
                  Salvar Parecer
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
