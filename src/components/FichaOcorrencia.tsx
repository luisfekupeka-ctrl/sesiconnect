import React, { useState, useEffect } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square, Plus, Trash2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFichaOcorrenciaPDF } from '../lib/reportGenerator';
import papelTimbradoImg from '../assets/papel_timbrado.png';
import { occurrenceService } from '../services/occurrenceService';

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

const SERIES_CADASTRO = [
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º Ano EM',
  '2º Ano EM',
  '3º Ano EM'
];

interface Props {
  ocorrencia: RegistroOcorrencia;
  onClose: () => void;
  isPrintOnly?: boolean;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  startInEditMode?: boolean;
}

export default function FichaOcorrencia({ ocorrencia, onClose, isPrintOnly, onEditSuccess, onDeleteSuccess, startInEditMode }: Props) {
  const [isConfigOpen, setIsConfigOpen] = useState(startInEditMode || false);
  
  // Estados para edição de Ocorrências Diárias
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [editStudentName, setEditStudentName] = useState(ocorrencia.nomeAluno || '');
  const [editSchoolYear, setEditSchoolYear] = useState(ocorrencia.turmaAluno || '');
  const [editOccurrenceType, setEditOccurrenceType] = useState('');
  const [editReport, setEditReport] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Configurações dinâmicas de assinatura
  const [configAssinaturas, setConfigAssinaturas] = useState({
    mostrarAluno: true,
    nomeAluno: ocorrencia.nomeAluno,
    mostrarResponsavel: true,
    nomeResponsavel: '',
    mostrarEmissor: true,
    nomeEmissor: ocorrencia.professorAtual || 'Administração'
  });

  // Sync state with ocorrencia changes to prevent layout and names caching
  useEffect(() => {
    setConfigAssinaturas({
      mostrarAluno: true,
      nomeAluno: ocorrencia.nomeAluno || '',
      mostrarResponsavel: true,
      nomeResponsavel: '',
      mostrarEmissor: true,
      nomeEmissor: ocorrencia.professorAtual || 'Administração'
    });
    setNovoNomeExtra('');
    setNovoTipoExtra('Aluno');
    setAssinaturasExtras([]);

    // Sincroniza campos de edição
    setEditStudentName(ocorrencia.nomeAluno || '');
    setEditSchoolYear(ocorrencia.turmaAluno || '');
    const descKey = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase() === 'descrição' || k.toLowerCase() === 'descricao' || k.toLowerCase() === 'relato');
    const typeKey = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase() === 'tipo de ocorrência' || k.toLowerCase() === 'tipo de ocorrencia' || k.toLowerCase() === 'tipo');
    setEditOccurrenceType(typeKey ? String(ocorrencia.dados[typeKey]) : (ocorrencia.nomeModelo || ''));
    setEditReport(descKey ? String(ocorrencia.dados[descKey]) : '');
    setIsEditing(startInEditMode || false);
    setIsConfigOpen(startInEditMode || false);
  }, [ocorrencia, startInEditMode]);


  interface AssinaturaExtra {
    papel: string;
    nome: string;
  }

  const [assinaturasExtras, setAssinaturasExtras] = useState<AssinaturaExtra[]>([]);
  const [novoNomeExtra, setNovoNomeExtra] = useState('');
  const [novoTipoExtra, setNovoTipoExtra] = useState('Aluno');

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

  const content = (
    <>
      <div className={cn(
          "bg-transparent md:bg-white w-full max-w-5xl flex flex-col md:flex-row gap-4 md:gap-0 print:shadow-none print:max-h-none print:rounded-none print-modal-container",
          !isPrintOnly ? "max-h-none md:max-h-[95vh] md:overflow-hidden md:rounded-[2.5rem] md:shadow-2xl" : "rounded-none"
      )}>
          
          {/* Configurações (Esquerda) - Oculta na impressão */}
          <div className="w-full md:w-80 bg-white md:bg-gray-50 border border-gray-100 md:border-0 md:border-r border-gray-100 p-6 md:p-8 flex flex-col gap-6 print:hidden rounded-3xl md:rounded-none md:rounded-l-[2.5rem] shadow-xl md:shadow-none overflow-y-visible md:overflow-y-auto shrink-0">
            <div>
              <h3 className="font-black text-lg mb-1">Configurar Documento</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personalize as assinaturas</p>
            </div>

            <div className="space-y-6">
              {/* Assinatura Aluno */}
              <div className="space-y-3">
                <button 
                  onClick={() => setConfigAssinaturas(prev => ({ ...prev, mostrarAluno: !prev.mostrarAluno }))}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900"
                >
                  {configAssinaturas.mostrarAluno ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  Assinatura do Aluno
                </button>
                {configAssinaturas.mostrarAluno && (
                  <input 
                    type="text" 
                    value={configAssinaturas.nomeAluno} 
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeAluno: e.target.value }))}
                    placeholder="Nome do Aluno"
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all"
                  />
                )}
              </div>

              {/* Assinatura Responsável */}
              <div className="space-y-3">
                <button 
                  onClick={() => setConfigAssinaturas(prev => ({ ...prev, mostrarResponsavel: !prev.mostrarResponsavel }))}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900"
                >
                  {configAssinaturas.mostrarResponsavel ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  Assinatura do Responsável Legal (Pai/Mãe)
                </button>
                {configAssinaturas.mostrarResponsavel && (
                  <input 
                    type="text" 
                    value={configAssinaturas.nomeResponsavel} 
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                    placeholder="Nome do Responsável Legal (Pai/Mãe)"
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all"
                  />
                )}
              </div>

              {/* Assinatura Emissor */}
              <div className="space-y-3">
                <button 
                  onClick={() => setConfigAssinaturas(prev => ({ ...prev, mostrarEmissor: !prev.mostrarEmissor }))}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900"
                >
                  {configAssinaturas.mostrarEmissor ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  Responsável pelo Registro
                </button>
                {configAssinaturas.mostrarEmissor && (
                  <input 
                    type="text" 
                    value={configAssinaturas.nomeEmissor} 
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeEmissor: e.target.value }))}
                    placeholder="Nome de quem fez o registro"
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all"
                  />
                )}
              </div>

              {/* Assinaturas Extras */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center justify-between">
                  <span>Assinaturas Extras</span>
                  {assinaturasExtras.length > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px]">
                      {assinaturasExtras.length}
                    </span>
                  )}
                </label>
                
                <div className="space-y-2 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Tipo</label>
                    <input
                      type="text"
                      list="cargos-list"
                      value={novoTipoExtra}
                      onChange={e => setNovoTipoExtra(e.target.value)}
                      placeholder="Ex: Monitor, Professor..."
                      className="w-full bg-gray-50 border border-gray-150 p-2 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all mt-1"
                    />
                    <datalist id="cargos-list">
                      <option value="Monitor" />
                      <option value="Professor" />
                      <option value="Pedagogo" />
                      <option value="Colaborador" />
                      <option value="Aluno" />
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Nome</label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="text" 
                        value={novoNomeExtra} 
                        onChange={e => setNovoNomeExtra(e.target.value)}
                        placeholder="Nome de quem vai assinar"
                        className="flex-1 bg-gray-50 border border-gray-150 p-2 rounded-xl text-xs font-bold text-gray-900 focus:border-primary outline-none transition-all"
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
                </div>

                {assinaturasExtras.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {assinaturasExtras.map((extra, index) => (
                      <div key={index} className="space-y-1.5 bg-white border border-gray-100 p-2.5 rounded-xl text-xs shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            list="cargos-list"
                            value={extra.papel}
                            onChange={e => {
                              const val = e.target.value;
                              setAssinaturasExtras(prev => prev.map((item, i) => i === index ? { ...item, papel: val } : item));
                            }}
                            className="bg-transparent border-0 outline-none font-bold text-primary text-[10px] uppercase tracking-wider w-24"
                          />
                          <button 
                            onClick={() => removerAssinaturaExtra(index)}
                            className="text-gray-400 hover:text-red-500 transition-all p-1 shrink-0"
                            type="button"
                            title="Remover"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={extra.nome} 
                          onChange={e => {
                            const val = e.target.value;
                            setAssinaturasExtras(prev => prev.map((item, i) => i === index ? { ...item, nome: val } : item));
                          }}
                          className="w-full bg-gray-50 p-1.5 px-2 border-0 outline-none font-bold text-gray-700 rounded-lg text-xs"
                          placeholder="Nome de quem vai assinar"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {ocorrencia.modeloFormularioId === 'diario' && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ações do Registro Diário</label>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white rounded-2xl text-xs font-black uppercase transition-all shadow-sm cursor-pointer"
                >
                  Editar Registro
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
                      try {
                        await occurrenceService.deleteRecord(ocorrencia.id);
                        alert('Registro apagado com sucesso!');
                        if (onDeleteSuccess) onDeleteSuccess();
                        onClose();
                      } catch (err) {
                        alert('Erro ao apagar registro.');
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl text-xs font-black uppercase transition-all shadow-sm cursor-pointer"
                >
                  Apagar Registro
                </button>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
                <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-md cursor-pointer">
                  <Printer size={16} /> Imprimir
                </button>
                <button 
                  onClick={async () => {
                    await generateFichaOcorrenciaPDF(ocorrencia, configAssinaturas, assinaturasExtras);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-md cursor-pointer"
                >
                  <Download size={16} /> Baixar PDF
                </button>
                <button onClick={onClose} className="w-full py-3.5 bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                Fechar Visualização
              </button>
            </div>
          </div>

          {/* Área de Impressão (Direita) ou Formulário de Edição */}
          <div id="printable-occurrence" className="flex-1 bg-white rounded-3xl md:rounded-none md:rounded-r-[2.5rem] shadow-xl md:shadow-none border border-gray-100 md:border-0 overflow-y-visible md:overflow-y-auto custom-scrollbar relative flex flex-col print-card-content">
            {isEditing ? (
              <div className="flex-1 p-6 sm:p-10 md:p-14 overflow-y-auto flex flex-col justify-between relative z-10 text-gray-800">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Editar Registro Diário</h3>
                    <p className="text-xs text-gray-500 mt-1">Modifique as informações do registro diário selecionado.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-700 uppercase">Nome do Aluno</label>
                      <input 
                        type="text" 
                        value={editStudentName} 
                        onChange={e => setEditStudentName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-700 uppercase">Ano Letivo</label>
                      <select 
                        value={editSchoolYear} 
                        onChange={e => setEditSchoolYear(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                      >
                        {SERIES_CADASTRO.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-700 uppercase">Tipo de Ocorrência</label>
                      <select 
                        value={editOccurrenceType} 
                        onChange={e => setEditOccurrenceType(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                      >
                        {TIPOS_OCORRENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-700 uppercase">Relato Completo / Descrição</label>
                      <textarea 
                        value={editReport} 
                        onChange={e => setEditReport(e.target.value)}
                        rows={6}
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-medium text-gray-900 focus:border-primary outline-none transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase transition-all"
                    disabled={salvandoEdicao}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      if (!editStudentName.trim() || !editReport.trim()) {
                        alert('Preencha todos os campos obrigatórios.');
                        return;
                      }
                      setSalvandoEdicao(true);
                      try {
                        await occurrenceService.updateRecord(ocorrencia.id, {
                          student_name: editStudentName.trim(),
                          school_year: editSchoolYear.trim(),
                          occurrence_type: editOccurrenceType.trim(),
                          report: editReport.trim()
                        });
                        alert('Registro atualizado com sucesso!');
                        setIsEditing(false);
                        if (onEditSuccess) onEditSuccess();
                      } catch (err) {
                        alert('Erro ao atualizar registro.');
                      } finally {
                        setSalvandoEdicao(false);
                      }
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl text-xs uppercase transition-all"
                    disabled={salvandoEdicao}
                  >
                    {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Papel Timbrado Oficial em Altíssima Definição (Fundo Real) */}
                <img 
                  src={papelTimbradoImg} 
                  alt="Papel Timbrado Oficial" 
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-[1]" 
                />

                <div className="flex-1 px-4 sm:px-12 md:px-20 pt-[35mm] md:pt-[45mm] pb-10 md:pb-20 space-y-6 md:space-y-10 print:pt-[55mm] print:px-[25mm] print:pb-[20mm] relative z-10">
                   {/* Cabeçalho do Documento - Alocado de maneira inteligente */}
                   <div className="space-y-1.5 text-sm text-[#0c2340] font-medium border-b border-gray-200 pb-6">
                     <p><span className="font-bold mr-2">Nome do Aluno:</span> {configAssinaturas.nomeAluno || ocorrencia.nomeAluno}</p>
                     <p><span className="font-bold mr-2">Ano:</span> {ocorrencia.anoAluno || ocorrencia.turmaAluno || 'Não informado'}</p>
                     <p><span className="font-bold mr-2">Responsável pelo Registro:</span> {configAssinaturas.nomeEmissor || 'Administração'}</p>
                     
                     {/* Quaisquer outros campos adicionados vêm abaixo do responsável pelo registro */}
                     {configAssinaturas.nomeResponsavel && (
                       <p><span className="font-bold mr-2">Responsável Legal:</span> {configAssinaturas.nomeResponsavel}</p>
                     )}
                     {assinaturasExtras.map((extra, index) => (
                       <p key={index}><span className="font-bold mr-2">{extra.papel}:</span> {extra.nome}</p>
                     ))}
                     
                     <p><span className="font-bold mr-2">Data:</span> {(() => {
                       const key = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase() === 'data');
                       const rawDate = key ? String(ocorrencia.dados[key]) : (ocorrencia.criadoEm || new Date().toISOString());
                       if (!rawDate) return '';
                       if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                         const [y, m, d] = rawDate.split('-');
                         return `${d}/${m}/${y}`;
                       }
                       try {
                         const dt = new Date(rawDate);
                         if (isNaN(dt.getTime())) return rawDate;
                         const useUTC = !rawDate.includes('T') && !rawDate.includes(' ');
                         return dt.toLocaleDateString('pt-BR', useUTC ? { timeZone: 'UTC' } : undefined);
                       } catch (e) {
                         return rawDate;
                       }
                     })()}</p>
                     {(() => {
                       const numAtaKey = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase().includes('número da ata') || k.toLowerCase().includes('numero da ata') || k.toLowerCase() === 'ata');
                       if (numAtaKey && ocorrencia.dados[numAtaKey]) {
                         return <p><span className="font-bold mr-2">Número da Ata:</span> {String(ocorrencia.dados[numAtaKey])}</p>;
                       }
                       return null;
                     })()}
                   </div>

                   {/* Título */}
                   <div>
                     <h1 className="text-2xl font-black text-[#0c2340] uppercase tracking-tight">
                        Registro de Ata
                     </h1>
                     <p className="text-sm font-bold text-gray-500 uppercase mt-1">
                        {(() => {
                          const key = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase() === 'tipo de ocorrência' || k.toLowerCase() === 'tipo de ocorrencia');
                          return key ? String(ocorrencia.dados[key]) : ocorrencia.nomeModelo;
                        })()}
                     </p>
                   </div>

                   {/* Descrição Dinâmica - Ignorando campos que já estão no cabeçalho */}
                   <div className="space-y-6 text-sm text-gray-800 leading-relaxed text-justify pt-4">
                      {Object.entries(ocorrencia.dados || {})
                        .filter(([key]) => !['responsável', 'responsavel', 'professor', 'data', 'tipo de ocorrência', 'tipo de ocorrencia', 'número da ata', 'numero da ata', 'ata'].includes(key.toLowerCase()))
                        .map(([key, value]) => (
                        <div key={key}>
                          <p className="font-bold mb-1 uppercase text-xs text-[#0c2340]">{key}</p>
                          <p className="whitespace-pre-wrap text-gray-700">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                        </div>
                      ))}
                   </div>

                    {/* Assinaturas - Margem superior grande para empurrar para o fundo ou separar bem */}
                    <div className="pt-24 print:pt-32 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-20 print:gap-y-12">
                      {configAssinaturas.mostrarAluno && (
                        <div className="text-center">
                          <div className="w-full border-b border-gray-900 mb-2"></div>
                          <p className="text-xs font-bold text-gray-900 uppercase">Assinatura do Aluno</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-1">{configAssinaturas.nomeAluno}</p>
                        </div>
                      )}
                      {configAssinaturas.mostrarResponsavel && (
                        <div className="text-center">
                          <div className="w-full border-b border-gray-900 mb-2"></div>
                          <p className="text-xs font-bold text-gray-900 uppercase">Assinatura do Responsável</p>
                          {configAssinaturas.nomeResponsavel && <p className="text-[10px] text-gray-500 uppercase mt-1">{configAssinaturas.nomeResponsavel}</p>}
                        </div>
                      )}
                      {assinaturasExtras.map((extra, index) => (
                        <div key={index} className="text-center">
                          <div className="w-full border-b border-gray-900 mb-2"></div>
                          <p className="text-xs font-bold text-gray-900 uppercase">Assinatura do {extra.papel}</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-1">{extra.nome}</p>
                        </div>
                      ))}
                      {configAssinaturas.mostrarEmissor && (
                        <div className="text-center col-span-2 max-w-sm mx-auto w-full">
                          <div className="w-full border-b border-gray-900 mb-2"></div>
                          <p className="text-xs font-bold text-gray-900 uppercase">Responsável pelo Registro</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-1">{configAssinaturas.nomeEmissor}</p>
                        </div>
                      )}
                   </div>
                </div>
              </>
            )}
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
