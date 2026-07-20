import React, { useState } from 'react';
import { ChevronRight, RefreshCw, HelpCircle } from 'lucide-react';

const CONTINGENCY_BLOCKS: Record<string, Record<string, string[]>> = {
  "1. Acidentes": {
    "Óbito dentro da instituição": [
      "Não tocar ou movimentar a vítima.",
      "Isolar o local e afastar curiosos.",
      "Acionar Polícia (190) e SAMU (192).",
      "Comunicar imediatamente à Coordenação e à gestão.",
      "Preservar o local até a chegada das autoridades."
    ],
    "Acidente rodoviário com feridos ou vítima fatal": [
      "Acionar SAMU (192) ou SIATE (193).",
      "Verificar o local de encaminhamento da vítima.",
      "Comunicar à Coordenação e aos responsáveis.",
      "Garantir acompanhamento de menores.",
      "Preservar informações da ocorrência."
    ],
    "Incêndio com vítimas ou necessidade de Bombeiros": [
      "Comunicar a Brigada.",
      "Acionar Bombeiros (193).",
      "Seguir as rotas de fuga.",
      "Levar os estudantes ao ponto de encontro.",
      "Não retornar ao prédio sem autorização.",
      "Acionar atendimento médico se houver vítimas."
    ],
    "Vazamento, explosão ou intoxicação por gás/produto químico": [
      "Afastar as pessoas da área.",
      "Não tocar no produto.",
      "Acionar a Brigada.",
      "Seguir a orientação de evacuação.",
      "Acionar SAMU (192) ou SIATE (193) se houver vítimas.",
      "Comunicar à Coordenação."
    ],
    "Acidente com lesão": [
      "Não movimentar a vítima em caso de suspeita de lesão grave.",
      "Chamar brigadista.",
      "Acionar SAMU (192) ou SIATE (193).",
      "Afastar curiosos.",
      "Comunicar à Coordenação e aos responsáveis."
    ],
    "Ataque de animal peçonhento ou silvestre": [
      "Afastar as pessoas.",
      "Não tentar capturar o animal.",
      "Acionar atendimento médico em caso de lesão.",
      "Comunicar à Coordenação e aos órgãos ambientais, quando necessário."
    ],
    "Intoxicação, afogamento ou engasgamento": [
      "Acionar imediatamente brigadista e atendimento de emergência.",
      "Prestar primeiros socorros somente se estiver capacitado.",
      "Identificar o possível agente causador.",
      "Comunicar à Coordenação."
    ]
  },
  "2. Calamidades": {
    "Vendaval, tempestade, enchente, desmoronamento ou tremor de terra": [
      "Comunicar a Coordenação e a Brigada.",
      "Conduzir todos para local seguro.",
      "Seguir as rotas de fuga quando determinado.",
      "Conferir se todos os estudantes estão presentes.",
      "Não deixar aluno sozinho."
    ],
    "Ausência permanente da alta gestão": [
      "Comunicar à liderança imediatamente superior.",
      "Seguir a cadeia institucional de substituição.",
      "Preservar a continuidade das atividades e aguardar orientações oficiais."
    ]
  },
  "3. Saúde": {
    "Mal-estar, febre alta, crise alérgica ou dor aguda": [
      "Levar o estudante a local seguro e acompanhado.",
      "Comunicar à Coordenação.",
      "Contatar os responsáveis.",
      "Acionar SAMU (192) em caso de gravidade.",
      "Não ministrar medicamento sem autorização e receita."
    ],
    "Doença infectocontagiosa, endêmica, epidêmica ou pandêmica": [
      "Afastar o estudante do contato coletivo.",
      "Comunicar à Coordenação e aos responsáveis.",
      "Aplicar os protocolos sanitários vigentes.",
      "Preservar a identidade do estudante."
    ],
    "Crise ou surto psiquiátrico": [
      "Reduzir estímulos.",
      "Afastar curiosos.",
      "Falar calmamente.",
      "Não realizar contenção física sem capacitação.",
      "Retirar objetos perigosos quando for seguro.",
      "Comunicar à Coordenação.",
      "Acionar SAMU (192) quando necessário."
    ]
  },
  "4. Atos infracionais ou indisciplinares": {
    "Degradação da imagem ou reputação da instituição": [
      "Preservar prints, vídeos ou publicações.",
      "Não responder publicamente.",
      "Comunicar à Coordenação.",
      "Não dar declarações à imprensa ou redes sociais."
    ],
    "Declaração inapropriada de dirigente": [
      "Preservar a manifestação.",
      "Não divulgar ou comentar publicamente.",
      "Comunicar à gestão para análise institucional."
    ],
    "Constrangimento, discriminação ou preconceito": [
      "Acolher a vítima.",
      "Conversar com os envolvidos separadamente e em local reservado.",
      "Evitar exposição.",
      "Preservar evidências.",
      "Encaminhar imediatamente à Coordenação."
    ],
    "Impedimento de acesso à unidade": [
      "Não enfrentar ou discutir com os responsáveis pelo bloqueio.",
      "Manter estudantes e funcionários em local seguro.",
      "Comunicar imediatamente à Coordenação e à gestão."
    ],
    "Tráfico de drogas": [
      "Não confrontar ou investigar diretamente.",
      "Não realizar revista.",
      "Preservar a confidencialidade.",
      "Reunir apenas as informações observadas.",
      "Comunicar imediatamente à Coordenação."
    ],
    "Porte ou consumo de drogas, álcool, cigarros ou vape": [
      "Abordar discretamente.",
      "Não revistar.",
      "Não manipular a substância.",
      "Manter o estudante acompanhado.",
      "Observar sinais de alteração.",
      "Acionar SAMU (192) se houver mal-estar.",
      "Encaminhar à Coordenação."
    ],
    "Dano intencional ao patrimônio": [
      "Interromper a ação se for seguro.",
      "Afastar o estudante.",
      "Preservar o bem e o local.",
      "Identificar envolvidos e testemunhas.",
      "Encaminhar à Coordenação.",
      "Registrar os danos para possível reparação."
    ],
    "Roubo ou furto": [
      "Não acusar, confrontar ou revistar.",
      "Preservar o local e as evidências.",
      "Identificar envolvidos e testemunhas.",
      "Comunicar imediatamente à Coordenação, que avaliará o acionamento policial."
    ],
    "Uso indevido das tecnologias da informação": [
      "Não apagar arquivos ou históricos.",
      "Não tentar investigar o equipamento.",
      "Preservar o dispositivo.",
      "Comunicar à Coordenação para acionamento do setor de Tecnologia da Informação."
    ],
    "Relação sexual nas dependências da instituição": [
      "Preservar a privacidade.",
      "Afastar curiosos.",
      "Não realizar perguntas íntimas em público.",
      "Manter os envolvidos separados e acompanhados.",
      "Encaminhar à Coordenação."
    ],
    "Bullying ou cyberbullying": [
      "Acolher a vítima.",
      "Separar os envolvidos.",
      "Verificar se há repetição.",
      "Preservar prints, mensagens e testemunhos.",
      "Não realizar confronto público.",
      "Encaminhar à Coordenação."
    ]
  },
  "5. Atentados contra a própria vida ou a de outros": {
    "Explosão ou ameaça de bomba": [
      "Não tocar ou movimentar objetos suspeitos.",
      "Isolar a área e afastar as pessoas.",
      "Comunicar à Coordenação e à Brigada.",
      "Acionar Polícia (190) e Bombeiros (193).",
      "Seguir o plano de evacuação."
    ],
    "Atentado coletivo": [
      "Buscar abrigo seguro.",
      "Trancar ou bloquear o ambiente quando possível.",
      "Manter silêncio.",
      "Afastar estudantes de portas e janelas.",
      "Não procurar o agressor.",
      "Acionar Polícia (190) quando for seguro."
    ],
    "Assalto à mão armada": [
      "Não reagir.",
      "Evitar movimentos bruscos.",
      "Manter a calma.",
      "Priorizar a preservação da vida.",
      "Após a saída do autor, acionar Polícia (190) e atendimento médico se houver vítimas."
    ],
    "Sequestro": [
      "Não realizar contato ou negociação por conta própria.",
      "Comunicar imediatamente à Coordenação e à gestão.",
      "Preservar todas as informações.",
      "Aguardar orientação das autoridades."
    ],
    "Estupro ou violência sexual": [
      "Proteger e acolher a vítima.",
      "Não confrontar o possível autor.",
      "Evitar perguntas repetidas.",
      "Preservar roupas, objetos e evidências quando o fato for recente.",
      "Comunicar imediatamente à Coordenação e acionar atendimento médico e autoridades."
    ],
    "Autolesão ou tentativa de suicídio": [
      "Não deixar o estudante sozinho.",
      "Afastar objetos de risco quando for seguro.",
      "Falar sem julgamento.",
      "Comunicar imediatamente à Coordenação.",
      "Acionar SAMU (192) em caso de risco ou lesão."
    ],
    "Agressão física com lesão corporal": [
      "Separar os envolvidos.",
      "Verificar lesões.",
      "Chamar brigadista.",
      "Acionar SAMU (192) ou SIATE (193) quando necessário.",
      "Manter os estudantes acompanhados.",
      "Encaminhar à Coordenação."
    ],
    "Ameaça de morte": [
      "Proteger a vítima.",
      "Separar os envolvidos.",
      "Preservar mensagens e testemunhos.",
      "Não promover confronto.",
      "Comunicar imediatamente à Coordenação e avaliar acionamento policial."
    ],
    "Porte de arma de fogo, arma branca, explosivo ou bomba": [
      "Não confrontar nem tentar retirar o objeto.",
      "Manter distância.",
      "Afastar outras pessoas quando for seguro.",
      "Não realizar revista.",
      "Comunicar imediatamente à Coordenação e acionar Polícia (190)."
    ]
  },
  "6. Retenções ou greves": {
    "Prisão ou confisco de equipamentos": [
      "Não impedir a atuação da autoridade.",
      "Solicitar identificação e documentação.",
      "Comunicar à Coordenação e à gestão.",
      "Preservar cópia das informações e aguardar orientação jurídica."
    ],
    "Greve do transporte público": [
      "Comunicar à Coordenação.",
      "Acompanhar os estudantes que não puderem sair.",
      "Contatar os responsáveis.",
      "Organizar local seguro de espera.",
      "Não liberar menor desacompanhado."
    ]
  }
};

