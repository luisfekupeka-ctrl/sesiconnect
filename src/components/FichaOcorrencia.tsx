import React, { useState } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  ocorrencia: RegistroOcorrencia;
  onClose: () => void;
  isPrintOnly?: boolean;
}

export default function FichaOcorrencia({ ocorrencia, onClose, isPrintOnly }: Props) {
  // Configurações dinâmicas de assinatura
  const [configAssinaturas, setConfigAssinaturas] = useState({
    mostrarAluno: true,
    nomeAluno: ocorrencia.nomeAluno,
    mostrarResponsavel: true,
    nomeResponsavel: '',
    mostrarEmissor: true,
    nomeEmissor: ocorrencia.professorAtual || 'Administração'
  });

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <>
      <div className={cn(
          "bg-white w-full max-w-5xl flex flex-col md:flex-row print:shadow-none print:max-h-none print:rounded-none",
          !isPrintOnly ? "max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl" : "rounded-none"
      )}>
          
          {/* Configurações (Esquerda) - Oculta na impressão */}
          <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-6 print:hidden overflow-y-auto">
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
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
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
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
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
                    className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
                  />
                )}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
              <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-lg">
                <Printer size={16} /> Imprimir / PDF
              </button>
              <button onClick={onClose} className="w-full py-4 bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                Fechar Visualização
              </button>
            </div>
          </div>

          {/* Área de Impressão (Direita) */}
          {/* Área de Impressão (Direita) */}
          <div id="printable-occurrence" className="flex-1 overflow-y-auto p-12 bg-white print:overflow-visible print:p-0 custom-scrollbar relative"
            style={{
              backgroundImage: 'url("/src/assets/papel_timbrado.png")',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}>
            
            <div className="flex justify-between items-center mb-24 relative z-10 pt-10 px-8">
              <div className="pt-6 pl-2">
                <div className="text-[8px] font-black tracking-[0.5em] text-blue-900/40 uppercase">SESI CONNECT SYSTEM</div>
              </div>
              <div className="relative z-10 select-none scale-90 origin-right">
                <div className="flex flex-col items-end mr-2">
                  <div className="flex items-center gap-1.5 mr-0.5">
                    <span className="text-[10px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#0c2340]" />
                      <div className="w-1.5 h-2.5 rounded-full bg-[#0c2340]" />
                    </div>
                  </div>
                  <div className="text-[34px] font-bold text-[#0c2340] leading-none tracking-tight -mt-0.5 font-serif italic mr-4 relative">
                    Ses<span className="relative">ı</span>
                  </div>
                  <div className="bg-[#fbbf24] text-[#0c2340] text-[8px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 mt-1 rounded-[6px] transform -skew-x-12 leading-none">
                    internacional
                  </div>
                </div>
              </div>
            </div>

            <div className="px-16 space-y-10">
              <div className="text-center border-y-2 border-gray-900/10 py-6 mb-8">
                <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-[#002b45]">Registro de Ocorrência Disciplinar</h1>
              </div>

              <div className="space-y-12">
                {/* Seção 1: Dados do Aluno */}
                <section className="space-y-6">
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Aluno</p>
                      <p className="text-lg font-black text-gray-900 border-b-2 border-gray-100 pb-1">{ocorrencia.nomeAluno}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ano Escolar</p>
                      <p className="text-lg font-black text-gray-900 border-b-2 border-gray-100 pb-1">{ocorrencia.anoAluno || ocorrencia.turmaAluno}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data do Registro</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(ocorrencia.criadoEm || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Local / Sala</p>
                      <p className="text-sm font-bold text-gray-900">{ocorrencia.salaAluno ? `Sala ${ocorrencia.salaAluno}` : '—'}</p>
                    </div>
                  </div>
                </section>

                {/* Seção 2: Detalhes da Ocorrência */}
                <section className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-4 bg-amber-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Relato da Ocorrência</h4>
                  </div>
                  <div className="bg-gray-50/30 p-10 rounded-[2.5rem] border-2 border-gray-100/50 min-h-[350px]">
                    <div className="flex items-center gap-2 mb-8 border-b border-amber-500/10 pb-4">
                      <ClipboardList size={16} className="text-amber-500" />
                      <p className="text-xs font-black text-amber-600 uppercase tracking-[0.2em]">{ocorrencia.nomeModelo}</p>
                    </div>
                    <div className="space-y-10">
                      {Object.entries(ocorrencia.dados || {}).map(([key, value]) => (
                        <div key={key} className="border-b border-gray-100/80 pb-8 last:border-none last:pb-0">
                          <p className="text-[10px] font-black text-amber-600 tracking-wider mb-3 uppercase">{key}</p>
                          <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap text-justify pl-4 border-l-2 border-gray-200">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Seção 3: Informações do Emissor */}
                <section className="grid grid-cols-2 gap-12 border-t border-gray-100 pt-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Emitido por</p>
                    <p className="text-sm font-black text-gray-900 uppercase">{ocorrencia.professorAtual || 'Administração'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Horário</p>
                    <p className="text-sm font-black text-gray-900">{new Date(ocorrencia.criadoEm || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </section>

                {/* Seção 4: Assinaturas */}
                <section className="mt-24 pb-12">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-20">
                    {configAssinaturas.mostrarAluno && (
                      <div className="text-center">
                        <div className="w-full border-b-2 border-gray-900/20 mb-2"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Assinatura do Aluno</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeAluno}</p>
                      </div>
                    )}
                    {configAssinaturas.mostrarResponsavel && (
                      <div className="text-center">
                        <div className="w-full border-b-2 border-gray-900/20 mb-2"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Assinatura do Responsável</p>
                        {configAssinaturas.nomeResponsavel && <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeResponsavel}</p>}
                      </div>
                    )}
                    {configAssinaturas.mostrarEmissor && (
                      <div className="text-center col-span-2 max-w-xs mx-auto">
                        <div className="w-full border-b-2 border-gray-900/20 mb-2"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Coordenação / Direção</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeEmissor}</p>
                      </div>
                    )}
                  </div>
                </section>
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
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
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
