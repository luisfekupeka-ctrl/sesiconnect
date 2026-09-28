import React, { useState, useEffect, useMemo } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square, Plus, Trash2, Download, Clock, Calendar, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFichaOcorrenciaPDF } from '../lib/reportGenerator';
import papelTimbradoImg from '../assets/papel_timbrado.png';
import { occurrenceService } from '../services/occurrenceService';
import { montarEstruturaAta, parseDataEHorarioAta } from '../lib/ataUtils';

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

const SERIES_CADASTRO = [
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º Ano EM',
  '2º Ano EM',
  '3º Ano EM'
];

const TIPOS_OCORRENCIA = [
  'Uso indevido de celular e aparelhos eletrônicos',
  'Desrespeito a colegas, professores e funcionários',
  'Baderna, gritaria e perturbação das aulas',
  'Bullying, cyberbullying e constrangimentos',
  'Agressão física ou verbal',
  'Saída da sala sem autorização',
  'Saída da escola sem autorização',
  'Atrasos e descumprimento de horários',
  'Danos leves ao patrimônio ou pertences alheios, sem intenção',
  'Dano intencional ou depredação',
  'Cola ou fraude em atividade escolar',
  'Falsificação ou adulteração de documentos',
  'Porte ou uso de vape, cigarros, álcool e drogas',
  'Uso inadequado do uniforme escolar',
  'Porte de objetos ou materiais comuns não autorizados',
  'Porte de objeto perigoso, arma ou explosivo',
  'Comércio, vendas ou arrecadações sem autorização',
  'Descumprimento de orientações da equipe escolar',
  'Conduta incompatível com o ambiente escolar'
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
  // Estados para edição de Ocorrências Diárias legadas
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [editStudentName, setEditStudentName] = useState(ocorrencia.nomeAluno || '');
  const [editSchoolYear, setEditSchoolYear] = useState(ocorrencia.turmaAluno || '');
  const [editOccurrenceType, setEditOccurrenceType] = useState('');
  const [editReport, setEditReport] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estados principais da ATA
  const [numeroAta, setNumeroAta] = useState('');
  const [anoAta, setAnoAta] = useState(String(new Date().getFullYear()));
  const [dataAta, setDataAta] = useState('');
  const [horarioAta, setHorarioAta] = useState('10:00');
  const [cargoEmissor, setCargoEmissor] = useState('Psicólogo Escolar');
  const [nomeEmissor, setNomeEmissor] = useState(ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva');
  const [listaAlunos, setListaAlunos] = useState<string[]>([]);
  const [novoAlunoNome, setNovoAlunoNome] = useState('');
  const [relatoTexto, setRelatoTexto] = useState('');

  // Configurações extras de assinatura
  const [configAssinaturas, setConfigAssinaturas] = useState({
    mostrarAluno: true,
    nomeAluno: ocorrencia.nomeAluno,
    mostrarResponsavel: false,
    nomeResponsavel: '',
    mostrarEmissor: true,
    nomeEmissor: ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva'
  });

  const [assinaturasExtras, setAssinaturasExtras] = useState<AssinaturaExtra[]>([]);
  const [novoNomeExtra, setNovoNomeExtra] = useState('');
  const [novoTipoExtra, setNovoTipoExtra] = useState('Responsável');

  // Inicializa e sincroniza os dados da ocorrência com os estados da ATA
  useEffect(() => {
    const dados = ocorrencia.dados || {};

    // Extrai número da ATA
    const numAtaKey = Object.keys(dados).find(k =>
      k.toLowerCase().includes('número da ata') || k.toLowerCase().includes('numero da ata') || k.toLowerCase() === 'ata' || k.toLowerCase() === 'número' || k.toLowerCase() === 'numero'
    );
    let rawNumAta = numAtaKey ? String(dados[numAtaKey]) : '';
    if (!rawNumAta && ocorrencia.nomeModelo && ocorrencia.nomeModelo.includes('1040')) {
      rawNumAta = '1040/2026';
    }

    if (rawNumAta.includes('/')) {
      const p = rawNumAta.split('/');
      setNumeroAta(p[0].trim());
      if (p[1]) setAnoAta(p[1].trim());
    } else if (rawNumAta) {
      setNumeroAta(rawNumAta.trim());
    } else {
      setNumeroAta('1040');
      setAnoAta('2026');
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
    setDataAta(initialDate || '2026-09-23');

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

    // Extrai cargo e nome emissor
    const cargoKey = Object.keys(dados).find(k =>
      k.toLowerCase().includes('cargo') || k.toLowerCase().includes('função') || k.toLowerCase().includes('funcao')
    );
    if (cargoKey && dados[cargoKey]) {
      setCargoEmissor(String(dados[cargoKey]));
    } else {
      setCargoEmissor('Psicólogo Escolar');
    }

    const emissor = ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva';
    setNomeEmissor(emissor);

    // Extrai lista de alunos
    const baseAluno = ocorrencia.nomeAluno || '';
    if (baseAluno.includes(' e ') || baseAluno.includes(',')) {
      const parts = baseAluno.split(/,|\se\s/).map(s => s.trim()).filter(Boolean);
      setListaAlunos(parts);
    } else if (baseAluno) {
      setListaAlunos([baseAluno]);
    } else {
      setListaAlunos(['Vithoria Franco', 'Angelina Maria Vaz Guimarães Ferreira Nishizaki']);
    }

    // Extrai relato dos fatos
    const descKey = Object.keys(dados).find(k =>
      ['descrição', 'descricao', 'relato', 'descrição do ocorrido', 'descrição do fato',
       'description', 'observações', 'observacoes', 'obs', 'fatos'].includes(k.toLowerCase())
    );
    const rawRelato = descKey ? String(dados[descKey]) : ((ocorrencia as any).relato || '');
    setRelatoTexto(rawRelato || 'Nesta data, as estudantes foram encontradas fora de sala de aula em horário indevido, relatando que vivenciaram uma situação de crise emocional, por conta disso não se dirigiram para a sala de aula, complementaram que estavam se escondendo no banheiro feminino do terceiro andar. Informei as alunas quanto a natureza inaceitável de suas ações, destacando que, em caso de crises emocionais, podem e devem procurar meu auxílio, para que sejam atendidas de forma profissional e qualificada. Complementei destacando as medidas previstas no Regimento Escolar, em caso de reincidência de suas ações.');

    // Sincroniza campos legados de edição
    setEditStudentName(ocorrencia.nomeAluno || '');
    setEditSchoolYear(ocorrencia.turmaAluno || '');
    const typeKey = Object.keys(dados).find(k => k.toLowerCase() === 'tipo de ocorrência' || k.toLowerCase() === 'tipo de ocorrencia' || k.toLowerCase() === 'tipo');
    setEditOccurrenceType(typeKey ? String(dados[typeKey]) : (ocorrencia.nomeModelo || ''));
    setEditReport(rawRelato);
    setIsEditing(startInEditMode || false);

    setConfigAssinaturas({
      mostrarAluno: true,
      nomeAluno: ocorrencia.nomeAluno || '',
      mostrarResponsavel: false,
      nomeResponsavel: '',
      mostrarEmissor: true,
      nomeEmissor: emissor
    });
    setAssinaturasExtras([]);
  }, [ocorrencia, startInEditMode]);

  // Monta a estrutura da ATA em tempo real
  const estruturaAta = useMemo(() => {
    return montarEstruturaAta({
      numeroAta,
      anoAta,
      dataStr: dataAta,
      horarioStr: horarioAta,
      alunos: listaAlunos,
      nomeEmissor,
      cargoEmissor,
      relato: relatoTexto,
      assinaturasExtras
    });
  }, [numeroAta, anoAta, dataAta, horarioAta, listaAlunos, nomeEmissor, cargoEmissor, relatoTexto, assinaturasExtras]);

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

  const handleBaixarPDF = async () => {
    const configCompleta = {
      ...configAssinaturas,
      numeroAta,
      anoAta,
      dataAta,
      horario: horarioAta,
      cargoEmissor,
      nomeEmissor,
      alunos: listaAlunos
    };

    const ocorrenciaAtualizada = {
      ...ocorrencia,
      relato: relatoTexto,
      dados: {
        ...(ocorrencia.dados || {}),
        'Número da Ata': numeroAta ? `${numeroAta}/${anoAta}` : '',
        'Data': dataAta,
        'Horário': horarioAta,
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
        {/* Painel de Configurações da ATA (Esquerda) - Oculta na Impressão */}
        <div className="w-full md:w-96 bg-white md:bg-gray-50 border border-gray-100 md:border-0 md:border-r border-gray-100 p-6 md:p-8 flex flex-col gap-6 print:hidden rounded-3xl md:rounded-none md:rounded-l-[2.5rem] shadow-xl md:shadow-none overflow-y-visible md:overflow-y-auto shrink-0 custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="font-black text-lg text-gray-900">Configurar ATA</h3>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Estrutura Oficial de Registro
            </p>
          </div>

          <div className="space-y-5">
            {/* Número da ATA */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                <FileText size={13} className="text-primary" /> Número da ATA
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={numeroAta}
                  onChange={e => setNumeroAta(e.target.value)}
                  placeholder="Ex: 1040"
                  className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm"
                />
                <span className="self-center font-bold text-gray-400">/</span>
                <input
                  type="text"
                  value={anoAta}
                  onChange={e => setAnoAta(e.target.value)}
                  placeholder="Ano"
                  className="w-20 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all shadow-sm text-center"
                />
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-1">
                  <Calendar size={13} className="text-primary" /> Data da ATA
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

            {/* Estudantes Envolvidos */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center justify-between">
                <span>Estudantes na ATA</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold">
                  {listaAlunos.length}
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoAlunoNome}
                  onChange={e => setNovoAlunoNome(e.target.value)}
                  placeholder="Nome do estudante..."
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
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relato / Fatos Ocorridos */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center justify-between">
                <span>Relato dos Fatos</span>
              </label>
              <textarea
                value={relatoTexto}
                onChange={e => setRelatoTexto(e.target.value)}
                rows={5}
                className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium text-gray-900 focus:border-primary outline-none transition-all resize-y shadow-sm leading-relaxed"
                placeholder="Descreva os fatos detalhados que serão emendados na ATA..."
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
                  placeholder="Cargo / Papel (ex: Responsável Legal)"
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
                    className="p-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center shrink-0"
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
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-md cursor-pointer"
            >
              <Printer size={16} /> Imprimir ATA
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

        {/* Folha Oficial de Impressão e Preview (Direita) */}
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

          <div className="flex-1 px-8 sm:px-14 md:px-20 pt-[42mm] md:pt-[50mm] pb-12 md:pb-20 space-y-8 print:pt-[52mm] print:px-[25mm] print:pb-[20mm] relative z-10 flex flex-col justify-between">
            <div>
              {/* Título Oficial da ATA (ex: ATA 1040/2026) */}
              <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-black text-[#0c2340] tracking-tight uppercase">
                  {estruturaAta.tituloAta}
                </h1>
              </div>

              {/* Texto Corrido Contínuo da ATA */}
              <div className="text-sm md:text-[15px] text-gray-900 leading-[1.8] text-justify font-normal space-y-4 font-sans">
                <p>
                  <span className="font-normal">{estruturaAta.textoAbertura} </span>
                  {estruturaAta.textoRelato && (
                    <span className="font-normal">{estruturaAta.textoRelato} </span>
                  )}
                  <span className="font-normal">{estruturaAta.textoFechamento}</span>
                </p>
              </div>
            </div>

            {/* Seção de Assinaturas (Linhas e Nomes) */}
            <div className="pt-16 print:pt-20">
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-12 max-w-3xl">
                {estruturaAta.assinaturas.map((ass, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-full max-w-[240px] border-b border-gray-900 mb-2"></div>
                    <p className="text-xs font-bold text-gray-900 tracking-wide">
                      {ass.nome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-occurrence, #printable-occurrence * { visibility: visible; }
          #printable-occurrence {
            position: relative;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 0 !important;
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
