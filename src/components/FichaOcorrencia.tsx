import React, { useState, useEffect, useMemo } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square, Plus, Trash2, Download, Clock, Calendar, FileText, GraduationCap, Share2, Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFichaOcorrenciaPDF } from '../lib/reportGenerator';
import papelTimbradoImg from '../assets/papel_timbrado.png';
import { occurrenceService } from '../services/occurrenceService';
import { montarEstruturaAta, gerarMensagemResponsaveis } from '../lib/ataUtils';

const CARGOS_SUGERIDOS = [
  'Psicólogo Escolar',
  'Orientador Pedagógico',
  'Orientadora Pedagógica',
  'Coordenador Pedagógico',
  'Coordenadora Pedagógica',
  'Diretor Escolar',
  'Diretora Escolar',
  'Professor',
  'Professora',
  'Monitor Escolar',
  'Responsável pelo Registro'
];

const SERIES_OPCOES = [
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º Ano EM',
  '2º Ano EM',
  '3º Ano EM',
  '1º Ano EM - Turma A',
  '1º Ano EM - Turma B',
  '2º Ano EM - Turma A',
  '2º Ano EM - Turma B',
  '3º Ano EM - Turma A',
  '3º Ano EM - Turma B'
];

interface AssinaturaExtra {
  papel: string;
  nome: string;
}

interface Props {
  ocorrencia: RegistroOcorrencia;
  onClose: () => void;
  isPrintOnly?: boolean;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  startInEditMode?: boolean;
}

