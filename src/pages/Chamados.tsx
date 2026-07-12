import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Search, PlusCircle, Download, FileSpreadsheet, Loader2, Calendar, User, Tag, 
  CheckCircle2, Copy, X, Printer, Trash2, AlertTriangle, ShieldAlert, Clock, Pencil, 
  Filter, Check, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, 
  Settings, Image, Eye, Trash, ArrowDown, UserMinus, UserCheck, Shield, Key, EyeOff,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../lib/utils';

// Interfaces do Módulo
interface Andar {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

interface Local {
  id: string;
  nome: string;
  andar_id: string | null;
  ordem: number;
  ativo: boolean;
}

interface TipoChamado {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

interface Chamado {
  id: string;
  numero_chamado: string;
  usuario_id: string;
  solicitante: string;
  andar_id: string;
  local_id: string;
  tipo_id: string;
  tipo_outro_descricao: string | null;
  descricao: string;
  status: 'Aberto' | 'Em Atendimento' | 'Aguardando Validação' | 'Concluído' | 'Cancelado';
  created_at: string;
  updated_at: string;
  // Joins
  andares?: Andar;
  locais?: Local;
  tipos_chamado?: TipoChamado;
}

interface Comentario {
  id: string;
  chamado_id: string;
  usuario_id: string;
  comentario: string;
  created_at: string;
}

interface Anexo {
  id: string;
  chamado_id: string;
  comentario_id: string | null;
  nome_arquivo: string;
  caminho_storage: string;
  url: string;
  usuario_id: string;
  created_at: string;
}

interface Historico {
  id: string;
  chamado_id: string;
  usuario_id: string;
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
  created_at: string;
}

export default function ChamadosPage() {
  const { user, profile, isAdmin } = useAuth();
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'consulta' | 'novo' | 'config'>('consulta');
  const [subTabConfig, setSubTabConfig] = useState<'andares' | 'locais' | 'tipos'>('andares');

  // Estados dos Dados
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [andares, setAndares] = useState<Andar[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [tiposChamado, setTiposChamado] = useState<TipoChamado[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Estados de Filtro (Consulta)
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroSolicitante, setFiltroSolicitante] = useState('');
  const [filtroAndar, setFiltroAndar] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Ordenação e Paginação (Consulta)
  const [ordenacao, setOrdenacao] = useState<{ campo: keyof Chamado | 'andar' | 'local' | 'tipo'; ascendente: boolean }>({ campo: 'created_at', ascendente: false });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estados de Filtro/Pesquisa para CRUD de Configurações
  const [buscaConfig, setBuscaConfig] = useState('');
  const [filtroAndarConfig, setFiltroAndarConfig] = useState('');
  const [filtroAtivoConfig, setFiltroAtivoConfig] = useState('');

  // Estados do Novo Chamado
  const [andarId, setAndarId] = useState('');
  const [localId, setLocalId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [tipoOutroDescricao, setTipoOutroDescricao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotosUpload, setFotosUpload] = useState<File[]>([]);
  const [salvandoChamado, setSalvandoChamado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estados de Visualização / Edição de Chamado
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [fotosComentario, setFotosComentario] = useState<File[]>([]);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const commentCameraInputRef = useRef<HTMLInputElement>(null);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [mostrarMotivoRecusa, setMostrarMotivoRecusa] = useState(false);

  // Estados de Modais de Visualização de Foto
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);

  // Estados de CRUD Auxiliar (Andares, Locais, Tipos)
  const [editandoConfig, setEditandoConfig] = useState<{ id?: string; nome: string; andar_id?: string | null; ordem: number; ativo: boolean } | null>(null);
  const [carregandoConfigAction, setCarregandoConfigAction] = useState(false);

  // ---------------------------------------------------------------------------
  // Carregamento de Dados e Seed Inicial
  // ---------------------------------------------------------------------------
  const carregarDadosAuxiliares = async () => {
    try {
      const [resAndares, resLocais, resTipos] = await Promise.all([
        supabase.from('andares').select('*').order('ordem', { ascending: true }),
        supabase.from('locais').select('*').order('ordem', { ascending: true }),
        supabase.from('tipos_chamado').select('*').order('ordem', { ascending: true }),
      ]);

      let andaresData = resAndares.data || [];
      let locaisData = resLocais.data || [];
      let tiposData = resTipos.data || [];

      if (resAndares.data) setAndares(resAndares.data);
      if (resLocais.data) setLocais(resLocais.data);
      if (resTipos.data) setTiposChamado(resTipos.data);

      // Chamar rotina de inicialização automática se os dados estiverem vazios
      await rodarSeedSeVazio(andaresData, locaisData, tiposData);
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err);
    }
  };

  const rodarSeedSeVazio = async (listaAndares: Andar[], listaLocais: Local[], listaTipos: TipoChamado[]) => {
    let precisaRecarregar = false;
    let andaresAtuais = [...listaAndares];

    // 1. Seed Inicial de Andares (Térreo, 1º Andar, etc.) para vincularmos depósitos
    if (listaAndares.length === 0) {
      precisaRecarregar = true;
      const andaresPadrao = [
        { nome: 'Subsolo', ordem: 10, ativo: true },
        { nome: 'Térreo', ordem: 20, ativo: true },
        { nome: '1º Andar', ordem: 30, ativo: true },
        { nome: '2º Andar', ordem: 40, ativo: true },
        { nome: 'Bloco A', ordem: 50, ativo: true }
      ];
      const { data, error } = await supabase.from('andares').insert(andaresPadrao).select();
      if (!error && data) {
        andaresAtuais = data;
      }
    }

    // 2. Seed Inicial de Locais
    if (listaLocais.length === 0) {
      precisaRecarregar = true;
      const locaisParaInserir: any[] = [];
      let ordem = 10;

      // Salas de Aula (Sala 01 até Sala 31)
      for (let i = 1; i <= 31; i++) {
        const numStr = String(i).padStart(2, '0');
        locaisParaInserir.push({ nome: `Sala ${numStr}`, ordem: ordem, ativo: true });
        ordem += 10;
      }

      // Áreas Administrativas
      const admin = ['Secretaria', 'Direção', 'Coordenação', 'Monitoria', 'Sala dos Professores', 'Biblioteca'];
      admin.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Laboratórios
      const labs = ['Laboratório de Biologia', 'Laboratório de Química'];
      labs.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Ambientes de Apoio
      const apoio = ['Auditório', 'Refeitório', 'Cantina', 'Cozinha'];
      apoio.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Área Esportiva
      locaisParaInserir.push({ nome: 'Arena', ordem: ordem, ativo: true });
      ordem += 10;

      // Áreas Externas
      const externas = ['Pátio Lateral', 'Jardim de Inverno 1', 'Jardim de Inverno 2', 'Gramado'];
      externas.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Banheiros
      const banheiros = ['Banheiro Feminino', 'Banheiro Masculino', 'Banheiro PCD'];
      banheiros.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Estacionamentos
      const estacionamentos = ['Estacionamento S1', 'Estacionamento S2'];
      estacionamentos.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Outros Ambientes
      const outros = ['Corredor', 'Escadaria', 'Elevador', 'Portaria'];
      outros.forEach(n => {
        locaisParaInserir.push({ nome: n, ordem: ordem, ativo: true });
        ordem += 10;
      });

      // Depósitos (vincular depósito para cada andar cadastrado)
      andaresAtuais.forEach(a => {
        locaisParaInserir.push({
          nome: `Depósito - ${a.nome}`,
          andar_id: a.id,
          ordem: ordem,
          ativo: true
        });
        ordem += 10;
      });

      await supabase.from('locais').insert(locaisParaInserir);
    }

    // 3. Seed Inicial de Tipos de Chamado
    if (listaTipos.length === 0) {
      precisaRecarregar = true;
      const tiposPadrao = [
        'Elétrico', 'Hidráulico', 'Informática', 'Internet / Rede', 'Telefonia', 
        'Impressoras', 'Projetor / Datashow', 'Ar-condicionado', 'Iluminação', 
        'Mobiliário', 'Marcenaria', 'Serralheria', 'Pintura', 'Alvenaria', 
        'Gesso / Forro', 'Cobertura / Telhado', 'Vidraçaria', 'Limpeza', 
        'Jardinagem', 'Controle de Pragas', 'Equipamentos', 'Segurança', 
        'Acessibilidade', 'Outro'
      ];
      const tiposParaInserir = tiposPadrao.map((t, idx) => ({
        nome: t,
        ordem: (idx + 1) * 10,
        ativo: true
      }));

      await supabase.from('tipos_chamado').insert(tiposParaInserir);
    }

    if (precisaRecarregar) {
      const [resAndares, resLocais, resTipos] = await Promise.all([
        supabase.from('andares').select('*').order('ordem', { ascending: true }),
        supabase.from('locais').select('*').order('ordem', { ascending: true }),
        supabase.from('tipos_chamado').select('*').order('ordem', { ascending: true }),
      ]);
      if (resAndares.data) setAndares(resAndares.data);
      if (resLocais.data) setLocais(resLocais.data);
      if (resTipos.data) setTiposChamado(resTipos.data);
    }
  };

  const carregarChamados = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select(`
          *,
          andares (id, nome),
          locais (id, nome),
          tipos_chamado (id, nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setChamados(data);
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao carregar chamados: ' + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const carregarUsuarios = async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setUsuarios(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  useEffect(() => {
    carregarDadosAuxiliares();
    carregarChamados();
    carregarUsuarios();
  }, []);

  // Mapeamento rápido de Usuários para exibir nomes
  const mapaUsuarios = useMemo(() => {
    const mapa: Record<string, any> = {};
    usuarios.forEach(u => {
      mapa[u.id] = u;
    });
    return mapa;
  }, [usuarios]);

  // ID do Tipo "Outro" para exibir campo adicional
  const tipoOutroId = useMemo(() => {
    return tiposChamado.find(t => t.nome.toLowerCase() === 'outro')?.id || '';
  }, [tiposChamado]);

  // Resetar busca/filtros de CRUD ao mudar sub-aba
  useEffect(() => {
    setBuscaConfig('');
    setFiltroAndarConfig('');
    setFiltroAtivoConfig('');
  }, [subTabConfig]);

  // ---------------------------------------------------------------------------
  // Exibição de Mensagens
  // ---------------------------------------------------------------------------
  const exibirMensagem = (tipo: 'ok' | 'erro', texto: string) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 5000);
  };

  // ---------------------------------------------------------------------------
  // Carregamento de Detalhes de um Chamado
  // ---------------------------------------------------------------------------
  const selecionarChamado = async (chamado: Chamado) => {
    setChamadoSelecionado(chamado);
    setNovoComentario('');
    setFotosComentario([]);
    setMostrarMotivoRecusa(false);
    setMotivoRecusa('');
    
    try {
      // Carregar Comentários
      const resComments = await supabase
        .from('comentarios_chamado')
        .select('*')
        .eq('chamado_id', chamado.id)
        .order('created_at', { ascending: true });

      // Carregar Anexos
      const resAnexos = await supabase
        .from('anexos_chamado')
        .select('*')
        .eq('chamado_id', chamado.id);

      // Carregar Histórico
      const resHist = await supabase
        .from('historico_chamado')
        .select('*')
        .eq('chamado_id', chamado.id)
        .order('created_at', { ascending: true });

      if (resComments.data) setComentarios(resComments.data);
      if (resAnexos.data) setAnexos(resAnexos.data);
      if (resHist.data) setHistorico(resHist.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes do chamado:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Abertura de Novo Chamado (Criação)
  // ---------------------------------------------------------------------------
  const handleSalvarChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!andarId || !localId || !tipoId || !descricao.trim()) {
      exibirMensagem('erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (tipoId === tipoOutroId && !tipoOutroDescricao.trim()) {
      exibirMensagem('erro', 'Por favor, descreva o tipo de chamado.');
      return;
    }

    setSalvandoChamado(true);
    try {
      // 1. Inserir Chamado
      const { data: chamadoCriado, error: erroChamado } = await supabase
        .from('chamados')
        .insert({
          usuario_id: user.id,
          solicitante: profile?.full_name || user.email || 'Usuário',
          andar_id: andarId,
          local_id: localId,
          tipo_id: tipoId,
          tipo_outro_descricao: tipoId === tipoOutroId ? tipoOutroDescricao.trim() : null,
          descricao: descricao.trim(),
          status: 'Aberto'
        })
        .select()
        .single();

      if (erroChamado) throw erroChamado;

      // 2. Registrar Histórico de Abertura
      await supabase.from('historico_chamado').insert({
        chamado_id: chamadoCriado.id,
        usuario_id: user.id,
        acao: `${profile?.full_name || 'Usuário'} abriu o chamado.`,
        status_anterior: null,
        status_novo: 'Aberto'
      });

      // 3. Fazer Upload de Imagens no Storage e cadastrar como anexos
      if (fotosUpload.length > 0) {
        for (const foto of fotosUpload) {
          const fileExt = foto.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `chamados/${chamadoCriado.id}/${fileName}`;

          const { error: erroUpload } = await supabase.storage
            .from('fotos_chamados')
            .upload(filePath, foto);

          if (erroUpload) throw erroUpload;

          const { data: urlData } = supabase.storage
            .from('fotos_chamados')
            .getPublicUrl(filePath);

          await supabase.from('anexos_chamado').insert({
            chamado_id: chamadoCriado.id,
            nome_arquivo: foto.name,
            caminho_storage: filePath,
            url: urlData.publicUrl,
            usuario_id: user.id
          });
        }
      }

      exibirMensagem('ok', 'Chamado aberto com sucesso!');
      
      // Limpar formulário
      setAndarId('');
      setLocalId('');
      setTipoId('');
      setTipoOutroDescricao('');
      setDescricao('');
      setFotosUpload([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';

      // Atualizar lista e retornar
      await carregarChamados();
      setActiveTab('consulta');
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao abrir chamado: ' + err.message);
    } finally {
      setSalvandoChamado(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Transições de Status e Validações
  // ---------------------------------------------------------------------------
  const handleAlterarStatus = async (novoStatus: 'Em Atendimento' | 'Aguardando Validação' | 'Concluído' | 'Cancelado', recusaMotivo?: string) => {
    if (!chamadoSelecionado || !user) return;

    try {
      const statusAnterior = chamadoSelecionado.status;

      // 1. Atualizar chamado no banco
      const { data: chamadoAtualizado, error: erroAtualizacao } = await supabase
        .from('chamados')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', chamadoSelecionado.id)
        .select()
        .single();

      if (erroAtualizacao) throw erroAtualizacao;

      // 2. Definir texto da ação de histórico
      let acao = '';
      const nomeOperador = profile?.full_name || 'Operador';
      
      if (novoStatus === 'Em Atendimento') {
        if (statusAnterior === 'Aguardando Validação') {
          acao = `${nomeOperador} informou que o problema não foi resolvido. Motivo: "${recusaMotivo}".`;
        } else {
          acao = `${nomeOperador} alterou o status para Em Atendimento.`;
        }
      } else if (novoStatus === 'Aguardando Validação') {
        acao = `${nomeOperador} alterou o status para Aguardando Validação.`;
      } else if (novoStatus === 'Concluído') {
        acao = `${nomeOperador} informou que o problema foi resolvido. Status alterado para Concluído.`;
      } else if (novoStatus === 'Cancelado') {
        acao = `${nomeOperador} cancelou o chamado.`;
      }

      // 3. Inserir comentário automático em caso de retorno (Problema Não Resolvido)
      if (statusAnterior === 'Aguardando Validação' && novoStatus === 'Em Atendimento' && recusaMotivo) {
        await supabase.from('comentarios_chamado').insert({
          chamado_id: chamadoSelecionado.id,
          usuario_id: user.id,
          comentario: `Retornado para Em Atendimento. Motivo: ${recusaMotivo}`
        });
      }

      // 4. Gravar Histórico
      await supabase.from('historico_chamado').insert({
        chamado_id: chamadoSelecionado.id,
        usuario_id: user.id,
        acao,
        status_anterior: statusAnterior,
        status_novo: novoStatus
      });

      exibirMensagem('ok', 'Status atualizado com sucesso!');
      
      // Atualizar dados locais da visualização e da lista principal
      const chamadoComJoins = {
        ...chamadoAtualizado,
        andares: chamadoSelecionado.andares,
        locais: chamadoSelecionado.locais,
        tipos_chamado: chamadoSelecionado.tipos_chamado
      };
      
      setChamadoSelecionado(chamadoComJoins);
      await selecionarChamado(chamadoComJoins);
      await carregarChamados();
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao alterar status: ' + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Envio de Comentários
  // ---------------------------------------------------------------------------
  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamadoSelecionado || !novoComentario.trim() || !user) return;

    setEnviandoComentario(true);
    try {
      // 1. Cadastrar Comentário
      const { data: comentarioCriado, error: erroComentario } = await supabase
        .from('comentarios_chamado')
        .insert({
          chamado_id: chamadoSelecionado.id,
          usuario_id: user.id,
          comentario: novoComentario.trim()
        })
        .select()
        .single();

      if (erroComentario) throw erroComentario;

      // 2. Registrar Histórico do Comentário
      await supabase.from('historico_chamado').insert({
        chamado_id: chamadoSelecionado.id,
        usuario_id: user.id,
        acao: `${profile?.full_name || 'Usuário'} adicionou um comentário.`
      });

      // 3. Fazer upload de fotos anexadas ao comentário (se houver)
      if (fotosComentario.length > 0) {
        for (const foto of fotosComentario) {
          const fileExt = foto.name.split('.').pop();
          const fileName = `${Date.now()}_comment_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `chamados/${chamadoSelecionado.id}/${fileName}`;

          const { error: erroUpload } = await supabase.storage
            .from('fotos_chamados')
            .upload(filePath, foto);

          if (erroUpload) throw erroUpload;

          const { data: urlData } = supabase.storage
            .from('fotos_chamados')
            .getPublicUrl(filePath);

          await supabase.from('anexos_chamado').insert({
            chamado_id: chamadoSelecionado.id,
            comentario_id: comentarioCriado.id,
            nome_arquivo: foto.name,
            caminho_storage: filePath,
            url: urlData.publicUrl,
            usuario_id: user.id
          });

          // Registrar histórico do anexo
          await supabase.from('historico_chamado').insert({
            chamado_id: chamadoSelecionado.id,
            usuario_id: user.id,
            acao: `${profile?.full_name || 'Usuário'} anexou uma foto ao comentário.`
          });
        }
      }

      setNovoComentario('');
      setFotosComentario([]);
      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
      if (commentCameraInputRef.current) commentCameraInputRef.current.value = '';

      // Atualizar os detalhes do chamado exibidos na tela
      await selecionarChamado(chamadoSelecionado);
      await carregarChamados();
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao adicionar comentário: ' + err.message);
    } finally {
      setEnviandoComentario(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtros Avançados e Ordenação (Chamados)
  // ---------------------------------------------------------------------------
  const chamadosFiltrados = useMemo(() => {
    return chamados.filter(c => {
      const bateNumero = c.numero_chamado?.toLowerCase().includes(filtroNumero.toLowerCase());
      const bateSolicitante = c.solicitante?.toLowerCase().includes(filtroSolicitante.toLowerCase());
      const bateAndar = filtroAndar === '' || c.andar_id === filtroAndar;
      const bateLocal = filtroLocal === '' || c.local_id === filtroLocal;
      
      // Filtragem por Tipo de Chamado
      const bateTipo = filtroTipo === '' || c.tipo_id === filtroTipo;
      
      const bateStatus = filtroStatus === '' || c.status === filtroStatus;
      
      let bateData = true;
      if (filtroDataInicio) {
        bateData = bateData && new Date(c.created_at) >= new Date(filtroDataInicio + 'T00:00:00');
      }
      if (filtroDataFim) {
        bateData = bateData && new Date(c.created_at) <= new Date(filtroDataFim + 'T23:59:59');
      }

      return bateNumero && bateSolicitante && bateAndar && bateLocal && bateTipo && bateStatus && bateData;
    });
  }, [chamados, filtroNumero, filtroSolicitante, filtroAndar, filtroLocal, filtroTipo, filtroStatus, filtroDataInicio, filtroDataFim]);

  const chamadosOrdenados = useMemo(() => {
    const dados = [...chamadosFiltrados];
    dados.sort((a, b) => {
      let valorA: any = a[ordenacao.campo as keyof Chamado] || '';
      let valorB: any = b[ordenacao.campo as keyof Chamado] || '';

      if (ordenacao.campo === 'andar') {
        valorA = a.andares?.nome || '';
        valorB = b.andares?.nome || '';
      } else if (ordenacao.campo === 'local') {
        valorA = a.locais?.nome || '';
        valorB = b.locais?.nome || '';
      } else if (ordenacao.campo === 'tipo') {
        valorA = a.tipos_chamado?.nome || '';
        valorB = b.tipos_chamado?.nome || '';
      }

      if (typeof valorA === 'string') {
        return ordenacao.ascendente
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      } else {
        return ordenacao.ascendente
          ? (valorA > valorB ? 1 : -1)
          : (valorB > valorA ? 1 : -1);
      }
    });
    return dados;
  }, [chamadosFiltrados, ordenacao]);

  // Locais filtrados dinamicamente no formulário de Novo Chamado com base no Andar selecionado
  const locaisFiltradosParaForm = useMemo(() => {
    const ativos = locais.filter(l => l.ativo);
    if (!andarId) return ativos; // Se nenhum andar for selecionado, exibe todos os ativos
    return ativos.filter(l => l.andar_id === andarId || l.andar_id === null);
  }, [locais, andarId]);

  // Paginação
  const totalPaginas = Math.ceil(chamadosOrdenados.length / itensPorPagina);
  const chamadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return chamadosOrdenados.slice(inicio, inicio + itensPorPagina);
  }, [chamadosOrdenados, paginaAtual]);

