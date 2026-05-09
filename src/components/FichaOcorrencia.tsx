import React, { useState } from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X, User, ClipboardList, MapPin, CheckSquare, Square } from 'lucide-react';

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
        <div id="printable-occurrence" className="flex-1 overflow-y-auto p-12 bg-white print:overflow-visible print:p-8 custom-scrollbar">
          {/* Cabeçalho SESI */}
          <div className="flex flex-col items-center text-center mb-10 border-b-2 border-gray-900 pb-8">
            <div className="text-2xl font-black tracking-tighter text-gray-900 mb-1">SESI CONNECT</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6">Serviço Social da Indústria</div>
            <div className="px-8 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-full">
              Registro de Ocorrência Disciplinar
            </div>
          </div>

          <div className="space-y-10">
            {/* Seção 1: Dados do Aluno */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User size={14} className="text-gray-900" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Identificação do Aluno</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome Completo</p>
                  <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">{ocorrencia.nomeAluno}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Turma / Grupo</p>
                  <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">{ocorrencia.turmaAluno} • {ocorrencia.anoAluno}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Data do Registro</p>
                  <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">{new Date(ocorrencia.criadoEm || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sala / Local</p>
                  <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">Sala {ocorrencia.salaAluno || '—'}</p>
                </div>
              </div>
            </section>

            {/* Seção 2: Detalhes da Ocorrência */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={14} className="text-gray-900" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Descrição da Ocorrência</h4>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{ocorrencia.nomeModelo}</p>
                <div className="space-y-4">
                  {Object.entries(ocorrencia.dados || {}).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[9px] font-black text-gray-900/40 uppercase tracking-tighter mb-1">{key}</p>
                      <p className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Seção 3: Informações Complementares */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} className="text-gray-900" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Informações Complementares</h4>
              </div>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registrado por</p>
                  <p className="text-xs font-bold text-gray-900">{ocorrencia.professorAtual || 'Administração'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Horário do Registro</p>
                  <p className="text-xs font-bold text-gray-900">{new Date(ocorrencia.criadoEm || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </section>

            {/* Seção 4: Assinaturas Dinâmicas */}
            <section className="mt-16 pt-16 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-x-12 gap-y-20">
                {configAssinaturas.mostrarAluno && (
                  <div className="text-center">
                    <div className="w-full border-b border-gray-900 mb-2"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Assinatura do Aluno</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeAluno}</p>
                  </div>
                )}
                {configAssinaturas.mostrarResponsavel && (
                  <div className="text-center">
                    <div className="w-full border-b border-gray-900 mb-2"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Assinatura do Responsável</p>
                    {configAssinaturas.nomeResponsavel && <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeResponsavel}</p>}
                  </div>
                )}
                {configAssinaturas.mostrarEmissor && (
                  <div className="text-center col-span-2 max-w-xs mx-auto">
                    <div className="w-full border-b border-gray-900 mb-2"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Coordenação / Emissor</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{configAssinaturas.nomeEmissor}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="mt-20 text-center opacity-30 text-[8px] font-black uppercase tracking-[0.5em] print:block hidden">
            Documento gerado digitalmente via SESI Connect - {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-occurrence, #printable-occurrence * { visibility: visible; }
          #printable-occurrence {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );

  if (isPrintOnly) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      {content}
    </div>
  );
}
