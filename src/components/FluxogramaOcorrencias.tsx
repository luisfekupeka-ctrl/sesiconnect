import React, { useState } from 'react';
import { ChevronRight, RefreshCw, HelpCircle } from 'lucide-react';

const PROTOCOLS: Record<string, string[]> = {
  "Acidente ou emergência de saúde": [
    "Proteger a vítima e impedir nova exposição ao risco.",
    "Avaliar rapidamente se há consciência, respiração e sinais de gravidade, sem realizar procedimento para o qual não esteja capacitado.",
    "Acionar imediatamente o profissional treinado da unidade.",
    "Acionar SAMU ou SIATE conforme a natureza e a gravidade da situação.",
    "Não administrar medicamentos por iniciativa própria.",
    "Manter curiosos afastados e preservar o acesso para o atendimento.",
    "Comunicar à liderança apenas as informações necessárias.",
    "Registrar horário, local, sinais observados, medidas adotadas e responsáveis acionados."
  ],
  "Agressão grave ou ameaça": [
    "Solicitar apoio imediato e afastar os demais estudantes.",
    "Interromper verbalmente apenas se houver segurança para fazê-lo.",
    "Não se colocar sozinho entre envolvidos em situação de alto risco.",
    "Separar os envolvidos quando for possível e seguro, conduzindo-os a locais distintos.",
    "Verificar se há lesões e, se houver, abrir também o protocolo de saúde ou acidente.",
    "Comunicar a liderança e preservar testemunhas e informações.",
    "Evitar exposição pública, julgamentos ou discussão sobre culpa no local.",
    "Registrar fatos observados, falas relevantes, lesões aparentes e providências."
  ],
  "Incêndio, fumaça ou risco estrutural": [
    "Afastar imediatamente as pessoas da área de risco.",
    "Acionar brigada e liderança da unidade.",
    "Não improvisar combate ao fogo sem treinamento e condições seguranças.",
    "Seguir a rota de evacuação indicada e utilizar rota alternativa se necessário.",
    "Manter os estudantes juntos, acompanhados e sob contagem.",
    "Não permitir retorno ao local até liberação oficial.",
    "Em problema estrutural grave, isolar a área e desviar o fluxo.",
    "Registrar horários, local, acionamentos e medidas adotadas."
  ],
  "Objeto perigoso ou possível arma": [
    "Não confrontar nem tentar retirar o objeto à força.",
    "Manter distância segura e afastar discretamente outras pessoas.",
    "Comunicar imediatamente a liderança e seguir a orientação institucional.",
    "Se houver ameaça ativa, priorizar proteção e acionamento emergencial.",
    "Preservar o local e evitar aglomeração.",
    "Não tocar em objetos abandonados ou suspeitos.",
    "Registrar somente fatos observados, localização, características e deslocamento."
  ],
  "Invasão ou acesso indevido": [
    "Não enfrentar a pessoa sozinho.",
    "Informar localização, características, direção de deslocamento e comportamento observado.",
    "Proteger estudantes próximos e restringir acessos apenas quando isso puder ser feito com segurança.",
    "Acionar liderança e segurança.",
    "Se houver comportamento ameaçador, aplicar o fluxo de ameaça à vida.",
    "Manter acompanhamento visual sem aproximação arriscada.",
    "Registrar horário, local, características e providências."
  ],
  "Crise emocional com risco": [
    "Reduzir estímulos, afastar curiosos e manter o ambiente protegido.",
    "Falar com voz calma, frases curtas e distância segura.",
    "Não ameaçar, desafiar, pressionar ou discutir culpa.",
    "Não deixar o estudante sozinho.",
    "Se houver risco de autoagressão, agressão ou fuga, acionar apoio imediato e emergência conforme orientação institucional.",
    "Utilizar desescalada verbal; questionamento reflexivo somente após estabilização.",
    "Transferir o atendimento à equipe responsável.",
    "Registrar comportamentos observados, falas relevantes e encaminhamento."
  ],
  "Calamidade": [
    "Seguir a orientação institucional de evacuação ou abrigo.",
    "Manter todos os estudantes acompanhados durante todo o deslocamento.",
    "Não permitir que estudantes circulem sozinhos.",
    "Organizar a conferência dos grupos e comunicar ausências imediatamente.",
    "Permanecer no local seguro até nova orientação.",
    "Não liberar estudantes sem autorização institucional.",
    "Registrar medidas adotadas, horários e responsáveis."
  ],
  "Outra contingência": [
    "Proteger as pessoas e controlar o acesso ao local.",
    "Solicitar apoio imediato da liderança.",
    "Não improvisar ações fora da própria capacitação.",
    "Identificar se a situação envolve acidente, saúde, ameaça, calamidade, incêndio, invasão ou risco estrutural.",
    "Acionar os recursos internos ou externos indicados.",
    "Manter acompanhamento até a transferência formal.",
    "Registrar fatos, horários, providências e pendências."
  ]
};