  const alternarOrdenacao = (campo: typeof ordenacao.campo) => {
    setOrdenacao(prev => ({
      campo,
      ascendente: prev.campo === campo ? !prev.ascendente : true
    }));
  };

  const limparFiltros = () => {
    setFiltroNumero('');
    setFiltroSolicitante('');
    setFiltroAndar('');
    setFiltroLocal('');
    setFiltroTipo('');
    setFiltroStatus('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPaginaAtual(1);
  };

  // ---------------------------------------------------------------------------
  // Exportar Excel e PDF
  // ---------------------------------------------------------------------------
  const handleExportarExcel = () => {
    const dataToExport = chamadosFiltrados.map(c => {
      const tipoNome = c.tipo_outro_descricao 
        ? `${c.tipos_chamado?.nome} (${c.tipo_outro_descricao})` 
        : (c.tipos_chamado?.nome || '—');

      return {
        'Número': c.numero_chamado,
        'Data Abertura': new Date(c.created_at).toLocaleString('pt-BR'),
        'Solicitante': c.solicitante,
        'Andar': c.andares?.nome || '—',
        'Local': c.locais?.nome || '—',
        'Tipo de Chamado': tipoNome,
        'Status': c.status,
        'Descrição': c.descricao,
        'Última Atualização': new Date(c.updated_at).toLocaleString('pt-BR')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chamados');
    XLSX.writeFile(workbook, `Chamados_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Relatório de Chamados — SESI Connect', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

    const columns = ['Número', 'Data', 'Solicitante', 'Andar', 'Local', 'Tipo', 'Status'];
    const rows = chamadosFiltrados.map(c => {
      const tipoNome = c.tipo_outro_descricao 
        ? `${c.tipos_chamado?.nome} (${c.tipo_outro_descricao})` 
        : (c.tipos_chamado?.nome || '—');

      return [
        c.numero_chamado || '',
        new Date(c.created_at).toLocaleDateString('pt-BR') || '',
        c.solicitante || '',
        c.andares?.nome || '—',
        c.locais?.nome || '—',
        tipoNome,
        c.status || ''
      ];
    });

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [66, 160, 245], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Chamados_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const baixarArquivo = async (url: string, nomeOriginal: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = nomeOriginal;
      link.click();
    } catch (err) {
      alert('Erro ao tentar baixar o arquivo.');
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD de Tabelas Auxiliares (Andares, Locais, Tipos de Chamado)
  // ---------------------------------------------------------------------------
  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoConfig || !editandoConfig.nome.trim()) return;

    setCarregandoConfigAction(true);
    const tabela = subTabConfig === 'andares' ? 'andares' : subTabConfig === 'locais' ? 'locais' : 'tipos_chamado';
    
    try {
      if (editandoConfig.id) {
        // Atualizar
        const payload: any = {
          nome: editandoConfig.nome.trim(),
          ordem: editandoConfig.ordem,
          ativo: editandoConfig.ativo,
          updated_at: new Date().toISOString()
        };
        if (tabela === 'locais') {
          payload.andar_id = editandoConfig.andar_id || null;
        }

        const { error } = await supabase
          .from(tabela)
          .update(payload)
          .eq('id', editandoConfig.id);

        if (error) throw error;
        exibirMensagem('ok', 'Item atualizado com sucesso!');
      } else {
        // Inserir
        const payload: any = {
          nome: editandoConfig.nome.trim(),
          ordem: editandoConfig.ordem,
          ativo: editandoConfig.ativo
        };
        if (tabela === 'locais') {
          payload.andar_id = editandoConfig.andar_id || null;
        }

        const { data: novoAndar, error } = await supabase
          .from(tabela)
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        // Regra Especial: se for adicionado um andar, criar automaticamente o respectivo Depósito
        if (tabela === 'andares' && novoAndar) {
          await supabase.from('locais').insert({
            nome: `Depósito - ${novoAndar.nome}`,
            andar_id: novoAndar.id,
            ordem: 999,
            ativo: true
          });
        }

        exibirMensagem('ok', 'Item cadastrado com sucesso!');
      }

      setEditandoConfig(null);
      await carregarDadosAuxiliares();
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao salvar configuração: ' + err.message);
    } finally {
      setCarregandoConfigAction(false);
    }
  };

  const handleExcluirConfig = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o item "${nome}"? Chamados vinculados a este item serão mantidos, mas com a informação em branco.`)) return;

    const tabela = subTabConfig === 'andares' ? 'andares' : subTabConfig === 'locais' ? 'locais' : 'tipos_chamado';
    
    try {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq('id', id);

      if (error) throw error;
      exibirMensagem('ok', 'Item excluído com sucesso!');
      await carregarDadosAuxiliares();
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao excluir item: ' + err.message);
    }
  };

  const handleToggleAtivoConfig = async (item: any) => {
    const tabela = subTabConfig === 'andares' ? 'andares' : subTabConfig === 'locais' ? 'locais' : 'tipos_chamado';
    try {
      const { error } = await supabase
        .from(tabela)
        .update({ ativo: !item.ativo, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      await carregarDadosAuxiliares();
    } catch (err: any) {
      exibirMensagem('erro', 'Erro ao alterar status de atividade: ' + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Listas Filtradas do CRUD (Configurações)
  // ---------------------------------------------------------------------------
  const listaConfigFiltrada = useMemo(() => {
    let dados: any[] = [];
    if (subTabConfig === 'andares') dados = [...andares];
    else if (subTabConfig === 'locais') dados = [...locais];
    else if (subTabConfig === 'tipos') dados = [...tiposChamado];

    return dados.filter(item => {
      const bateNome = item.nome?.toLowerCase().includes(buscaConfig.toLowerCase());
      
      let bateAndar = true;
      if (subTabConfig === 'locais' && filtroAndarConfig) {
        bateAndar = item.andar_id === filtroAndarConfig;
      }

      let bateAtivo = true;
      if (filtroAtivoConfig !== '') {
        const ativoBool = filtroAtivoConfig === 'true';
        bateAtivo = item.ativo === ativoBool;
      }

      return bateNome && bateAndar && bateAtivo;
    });
  }, [subTabConfig, andares, locais, tiposChamado, buscaConfig, filtroAndarConfig, filtroAtivoConfig]);

  // Helpers de Estilo do Status
  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case 'Aberto':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Em Atendimento':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Aguardando Validação':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'Concluído':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Cancelado':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Mensagens Temporárias */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-semibold",
              msg.tipo === 'ok' ? "bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            )}
          >
            {msg.tipo === 'ok' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>{msg.texto}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-4 font-black text-xs uppercase tracking-widest border border-primary/20">
            <Clock size={14} className="animate-pulse" /> Chamados de Manutenção
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Módulo de Chamados</h1>
          <p className="text-on-surface-variant font-medium mt-2">Registre ordens de serviço e acompanhe o status em tempo real.</p>
        </div>
      </header>

      {/* Abas Superiores */}
      <div className="flex space-x-1 p-1 bg-surface-container-low rounded-2xl w-full max-w-lg backdrop-blur-sm border border-white/5">
        {[
          { id: 'consulta', label: 'Consultar', icon: Search },
          { id: 'novo', label: 'Novo Chamado', icon: PlusCircle },
          ...(isAdmin ? [{ id: 'config', label: 'Painel Admin', icon: Settings }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setChamadoSelecionado(null);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === tab.id
                ? 'bg-primary text-black shadow-glow-yellow'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: CONSULTA */}
        {activeTab === 'consulta' && !chamadoSelecionado && (
          <motion.div
            key="consulta"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Filtros */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter size={18} className="text-[#f1d86f]" /> Filtros de Busca
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Filtro Número */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Número</label>
                  <input
                    type="text"
                    value={filtroNumero}
                    onChange={(e) => setFiltroNumero(e.target.value)}
                    placeholder="CH-000000"
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  />
                </div>

                {/* Filtro Solicitante */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Solicitante</label>
                  <input
                    type="text"
                    value={filtroSolicitante}
                    onChange={(e) => setFiltroSolicitante(e.target.value)}
                    placeholder="Nome do usuário"
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  />
                </div>

                {/* Filtro Andar */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Andar</label>
                  <select
                    value={filtroAndar}
                    onChange={(e) => setFiltroAndar(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  >
                    <option value="">Todos</option>
                    {andares.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Local */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Local</label>
                  <select
                    value={filtroLocal}
                    onChange={(e) => setFiltroLocal(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  >
                    <option value="">Todos</option>
                    {locais.map(l => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Tipo */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tipo</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  >
                    <option value="">Todos</option>
                    {tiposChamado.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  >
                    <option value="">Todos</option>
                    <option value="Aberto">Aberto</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Aguardando Validação">Aguardando Validação</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Data Inicial */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data Inicial</label>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  />
                </div>

                {/* Data Final */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data Final</label>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                  />
                </div>
              </div>

              {/* Botões do Filtro */}
              <div className="flex flex-wrap gap-3 justify-between pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={handleExportarExcel}
                    className="px-4 py-2.5 bg-emerald-600/10 text-emerald-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-600/20 border border-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button
                    onClick={handleExportarPDF}
                    className="px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-500/20 border border-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Download size={16} /> PDF
                  </button>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={limparFiltros}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={carregarChamados}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-glow-yellow"
                  >
                    Pesquisar
                  </button>
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="bg-surface-container-low rounded-[2rem] border border-white/5 overflow-hidden">
              {carregando ? (
                <div className="py-20 text-center space-y-4">
                  <Loader2 size={40} className="text-primary animate-spin mx-auto" />
                  <p className="text-on-surface-variant font-medium">Buscando chamados no banco...</p>
                </div>
              ) : chamadosPaginados.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <AlertTriangle size={48} className="text-[#f1d86f] mx-auto animate-bounce" />
                  <h3 className="text-lg font-bold text-white">Nenhum chamado encontrado</h3>
                  <p className="text-on-surface-variant text-sm max-w-xs mx-auto">Tente redefinir os filtros de busca ou abra uma nova solicitação.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-on-surface-variant font-black uppercase tracking-wider bg-surface-container-medium">
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('numero_chamado')}>
                          <span className="flex items-center gap-1.5">Número <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('created_at')}>
                          <span className="flex items-center gap-1.5">Data Abertura <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('solicitante')}>
                          <span className="flex items-center gap-1.5">Solicitante <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('andar')}>
                          <span className="flex items-center gap-1.5">Andar <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('local')}>
                          <span className="flex items-center gap-1.5">Local <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('tipo')}>
                          <span className="flex items-center gap-1.5">Tipo <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-primary transition-colors" onClick={() => alternarOrdenacao('status')}>
                          <span className="flex items-center gap-1.5">Status <ArrowUpDown size={12} /></span>
                        </th>
                        <th className="p-5">Última Atualização</th>
                        <th className="p-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {chamadosPaginados.map(c => {
                        const tipoNome = c.tipo_outro_descricao 
                          ? `${c.tipos_chamado?.nome} (${c.tipo_outro_descricao})` 
                          : (c.tipos_chamado?.nome || '—');

                        return (
                          <tr key={c.id} className="hover:bg-surface-container-high transition-colors font-medium text-sm text-on-surface-bright">
                            <td className="p-5 font-black text-primary">{c.numero_chamado}</td>
                            <td className="p-5 text-xs text-on-surface-variant">{new Date(c.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="p-5">{c.solicitante}</td>
                            <td className="p-5">{c.andares?.nome || '—'}</td>
                            <td className="p-5">{c.locais?.nome || '—'}</td>
                            <td className="p-5">{tipoNome}</td>
                            <td className="p-5">
                              <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", obterBadgeStatus(c.status))}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-5 text-xs text-on-surface-variant">{new Date(c.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="p-5 text-right">
                              <button
                                onClick={() => selecionarChamado(c)}
                                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-xl text-xs font-bold transition-all active:scale-95"
                              >
                                Visualizar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="p-5 flex items-center justify-between border-t border-white/5">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="p-2 bg-surface-container-high text-white hover:bg-primary hover:text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="p-2 bg-surface-container-high text-white hover:bg-primary hover:text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* DETALHE DO CHAMADO SELECIONADO */}
        {activeTab === 'consulta' && chamadoSelecionado && (
          <motion.div
            key="detalhe"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header da visualização */}
            <div className="flex items-center gap-4 justify-between">
              <button
                onClick={() => {
                  setChamadoSelecionado(null);
                  carregarChamados();
                }}
                className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container-high text-primary border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all"
              >
                <ChevronLeft size={16} /> Voltar para Consulta
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant">Status Atual:</span>
                <span className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest", obterBadgeStatus(chamadoSelecionado.status))}>
                  {chamadoSelecionado.status}
                </span>
              </div>
            </div>

            {/* Layout em Grade */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Painel Esquerdo: Info do Chamado */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Informações Gerais */}
                <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-3xl font-black text-white">{chamadoSelecionado.numero_chamado}</h2>
                      <p className="text-xs font-medium text-on-surface-variant mt-1">Aberto em {new Date(chamadoSelecionado.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Solicitante</span>
                      <p className="font-bold text-white flex items-center gap-2">
                        <User size={16} className="text-primary" /> {chamadoSelecionado.solicitante}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Tipo de Manutenção</span>
                      <p className="font-bold text-white flex items-center gap-2">
                        <Tag size={16} className="text-[#f1d86f]" /> 
                        {chamadoSelecionado.tipos_chamado?.nome || '—'}
                        {chamadoSelecionado.tipo_outro_descricao ? ` (${chamadoSelecionado.tipo_outro_descricao})` : ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Andar</span>
                      <p className="font-bold text-white">{chamadoSelecionado.andares?.nome || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Local / Sala</span>
                      <p className="font-bold text-white">
                        {chamadoSelecionado.locais?.nome || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 space-y-2">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Descrição do Problema</span>
                    <div className="bg-surface p-4 rounded-2xl border border-white/5 text-on-surface-bright leading-relaxed whitespace-pre-line text-sm">
                      {chamadoSelecionado.descricao}
                    </div>
                  </div>

                  {/* Fotos anexadas na abertura */}
                  {anexos.filter(a => !a.comentario_id).length > 0 && (
                    <div className="border-t border-white/5 pt-6 space-y-3">
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Fotos Anexadas</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {anexos.filter(a => !a.comentario_id).map(a => (
                          <div key={a.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-surface aspect-square">
                            <img src={a.url} alt={a.nome_arquivo} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => setFotoZoom(a.url)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                title="Visualizar Foto"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => baixarArquivo(a.url, a.nome_arquivo)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                title="Baixar Foto"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow de Ações de Status */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Controle do Chamado</h3>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* Ações ADMIN */}
                    {isAdmin && (
                      <>
                        {chamadoSelecionado.status === 'Aberto' && (
                          <button
                            onClick={() => handleAlterarStatus('Em Atendimento')}
                            className="px-5 py-3 bg-amber-500 text-black font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-2"
                          >
                            Iniciar Atendimento
                          </button>
                        )}
                        {chamadoSelecionado.status === 'Em Atendimento' && (
                          <button
                            onClick={() => handleAlterarStatus('Aguardando Validação')}
                            className="px-5 py-3 bg-indigo-600 text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-2"
                          >
                            Concluir Serviço (Validar)
                          </button>
                        )}
                        {chamadoSelecionado.status !== 'Concluído' && chamadoSelecionado.status !== 'Cancelado' && (
                          <button
                            onClick={() => handleAlterarStatus('Cancelado')}
                            className="px-5 py-3 bg-red-600 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 active:scale-95 transition-all text-xs flex items-center gap-2"
                          >
                            Cancelar Chamado
                          </button>
                        )}
                      </>
                    )}

                    {/* Ações SOLICITANTE / CLIENTE */}
                    {chamadoSelecionado.status === 'Aguardando Validação' && (chamadoSelecionado.usuario_id === user?.id || isAdmin) && (
                      <>
                        <button
                          onClick={() => handleAlterarStatus('Concluído')}
                          className="px-5 py-3 bg-emerald-500 text-black font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-2"
                        >
                          <Check size={16} /> Problema Resolvido (Concluir)
                        </button>
                        <button
                          onClick={() => setMostrarMotivoRecusa(true)}
                          className="px-5 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold uppercase tracking-wider rounded-xl active:scale-95 transition-all text-xs flex items-center gap-2"
                        >
                          Problema Não Resolvido (Reabrir)
                        </button>
                      </>
                    )}
                  </div>

                  {/* Justificativa Problema não resolvido */}
                  {mostrarMotivoRecusa && (
                    <div className="bg-surface p-4 rounded-2xl border border-red-500/20 space-y-3">
                      <label className="text-xs font-bold text-red-400">Descreva o motivo de o problema persistir (Obrigatório):</label>
                      <textarea
                        value={motivoRecusa}
                        onChange={(e) => setMotivoRecusa(e.target.value)}
                        placeholder="Ex: A lâmpada continua piscando / O vazamento voltou..."
                        rows={3}
                        className="w-full bg-surface-container-low rounded-xl p-3 border border-white/10 text-sm outline-none focus:border-red-500 text-white"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setMostrarMotivoRecusa(false)}
                          className="px-4 py-2.5 bg-surface-container-high rounded-xl text-xs font-bold text-white hover:bg-surface-container-highest transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (!motivoRecusa.trim()) {
                              alert('Por favor, informe o motivo do chamado não ter sido resolvido.');
                              return;
                            }
                            handleAlterarStatus('Em Atendimento', motivoRecusa);
                          }}
                          className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition-all"
                        >
                          Enviar Motivo e Reabrir
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comentários / Chat */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Comentários e Conversa</h3>
                  
                  {/* Lista de Comentários */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {comentarios.length === 0 ? (
                      <p className="text-center py-6 text-xs font-bold text-on-surface-variant">Nenhum comentário adicionado ainda.</p>
                    ) : (
                      comentarios.map(c => {
                        const ehUsuarioLogado = c.usuario_id === user?.id;
                        const userProfile = mapaUsuarios[c.usuario_id];
                        const nomeUsuario = userProfile?.full_name || (c.usuario_id === chamadoSelecionado.usuario_id ? chamadoSelecionado.solicitante : 'Usuário');
                        const dataHoraStr = new Date(c.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                        const anexosComentario = anexos.filter(a => a.comentario_id === c.id);

                        return (
                          <div
                            key={c.id}
                            className={cn(
                              "flex flex-col max-w-[85%] rounded-2xl p-4 border text-sm space-y-2",
                              ehUsuarioLogado
                                ? "bg-primary/10 border-primary/20 text-on-surface-bright ml-auto"
                                : "bg-surface border-white/5 text-on-surface-bright mr-auto"
                            )}
                          >
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-1">
                              <span className="text-[10px] font-black uppercase text-primary tracking-wider">{nomeUsuario}</span>
                              <span className="text-[9px] font-medium text-on-surface-variant">{dataHoraStr}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{c.comentario}</p>
                            
                            {/* Anexos do comentário */}
                            {anexosComentario.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                {anexosComentario.map(a => (
                                  <div key={a.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-surface">
                                    <img src={a.url} alt={a.nome_arquivo} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setFotoZoom(a.url)}
                                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition-all"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => baixarArquivo(a.url, a.nome_arquivo)}
                                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition-all"
                                      >
                                        <Download size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Form de Comentário */}
                  <form onSubmit={handleEnviarComentario} className="space-y-4 pt-4 border-t border-white/5">
                    <textarea
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder="Adicione um comentário para o atendimento..."
                      rows={3}
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm outline-none focus:border-primary text-white"
                    />

                    {/* Preview de fotos selecionadas */}
                    {fotosComentario.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {fotosComentario.map((f, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="Preview" />
                            <button
                              type="button"
                              onClick={() => setFotosComentario(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setFotosComentario(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          ref={commentFileInputRef}
                          className="hidden"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setFotosComentario(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          ref={commentCameraInputRef}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => commentFileInputRef.current?.click()}
                            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <Image size={14} className="text-[#f1d86f]" /> Escolher Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => commentCameraInputRef.current?.click()}
                            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <Camera size={14} className="text-primary" /> Tirar Foto
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={enviandoComentario || !novoComentario.trim()}
                        className="px-6 py-3 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enviandoComentario ? 'Enviando...' : 'Adicionar Comentário'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Painel Direito: Histórico */}
              <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Histórico do Chamado</h3>
                
                <div className="relative border-l border-white/10 pl-6 ml-2 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {historico.length === 0 ? (
                    <p className="text-xs font-bold text-on-surface-variant py-4">Nenhum histórico registrado.</p>
                  ) : (
                    historico.map(h => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-primary border-4 border-surface shadow-[0_0_8px_rgba(66,160,245,0.8)]" />
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-on-surface-variant">
                            {new Date(h.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <p className="text-on-surface-bright leading-relaxed font-bold">{h.acao}</p>
                          {(h.status_anterior || h.status_novo) && (
                            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-1 font-semibold">
                              Status: <span className="text-red-400 font-bold">{h.status_anterior || '—'}</span> 
                              <span>➔</span> 
                              <span className="text-emerald-400 font-bold">{h.status_novo || '—'}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: NOVO CHAMADO */}
        {activeTab === 'novo' && (
          <motion.div
            key="novo"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Novo Chamado</h2>
                <p className="text-sm font-medium text-on-surface-variant mt-1">Preencha o formulário abaixo para abrir uma solicitação de manutenção.</p>
              </div>

              <form onSubmit={handleSalvarChamado} className="space-y-6">
                
                {/* Solicitante (Somente Leitura) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Solicitante</label>
                    <input
                      type="text"
                      readOnly
                      value={profile?.full_name || user?.email || 'Usuário Logado'}
                      className="w-full bg-surface rounded-xl p-3 border border-white/5 text-sm font-semibold text-on-surface-variant outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data / Hora</label>
                    <input
                      type="text"
                      readOnly
                      value={new Date().toLocaleString()}
                      className="w-full bg-surface rounded-xl p-3 border border-white/5 text-sm font-semibold text-on-surface-variant outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Localização e Tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Andar *</label>
                    <select
                      required
                      value={andarId}
                      onChange={(e) => {
                        setAndarId(e.target.value);
                        setLocalId(''); // reset local ao trocar de andar
                      }}
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                    >
                      <option value="">Selecione...</option>
                      {andares.filter(a => a.ativo).map(a => (
                        <option key={a.id} value={a.id}>{a.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Local *</label>
                    <select
                      required
                      value={localId}
                      onChange={(e) => setLocalId(e.target.value)}
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                    >
                      <option value="">Selecione...</option>
                      {locaisFiltradosParaForm.map(l => {
                        const andarNome = andares.find(a => a.id === l.andar_id)?.nome;
                        return (
                          <option key={l.id} value={l.id}>
                            {l.nome} {andarNome ? `(${andarNome})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tipo do Chamado *</label>
                    <select
                      required
                      value={tipoId}
                      onChange={(e) => {
                        setTipoId(e.target.value);
                        if (e.target.value !== tipoOutroId) {
                          setTipoOutroDescricao('');
                        }
                      }}
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                    >
                      <option value="">Selecione...</option>
                      {tiposChamado.filter(t => t.ativo).map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campo Tipo Especial "Outro" */}
                {tipoId === tipoOutroId && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Descreva o tipo do chamado *</label>
                    <input
                      type="text"
                      required
                      value={tipoOutroDescricao}
                      onChange={(e) => setTipoOutroDescricao(e.target.value)}
                      placeholder="Especifique qual tipo de serviço de manutenção..."
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                    />
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                    <label>Descrição do Problema *</label>
                    <span>{descricao.length} / 1000</span>
                  </div>
                  <textarea
                    required
                    maxLength={1000}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva com detalhes o problema que precisa de manutenção..."
                    rows={6}
                    className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm outline-none focus:border-primary text-white leading-relaxed"
                  />
                </div>

                {/* Foto / Upload */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Fotos do Local / Problema</label>
                  
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        setFotosUpload(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    ref={cameraInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        setFotosUpload(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-3 bg-surface-container-high border border-white/5 rounded-xl text-xs font-bold text-white hover:bg-surface-container-highest transition-all flex items-center gap-2"
                    >
                      <Image size={16} className="text-[#f1d86f]" /> Escolher Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-5 py-3 bg-surface-container-high border border-white/5 rounded-xl text-xs font-bold text-white hover:bg-surface-container-highest transition-all flex items-center gap-2"
                    >
                      <Camera size={16} className="text-primary" /> Tirar Foto
                    </button>
                    <span className="text-xs text-on-surface-variant font-semibold">Formatos aceitos: JPG, JPEG, PNG, WEBP</span>
                  </div>

                  {/* Previews das fotos selecionadas */}
                  {fotosUpload.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      {fotosUpload.map((foto, idx) => (
                        <div key={idx} className="relative border border-white/10 rounded-xl overflow-hidden aspect-square bg-surface">
                          <img src={URL.createObjectURL(foto)} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFotosUpload(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 p-1.5 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão Salvar */}
                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={salvandoChamado}
                    className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {salvandoChamado ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Salvando Chamado...
                      </>
                    ) : (
                      'Salvar Chamado'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CONFIGURAÇÕES E CRUD (Administrador) */}
        {activeTab === 'config' && isAdmin && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Abas Internas de Configurações */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
              {[
                { id: 'andares', label: 'Andares' },
                { id: 'locais', label: 'Locais' },
                { id: 'tipos', label: 'Tipos de Chamado' }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => {
                    setSubTabConfig(subTab.id as any);
                    setEditandoConfig(null);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                    subTabConfig === subTab.id
                      ? "bg-primary text-black border-primary shadow-glow-yellow"
                      : "bg-surface-container-low text-on-surface-variant border-[#30363d] hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Layout em Grade: CRUD Form + CRUD Lista */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Esquerdo */}
              <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  {editandoConfig?.id ? 'Editar Item' : 'Cadastrar Novo'}
                </h3>

                <form onSubmit={handleSalvarConfig} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome *</label>
                    <input
                      type="text"
                      required
                      value={editandoConfig?.nome || ''}
                      onChange={(e) => setEditandoConfig(prev => ({ ...prev, nome: e.target.value } as any))}
                      placeholder="Nome do local / andar / tipo"
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm outline-none focus:border-primary text-white font-semibold"
                    />
                  </div>

                  {/* Vínculo de Andar (apenas para Locais) */}
                  {subTabConfig === 'locais' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Andar Vinculado</label>
                      <select
                        value={editandoConfig?.andar_id || ''}
                        onChange={(e) => setEditandoConfig(prev => ({ ...prev, andar_id: e.target.value || null } as any))}
                        className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm font-semibold outline-none focus:border-primary text-white"
                      >
                        <option value="">Nenhum (Geral)</option>
                        {andares.map(a => (
                          <option key={a.id} value={a.id}>{a.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ordem de Exibição</label>
                    <input
                      type="number"
                      value={editandoConfig?.ordem || 0}
                      onChange={(e) => setEditandoConfig(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 } as any))}
                      className="w-full bg-surface rounded-xl p-3 border border-white/10 text-sm outline-none focus:border-primary text-white font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="ativo-config"
                      checked={editandoConfig?.ativo ?? true}
                      onChange={(e) => setEditandoConfig(prev => ({ ...prev, ativo: e.target.checked } as any))}
                      className="w-4 h-4 rounded bg-surface border-white/10 text-primary focus:ring-primary"
                    />
                    <label htmlFor="ativo-config" className="text-xs font-bold text-on-surface-variant">Ativo (visível nos formulários)</label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    {editandoConfig && (
                      <button
                        type="button"
                        onClick={() => setEditandoConfig(null)}
                        className="px-4 py-2.5 bg-surface-container-high rounded-xl text-xs font-bold text-white hover:bg-surface-container-highest"
                      >
                        Limpar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={carregandoConfigAction}
                      className="px-5 py-2.5 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 shadow-glow-yellow disabled:opacity-50"
                    >
                      {carregandoConfigAction ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista Direita (Com Busca e Filtros) */}
              <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                
                {/* Barra de Busca e Filtros da Configuração */}
                <div className="p-4 bg-surface-container-medium border-b border-white/5 flex flex-wrap gap-3 items-center justify-between">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder={`Pesquisar por nome...`}
                      value={buscaConfig}
                      onChange={(e) => setBuscaConfig(e.target.value)}
                      className="w-full bg-surface rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold outline-none border border-white/10 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    {subTabConfig === 'locais' && (
                      <select
                        value={filtroAndarConfig}
                        onChange={(e) => setFiltroAndarConfig(e.target.value)}
                        className="bg-surface rounded-xl px-3 py-2.5 text-xs font-semibold outline-none border border-white/10 text-white"
                      >
                        <option value="">Filtrar por Andar</option>
                        {andares.map(a => (
                          <option key={a.id} value={a.id}>{a.nome}</option>
                        ))}
                      </select>
                    )}
                    <select
                      value={filtroAtivoConfig}
                      onChange={(e) => setFiltroAtivoConfig(e.target.value)}
                      className="bg-surface rounded-xl px-3 py-2.5 text-xs font-semibold outline-none border border-white/10 text-white"
                    >
                      <option value="">Filtrar por Status</option>
                      <option value="true">Ativos</option>
                      <option value="false">Inativos</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-on-surface-variant font-black uppercase tracking-wider bg-surface-container-medium">
                        <th className="p-4">Ordem</th>
                        <th className="p-4">Nome</th>
                        {subTabConfig === 'locais' && <th className="p-4">Andar Vinculado</th>}
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-on-surface-bright">
                      {listaConfigFiltrada.map(item => (
                        <tr key={item.id} className="hover:bg-surface-container-high transition-colors font-medium">
                          <td className="p-4 font-bold text-primary">{item.ordem}</td>
                          <td className="p-4 font-bold">{item.nome}</td>
                          {subTabConfig === 'locais' && (
                            <td className="p-4 text-xs text-on-surface-variant font-semibold">
                              {andares.find(a => a.id === item.andar_id)?.nome || '—'}
                            </td>
                          )}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleAtivoConfig(item)}
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                item.ativo
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                              )}
                            >
                                {item.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => setEditandoConfig(item)}
                              className="p-2 bg-surface hover:bg-surface-container-high border border-white/5 text-white rounded-lg transition-all"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleExcluirConfig(item.id, item.nome)}
                              className="p-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/10 text-red-500 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL DE ZOOM DA FOTO */}
      <AnimatePresence>
        {fotoZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFotoZoom(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          >
            <button
              onClick={() => setFotoZoom(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>
            <img src={fotoZoom} alt="Zoom" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
