import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Camera, PlusCircle, FileText, CheckCircle2, Clock, 
  AlertTriangle, Shield, Download, User, 
  MapPin, Calendar, Check, X, RefreshCw, ChevronRight,
  FileCheck, ShieldAlert, ArrowRight, Edit3, Info, Lock, 
  Copy, Share2, Search, KeyRound, ExternalLink, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { SolicitacaoCFTV, TipoIntervaloCftv, StatusCftv, SolicitanteProfile } from '../types';
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

export default function PortalSolicitacaoCameras() {
  const [searchParams] = useSearchParams();

  // Tabs do Solicitante: 'formulario' | 'meus-chamados'
  const [tabAtiva, setTabAtiva] = useState<'formulario' | 'meus-chamados'>('formulario');

  // Perfil do Solicitante (Pré-cadastro gravado em LocalStorage)
  const [perfil, setPerfil] = useState<SolicitanteProfile>({
    nome: '',
    cargo: '',
    email: ''
  });
  const [isEditandoPerfil, setIsEditandoPerfil] = useState(false);

  // Estados dos Campos do Perfil (Inputs)
  const [inputNome, setInputNome] = useState('');
  const [inputCargo, setInputCargo] = useState('');
  const [inputEmail, setInputEmail] = useState('');

  // Busca Universal por E-mail ou Protocolo
  const [termoConsulta, setTermoConsulta] = useState('');

  // Listas de Andares e Locais
  const [andares, setAndares] = useState<string[]>(ANDARES_PADRAO);
  const [locais, setLocais] = useState<string[]>(SETORES_SUGESTOES);

  // Estados do Formulário de Solicitação
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
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);

  // Lista de chamados do solicitante
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState<SolicitacaoCFTV[]>([]);
  const [carregandoChamados, setCarregandoChamados] = useState(false);

  // 1. Carregar Pré-cadastro do LocalStorage e Parâmetros da URL
  useEffect(() => {
    try {
      const paramProtocolo = searchParams.get('protocolo');
      const paramEmail = searchParams.get('email');

      if (paramProtocolo) {
        setTermoConsulta(paramProtocolo);
        setTabAtiva('meus-chamados');
        consultarChamadosDireto(paramProtocolo);
      } else if (paramEmail) {
        setTermoConsulta(paramEmail);
        setTabAtiva('meus-chamados');
        consultarChamadosDireto(paramEmail);
      }

      const salvo = localStorage.getItem('sesi_cftv_solicitante_profile');
      if (salvo) {
        const parsed: SolicitanteProfile = JSON.parse(salvo);
        setPerfil(parsed);
        setInputNome(parsed.nome || '');
        setInputCargo(parsed.cargo || '');
        setInputEmail(parsed.email || '');
        if (!paramProtocolo && !paramEmail && parsed.email) {
          setTermoConsulta(parsed.email);
          consultarChamadosDireto(parsed.email);
        }
      } else {
        if (!paramProtocolo && !paramEmail) {
          setIsEditandoPerfil(true);
        }
      }
    } catch (e) {
      console.error('Erro ao ler perfil salvo:', e);
      setIsEditandoPerfil(true);
    }
  }, [searchParams]);

  // 2. Carregar Andares e Locais públicos
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

  // 3. Consulta Rápida por Protocolo OU E-mail
  const consultarChamadosDireto = async (buscaParam?: string) => {
    const termo = (buscaParam !== undefined ? buscaParam : termoConsulta).trim();
    if (!termo) {
      if (perfil.email) {
        buscarPorEmail(perfil.email);
      }
      return;
    }

    setCarregandoChamados(true);
    try {
      // Se for formato de protocolo (ex: CFTV-2026-0001 ou contém 'CFTV')
      if (termo.toUpperCase().startsWith('CFTV') || termo.includes('-')) {
        const { data, error } = await supabase
          .from('solicitacoes_cftv')
          .select('*')
          .ilike('numero_protocolo', `%${termo}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMinhasSolicitacoes(data || []);
      } else {
        // Busca por e-mail
        buscarPorEmail(termo);
      }
    } catch (err) {
      console.error('Erro ao consultar chamados:', err);
    } finally {
      setCarregandoChamados(false);
    }
  };

  const buscarPorEmail = async (email: string) => {
    if (!email || !email.trim()) return;
    setCarregandoChamados(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_cftv')
        .select('*')
        .ilike('solicitante_email', email.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMinhasSolicitacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar chamados por e-mail:', err);
    } finally {
      setCarregandoChamados(false);
    }
  };

  // Salvar / Atualizar Pré-Cadastro
  const handleSalvarPerfil = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputNome.trim() || !inputCargo.trim() || !inputEmail.trim()) {
      alert('Por favor, preencha Nome, Cargo e E-mail institucional para completar o pré-cadastro.');
      return;
    }

    const novoPerfil: SolicitanteProfile = {
      nome: inputNome.trim(),
      cargo: inputCargo.trim(),
      email: inputEmail.trim().toLowerCase()
    };

    setPerfil(novoPerfil);
    localStorage.setItem('sesi_cftv_solicitante_profile', JSON.stringify(novoPerfil));
    setIsEditandoPerfil(false);
    setTermoConsulta(novoPerfil.email);
    consultarChamadosDireto(novoPerfil.email);
  };

  const handleLimparPerfil = () => {
    if (confirm('Deseja desconectar este perfil deste aparelho? Você poderá consultar seus chamados a qualquer momento digitando seu e-mail ou número de protocolo.')) {
      localStorage.removeItem('sesi_cftv_solicitante_profile');
      setPerfil({ nome: '', cargo: '', email: '' });
      setInputNome('');
      setInputCargo('');
      setInputEmail('');
      setMinhasSolicitacoes([]);
      setIsEditandoPerfil(true);
    }
  };

  // Cálculo de Horário
  const duracaoMinutos = useMemo(() => {
    if (!horarioInicio || !horarioTermino) return 0;
    const [h1, m1] = horarioInicio.split(':').map(Number);
    const [h2, m2] = horarioTermino.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    
    let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutos < 0) totalMinutos += 24 * 60;
    return totalMinutos;
  }, [horarioInicio, horarioTermino]);

  // Trava do formulário: se "Aproximado", diferença não pode exceder 60 minutos (1 hora)
  const isIntervaloAproximadoInvalido = useMemo(() => {
    return tipoIntervalo === 'Aproximado' && duracaoMinutos > 60;
  }, [tipoIntervalo, duracaoMinutos]);

  // Enviar Solicitação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeFinal = perfil.nome || inputNome.trim();
    const cargoFinal = perfil.cargo || inputCargo.trim();
    const emailFinal = perfil.email || inputEmail.trim();

    if (!nomeFinal || !cargoFinal || !emailFinal) {
      alert('Por favor, preencha seus dados de identificação antes de enviar.');
      setIsEditandoPerfil(true);
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

    if (!perfil.email) {
      handleSalvarPerfil();
    }

    setEnviando(true);
    try {
      const payload = {
        solicitante_nome: nomeFinal,
        solicitante_cargo: cargoFinal,
        solicitante_email: emailFinal.toLowerCase(),
        
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
      
      // Limpar campos de ocorrência
      setDescricaoFatos('');
      setPontoReferencia('');
      setEnvolvidosNomesTurmas('');
      setEnvolvidosCaracteristicas('');
      setEnvolvidosSentidoFuga('');
      setObjetosEnvolvidos('');
      setTipoOcorrenciaOutro('');
      setMotivoOutroDescricao('');

      setTermoConsulta(emailFinal);
      consultarChamadosDireto(emailFinal);
    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      alert(`Erro ao registrar solicitação: ${err.message || 'Falha de conexão.'}`);
    } finally {
      setEnviando(false);
    }
  };

  // Helper para copiar link direto de acompanhamento
  const handleCopiarLinkProtocolo = (protocolo: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/cameras?protocolo=${protocolo}`;
    navigator.clipboard.writeText(url);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 2500);
  };

  // Helper para abrir no WhatsApp
  const handleCompartilharWhatsApp = (protocolo: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/cameras?protocolo=${protocolo}`;
    const msg = encodeURIComponent(`Olá! Minha solicitação de imagens CFTV no SESI Connect foi registrada sob o protocolo *${protocolo}*. Para acompanhar o andamento e o parecer técnico, acesse: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  // Render do Badge de Status
  const renderStatusBadge = (status: StatusCftv) => {
    switch (status) {
      case 'Em Espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
            <Clock size={14} className="animate-spin-slow" /> Em Espera (Pendente)
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
            <RefreshCw size={14} className="animate-spin" /> Em Análise pela Equipe
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

  // Render da Linha do Tempo / Timeline de Status
  const renderTimelineStatus = (item: SolicitacaoCFTV) => {
    const isCancelado = item.status === 'Cancelado';
    const isAtendido = item.status === 'Atendido' || item.status === 'Finalizado';
    const isEmAnalise = item.status === 'Em Análise' || isAtendido;

    return (
      <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 my-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
          Progresso do Chamado
        </span>
        <div className="grid grid-cols-3 gap-2 text-center relative">
          {/* Passo 1: Enviado */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shadow-glow-yellow">
              <Check size={14} />
            </div>
            <span className="text-[11px] font-bold text-white">1. Enviado</span>
            <span className="text-[9px] text-zinc-400 font-mono">
              {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Passo 2: Análise Técnica */}
          <div className="flex flex-col items-center space-y-1">
            <div className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all",
              isEmAnalise
                ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                : "bg-zinc-900 text-zinc-600 border-zinc-800"
            )}>
              {isEmAnalise ? <RefreshCw size={14} className={item.status === 'Em Análise' ? "animate-spin" : ""} /> : "2"}
            </div>
            <span className={cn("text-[11px] font-bold", isEmAnalise ? "text-blue-300" : "text-zinc-500")}>
              2. Em Análise
            </span>
            <span className="text-[9px] text-zinc-400">
              {item.status === 'Em Análise' ? 'Verificando câmeras' : isAtendido ? 'Concluída' : 'Aguardando'}
            </span>
          </div>

          {/* Passo 3: Conclusão / Parecer */}
          <div className="flex flex-col items-center space-y-1">
            <div className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all",
              isCancelado 
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : isAtendido
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-900 text-zinc-600 border-zinc-800"
            )}>
              {isCancelado ? <X size={14} /> : isAtendido ? <CheckCircle2 size={14} /> : "3"}
            </div>
            <span className={cn(
              "text-[11px] font-bold",
              isCancelado ? "text-red-300" : isAtendido ? "text-emerald-300" : "text-zinc-500"
            )}>
              {isCancelado ? '3. Recusado' : '3. Atendido'}
            </span>
            <span className="text-[9px] text-zinc-400">
              {isCancelado ? 'Ver motivo abaixo' : isAtendido ? 'Parecer emitido' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pb-24 selection:bg-primary selection:text-black">
      {/* Barra de Topo do Portal */}
      <header className="bg-surface/90 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-black font-black flex items-center justify-center text-xl shadow-glow-yellow border border-primary">
              S
            </div>
            <div>
              <span className="text-base md:text-lg font-black text-white leading-none block">
                SESI Connect
              </span>
              <span className="text-[10px] md:text-xs text-amber-400 font-bold uppercase tracking-wider block">
                Portal de Solicitação de Imagens (CFTV)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTabAtiva('meus-chamados');
                if (perfil.email) consultarChamadosDireto(perfil.email);
              }}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 bg-surface-container-high px-3 py-2 rounded-xl border border-white/5 transition-colors font-bold"
            >
              <Search size={14} className="text-primary" />
              <span className="hidden sm:inline">Consultar</span> Meus Chamados
            </button>

            <a
              href="/login"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-surface-container-high px-2.5 py-2 rounded-xl border border-white/5 transition-colors"
              title="Acesso restrito de Administradores"
            >
              <Lock size={12} className="text-amber-400" />
              <span className="hidden md:inline">ADM</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* Banner de Pré-Cadastro do Solicitante */}
        <div className="bg-surface border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Pré-Cadastro do Solicitante</h2>
                <p className="text-xs text-on-surface-variant">
                  Seus dados ficam gravados neste aparelho para preenchimento rápido e consulta de chamados
                </p>
              </div>
            </div>

            {perfil.nome && !isEditandoPerfil && (
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setIsEditandoPerfil(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Edit3 size={14} /> Alterar Dados
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={handleLimparPerfil}
                  className="text-xs font-bold text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Sair / Trocar
                </button>
              </div>
            )}
          </div>

          {/* Perfil Ativo */}
          {perfil.nome && !isEditandoPerfil ? (
            <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-white">{perfil.nome}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {perfil.cargo}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">{perfil.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <Check size={14} /> Solicitante Conectado
                </span>
              </div>
            </div>
          ) : (
            /* Formulário de Pré-Cadastro */
            <form onSubmit={handleSalvarPerfil} className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={inputNome}
                    onChange={(e) => setInputNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo da Silva"
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
                    value={inputCargo}
                    onChange={(e) => setInputCargo(e.target.value)}
                    placeholder="Ex: Professor, Coordenador, Inspetor"
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
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="seu.email@sesisp.org.br"
                    className="campo-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-zinc-400">
                  💡 Seus pedidos ficarão vinculados ao seu e-mail para consulta posterior.
                </p>
                <div className="flex items-center gap-2">
                  {perfil.nome && (
                    <button
                      type="button"
                      onClick={() => setIsEditandoPerfil(false)}
                      className="btn-secondary !py-2.5 !px-4 text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-primary !py-2.5 !px-5 text-xs flex items-center gap-2 shadow-glow-yellow"
                  >
                    <Check size={16} /> Salvar Pré-Cadastro
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setTabAtiva('formulario')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all",
              tabAtiva === 'formulario'
                ? "bg-primary text-black shadow-glow-yellow"
                : "text-on-surface-variant hover:bg-white/5 hover:text-white"
            )}
          >
            <PlusCircle size={18} />
            Nova Solicitação
          </button>

          <button
            onClick={() => {
              setTabAtiva('meus-chamados');
              if (perfil.email) consultarChamadosDireto(perfil.email);
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all",
              tabAtiva === 'meus-chamados'
                ? "bg-primary text-black shadow-glow-yellow"
                : "text-on-surface-variant hover:bg-white/5 hover:text-white"
            )}
          >
            <FileText size={18} />
            Meus Chamados {minhasSolicitacoes.length > 0 && `(${minhasSolicitacoes.length})`}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: FORMULÁRIO DE SOLICITAÇÃO                                          */}
        {/* ========================================================================= */}
        {tabAtiva === 'formulario' && (
          <div className="space-y-8">
            {/* Card de Confirmação com Links de Compartilhamento */}
            {protocoloGerado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-white">
                        Solicitação de Imagens Enviada com Sucesso!
                      </h3>
                      <p className="text-xs md:text-sm text-emerald-300 font-medium">
                        Protocolo de Acompanhamento: <span className="font-mono font-bold text-white bg-black/60 px-2.5 py-1 rounded border border-emerald-500/40 text-base">{protocoloGerado}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {solicitacaoRecente && (
                      <button
                        onClick={() => gerarPdfSolicitacaoCFTV(solicitacaoRecente)}
                        className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-2"
                      >
                        <Download size={16} /> Baixar Comprovante PDF
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setTabAtiva('meus-chamados');
                        consultarChamadosDireto(protocoloGerado);
                        setProtocoloGerado(null);
                      }}
                      className="btn-primary !py-2.5 !px-4 text-xs flex items-center gap-2 shadow-glow-yellow"
                    >
                      Acompanhar Status <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Como Acessar Depois / Guardar Comprovante */}
                <div className="bg-black/50 border border-emerald-500/20 rounded-2xl p-4 space-y-3 text-xs">
                  <span className="font-bold text-emerald-300 block uppercase tracking-wider text-[11px]">
                    📲 Como Acompanhar Esta Solicitação Mais Tarde:
                  </span>
                  <p className="text-zinc-300">
                    Você pode consultar o andamento deste chamado pelo seu celular ou computador a qualquer momento das seguintes formas:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleCopiarLinkProtocolo(protocoloGerado)}
                      className="bg-surface-container-high hover:bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between text-left transition-colors"
                    >
                      <div>
                        <strong className="text-white block text-xs">Copiar Link Direto</strong>
                        <span className="text-zinc-400 text-[10px]">Guarde o link direto deste chamado</span>
                      </div>
                      <Copy size={16} className={copiadoFeedback ? "text-emerald-400" : "text-primary"} />
                    </button>

                    <button
                      onClick={() => handleCompartilharWhatsApp(protocoloGerado)}
                      className="bg-emerald-950/60 hover:bg-emerald-900/60 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between text-left transition-colors"
                    >
                      <div>
                        <strong className="text-emerald-200 block text-xs">Salvar no WhatsApp</strong>
                        <span className="text-emerald-300/70 text-[10px]">Envie o link para o seu WhatsApp</span>
                      </div>
                      <MessageCircle size={18} className="text-emerald-400" />
                    </button>
                  </div>

                  {copiadoFeedback && (
                    <p className="text-emerald-400 text-[11px] font-bold text-center pt-1 animate-pulse">
                      ✓ Link copiado para a área de transferência!
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SEÇÃO 2: DATA E HORÁRIO */}
              <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">2. Informações de Data e Horário</h2>
                    <p className="text-xs text-on-surface-variant">Delimite o momento para facilitar a localização das imagens</p>
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
                      Tipo de Intervalo *
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

                {/* Avisos de Regra */}
                {tipoIntervalo === 'Aproximado' && (
                  <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-3">
                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-300">Regra do Sistema:</strong> A diferença entre o início e o término deve ser de no máximo <strong>1 hora</strong> (margem de 30 min a 1 hora).
                    </div>
                  </div>
                )}

                {tipoIntervalo === 'Amplo' && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">⚠️ Aviso:</strong> Solicitações com intervalo amplo (superior a 1 hora) demandam análise prolongada de vídeo e <strong>poderão ser canceladas ou recusadas</strong> por falta de precisão nas informações. Tente delimitar ao máximo o horário antes de enviar.
                    </div>
                  </div>
                )}

                {/* Horários Início e Fim */}
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
                  <span className="text-zinc-400">
                    Duração estimada informada: <strong className="text-white font-mono">{Math.floor(duracaoMinutos / 60)}h {duracaoMinutos % 60}min ({duracaoMinutos} min)</strong>
                  </span>

                  {isIntervaloAproximadoInvalido && (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> Trava: Intervalo superior a 1h para modo Aproximado. Reduza o tempo ou selecione 'Amplo'.
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
                    <p className="text-xs text-on-surface-variant">Andar, ambiente escolar e pontos visuais de referência</p>
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
                      list="portal-locais-list"
                      value={ambiente}
                      onChange={(e) => setAmbiente(e.target.value)}
                      placeholder="Ex: Pátio, Corredor Bloco B, Sala 14, Portão Principal, Refeitório, Quadra"
                      className="campo-input"
                    />
                    <datalist id="portal-locais-list">
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
                    <p className="text-xs text-on-surface-variant">Classifique a ocorrência</p>
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
                      placeholder="Descreva a ocorrência"
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
                    <p className="text-xs text-on-surface-variant">Relato detalhado com clareza (sequência dos fatos e desfecho)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Relato do Ocorrido *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={descricaoFatos}
                    onChange={(e) => setDescricaoFatos(e.target.value)}
                    placeholder="Descreva com detalhes o que aconteceu, a sequência dos fatos e o desfecho..."
                    className="campo-input text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* SEÇÃO 6: IDENTIFICAÇÃO DOS ENVOLVIDOS */}
              <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">6. Identificação dos Envolvidos e Deslocamento</h2>
                    <p className="text-xs text-on-surface-variant">Traços visuais para localização nas filmagens</p>
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
                      placeholder="Ex: Alunos do 8º A ou 1º EM"
                      className="campo-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Características Visuais (Roupas, Mochila, etc.)
                    </label>
                    <input
                      type="text"
                      value={envolvidosCaracteristicas}
                      onChange={(e) => setEnvolvidosCaracteristicas(e.target.value)}
                      placeholder="Ex: Casaco vermelho, mochila preta, tênis branco"
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
                      placeholder="Ex: Vieram da quadra e foram para o bloco B"
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
                      placeholder="Ex: Celular, estojo preto, fechadura"
                      className="campo-input"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 7: FINALIDADE */}
              <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">7. Finalidade / Motivo da Solicitação</h2>
                    <p className="text-xs text-on-surface-variant">Destino institucional das imagens solicitadas</p>
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
                      placeholder="Informe detalhadamente o motivo"
                      className="campo-input"
                    />
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={enviando || isIntervaloAproximadoInvalido}
                  className={cn(
                    "w-full sm:w-auto btn-primary !py-4 !px-8 text-sm font-black uppercase tracking-wider shadow-glow-yellow flex items-center justify-center gap-3",
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
                      Enviar Solicitação de Imagens
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: MEUS CHAMADOS / CONSULTA UNIVERSAL                                 */}
        {/* ========================================================================= */}
        {tabAtiva === 'meus-chamados' && (
          <div className="space-y-6">
            {/* Campo de Consulta por Protocolo ou E-mail */}
            <div className="bg-surface border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Consultar Minhas Solicitações de Câmeras
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Digite seu e-mail institucional ou o número de protocolo para ver o status e o parecer
                  </p>
                </div>

                <button
                  onClick={() => consultarChamadosDireto()}
                  className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 self-start md:self-auto"
                >
                  <RefreshCw size={14} className={carregandoChamados ? "animate-spin" : ""} />
                  Atualizar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={termoConsulta}
                    onChange={(e) => setTermoConsulta(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') consultarChamadosDireto();
                    }}
                    placeholder="Digite seu e-mail (ex: nome@sesisp.org.br) ou Protocolo (ex: CFTV-2026-0001)..."
                    className="campo-input !pl-11 !py-3 text-xs w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => consultarChamadosDireto()}
                  className="w-full sm:w-auto btn-primary !py-3 !px-6 text-xs flex items-center justify-center gap-2 shadow-glow-yellow"
                >
                  <Search size={16} /> Buscar Chamados
                </button>
              </div>
            </div>

            {/* Lista de Chamados Encontrados */}
            {carregandoChamados ? (
              <div className="text-center py-16 text-zinc-400">
                <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-primary" />
                Buscando solicitações no sistema...
              </div>
            ) : minhasSolicitacoes.length === 0 ? (
              <div className="bg-surface border border-white/5 rounded-3xl p-16 text-center space-y-4 shadow-lg">
                <Camera size={48} className="mx-auto text-zinc-600" />
                <h4 className="text-base font-bold text-white">Nenhum chamado localizado</h4>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Não encontramos nenhuma solicitação com o termo buscado. Certifique-se de digitar o mesmo e-mail informado no momento do envio ou o código do protocolo.
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
                    className="bg-surface border border-white/10 rounded-3xl p-6 space-y-4 transition-all hover:border-primary/40 shadow-xl"
                  >
                    {/* Topo do Card */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-black text-sm bg-black/60 border border-amber-500/30 px-3 py-1 rounded-xl text-primary">
                          {item.numero_protocolo}
                        </span>
                        {renderStatusBadge(item.status)}
                        <span className="text-xs text-zinc-400 font-mono">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                        <button
                          onClick={() => handleCopiarLinkProtocolo(item.numero_protocolo)}
                          className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                          title="Copiar link para consultar este chamado depois"
                        >
                          <Copy size={14} /> Link do Chamado
                        </button>

                        <button
                          onClick={() => handleCompartilharWhatsApp(item.numero_protocolo)}
                          className="bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Enviar protocolo para o WhatsApp"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </button>

                        <button
                          onClick={() => gerarPdfSolicitacaoCFTV(item)}
                          className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </div>

                    {/* Linha do Tempo / Timeline */}
                    {renderTimelineStatus(item)}

                    {/* Resumo da Ocorrência */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-zinc-500 uppercase font-bold text-[10px] block">Local da Ocorrência</span>
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
                        <p className="text-zinc-400 text-[11px]">Finalidade: {item.motivo_solicitacao}</p>
                      </div>
                    </div>

                    {/* Relato */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-xs text-zinc-300 space-y-1">
                      <span className="text-zinc-400 font-bold block text-[11px]">Relato do Solicitante:</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{item.descricao_fatos}</p>
                    </div>

                    {/* RESPOSTA / PARECER DA EQUIPE DE CÂMERAS */}
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
                            Resposta da Equipe Técnica de Monitoramento
                          </span>
                          {item.analisado_por_nome && (
                            <span className="text-[10px] text-zinc-400">
                              Analisado por: {item.analisado_por_nome}
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
                            <strong>Parecer Técnico:</strong> {item.parecer_analise}
                          </p>
                        )}

                        {item.status === 'Cancelado' && item.justificativa_cancelamento && (
                          <p className="leading-relaxed font-semibold text-red-300">
                            <strong>Motivo da Recusa / Cancelamento:</strong> {item.justificativa_cancelamento}
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
      </main>
    </div>
  );
}
