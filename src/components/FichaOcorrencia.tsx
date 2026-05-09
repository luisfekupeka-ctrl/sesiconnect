import React from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, Download, X, User, Calendar, MapPin, ClipboardList, PenTool } from 'lucide-react';

interface Props {
  ocorrencia: RegistroOcorrencia;
  onClose: () => void;
}

export default function FichaOcorrencia({ ocorrencia, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Toolbar - Oculta na impressão */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg">Visualizar Ocorrência</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documento Oficial</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase hover:bg-gray-800 transition-all">
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Área de Impressão */}
        <div id="printable-occurrence" className="flex-1 overflow-y-auto p-12 bg-white print:overflow-visible print:p-8">
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

            {/* Seção 3: Observações Adicionais */}
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

            {/* Seção 4: Assinaturas */}
            <section className="mt-16 pt-16 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-x-12 gap-y-20">
                <div className="text-center">
                  <div className="w-full border-b border-gray-900 mb-2"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Assinatura do Aluno</p>
                </div>
                <div className="text-center">
                  <div className="w-full border-b border-gray-900 mb-2"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Assinatura do Responsável</p>
                </div>
                <div className="text-center col-span-2 max-w-xs mx-auto">
                  <div className="w-full border-b border-gray-900 mb-2"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-900">Coordenação Pedagógica / Direção</p>
                </div>
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
}