export function FluxogramaOcorrencias({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState<string>('inicio');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  const navigateTo = (nextStep: string) => {
    setHistory(prev => [...prev, currentStep]);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentStep(prev);
    }
  };

  const handleReset = () => {
    setCurrentStep('inicio');
    setHistory([]);
    setSelectedProtocol(null);
  };

  const handleShowProtocol = (protocolName: string) => {
    setSelectedProtocol(protocolName);
    navigateTo('protocolo');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 relative overflow-hidden select-none">
      {/* Decorative top header indicator */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Fluxograma de Ocorrências</h3>
            <p className="text-[11px] text-slate-400 font-medium">Guia interativo para tomada de decisões operacionais</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ChevronRight size={24} className="rotate-90" />
        </button>
      </div>

      {/* Interactive Flow Area */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 min-h-[300px] flex flex-col justify-between">
        
        {/* Step: INICIO */}
        {currentStep === 'inicio' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Etapa 1</span>
            <h4 className="text-xl font-bold text-white leading-tight">Foi identificada uma ocorrência?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Considere qualquer situação que afete a segurança, a convivência, a saúde, o patrimônio ou o funcionamento da escola.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => navigateTo('classificacao')} className="py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-extrabold rounded-xl text-sm shadow-lg shadow-blue-600/15">
                Sim
              </button>
              <button onClick={() => navigateTo('observar')} className="py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all text-slate-300 font-extrabold rounded-xl text-sm border border-slate-700/80">
                Não
              </button>
            </div>
          </div>
        )}

        {/* Step: OBSERVAR */}
        {currentStep === 'observar' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 px-3 py-1 rounded-full">Sem Ocorrência</span>
            <h4 className="text-xl font-bold text-white leading-tight">Manter observação preventiva</h4>
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                Continue acompanhando o ambiente, os estudantes e os fluxos preventivamente.
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                Se surgir perigo, mudança brusca de comportamento ou quebra de rotina, reinicie o fluxograma.
              </div>
            </div>
            <div className="pt-4">
              <button onClick={handleReset} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15">
                Voltar ao Início
              </button>
            </div>
          </div>
        )}

        {/* Step: CLASSIFICACAO */}
        {currentStep === 'classificacao' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">Etapa 2</span>
            <h4 className="text-xl font-bold text-white leading-tight">A situação se enquadra no Plano de Contingência?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Exemplos: acidente, emergência de saúde, calamidade, ameaça à vida, incêndio, suspeita de arma ou agressão física grave.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button onClick={() => navigateTo('grave')} className="py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/10">
                Sim — Grave (Contingência)
              </button>
              <button onClick={() => navigateTo('levePergunta')} className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-sm transition-all border border-slate-700/80">
                Não
              </button>
            </div>
          </div>
        )}

        {/* Step: LEVE PERGUNTA */}
        {currentStep === 'levePergunta' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">Etapa 3</span>
            <h4 className="text-xl font-bold text-white leading-tight">Pode ser resolvida com orientação educativa?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              A situação está sob controle imediato, não há risco físico ou à integridade, e o aluno se mostra receptivo a ouvir?
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => navigateTo('leve')} className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15">
                Sim — Leve
              </button>
              <button onClick={() => navigateTo('media')} className="py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-sm transition-all border border-amber-600/10">
                Não — Média
              </button>
            </div>
          </div>
        )}

        {/* Step: LEVE */}
        {currentStep === 'leve' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full">Ocorrência Leve</span>
            <h4 className="text-xl font-bold text-white leading-tight">Orientar, registrar no app e observar</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-300">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">1.</strong> Aproxime-se com calma e descreva o comportamento observado.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">2.</strong> Escute o estudante e confirme se ele entendeu as regras.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">3.</strong> Esclareça a conduta correta esperada dele.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">4.</strong> Utilize questionamento socrático se julgar adequado.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">5.</strong> Registre no app institucional (Aba Registro Diário).</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">6.</strong> Mantenha a observação da conduta no dia a dia.</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('leveFim')} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Cumpriu Orientação
              </button>
              <button onClick={() => navigateTo('media')} className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Recusou / Reincidiu
              </button>
            </div>
          </div>
        )}

        {/* Step: LEVE FIM */}
        {currentStep === 'leveFim' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">Encerramento Leve</span>
            <h4 className="text-xl font-bold text-white leading-tight">Orientação registrada e conduta acompanhada</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Garanta que o registro no aplicativo SESI Connect tenha sido efetuado de forma neutra e puramente fatual. Continue supervisionando o ambiente.
            </p>
            <div className="pt-4 space-y-2">
              <button onClick={() => navigateTo('registroLeve')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all">
                Como registrar no app
              </button>
              <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase tracking-wider border border-slate-700/80">
                Voltar ao Início
              </button>
            </div>
          </div>
        )}

        {/* Step: MEDIA */}
        {currentStep === 'media' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">Ocorrência Média</span>
            <h4 className="text-xl font-bold text-white leading-tight">Encaminhar à coordenação para registro em ata</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-300">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">1.</strong> Interrompa a conduta indesejada imediatamente com postura firme.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">2.</strong> Relembre a regra e confirme se o aluno está ciente da reincidência.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">3.</strong> Utilize escolhas controladas e validação emocional para acalmar.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">4.</strong> Leve o estudante até a sala da Coordenação de Turno.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">5.</strong> Repasse os fatos objetivos e solicite a elaboração de ata formal.</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('coordenacao')} className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Como Encaminhar
              </button>
              <button onClick={() => navigateTo('grave')} className="py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Passou a Oferecer Risco
              </button>
            </div>
          </div>
        )}

        {/* Step: GRAVE */}
        {currentStep === 'grave' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 px-3 py-1 rounded-full">Etapa Grave</span>
            <h4 className="text-xl font-bold text-white leading-tight">Escolha o Protocolo do Plano de Contingência</h4>
            <p className="text-slate-400 text-xs">
              Selecione a contingência abaixo para carregar as instruções obrigatórias da escola.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {Object.keys(PROTOCOLS).map(name => (
                <button key={name} onClick={() => handleShowProtocol(name)} className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 hover:text-white rounded-lg border border-slate-800 text-left truncate text-[11px] font-bold text-slate-300">
                  {name.replace(' ou ', ' / ').replace(' e ', ' / ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: PROTOCOLO DETALHE */}
        {currentStep === 'protocolo' && selectedProtocol && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 px-3 py-1 rounded-full">Plano de Contingência</span>
            <h4 className="text-lg font-bold text-white leading-tight">{selectedProtocol}</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-350">
              {PROTOCOLS[selectedProtocol].map((step, i) => (
                <div key={i} className="bg-slate-905 border border-slate-850/60 p-3 rounded-lg leading-relaxed">
                  <strong className="text-red-400">{i + 1}.</strong> {step}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('registro')} className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
                Registrar
              </button>
              <button onClick={() => navigateTo('transferido')} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
                Atendimento Concluído
              </button>
            </div>
          </div>
        )}

        {/* Step: TRANSFERIDO */}
        {currentStep === 'transferido' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">Finalizado</span>
            <h4 className="text-xl font-bold text-white leading-tight">Atendimento transferido e registrado</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registre fatos, horários, medidas adotadas e profissionais ou familiares acionados. O atendimento é considerado encerrado apenas quando há transferência formal para a equipe especializada ou autoridade competente.
            </p>
            <div className="pt-4">
              <button onClick={handleReset} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15">
                Voltar ao Início
              </button>
            </div>
          </div>
        )}

        {/* Step: TECLADO TECNICAS */}
        {currentStep === 'tecnicas' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">Técnicas de Comunicação</span>
            <h4 className="text-lg font-bold text-white">Consulta Rápida de Habilidades Sociais</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar text-[11px] text-slate-300">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Escuta ativa</b> Ouvir sem julgar ou formular respostas.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Paráfrase</b> Repetir o que o aluno disse para alinhar.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">CNV</b> Descrever fatos objetivos, sentimentos e limites.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Socrático</b> Provocar a auto-reflexão com perguntas abertas.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Validação</b> Aceitar a emoção do aluno sem aceitar a má conduta.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Desescalada</b> Controlar o próprio tom e usar frases curtas.</div>
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Voltar
            </button>
          </div>
        )}

        {/* Step: COORDINACAO */}
        {currentStep === 'coordenacao' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full">Encaminhamento</span>
            <h4 className="text-lg font-bold text-white">Como repassar dados para Ata</h4>
            <div className="space-y-2 text-xs text-slate-350">
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">1. Relate com clareza **o quê, quem, onde e quando**.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">2. Esclareça quais intervenções preventivas ou orientações já foram feitas anteriormente.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">3. Transfira a custódia do aluno apenas com a entrega destas informações consolidadas.</p>
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Entendido
            </button>
          </div>
        )}

        {/* Step: REGISTRO LEVE */}
        {currentStep === 'registroLeve' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Instrução de Registro</span>
            <h4 className="text-lg font-bold text-white">Como cadastrar ocorrências</h4>
            <div className="space-y-2 text-xs text-slate-350">
              <p className="bg-slate-900 p-3 rounded-lg">1. Abra o formulário de **Registro Diário**.</p>
              <p className="bg-slate-900 p-3 rounded-lg">2. Selecione o aluno e classifique o comportamento.</p>
              <p className="bg-slate-900 p-3 rounded-lg">3. Seja descritivo e puramente factual na caixa de texto.</p>
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Voltar
            </button>
          </div>
        )}

        {/* Step: REGISTRO GERAL */}
        {currentStep === 'registro' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Guia de Notas</span>
            <h4 className="text-lg font-bold text-white">Redação Factual de Ocorrências</h4>
            <div className="space-y-3 text-xs">
              <div className="bg-emerald-950/20 border border-emerald-550/20 p-3 rounded-lg text-emerald-400">
                <b>Correto (Fatos):</b> "Aluno elevou o tom de voz e recusou-se a entregar o aparelho celular."
              </div>
              <div className="bg-red-950/20 border border-red-550/20 p-3 rounded-lg text-red-400">
                <b>Incorreto (Julgamento):</b> "Estudante é agressivo, bagunceiro e muito problemático."
              </div>
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Entendido
            </button>
          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <div className="flex gap-2 justify-between items-center border-t border-slate-800 pt-4 text-xs">
        <div className="flex gap-2">
          {history.length > 0 && (
            <button onClick={handleBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors">
              Voltar
            </button>
          )}
          <button onClick={handleReset} className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-lg transition-colors flex items-center gap-1.5">
            <RefreshCw size={12} />
            Reiniciar
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigateTo('tecnicas')} className="px-3 py-2 text-slate-400 hover:text-white font-medium">Habilidades</button>
          <button onClick={() => navigateTo('coordenacao')} className="px-3 py-2 text-slate-400 hover:text-white font-medium">Ata</button>
        </div>
      </div>
    </div>
  );
}
