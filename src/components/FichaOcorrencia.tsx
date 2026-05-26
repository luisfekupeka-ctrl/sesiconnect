import React, { useState, useEffect } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square, Plus, Trash2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFichaOcorrenciaPDF } from '../lib/reportGenerator';

interface Props {
  ocorrencia: RegistroOcorrencia;
  onClose: () => void;
  isPrintOnly?: boolean;
}

export default function FichaOcorrencia({ ocorrencia, onClose, isPrintOnly }: Props) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
  }, [ocorrencia]);

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
      {!isPrintOnly && (
        <button 
          type="button"
          onClick={() => setIsConfigOpen(!isConfigOpen)} 
          className="md:hidden w-full flex items-center justify-between p-4 bg-gray-100 text-gray-800 font-extrabold text-xs uppercase tracking-wider border-b border-gray-200 print:hidden shrink-0 rounded-t-[2.5rem]"
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Configurar Assinaturas
          </span>
          <span className="text-[10px] font-bold text-gray-500">{isConfigOpen ? '▲ Recolher' : '▼ Expandir'}</span>
        </button>
      )}

      <div className={cn(
          "bg-white w-full max-w-5xl flex flex-col md:flex-row print:shadow-none print:max-h-none print:rounded-none print-modal-container",
          !isPrintOnly ? "max-h-[95vh] overflow-hidden rounded-b-[2.5rem] md:rounded-[2.5rem] shadow-2xl" : "rounded-none"
      )}>
          
          {/* Configurações (Esquerda) - Oculta na impressão */}
          <div className={cn(
            "w-full md:w-80 bg-gray-50 border-r border-gray-100 p-4 md:p-8 flex flex-col gap-4 md:gap-6 print:hidden overflow-y-auto shrink-0 transition-all duration-200",
            !isConfigOpen ? "hidden md:flex" : "flex"
          )}>
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
                  Assinatura do Responsável
                </button>
                {configAssinaturas.mostrarResponsavel && (
                  <input 
                    type="text" 
                    value={configAssinaturas.nomeResponsavel} 
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                    placeholder="Nome do Responsável (Opcional)"
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
                  Assinatura Emissor/Coord.
                </button>
                {configAssinaturas.mostrarEmissor && (
                  <input 
                    type="text" 
                    value={configAssinaturas.nomeEmissor} 
                    onChange={e => setConfigAssinaturas(prev => ({ ...prev, nomeEmissor: e.target.value }))}
                    placeholder="Nome do Coordenador"
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

          {/* Área de Impressão (Direita) */}
          <div id="printable-occurrence" className="flex-1 overflow-y-auto bg-white custom-scrollbar relative flex flex-col print-card-content">
            
            {/* Header Oficial do Colégio Sesi */}
            <div className="relative w-full h-[100px] md:h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-4 md:px-8 select-none">
              {/* Polígonos Geométricos */}
              <div className="absolute top-0 left-0 w-[180px] md:w-[300px] h-full pointer-events-none">
                <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
              </div>
              <div className="flex-1" />
              {/* Logo Sesi */}
              <div className="relative z-10">
                <div className="flex flex-col items-end mr-2 md:mr-4">
                  <div className="flex items-center gap-1 md:gap-2 mr-1">
                    <span className="text-[9px] md:text-[11px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-[#0c2340]" />
                      <div className="w-1 md:w-2 h-2.5 md:h-3.5 rounded-full bg-[#0c2340]" />
                    </div>
                  </div>
                  <div className="text-[28px] md:text-[42px] font-bold text-[#0c2340] leading-none tracking-tight -mt-0.5 md:-mt-1 font-serif italic mr-2 md:mr-6 relative">
                    Ses<span className="relative">ı</span>
                  </div>
                  <div className="bg-[#fbbf24] text-[#0c2340] text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] px-2.5 md:px-4 py-1 md:py-2 mt-1 rounded-[6px] md:rounded-[8px] transform -skew-x-12 leading-none">
                    internacional
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 sm:px-12 md:px-20 pt-6 md:pt-12 pb-10 md:pb-20 space-y-6 md:space-y-10">
               {/* Cabeçalho do Documento - Alocado de maneira inteligente */}
               <div className="space-y-1.5 text-sm text-[#0c2340] font-medium border-b border-gray-200 pb-6">
                 <p><span className="font-bold mr-2">Nome do Aluno:</span> {configAssinaturas.nomeAluno || ocorrencia.nomeAluno}</p>
                 <p><span className="font-bold mr-2">Ano:</span> {ocorrencia.anoAluno || ocorrencia.turmaAluno || 'Não informado'}</p>
                 <p><span className="font-bold mr-2">Professor / Emissor:</span> {configAssinaturas.nomeEmissor || 'Administração'}</p>
                 {configAssinaturas.nomeResponsavel && (
                   <p><span className="font-bold mr-2">Responsável Legal:</span> {configAssinaturas.nomeResponsavel}</p>
                 )}
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
               <div className="pt-24 print:pt-32 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
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
                      <p className="text-xs font-bold text-gray-900 uppercase">Professor / Coordenação</p>
                      <p className="text-[10px] text-gray-500 uppercase mt-1">{configAssinaturas.nomeEmissor}</p>
                    </div>
                  )}
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
            background-image: url("/src/assets/papel_timbrado.png") !important;
            background-size: 100% 100% !important;
            background-repeat: no-repeat !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      {content}
    </div>
  );
}
