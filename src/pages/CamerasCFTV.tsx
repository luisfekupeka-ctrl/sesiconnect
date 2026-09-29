import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, QrCode as QrIcon, PlusCircle, FileText, CheckCircle2, Clock, 
  AlertTriangle, Shield, Search, Filter, Download, Printer, User, 
  MapPin, Calendar, Check, X, RefreshCw, ChevronDown, ChevronUp,
  FileCheck, ShieldAlert, ArrowRight, ArrowLeft, Eye, Edit3, Trash2, Info, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { SolicitacaoCFTV, TipoIntervaloCftv, StatusCftv, SolicitanteProfile } from '../types';
import { ModalQRCodeCFTV } from '../components/ModalQRCodeCFTV';
import { gerarPdfSolicitacaoCFTV } from '../lib/cftvPdfGenerator';

// Opções Padrão de Tipo de Ocorrência
const TIPOS_OCORRENCIA = [
  'Baderna / Desordem / Tumulto',
  'Conflito físico / Briga',
  'Dano ao patrimônio / Vandalismo',
  'Suspeita de furto / Subtração de pertences',
  'Objeto esquecido / Extravio',
  'Evasão / Saída indevida (salto de muro, portão)',
  'Acesso não autorizado / Intrusão de terceiros',
  'Uso/porte de itens ou substâncias não permitidos',
  'Acidente / Queda',
  'Outro'
];

// Opções Padrão de Motivo/Finalidade
const MOTIVOS_SOLICITACAO = [
  'Registro de ocorrência / Advertência interna',
  'Reunião com responsáveis',
  'Deliberação da direção / Conselho',
  'Encaminhamento externo (B.O. / Órgãos competentes)',
  'Outro'
];

// Andares comuns
const ANDARES_PADRAO = [
  'Térreo',
  '1º Andar',
  '2º Andar',
  '3º Andar',
  'Subsolo',
  'Quadras / Área Externa',
  'Estacionamento / Portaria',
  'Outro'
];

// Setores comuns para sugestão rápida
const SETORES_SUGESTOES = [
  'Pátio Central',
  'Corredor Bloco A',
  'Corredor Bloco B',
  'Corredor Bloco C',
  'Sala de Aula',
  'Portão Principal',
  'Portão Secundário',
  'Refeitório / Cantina',
  'Quadra Coberta',
  'Quadra Externa',
  'Biblioteca',
  'Banheiros Masculino Bloco A',
  'Banheiros Feminino Bloco A',
  'Banheiros Bloco B',
  'Laboratório de Ciências / Informática'
];

