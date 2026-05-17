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
          <div id="printable-occurrence" className="flex-1 overflow-y-auto bg-white print:overflow-visible custom-scrollbar relative flex flex-col"
            style={{
              backgroundImage: 'url("/src/assets/papel_timbrado.png")',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}>
            
            <div className="flex-1 px-12 md:px-20 pt-32 md:pt-48 pb-20 print:pt-[180px] print:px-[80px] space-y-12">
               {/* Cabeçalho do Documento */}
               <div className="space-y-1.5 text-sm text-gray-900 font-medium">
                 <p><span className="font-bold mr-2">Nome do Aluno:</span> {ocorrencia.nomeAluno}</p>
                 <p><span className="font-bold mr-2">Ano:</span> {ocorrencia.anoAluno || ocorrencia.turmaAluno}</p>
                 <p><span className="font-bold mr-2">Professor/Responsável:</span> {ocorrencia.professorAtual || 'Administração'}</p>
                 <p><span className="font-bold mr-2">Data:</span> {new Date(ocorrencia.criadoEm || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
               </div>

               {/* Título */}
               <div className="pt-4">
                 <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    Registro de Ocorrência
                 </h1>
                 <p className="text-sm font-bold text-gray-500 uppercase mt-1">
                    {ocorrencia.nomeModelo}
                 </p>
               </div>

               {/* Descrição */}
               <div className="space-y-6 text-sm text-gray-800 leading-relaxed text-justify pt-4">
                  {Object.entries(ocorrencia.dados || {}).map(([key, value]) => (
                    <div key={key}>
                      <p className="font-bold mb-1 uppercase text-xs text-gray-900">{key}</p>
                      <p className="whitespace-pre-wrap">{Array.isArray(value) ? value.join(', ') : value}</p>
                    </div>
                  ))}
               </div>

               {/* Assinaturas - Margem superior grande para empurrar para o fundo ou separar bem */}
               <div className="pt-24 print:pt-32 grid grid-cols-2 gap-x-12 gap-y-20">
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