export default function FichaOcorrencia({
  ocorrencia,
  onClose,
  isPrintOnly,
  onEditSuccess,
  onDeleteSuccess,
  startInEditMode
}: Props) {
  // Tipo de documento: ATA Oficial ou Registro Diário
  const [tipoDocumento, setTipoDocumento] = useState<'ata' | 'diario'>('diario');
  const [numeroAta, setNumeroAta] = useState('');
  const [anoAta, setAnoAta] = useState(String(new Date().getFullYear()));
  const [dataAta, setDataAta] = useState('');
  const [horarioAta, setHorarioAta] = useState('10:00');
  const [cargoEmissor, setCargoEmissor] = useState('Psicólogo Escolar');
  const [nomeEmissor, setNomeEmissor] = useState(ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva');
  const [turmaAluno, setTurmaAluno] = useState(ocorrencia.turmaAluno || ocorrencia.anoAluno || '1º Ano EM');
  const [listaAlunos, setListaAlunos] = useState<string[]>([]);
  const [novoAlunoNome, setNovoAlunoNome] = useState('');
  const [relatoTexto, setRelatoTexto] = useState('');

  // Configurações de assinatura (Responsável ativo por padrão)
  const [configAssinaturas, setConfigAssinaturas] = useState({
    mostrarAluno: true,
    nomeAluno: ocorrencia.nomeAluno,
    mostrarResponsavel: true,
    nomeResponsavel: '',
    mostrarEmissor: true,
    nomeEmissor: ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva'
  });

  const [assinaturasExtras, setAssinaturasExtras] = useState<AssinaturaExtra[]>([]);
  const [novoNomeExtra, setNovoNomeExtra] = useState('');
  const [novoTipoExtra, setNovoTipoExtra] = useState('Responsável');

  // Inicializa e sincroniza os dados da ocorrência com os estados
  useEffect(() => {
    const dados = ocorrencia.dados || {};

    // Verifica se é registro diário ou ATA
    const isExplicitDaily =
      ocorrencia.modeloFormularioId === 'diario' ||
      ocorrencia.nomeModelo === 'diario' ||
      'occurrence_type' in ocorrencia;

    const numAtaKey = Object.keys(dados).find(k =>
      k.toLowerCase().includes('número da ata') || k.toLowerCase().includes('numero da ata') || k.toLowerCase() === 'ata'
    );
    let rawNumAta = numAtaKey ? String(dados[numAtaKey]) : '';

    const isExplicitAta =
      Boolean(rawNumAta && rawNumAta !== 'diario') ||
      Boolean(ocorrencia.nomeModelo && ocorrencia.nomeModelo.toLowerCase().includes('ata'));

    if (isExplicitAta && !isExplicitDaily) {
      setTipoDocumento('ata');
      if (rawNumAta.includes('/')) {
        const p = rawNumAta.split('/');
        setNumeroAta(p[0].trim());
        if (p[1]) setAnoAta(p[1].trim());
      } else if (rawNumAta) {
        setNumeroAta(rawNumAta.trim());
      } else {
        setNumeroAta('1040');
      }
    } else {
      setTipoDocumento('diario');
      setNumeroAta('');
    }

    // Extrai data
    const dateKey = Object.keys(dados).find(k => k.toLowerCase() === 'data' || k.toLowerCase().includes('data'));
    const rawDate = (dateKey ? String(dados[dateKey]) : ocorrencia.criadoEm) || new Date().toISOString();
    let initialDate = '';
    if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      initialDate = rawDate;
    } else {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          initialDate = d.toISOString().split('T')[0];
        }
      } catch (e) {
        initialDate = new Date().toISOString().split('T')[0];
      }
    }
    setDataAta(initialDate || new Date().toISOString().split('T')[0]);

    // Extrai horário
    const horaKey = Object.keys(dados).find(k =>
      k.toLowerCase().includes('horário') || k.toLowerCase().includes('horario') || k.toLowerCase().includes('hora')
    );
    const rawHora = horaKey ? String(dados[horaKey]) : '';
    if (rawHora) {
      setHorarioAta(rawHora);
    } else {
      setHorarioAta('10:00');
    }

    // Extrai turma / série
    const turmaVal = ocorrencia.turmaAluno || ocorrencia.anoAluno || dados['Turma'] || dados['turma'] || dados['Série'] || dados['serie'] || '1º Ano EM';
    setTurmaAluno(String(turmaVal));

    // Extrai cargo e nome emissor
    const cargoKey = Object.keys(dados).find(k =>
      k.toLowerCase().includes('cargo') || k.toLowerCase().includes('função') || k.toLowerCase().includes('funcao')
    );
    if (cargoKey && dados[cargoKey]) {
      setCargoEmissor(String(dados[cargoKey]));
    } else {
      setCargoEmissor('Psicólogo Escolar');
    }

    const emissor = ocorrencia.professorAtual || dados['Responsável'] || dados['responsavel'] || 'Guilherme Juliano de Freitas Silva';
    setNomeEmissor(emissor);

    // Extrai lista de alunos
    const baseAluno = ocorrencia.nomeAluno || '';
    if (baseAluno.includes(' e ') || baseAluno.includes(',')) {
      const parts = baseAluno.split(/,|\se\s/).map(s => s.trim()).filter(Boolean);
      setListaAlunos(parts);
    } else if (baseAluno) {
      setListaAlunos([baseAluno]);
    } else {
      setListaAlunos(['Estudante']);
    }

    // Extrai relato dos fatos
    const descKey = Object.keys(dados).find(k =>
      ['descrição', 'descricao', 'relato', 'descrição do ocorrido', 'descrição do fato',
       'description', 'observações', 'observacoes', 'obs', 'fatos'].includes(k.toLowerCase())
    );
    const rawRelato = descKey ? String(dados[descKey]) : ((ocorrencia as any).relato || '');
    setRelatoTexto(rawRelato || '');

    // Responsável ativo por padrão
    setConfigAssinaturas({
      mostrarAluno: true,
      nomeAluno: ocorrencia.nomeAluno || '',
      mostrarResponsavel: true,
      nomeResponsavel: dados['Responsável Legal'] || dados['nome_responsavel'] || '',
      mostrarEmissor: true,
      nomeEmissor: emissor
    });
    setAssinaturasExtras([]);
  }, [ocorrencia, startInEditMode]);

  // Monta a estrutura do documento em tempo real no padrão ABNT
  const estruturaAta = useMemo(() => {
    return montarEstruturaAta({
      tipoDocumento,
      numeroAta: tipoDocumento === 'ata' ? numeroAta : '',
      anoAta,
      dataStr: dataAta,
      horarioStr: horarioAta,
      alunos: listaAlunos,
      turmaAluno,
      nomeEmissor,
      cargoEmissor,
      relato: relatoTexto,
      mostrarAluno: configAssinaturas.mostrarAluno,
      mostrarResponsavel: configAssinaturas.mostrarResponsavel,
      nomeResponsavel: configAssinaturas.nomeResponsavel,
      mostrarEmissor: configAssinaturas.mostrarEmissor,
      assinaturasExtras
    });
  }, [tipoDocumento, numeroAta, anoAta, dataAta, horarioAta, listaAlunos, turmaAluno, nomeEmissor, cargoEmissor, relatoTexto, configAssinaturas, assinaturasExtras]);

  const adicionarAluno = () => {
    if (novoAlunoNome.trim() && !listaAlunos.includes(novoAlunoNome.trim())) {
      setListaAlunos(prev => [...prev, novoAlunoNome.trim()]);
      setNovoAlunoNome('');
    }
  };

  const removerAluno = (index: number) => {
    setListaAlunos(prev => prev.filter((_, i) => i !== index));
  };

  const adicionarAssinaturaExtra = () => {
    if (novoNomeExtra.trim()) {
      setAssinaturasExtras(prev => [...prev, { papel: novoTipoExtra, nome: novoNomeExtra.trim() }]);
      setNovoNomeExtra('');
    }
  };

  const removerAssinaturaExtra = (index: number) => {
    setAssinaturasExtras(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  const [copiadoMensagem, setCopiadoMensagem] = useState(false);

  const handleCopiarMensagem = async () => {
    const mensagem = gerarMensagemResponsaveis({
      nomeAluno: listaAlunos.join(' e ') || 'Estudante',
      turmaAluno,
      tipoOcorrencia: ocorrencia.nomeModelo || 'Registro',
      relato: relatoTexto,
      emissor: nomeEmissor,
      dataStr: dataAta
    });
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiadoMensagem(true);
      setTimeout(() => setCopiadoMensagem(false), 2500);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  const handleBaixarPDF = async () => {
    const configCompleta = {
      ...configAssinaturas,
      tipoDocumento,
      numeroAta: tipoDocumento === 'ata' ? numeroAta : '',
      anoAta,
      dataAta,
      horario: horarioAta,
      cargoEmissor,
      nomeEmissor,
      turmaAluno,
      alunos: listaAlunos
    };

    const ocorrenciaAtualizada = {
      ...ocorrencia,
      relato: relatoTexto,
      dados: {
        ...(ocorrencia.dados || {}),
        'Tipo de Documento': tipoDocumento === 'ata' ? 'ATA Oficial' : 'Registro Diário',
        'Número da Ata': tipoDocumento === 'ata' && numeroAta ? `${numeroAta}/${anoAta}` : '',
        'Data': dataAta,
        'Horário': horarioAta,
        'Turma': turmaAluno,
        'Cargo': cargoEmissor,
        'Responsável': nomeEmissor,
        'Descrição': relatoTexto
      }
    };

    await generateFichaOcorrenciaPDF(ocorrenciaAtualizada, configCompleta, assinaturasExtras);
  };

  const content = (
    <>
      <div className={cn(
        "bg-transparent md:bg-white w-full max-w-6xl flex flex-col md:flex-row gap-4 md:gap-0 print:shadow-none print:max-h-none print:rounded-none print-modal-container",
        !isPrintOnly ? "max-h-none md:max-h-[95vh] md:overflow-hidden md:rounded-[2.5rem] md:shadow-2xl" : "rounded-none"
      )}>
        {/* Painel de Formulário / Configurações da ATA / Registro (Esquerda) - Oculta na Impressão */}
        <div className="w-full md:w-96 bg-white md:bg-gray-50 border border-gray-100 md:border-0 md:border-r border-gray-100 p-6 md:p-8 flex flex-col gap-6 print:hidden rounded-3xl md:rounded-none md:rounded-l-[2.5rem] shadow-xl md:shadow-none overflow-y-visible md:overflow-y-auto shrink-0 custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h3 className="font-black text-lg text-gray-900">Configuração do Documento</h3>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Padrão Oficial Sesi & ABNT
            </p>
          </div>

          <div className="space-y-5">
            {/* Seletor de Tipo: ATA Oficial ou Registro Diário */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                <FileText size={13} className="text-primary" /> Tipo de Documento no Cabeçalho
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-200/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTipoDocumento('diario')}
                  className={cn(
                    "py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    tipoDocumento === 'diario'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Calendar size={13} />
                  Registro Diário
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDocumento('ata')}
                  className={cn(
                    "py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    tipoDocumento === 'ata'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <ClipboardList size={13} />
                  ATA Oficial
                </button>
              </div>
              <p className="text-[10px] font-bold text-gray-500 mt-1">
                {tipoDocumento === 'diario' ? (
                  <span className="text-emerald-700 font-bold">✓ Cabeçalho: REGISTRO DIÁRIO - {estruturaAta.dataFormatada}</span>
                ) : (
                  <span className="text-blue-700 font-bold">✓ Cabeçalho: {estruturaAta.tituloAta}</span>
                )}
              </p>
            </div>

            {/* Número da ATA (apenas se for ATA Oficial) */}
            {tipoDocumento === 'ata' && (
              <div className="space-y-1.5 p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1.5">
                  <FileText size={13} className="text-blue-600" /> Número da ATA
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={numeroAta}
                    onChange={e => setNumeroAta(e.target.value)}
                    placeholder="Ex: 1040"
                    className="flex-1 bg-white border border-blue-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                  />
                  <span className="self-center font-bold text-gray-400">/</span>
                  <input
                    type="text"
                    value={anoAta}
                    onChange={e => setAnoAta(e.target.value)}
                    placeholder="Ano"
                    className="w-20 bg-white border border-blue-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm text-center"
                  />
                </div>
              </div>
            )}

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1">
                  <Calendar size={13} className="text-primary" /> Data
                </label>
                <input
                  type="date"
                  value={dataAta}
                  onChange={e => setDataAta(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1">
                  <Clock size={13} className="text-primary" /> Horário
                </label>
                <input
                  type="time"
                  value={horarioAta}
                  onChange={e => setHorarioAta(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Turma / Série Escolar */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                <GraduationCap size={13} className="text-primary" /> Turma do(a) Aluno(a)
              </label>
              <input
                type="text"
                list="turmas-sugestoes"
                value={turmaAluno}
                onChange={e => setTurmaAluno(e.target.value)}
                placeholder="Ex: 1º Ano EM"
                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
              />
              <datalist id="turmas-sugestoes">
                {SERIES_OPCOES.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {/* Estudantes Envolvidos */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center justify-between">
                <span>Aluno(a) / Estudantes</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold">
                  {listaAlunos.length}
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoAlunoNome}
                  onChange={e => setNovoAlunoNome(e.target.value)}
                  placeholder="Nome do(a) aluno(a)..."
                  className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarAluno();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={adicionarAluno}
                  className="p-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="Adicionar Estudante"
                >
                  <Plus size={16} />
                </button>
              </div>

              {listaAlunos.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar pt-1">
                  {listaAlunos.map((aluno, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 bg-white border border-gray-200 p-2 px-3 rounded-xl text-xs shadow-sm">
                      <span className="font-bold text-gray-800 truncate">{aluno}</span>
                      <button
                        type="button"
                        onClick={() => removerAluno(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profissional / Emissor */}
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                <User size={13} className="text-primary" /> Profissional Responsável
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Cargo / Função</label>
                  <input
                    type="text"
                    list="cargos-emissor-list"
                    value={cargoEmissor}
                    onChange={e => setCargoEmissor(e.target.value)}
                    placeholder="Ex: Psicólogo Escolar"
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm mt-0.5"
                  />
                  <datalist id="cargos-emissor-list">
                    {CARGOS_SUGERIDOS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    value={nomeEmissor}
                    onChange={e => setNomeEmissor(e.target.value)}
                    placeholder="Nome do Profissional"
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Assinatura do Responsável Legal */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Assinatura do Responsável Legal
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configAssinaturas.mostrarResponsavel}
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, mostrarResponsavel: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {configAssinaturas.mostrarResponsavel && (
                <input
                  type="text"
                  value={configAssinaturas.nomeResponsavel}
                  onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                  placeholder="Nome do Responsável (vazio = Pais / Responsável Legal)"
                  className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                />
              )}
            </div>

            {/* Relato / Descrição dos Fatos */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center justify-between">
                <span>Descrição do Ocorrido</span>
              </label>
              <textarea
                value={relatoTexto}
                onChange={e => setRelatoTexto(e.target.value)}
                rows={5}
                className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium text-gray-900 focus:border-primary outline-none transition-all resize-y shadow-sm leading-relaxed"
                placeholder="Descreva detalhadamente o ocorrido..."
              />
            </div>

            {/* Assinaturas Extras */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center justify-between">
                <span>Outras Assinaturas</span>
                {assinaturasExtras.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold">
                    {assinaturasExtras.length}
                  </span>
                )}
              </label>

              <div className="space-y-2 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                <input
                  type="text"
                  value={novoTipoExtra}
                  onChange={e => setNovoTipoExtra(e.target.value)}
                  placeholder="Cargo / Papel (ex: Testemunha)"
                  className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novoNomeExtra}
                    onChange={e => setNovoNomeExtra(e.target.value)}
                    placeholder="Nome de quem vai assinar"
                    className="flex-1 bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarAssinaturaExtra();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={adicionarAssinaturaExtra}
                    className="p-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    title="Adicionar Assinatura"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {assinaturasExtras.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {assinaturasExtras.map((extra, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 bg-white border border-gray-200 p-2 px-3 rounded-xl text-xs shadow-sm">
                      <div className="truncate">
                        <span className="font-bold text-gray-900">{extra.nome}</span>
                        <span className="text-[10px] text-primary font-bold ml-1.5">({extra.papel})</span>
                      </div>
                      <button
                        onClick={() => removerAssinaturaExtra(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-auto pt-4 border-t border-gray-200 space-y-2.5">
            <button
              onClick={handleCopiarMensagem}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-5 py-3 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-md cursor-pointer",
                copiadoMensagem ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {copiadoMensagem ? <Check size={16} /> : <Share2 size={16} />} 
              {copiadoMensagem ? 'Mensagem Copiada!' : 'Copiar Mensagem Pais'}
            </button>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-md cursor-pointer"
            >
              <Printer size={16} /> Imprimir {tipoDocumento === 'ata' ? 'ATA' : 'Registro'}
            </button>
            <button
              onClick={handleBaixarPDF}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-md cursor-pointer"
            >
              <Download size={16} /> Baixar PDF Oficial
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>

        {/* Folha Oficial de Impressão e Preview (Direita) - Padrão ABNT com Margens Seguras Anti-Sobreposição */}
        <div
          id="printable-occurrence"
          className="flex-1 bg-white rounded-3xl md:rounded-none md:rounded-r-[2.5rem] shadow-xl md:shadow-none border border-gray-100 md:border-0 overflow-y-visible md:overflow-y-auto custom-scrollbar relative flex flex-col print-card-content min-h-[600px]"
        >
          {/* Papel Timbrado Oficial com o Logo do Colégio Sesi Internacional */}
          <img
            src={papelTimbradoImg}
            alt="Papel Timbrado Oficial"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-[1]"
          />

          <div className="flex-1 px-8 sm:px-14 md:px-20 pt-[42mm] md:pt-[48mm] pb-10 md:pb-12 space-y-6 print:pt-[48mm] print:px-[25mm] print:pb-[38mm] relative z-10 flex flex-col justify-between">
            <div>
              {/* TÍTULO EM FORMATO DE TÍTULO ANTES DE COMEÇAR A FRASE E EM NEGRITO */}
              <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-bold font-sans text-[#0c2340] tracking-tight uppercase">
                  {estruturaAta.tituloAta}
                </h1>
              </div>

              {/* Corpo do Documento: Arial 12pt, Espaçamento 1,5 linha, Texto Justificado (Padrão ABNT) */}
              <div
                className="text-gray-900 text-justify space-y-4"
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: '12pt',
                  lineHeight: '1.5'
                }}
              >
                {/* Parágrafo 1: Abertura com Dados Preenchidos */}
                <p className="text-justify indent-0">
                  {estruturaAta.paragrafoAbertura}
                </p>

                {/* Parágrafo 2: Descrição / Relato dos Fatos */}
                {estruturaAta.paragrafoRelato && (
                  <p className="text-justify whitespace-pre-wrap indent-0">
                    {estruturaAta.paragrafoRelato}
                  </p>
                )}

                {/* Parágrafo 3: Encaminhamentos */}
                <p className="text-justify indent-0">
                  {estruturaAta.paragrafoEncaminhamentos}
                </p>

                {/* Parágrafo 4: Fechamento */}
                <p className="text-justify indent-0">
                  {estruturaAta.paragrafoFechamento}
                </p>
              </div>
            </div>

            {/* Seção de Assinaturas (Linhas e Nomes) - Acima do logotipo SESI sem sobreposição */}
            <div className="mt-8 pt-4 pb-2 print:mt-auto print:pt-4 print:pb-0">
              <div className={cn(
                "grid gap-x-6 gap-y-6 max-w-3xl",
                estruturaAta.assinaturas.length === 2 ? "grid-cols-2" : (estruturaAta.assinaturas.length === 3 ? "grid-cols-3 print:grid-cols-3" : "grid-cols-2")
              )}>
                {estruturaAta.assinaturas.map((ass, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-full max-w-[190px] border-b border-gray-900 mb-1.5"></div>
                    <p className="text-[11px] font-bold text-gray-900 tracking-tight font-sans leading-tight">
                      {ass.nome}
                    </p>
                    {ass.papel && (
                      <p className="text-[9px] text-gray-600 font-sans mt-0.5 leading-tight">
                        {ass.papel}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-occurrence, #printable-occurrence * { visibility: visible; }
          #printable-occurrence {
            position: relative;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            padding: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:flex { display: flex !important; }
        }
      `}} />
    </>
  );

  if (isPrintOnly) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      {content}
    </div>
  );
}