export default function CamerasCFTV() {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === 'admin' || authProfile?.role === 'super_admin';

  // Tabs: 'formulario' | 'meus-chamados' | 'gestao'
  const [tabAtiva, setTabAtiva] = useState<'formulario' | 'meus-chamados' | 'gestao'>('formulario');

  // Modal de QR Code
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Perfil do Solicitante (Gravado em LocalStorage)
  const [perfil, setPerfil] = useState<SolicitanteProfile>({
    nome: '',
    cargo: '',
    email: ''
  });
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);

  // Listas de Andares e Locais do Sistema
  const [andares, setAndares] = useState<string[]>(ANDARES_PADRAO);
  const [locais, setLocais] = useState<string[]>(SETORES_SUGESTOES);

  // Estados do Formulário
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteCargo, setSolicitanteCargo] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');

  const [dataFato, setDataFato] = useState(() => new Date().toISOString().split('T')[0]);
  const [tipoIntervalo, setTipoIntervalo] = useState<TipoIntervaloCftv>('Aproximado');
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioTermino, setHorarioTermino] = useState('08:45');

  const [andar, setAndar] = useState('Térreo');
  const [ambiente, setAmbiente] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');

  const [tipoOcorrencia, setTipoOcorrencia] = useState(TIPOS_OCORRENCIA[0]);
  const [tipoOcorrenciaOutro, setTipoOcorrenciaOutro] = useState('');

  const [descricaoFatos, setDescricaoFatos] = useState('');

  const [envolvidosNomesTurmas, setEnvolvidosNomesTurmas] = useState('');
  const [envolvidosCaracteristicas, setEnvolvidosCaracteristicas] = useState('');
  const [envolvidosSentidoFuga, setEnvolvidosSentidoFuga] = useState('');
  const [objetosEnvolvidos, setObjetosEnvolvidos] = useState('');

  const [motivoSolicitacao, setMotivoSolicitacao] = useState(MOTIVOS_SOLICITACAO[0]);
  const [motivoOutroDescricao, setMotivoOutroDescricao] = useState('');

  // Status de envio e feedback
  const [enviando, setEnviando] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);
  const [solicitacaoRecente, setSolicitacaoRecente] = useState<SolicitacaoCFTV | null>(null);

  // Estados de Listas e Gestão
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCFTV[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [emailConsulta, setEmailConsulta] = useState<string>('');

  // Modal de Parecer / Análise Administrativa
  const [solicitacaoEmEdicao, setSolicitacaoEmEdicao] = useState<SolicitacaoCFTV | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusCftv>('Em Espera');
  const [parecerAnalise, setParecerAnalise] = useState('');
  const [camerasAnalisadas, setCamerasAnalisadas] = useState('');
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
  const [salvandoParecer, setSalvandoParecer] = useState(false);

  // 1. Carregar perfil salvo do LocalStorage ou Auth
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('sesi_cftv_profile');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        setPerfil(parsed);
        setSolicitanteNome(parsed.nome || '');
        setSolicitanteCargo(parsed.cargo || '');
        setSolicitanteEmail(parsed.email || '');
        setEmailConsulta(parsed.email || '');
      } else if (authProfile || user) {
        const defaultProfile: SolicitanteProfile = {
          nome: authProfile?.full_name || '',
          cargo: authProfile?.role === 'admin' ? 'Administrador' : (authProfile?.role || 'Docente / Monitor'),
          email: user?.email || ''
        };
        setPerfil(defaultProfile);
        setSolicitanteNome(defaultProfile.nome);
        setSolicitanteCargo(defaultProfile.cargo);
        setSolicitanteEmail(defaultProfile.email);
        setEmailConsulta(defaultProfile.email);
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    }
  }, [authProfile, user]);

  // 2. Carregar Andares e Locais do banco de dados (se existirem)
  useEffect(() => {
    async function carregarLocaisEAndares() {
      try {
        const [resAndares, resLocais] = await Promise.all([
          supabase.from('andares').select('nome').eq('ativo', true).order('ordem', { ascending: true }),
          supabase.from('locais').select('nome').eq('ativo', true).order('nome', { ascending: true })
        ]);

        if (resAndares.data && resAndares.data.length > 0) {
          const lista = resAndares.data.map((a: any) => a.nome);
          setAndares(Array.from(new Set([...lista, ...ANDARES_PADRAO])));
        }

        if (resLocais.data && resLocais.data.length > 0) {
          const lista = resLocais.data.map((l: any) => l.nome);
          setLocais(Array.from(new Set([...lista, ...SETORES_SUGESTOES])));
        }
      } catch (err) {
        console.warn('Usando lista padrão de andares e locais.');
      }
    }

    carregarLocaisEAndares();
  }, []);

  // 3. Buscar Solicitações
  const buscarSolicitacoes = async () => {
    setCarregandoLista(true);
    try {
      let query = supabase
        .from('solicitacoes_cftv')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações CFTV:', error);
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    buscarSolicitacoes();
  }, [tabAtiva]);

  // Cálculo da diferença de horários em minutos
  const duracaoMinutos = useMemo(() => {
    if (!horarioInicio || !horarioTermino) return 0;
    const [h1, m1] = horarioInicio.split(':').map(Number);
    const [h2, m2] = horarioTermino.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    
    let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutos < 0) {
      // Caso atravesse a meia-noite
      totalMinutos += 24 * 60;
    }
    return totalMinutos;
  }, [horarioInicio, horarioTermino]);

  // Trava do formulário: se "Aproximado", diferença não pode exceder 60 minutos (1 hora)
  const isIntervaloAproximadoInvalido = useMemo(() => {
    return tipoIntervalo === 'Aproximado' && duracaoMinutos > 60;
  }, [tipoIntervalo, duracaoMinutos]);

  // Salvar perfil do usuário no LocalStorage
  const handleSalvarPerfil = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const novoPerfil: SolicitanteProfile = {
      nome: solicitanteNome.trim(),
      cargo: solicitanteCargo.trim(),
      email: solicitanteEmail.trim()
    };
    setPerfil(novoPerfil);
    localStorage.setItem('sesi_cftv_profile', JSON.stringify(novoPerfil));
    setEmailConsulta(novoPerfil.email);
    setMostrarEditarPerfil(false);
  };

  // Enviar Solicitação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitanteNome.trim() || !solicitanteCargo.trim() || !solicitanteEmail.trim()) {
      alert('Por favor, preencha todos os dados de identificação do solicitante.');
      return;
    }

    if (!dataFato) {
      alert('Por favor, informe a data da ocorrência.');
      return;
    }

    if (!horarioInicio || !horarioTermino) {
      alert('Por favor, informe os horários de início e término.');
      return;
    }

    if (isIntervaloAproximadoInvalido) {
      alert('Regra do sistema: O intervalo aproximado deve ser de no máximo 1 hora. Ajuste o horário ou selecione a opção "Amplo".');
      return;
    }

    if (!andar.trim() || !ambiente.trim()) {
      alert('Por favor, informe o andar e o ambiente/setor escolar da ocorrência.');
      return;
    }

    if (!descricaoFatos.trim()) {
      alert('Por favor, relate com clareza a descrição dos fatos ocorridos.');
      return;
    }

    if (tipoOcorrencia === 'Outro' && !tipoOcorrenciaOutro.trim()) {
      alert('Por favor, especifique o tipo de ocorrência no campo Outro.');
      return;
    }

    if (motivoSolicitacao === 'Outro' && !motivoOutroDescricao.trim()) {
      alert('Por favor, descreva a finalidade da solicitação no campo Outro.');
      return;
    }

    // Salvar perfil no LocalStorage para próximas vezes
    handleSalvarPerfil();

    setEnviando(true);
    try {
      const payload = {
        solicitante_id: user?.id || null,
        solicitante_nome: solicitanteNome.trim(),
        solicitante_cargo: solicitanteCargo.trim(),
        solicitante_email: solicitanteEmail.trim().toLowerCase(),
        
        data_fato: dataFato,
        tipo_intervalo: tipoIntervalo,
        horario_inicio: horarioInicio,
        horario_termino: horarioTermino,
        
        andar: andar.trim(),
        ambiente: ambiente.trim(),
        ponto_referencia: pontoReferencia.trim() || null,
        
        tipo_ocorrencia: tipoOcorrencia,
        tipo_ocorrencia_outro: tipoOcorrencia === 'Outro' ? tipoOcorrenciaOutro.trim() : null,
        
        descricao_fatos: descricaoFatos.trim(),
        
        envolvidos_nomes_turmas: envolvidosNomesTurmas.trim() || null,
        envolvidos_caracteristicas: envolvidosCaracteristicas.trim() || null,
        envolvidos_sentido_fuga: envolvidosSentidoFuga.trim() || null,
        objetos_envolvidos: objetosEnvolvidos.trim() || null,
        
        motivo_solicitacao: motivoSolicitacao,
        motivo_outro_descricao: motivoSolicitacao === 'Outro' ? motivoOutroDescricao.trim() : null,
        
        status: 'Em Espera'
      };

      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setProtocoloGerado(data.numero_protocolo);
      setSolicitacaoRecente(data);
      
      // Limpar campos dinâmicos mantendo os dados do solicitante
      setDescricaoFatos('');
      setPontoReferencia('');
      setEnvolvidosNomesTurmas('');
      setEnvolvidosCaracteristicas('');
      setEnvolvidosSentidoFuga('');
      setObjetosEnvolvidos('');
      setTipoOcorrenciaOutro('');
      setMotivoOutroDescricao('');

      buscarSolicitacoes();
    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      alert(`Erro ao registrar solicitação: ${err.message || 'Falha de conexão com o banco de dados.'}`);
    } finally {
      setEnviando(false);
    }
  };

  // Atualizar parecer e status administrativo
  const handleSalvarParecer = async () => {
    if (!solicitacaoEmEdicao) return;

    if (novoStatus === 'Cancelado' && !justificativaCancelamento.trim()) {
      alert('Para cancelar a solicitação, é obrigatório informar a justificativa do cancelamento.');
      return;
    }

    setSalvandoParecer(true);
    try {
      const updates: Partial<SolicitacaoCFTV> = {
        status: novoStatus,
        parecer_analise: parecerAnalise.trim() || null,
        cameras_analisadas: camerasAnalisadas.trim() || null,
        justificativa_cancelamento: novoStatus === 'Cancelado' ? justificativaCancelamento.trim() : null,
        analisado_por_nome: authProfile?.full_name || 'Operador CFTV',
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
      console.error('Erro ao salvar parecer:', err);
      alert(`Erro ao atualizar: ${err.message}`);
    } finally {
      setSalvandoParecer(false);
    }
  };

  // Excluir solicitação (apenas admin)
  const handleExcluirSolicitacao = async (id: string, protocolo: string) => {
    if (!isAdmin) return;
    if (!confirm(`Tem certeza que deseja excluir permanentemente o chamado ${protocolo}?`)) return;

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

  // Filtros de Meus Chamados
  const minhasSolicitacoes = useMemo(() => {
    if (!emailConsulta.trim()) return solicitacoes;
    const emailNorm = emailConsulta.trim().toLowerCase();
    return solicitacoes.filter(s => 
      s.solicitante_email?.toLowerCase() === emailNorm ||
      (user?.id && s.solicitante_id === user.id)
    );
  }, [solicitacoes, emailConsulta, user]);

  // Filtros de Gestão / Admin
  const solicitacoesFiltradasGestao = useMemo(() => {
    return solicitacoes.filter(s => {
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
      if (buscaTexto.trim()) {
        const termo = buscaTexto.toLowerCase();
        const bateProtocolo = s.numero_protocolo?.toLowerCase().includes(termo);
        const bateNome = s.solicitante_nome?.toLowerCase().includes(termo);
        const bateLocal = s.ambiente?.toLowerCase().includes(termo);
        const bateAndar = s.andar?.toLowerCase().includes(termo);
        const bateRelato = s.descricao_fatos?.toLowerCase().includes(termo);
        const bateTipo = s.tipo_ocorrencia?.toLowerCase().includes(termo);
        return bateProtocolo || bateNome || bateLocal || bateAndar || bateRelato || bateTipo;
      }
      return true;
    });
  }, [solicitacoes, filtroStatus, buscaTexto]);

  // Helpers de Badge de Status
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
    <div className="sub-page-container max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rooms')}
              className="w-10 h-10 rounded-2xl bg-surface-container-high border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-primary/40 transition-colors"
              title="Voltar ao SESI Connect"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-glow-yellow">
              <Camera size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Solicitação de Imagens (CFTV)
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                Gestão e requisição de gravações do circuito interno de câmeras escolares
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-glow-yellow !py-3 !px-4 text-xs font-bold"
          >
            <QrIcon size={18} />
            QR Code / Cartaz
          </button>

          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary flex items-center gap-2 !py-3 !px-4 text-xs font-bold"
              title="Acesso de Administrador"
            >
              <LogIn size={16} />
              Login ADM
            </button>
          )}
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setTabAtiva('formulario')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
            tabAtiva === 'formulario'
              ? "bg-primary text-black shadow-glow-yellow"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <PlusCircle size={18} />
          Nova Solicitação
        </button>

        <button
          onClick={() => setTabAtiva('meus-chamados')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
            tabAtiva === 'meus-chamados'
              ? "bg-primary text-black shadow-glow-yellow"
              : "text-on-surface-variant hover:bg-white/5 hover:text-white"
          )}
        >
          <FileText size={18} />
          Meus Chamados {minhasSolicitacoes.length > 0 && `(${minhasSolicitacoes.length})`}
        </button>

        {(isAdmin || solicitacoes.length > 0) && (
          <button
            onClick={() => setTabAtiva('gestao')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
              tabAtiva === 'gestao'
                ? "bg-primary text-black shadow-glow-yellow"
                : "text-on-surface-variant hover:bg-white/5 hover:text-white"
            )}
          >
            <Shield size={18} />
            Painel de Aprovação & Gestão ({solicitacoes.length})
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: FORMULÁRIO DE SOLICITAÇÃO DE IMAGENS                               */}
      {/* ========================================================================= */}
      {tabAtiva === 'formulario' && (
        <div className="space-y-8">
          {/* Sucesso de Protocolo Recém-Gerado */}
          {protocoloGerado && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-white">
                      Solicitação Registrada com Sucesso!
                    </h3>
                    <p className="text-xs md:text-sm text-emerald-300 font-medium">
                      Protocolo: <span className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">{protocoloGerado}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {solicitacaoRecente && (
                    <button
                      onClick={() => gerarPdfSolicitacaoCFTV(solicitacaoRecente)}
                      className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-2"
                    >
                      <Download size={16} />
                      Baixar Comprovante PDF
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTabAtiva('meus-chamados');
                      setProtocoloGerado(null);
                    }}
                    className="btn-primary !py-2.5 !px-4 text-xs flex items-center gap-2"
                  >
                    Ver em Meus Chamados <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-300">
                Sua solicitação foi enviada para a equipe responsável por monitoramento e análise de câmeras. 
                O status passará por <strong className="text-amber-400">Em Espera</strong> ➔ <strong className="text-blue-400">Em Análise</strong> ➔ <strong className="text-emerald-400">Atendido / Finalizado</strong>.
              </p>
            </motion.div>
          )}

          {/* Card de Perfil Gravado / Solicitante */}
          <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">1. Identificação do Solicitante</h2>
                  <p className="text-xs text-on-surface-variant">Seus dados ficam gravados para preenchimento automático nas próximas solicitações</p>
                </div>
              </div>

              {perfil.nome && (
                <button
                  type="button"
                  onClick={() => setMostrarEditarPerfil(!mostrarEditarPerfil)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start md:self-auto"
                >
                  <Edit3 size={14} />
                  {mostrarEditarPerfil ? 'Ocultar Edição' : 'Alterar Meus Dados'}
                </button>
              )}
            </div>

            {/* Visualização de Perfil Carregado ou Formulário de Edição */}
            {perfil.nome && !mostrarEditarPerfil ? (
              <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{perfil.nome}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {perfil.cargo}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{perfil.email}</p>
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check size={14} /> Perfil ativo e pré-preenchido
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitanteNome}
                    onChange={(e) => setSolicitanteNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="campo-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitanteCargo}
                    onChange={(e) => setSolicitanteCargo(e.target.value)}
                    placeholder="Ex: Professor, Coordenador, Monitor"
                    className="campo-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={solicitanteEmail}
                    onChange={(e) => setSolicitanteEmail(e.target.value)}
                    placeholder="seu.nome@sesisp.org.br"
                    className="campo-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FORMULÁRIO PRINCIPAL */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SEÇÃO 2: DATA E HORÁRIO */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">2. Informações de Data e Horário</h2>
                  <p className="text-xs text-on-surface-variant">Delimite o momento exato ou aproximado para agilizar a localização do vídeo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Data da Ocorrência *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={dataFato}
                      onChange={(e) => setDataFato(e.target.value)}
                      className="campo-input"
                    />
                    <button
                      type="button"
                      onClick={() => setDataFato(new Date().toISOString().split('T')[0])}
                      className="btn-secondary !p-3 text-xs whitespace-nowrap"
                    >
                      Hoje
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Tipo de Intervalo de Horário *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Exato', 'Aproximado', 'Amplo'] as TipoIntervaloCftv[]).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoIntervalo(tipo)}
                        className={cn(
                          "py-3 px-2 rounded-2xl text-xs font-bold border transition-all text-center",
                          tipoIntervalo === tipo
                            ? "bg-primary text-black border-primary shadow-glow-yellow"
                            : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                        )}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações e Alertas do Intervalo */}
              {tipoIntervalo === 'Aproximado' && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-3">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-300">Regra do Sistema:</strong> A diferença entre o início e o término deve ser de no máximo <strong>1 hora</strong> (30 min a 60 min).
                  </div>
                </div>
              )}

              {tipoIntervalo === 'Amplo' && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">⚠️ Aviso Importante:</strong> Solicitações com intervalo amplo (superior a 1 hora) demandam análise prolongada de vídeo e <strong>poderão ser canceladas ou recusadas</strong> por falta de precisão nas informações. Tente delimitar ao máximo o horário antes de enviar.
                  </div>
                </div>
              )}

              {/* Horários Início e Término */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="campo-input font-mono text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={horarioTermino}
                    onChange={(e) => setHorarioTermino(e.target.value)}
                    className="campo-input font-mono text-base"
                  />
                </div>
              </div>

              {/* Indicador de Duração Calculada & Trava de Validação */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
                <span className="text-zinc-400">
                  Duração estimada informada: <strong className="text-white font-mono">{Math.floor(duracaoMinutos / 60)}h {duracaoMinutos % 60}min ({duracaoMinutos} minutos)</strong>
                </span>

                {isIntervaloAproximadoInvalido && (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle size={14} /> Trava ativa: Intervalo acima de 1h para modo Aproximado. Reduza o tempo ou mude para 'Amplo'.
                  </span>
                )}
              </div>
            </div>

            {/* SEÇÃO 3: LOCAL DA OCORRÊNCIA */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">3. Local da Ocorrência</h2>
                  <p className="text-xs text-on-surface-variant">Andar, ambiente escolar e pontos visuais para localização da câmera</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Andar *
                  </label>
                  <select
                    value={andar}
                    onChange={(e) => setAndar(e.target.value)}
                    className="campo-input font-bold"
                  >
                    {andares.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Setor / Ambiente Escolar *
                  </label>
                  <input
                    type="text"
                    required
                    list="locais-sugestoes"
                    value={ambiente}
                    onChange={(e) => setAmbiente(e.target.value)}
                    placeholder="Ex: Pátio, Corredor Bloco B, Sala 14, Portão Principal, Refeitório, Quadra"
                    className="campo-input"
                  />
                  <datalist id="locais-sugestoes">
                    {locais.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Ponto de Referência Visual
                </label>
                <input
                  type="text"
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  placeholder="Ex: Em frente ao bebedouro, próximo à escada, perto da lixeira verde"
                  className="campo-input"
                />
              </div>
            </div>

            {/* SEÇÃO 4: TIPO DE OCORRÊNCIA */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">4. Tipo de Ocorrência</h2>
                  <p className="text-xs text-on-surface-variant">Classifique a natureza do evento a ser analisado nas gravações</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {TIPOS_OCORRENCIA.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoOcorrencia(tipo)}
                    className={cn(
                      "p-4 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between gap-2",
                      tipoOcorrencia === tipo
                        ? "bg-primary text-black border-primary shadow-glow-yellow"
                        : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                    )}
                  >
                    <span>{tipo}</span>
                    {tipoOcorrencia === tipo && <Check size={16} className="shrink-0 text-black" />}
                  </button>
                ))}
              </div>

              {tipoOcorrencia === 'Outro' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Especifique o Tipo de Ocorrência *
                  </label>
                  <input
                    type="text"
                    required
                    value={tipoOcorrenciaOutro}
                    onChange={(e) => setTipoOcorrenciaOutro(e.target.value)}
                    placeholder="Descreva resumidamente o tipo de ocorrência"
                    className="campo-input"
                  />
                </div>
              )}
            </div>

            {/* SEÇÃO 5: DESCRIÇÃO DOS FATOS */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">5. Descrição dos Fatos</h2>
                  <p className="text-xs text-on-surface-variant">Descreva com clareza o que aconteceu, a sequência dos fatos e o desfecho</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Relato Detalhado do Ocorrido *
                </label>
                <textarea
                  required
                  rows={5}
                  value={descricaoFatos}
                  onChange={(e) => setDescricaoFatos(e.target.value)}
                  placeholder="Ex: Durante o intervalo das 09:30, houve um desentendimento próximo aos bebedouros do Bloco B. Dois alunos começaram uma discussão verbal que culminou em empurrões..."
                  className="campo-input text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* SEÇÃO 6: IDENTIFICAÇÃO DOS ENVOLVIDOS E DESLOCAMENTO */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">6. Identificação dos Envolvidos e Deslocamento</h2>
                  <p className="text-xs text-on-surface-variant">Detalhes visuais para facilitar a identificação nas filmagens</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Nomes ou Turmas dos Envolvidos (se souber)
                  </label>
                  <input
                    type="text"
                    value={envolvidosNomesTurmas}
                    onChange={(e) => setEnvolvidosNomesTurmas(e.target.value)}
                    placeholder="Ex: Aluno Lucas (8º A) e Aluno Mateus (8º B)"
                    className="campo-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Características Visuais das Pessoas
                  </label>
                  <input
                    type="text"
                    value={envolvidosCaracteristicas}
                    onChange={(e) => setEnvolvidosCaracteristicas(e.target.value)}
                    placeholder="Ex: Casaco vermelho, calça preta, mochila camuflada, tênis branco, cabelo cacheado"
                    className="campo-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Sentido da Movimentação / Fuga
                  </label>
                  <input
                    type="text"
                    value={envolvidosSentidoFuga}
                    onChange={(e) => setEnvolvidosSentidoFuga(e.target.value)}
                    placeholder="Ex: Vieram da quadra e foram em direção ao banheiro do bloco B"
                    className="campo-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Objetos ou Bens Envolvidos
                  </label>
                  <input
                    type="text"
                    value={objetosEnvolvidos}
                    onChange={(e) => setObjetosEnvolvidos(e.target.value)}
                    placeholder="Ex: Celular marca X com capinha azul, estojo preto, fechadura danificada"
                    className="campo-input"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 7: MOTIVO DA SOLICITAÇÃO */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">7. Finalidade / Motivo da Solicitação</h2>
                  <p className="text-xs text-on-surface-variant">Informe o destino institucional do parecer de vídeo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOTIVOS_SOLICITACAO.map((motivo) => (
                  <button
                    key={motivo}
                    type="button"
                    onClick={() => setMotivoSolicitacao(motivo)}
                    className={cn(
                      "p-4 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between gap-2",
                      motivoSolicitacao === motivo
                        ? "bg-primary text-black border-primary shadow-glow-yellow"
                        : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                    )}
                  >
                    <span>{motivo}</span>
                    {motivoSolicitacao === motivo && <Check size={16} className="shrink-0 text-black" />}
                  </button>
                ))}
              </div>

              {motivoSolicitacao === 'Outro' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Descreva a Finalidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={motivoOutroDescricao}
                    onChange={(e) => setMotivoOutroDescricao(e.target.value)}
                    placeholder="Descreva detalhadamente para que finalidade as imagens serão utilizadas"
                    className="campo-input"
                  />
                </div>
              )}
            </div>

            {/* Botão de Submissão */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
              <button
                type="submit"
                disabled={enviando || isIntervaloAproximadoInvalido}
                className={cn(
                  "w-full sm:w-auto btn-primary !py-4 !px-8 text-sm font-black tracking-widest uppercase shadow-glow-yellow flex items-center justify-center gap-3",
                  (enviando || isIntervaloAproximadoInvalido) && "opacity-50 cursor-not-allowed"
                )}
              >
                {enviando ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Enviando Solicitação...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Enviar Solicitação de Câmeras
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MEUS CHAMADOS (CONSULTA DO SOLICITANTE)                           */}
      {/* ========================================================================= */}
      {tabAtiva === 'meus-chamados' && (
        <div className="space-y-6">
          {/* Barra de Filtro de E-mail */}
          <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Minhas Solicitações de Câmeras
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Consulte os pareceres técnicos, status e imagens localizadas das suas solicitações
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailConsulta}
                  onChange={(e) => setEmailConsulta(e.target.value)}
                  placeholder="Filtrar por e-mail..."
                  className="campo-input !py-2.5 !px-4 text-xs max-w-xs"
                />
                <button
                  onClick={buscarSolicitacoes}
                  className="btn-secondary !p-2.5"
                  title="Atualizar lista"
                >
                  <RefreshCw size={16} className={carregandoLista ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Chamados do Usuário */}
          {carregandoLista ? (
            <div className="text-center py-12 text-zinc-400">
              <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-primary" />
              Carregando solicitações...
            </div>
          ) : minhasSolicitacoes.length === 0 ? (
            <div className="bg-surface border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <Camera size={48} className="mx-auto text-zinc-600" />
              <h3 className="text-base font-bold text-white">Nenhuma solicitação encontrada</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Não localizamos nenhuma solicitação vinculada ao e-mail informado. Preencha uma nova solicitação na aba ao lado!
              </p>
              <button
                onClick={() => setTabAtiva('formulario')}
                className="btn-primary !py-2.5 !px-5 text-xs inline-flex items-center gap-2"
              >
                <PlusCircle size={16} /> Fazer Nova Solicitação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {minhasSolicitacoes.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-white/10 rounded-3xl p-6 space-y-5 transition-all hover:border-primary/30"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-sm bg-black/50 border border-white/10 px-3 py-1 rounded-xl text-primary">
                        {item.numero_protocolo}
                      </span>
                      {renderStatusBadge(item.status)}
                      <span className="text-xs text-zinc-400">
                        Criado em {new Date(item.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <button
                      onClick={() => gerarPdfSolicitacaoCFTV(item)}
                      className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 self-start md:self-auto"
                    >
                      <Download size={14} /> PDF Oficial
                    </button>
                  </div>

                  {/* Informações da Ocorrência */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Local & Andar</span>
                      <p className="text-white font-bold">{item.ambiente} ({item.andar})</p>
                      {item.ponto_referencia && (
                        <p className="text-zinc-400 text-[11px]">Ref: {item.ponto_referencia}</p>
                      )}
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Data & Horário</span>
                      <p className="text-white font-bold">
                        {item.data_fato ? new Date(item.data_fato + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'}
                      </p>
                      <p className="text-zinc-400 text-[11px] font-mono">
                        {item.horario_inicio} às {item.horario_termino} ({item.tipo_intervalo})
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Tipo de Ocorrência</span>
                      <p className="text-white font-bold">
                        {item.tipo_ocorrencia}
                        {item.tipo_ocorrencia_outro ? ` - ${item.tipo_ocorrencia_outro}` : ''}
                      </p>
                      <p className="text-zinc-400 text-[11px] truncate">
                        Finalidade: {item.motivo_solicitacao}
                      </p>
                    </div>
                  </div>

                  {/* Relato dos Fatos */}
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-xs text-zinc-300 space-y-1">
                    <span className="text-zinc-400 font-bold block text-[11px]">Relato do Solicitante:</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{item.descricao_fatos}</p>
                  </div>

                  {/* PARECER TÉCNICO DA EQUIPE CFTV */}
                  {item.status !== 'Em Espera' && (
                    <div className={cn(
                      "p-4 rounded-2xl border text-xs space-y-2",
                      item.status === 'Atendido' || item.status === 'Finalizado' 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : item.status === 'Cancelado'
                        ? "bg-red-950/20 border-red-500/30 text-red-200"
                        : "bg-blue-950/20 border-blue-500/30 text-blue-200"
                    )}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                          {item.status === 'Cancelado' ? <X size={14} /> : <CheckCircle2 size={14} />}
                          Parecer da Equipe CFTV / Segurança
                        </span>
                        {item.analisado_por_nome && (
                          <span className="text-[10px] text-zinc-400">
                            Analisado por: {item.analisado_por_nome} em {item.analisado_em ? new Date(item.analisado_em).toLocaleDateString('pt-BR') : ''}
                          </span>
                        )}
                      </div>

                      {item.cameras_analisadas && (
                        <p className="text-[11px]">
                          <strong>Câmeras Analisadas:</strong> {item.cameras_analisadas}
                        </p>
                      )}

                      {item.parecer_analise && (
                        <p className="leading-relaxed whitespace-pre-wrap">
                          <strong>Parecer / Desfecho:</strong> {item.parecer_analise}
                        </p>
                      )}

                      {item.status === 'Cancelado' && item.justificativa_cancelamento && (
                        <p className="leading-relaxed font-semibold text-red-300">
                          <strong>Motivo do Cancelamento / Recusa:</strong> {item.justificativa_cancelamento}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: PAINEL DE GESTÃO & APROVAÇÃO (ADMIN / CFTV)                         */}
      {/* ========================================================================= */}
      {tabAtiva === 'gestao' && (
        <div className="space-y-6">
          {/* Controles de Filtro */}
          <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-primary" />
                  Painel de Aprovação e Gestão de Câmeras
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Gerencie pedidos de verificação, emita pareceres e altere o status das requisições
                </p>
              </div>

              <button
                onClick={buscarSolicitacoes}
                className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-2 self-start md:self-auto"
              >
                <RefreshCw size={16} className={carregandoLista ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  placeholder="Buscar por protocolo, solicitante, ambiente, relato..."
                  className="campo-input !pl-11 !py-3 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {['todos', 'Em Espera', 'Em Análise', 'Atendido', 'Finalizado', 'Cancelado'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFiltroStatus(st)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                      filtroStatus === st
                        ? "bg-primary text-black border-primary font-black"
                        : "bg-surface-container-high text-on-surface-variant border-white/5 hover:border-white/20"
                    )}
                  >
                    {st === 'todos' ? 'Todos os Status' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Chamados no Painel ADM */}
          {carregandoLista ? (
            <div className="text-center py-12 text-zinc-400">
              <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-primary" />
              Carregando chamados...
            </div>
          ) : solicitacoesFiltradasGestao.length === 0 ? (
            <div className="bg-surface border border-white/5 rounded-3xl p-12 text-center text-zinc-400">
              Nenhuma solicitação encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoesFiltradasGestao.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-white/10 rounded-3xl p-6 space-y-5 transition-all hover:border-primary/40"
                >
                  {/* Topo do Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-sm bg-black/60 border border-amber-500/30 px-3 py-1 rounded-xl text-primary">
                        {item.numero_protocolo}
                      </span>
                      {renderStatusBadge(item.status)}
                      <span className="text-xs text-zinc-300 font-bold">
                        Solicitante: {item.solicitante_nome} ({item.solicitante_cargo})
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
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
                        className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5 shadow-glow-yellow"
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
                          onClick={() => handleExcluirSolicitacao(item.id, item.numero_protocolo)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Excluir Chamado"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid de Detalhes da Ocorrência */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Local & Andar</span>
                      <p className="text-white font-bold">{item.ambiente} ({item.andar})</p>
                      {item.ponto_referencia && <p className="text-zinc-400 text-[11px]">Ref: {item.ponto_referencia}</p>}
                    </div>

                    <div className="bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Data & Horário</span>
                      <p className="text-white font-bold">
                        {item.data_fato ? new Date(item.data_fato + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'}
                      </p>
                      <p className="text-zinc-400 text-[11px] font-mono">
                        {item.horario_inicio} às {item.horario_termino} ({item.tipo_intervalo})
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Classificação</span>
                      <p className="text-white font-bold">{item.tipo_ocorrencia}</p>
                      <p className="text-zinc-400 text-[11px] truncate">Finalidade: {item.motivo_solicitacao}</p>
                    </div>

                    <div className="bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
                      <span className="text-zinc-500 uppercase font-bold text-[10px] block">Envolvidos & Pistas</span>
                      <p className="text-zinc-300 text-[11px] truncate">
                        {item.envolvidos_nomes_turmas || 'Nomes não informados'}
                      </p>
                      {item.envolvidos_caracteristicas && (
                        <p className="text-zinc-400 text-[10px] truncate">Visuais: {item.envolvidos_caracteristicas}</p>
                      )}
                    </div>
                  </div>

                  {/* Relato */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-xs text-zinc-300 space-y-1">
                    <span className="text-zinc-400 font-bold block text-[11px]">Relato dos Fatos:</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{item.descricao_fatos}</p>
                  </div>

                  {/* Informações adicionais de deslocamento se houver */}
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

                  {/* Parecer Gravado */}
                  {item.parecer_analise && (
                    <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl text-xs space-y-1 text-blue-200">
                      <span className="font-bold text-blue-300 block text-[11px]">
                        Parecer Técnico ({item.analisado_por_nome || 'Operador'}):
                      </span>
                      {item.cameras_analisadas && (
                        <p className="text-[11px] text-zinc-300"><strong>Câmeras:</strong> {item.cameras_analisadas}</p>
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
      {/* MODAL DE PARECER / ANÁLISE ADMINISTRATIVA                                */}
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
                      Protocolo: {solicitacaoEmEdicao.numero_protocolo} • {solicitacaoEmEdicao.solicitante_nome}
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
                  Câmeras Analisadas (Identificação das Câmeras)
                </label>
                <input
                  type="text"
                  value={camerasAnalisadas}
                  onChange={(e) => setCamerasAnalisadas(e.target.value)}
                  placeholder="Ex: CAM-04 Pátio Central, CAM-09 Corredor Bloco B"
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
                  placeholder="Ex: Imagens localizadas na câmera 04 entre 08:15 e 08:22. Aluno identificado com mochila camuflada. Arquivo de vídeo salvo na pasta de evidências sob o código EVID-2026-042..."
                  className="campo-input text-xs leading-relaxed"
                />
              </div>

              {/* Justificativa de Cancelamento se Status for 'Cancelado' */}
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
                    placeholder="Ex: Horário informado com intervalo muito amplo (> 2h) e sem movimentação relevante no setor indicado. Solicitação cancelada por falta de precisão..."
                    className="campo-input text-xs leading-relaxed !border-red-500/40"
                  />
                </div>
              )}

              {/* Botões do Modal */}
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

      {/* MODAL DE QR CODE E CARTAZ */}
      <ModalQRCodeCFTV
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