export function FluxogramaOcorrencias({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState<string>('inicio');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
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
    setSelectedBlock(null);
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
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 px-3 py-1 rounded-full">Sem ocorrência</span>
            <h4 className="text-xl font-bold text-white leading-tight">Manter observação preventiva</h4>
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                Continue acompanhando o ambiente, os estudantes e os fluxos.
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                Se surgir perigo, mudança de comportamento ou quebra da rotina, retorne ao início.
              </div>
            </div>
            <div className="pt-4">
              <button onClick={handleReset} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15">
                Voltar ao início
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
              Exemplos: acidente, emergência de saúde, calamidade, ameaça à vida ou à integridade, incêndio, invasão, possível arma, agressão grave ou risco coletivo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button onClick={() => navigateTo('grave')} className="py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/10">
                Sim — Grave
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
              A situação está controlada, sem risco imediato, e o estudante consegue ouvir e responder?
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
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full">Ocorrência leve</span>
            <h4 className="text-xl font-bold text-white leading-tight">Orientar, registrar no app e observar</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-300">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">1.</strong> Aproxime-se com calma e descreva o comportamento observado.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">2.</strong> Escute o estudante e confirme o entendimento.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">3.</strong> Informe a regra e a conduta esperada.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">4.</strong> Use questionamento socrático apenas se a situação estiver controlada.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">5.</strong> Registre a ocorrência no app, na aba Registro Diário.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">6.</strong> Mantenha observação e acompanhamento da conduta.</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('leveFim')} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Cumpriu a orientação
              </button>
              <button onClick={() => navigateTo('media')} className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Recusou ou reincidiu
              </button>
            </div>
          </div>
        )}

        {/* Step: LEVE FIM */}
        {currentStep === 'leveFim' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">Encerramento leve</span>
            <h4 className="text-xl font-bold text-white leading-tight">Orientação registrada no app e situação acompanhada</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registre no app institucional de forma objetiva e continue observando a conduta.
            </p>
            <div className="pt-4 space-y-2">
              <button onClick={() => navigateTo('registroLeve')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all">
                Como registrar no app
              </button>
              <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase tracking-wider border border-slate-700/80">
                Voltar ao início
              </button>
            </div>
          </div>
        )}

        {/* Step: MEDIA */}
        {currentStep === 'media' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">Ocorrência média</span>
            <h4 className="text-xl font-bold text-white leading-tight">Encaminhar à coordenação para registro em ata</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-300">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">1.</strong> Interrompa a conduta e mantenha postura calma e firme.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">2.</strong> Relembre a orientação anterior e confirme a reincidência.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">3.</strong> Use limite claro, validação emocional e escolhas controladas.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">4.</strong> Registre a reincidência no app institucional.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">5.</strong> Encaminhe à coordenação e repasse fatos, orientações e reação do estudante.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">6.</strong> Entregue o estudante e as informações à coordenação para elaboração da ata.</div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg"><strong className="text-white">7.</strong> Acompanhe o desfecho e as orientações recebidas.</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('coordenacao')} className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Como encaminhar
              </button>
              <button onClick={() => navigateTo('grave')} className="py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all">
                Passou a oferecer risco
              </button>
            </div>
          </div>
        )}

        {/* Step: GRAVE */}
        {currentStep === 'grave' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 px-3 py-1 rounded-full">Ocorrência grave</span>
            <h4 className="text-xl font-bold text-white leading-tight">Aplicar o Plano de Contingência</h4>
            <p className="text-slate-400 text-xs">
              Escolha o bloco do Plano de Contingência correspondente à ocorrência:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {Object.keys(CONTINGENCY_BLOCKS).map(blockName => (
                <button
                  key={blockName}
                  onClick={() => {
                    setSelectedBlock(blockName);
                    navigateTo('bloco_ocorrencias');
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 hover:text-white rounded-lg border border-slate-800 text-left text-[11px] font-bold text-slate-350"
                >
                  {blockName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: BLOCO OCORRENCIAS */}
        {currentStep === 'bloco_ocorrencias' && selectedBlock && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 px-3 py-1 rounded-full">
              {selectedBlock}
            </span>
            <h4 className="text-xl font-bold text-white leading-tight">Selecione a Ocorrência</h4>
            <p className="text-slate-400 text-xs">
              Selecione o tipo de situação específica para visualizar as condutas do Plano de Contingência:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[195px] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {Object.keys(CONTINGENCY_BLOCKS[selectedBlock]).map(occName => (
                <button
                  key={occName}
                  onClick={() => {
                    setSelectedProtocol(occName);
                    navigateTo('protocolo');
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-855 hover:text-white rounded-lg border border-slate-800 text-left text-[11px] font-bold text-slate-300 leading-normal"
                >
                  {occName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: PROTOCOLO DETALHE */}
        {currentStep === 'protocolo' && selectedProtocol && selectedBlock && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 px-3 py-1 rounded-full">
              {selectedBlock} — Contingência
            </span>
            <h4 className="text-md font-bold text-white leading-tight">{selectedProtocol}</h4>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-350">
              {CONTINGENCY_BLOCKS[selectedBlock][selectedProtocol].map((step, i) => (
                <div key={i} className="bg-slate-905 border border-slate-850/60 p-3 rounded-lg leading-relaxed">
                  <strong className="text-red-400">{i + 1}.</strong> {step}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => navigateTo('registro')} className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
                Registrar conforme o protocolo
              </button>
              <button onClick={() => navigateTo('transferido')} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
                Atendimento transferido
              </button>
            </div>
          </div>
        )}

        {/* Step: TRANSFERIDO */}
        {currentStep === 'transferido' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">Encerramento grave</span>
            <h4 className="text-xl font-bold text-white leading-tight">Atendimento transferido e registrado</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registre fatos, horários, medidas adotadas e profissionais acionados. O atendimento só termina quando houver transferência formal, liberação oficial ou encerramento confirmado pela liderança.
            </p>
            <div className="pt-4">
              <button onClick={handleReset} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15">
                Voltar ao início
              </button>
            </div>
          </div>
        )}

        {/* Step: TECLADO TECNICAS */}
        {currentStep === 'tecnicas' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">Consulta rápida</span>
            <h4 className="text-lg font-bold text-white">Técnicas de comunicação</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar text-[11px] text-slate-300">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Escuta ativa</b> Compreender o relato antes de concluir.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Paráfrase</b> Repetir com outras palavras para confirmar.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Comunicação não violenta</b> Descrever fato, impacto, regra e solicitação.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Questionamento socrático</b> Promover reflexão quando a situação estiver controlada.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Validação emocional</b> Reconhecer a emoção sem aceitar a conduta.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800"><b className="text-blue-400 block mb-1">Desescalada verbal</b> Reduzir tensão com voz calma e frases curtas.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850"><b className="text-blue-400 block mb-1">Limite claro</b> Informar o que deve parar e o que deve acontecer.</div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850"><b className="text-blue-400 block mb-1">Escolhas controladas</b> Oferecer opções permitidas sem retirar a regra.</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-purple-400 mt-2 font-bold leading-normal">
              Regra: primeiro proteger e estabilizar; depois ouvir, orientar e promover reflexão.
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
            <h4 className="text-lg font-bold text-white">Como encaminhar à coordenação para ata</h4>
            <div className="space-y-2 text-xs text-slate-350">
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">O que aconteceu, quem estava envolvido, onde e quando.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">O que foi observado diretamente e o que foi relatado.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">Qual risco existia e quais técnicas foram utilizadas.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">Quais orientações foram dadas e como o estudante reagiu.</p>
              <p className="bg-slate-900 p-3 rounded-lg border border-slate-800">Se houve reincidência e qual é a situação atual.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-amber-500 mt-2 font-bold leading-normal">
              <strong>Ocorrência média:</strong> levar o estudante à coordenação, repassar o histórico da orientação e da reincidência e solicitar o registro em ata. Encaminhar não é apenas levar o estudante: é transferir também as informações e a responsabilidade.
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Entendido
            </button>
          </div>
        )}

        {/* Step: REGISTRO LEVE */}
        {currentStep === 'registroLeve' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Ocorrência leve</span>
            <h4 className="text-lg font-bold text-white">Como registrar no app institucional</h4>
            <div className="space-y-2 text-xs text-slate-350">
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">1.</strong> Abra o app.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">2.</strong> Acesse a aba <strong>Registro Diário</strong>.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">3.</strong> Selecione o nome do aluno.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">4.</strong> Selecione o tipo de ocorrência.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">5.</strong> Preencha as informações solicitadas de forma objetiva.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-white">6.</strong> Revise os dados e envie o registro.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-blue-400 mt-2 font-bold leading-normal">
              <strong>Observação:</strong> caso o app indique reincidência, considerar a situação como <strong>ocorrência média</strong> e levar o estudante à coordenação para tratativa e registro em ata.
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider">
              Voltar
            </button>
          </div>
        )}

        {/* Step: REGISTRO GERAL */}
        {currentStep === 'registro' && (
          <div className="space-y-4 my-auto">
            <span className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Registro por classificação</span>
            <h4 className="text-lg font-bold text-white">Como registrar e encaminhar</h4>
            <div className="space-y-2 text-xs text-slate-350">
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-blue-400">Leve:</strong> registrar no app pela aba Registro Diário, selecionar o aluno e o tipo de ocorrência, preencher as informações e enviar.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-blue-400">Média:</strong> registrar a reincidência no app, encaminhar à coordenação e solicitar elaboração de ata.</p>
              <p className="bg-slate-900 p-3 rounded-lg"><strong className="text-blue-400">Grave:</strong> seguir o protocolo específico do Plano de Contingência, registrar fatos, horários, medidas adotadas e profissionais acionados.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-amber-500 mt-2 font-bold leading-normal">
              <strong>Registrar fatos, não julgamentos.</strong><br/>Correto: “Elevou o tom de voz e recusou-se a retornar.”<br/>Incorreto: “É agressivo e problemático.”
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
            <button onClick={handleBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors">
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
