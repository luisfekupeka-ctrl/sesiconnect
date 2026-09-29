import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, Download, Printer, Copy, Check, QrCode as QrIcon, 
  ExternalLink, Shield, Sparkles, Camera, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalQRCodeCFTVProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUrl?: string;
}

export function ModalQRCodeCFTV({ isOpen, onClose, defaultUrl }: ModalQRCodeCFTVProps) {
  const [url, setUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [tituloCartaz, setTituloCartaz] = useState('SOLICITAÇÃO DE CÂMERAS (CFTV)');
  const [subtituloCartaz, setSubtituloCartaz] = useState('Escaneie para solicitar verificação de imagens de segurança');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const initialUrl = defaultUrl || `${origin}/cameras`;
    setUrl(initialUrl);
  }, [defaultUrl, isOpen]);

  useEffect(() => {
    if (!url) return;
    
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Erro ao gerar QR Code:', err);
      });
  }, [url]);

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleBaixarPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode_solicitacao_cftv_sesi.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImprimir = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartaz QR Code - Solicitação CFTV SESI</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #111827;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              min-height: 90vh;
            }
            .poster-card {
              border: 3px solid #f59e0b;
              border-radius: 24px;
              padding: 40px 30px;
              max-width: 650px;
              width: 100%;
              box-sizing: border-box;
              background: #fafafa;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .header-badge {
              display: inline-flex;
              align-items: center;
              background: #000000;
              color: #fbbf24;
              padding: 8px 24px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 28px;
              font-weight: 900;
              color: #0f172a;
              margin: 0 0 8px 0;
              line-height: 1.2;
            }
            p.sub {
              font-size: 14px;
              color: #475569;
              margin: 0 0 30px 0;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 20px;
              border-radius: 20px;
              border: 2px solid #e2e8f0;
              display: inline-block;
              margin-bottom: 24px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .qr-wrapper img {
              width: 260px;
              height: 260px;
              display: block;
            }
            .steps {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin: 20px 0;
              text-align: left;
            }
            .step-box {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 12px;
              font-size: 12px;
            }
            .step-number {
              display: inline-block;
              background: #f59e0b;
              color: #000;
              font-weight: 800;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              text-align: center;
              line-height: 20px;
              margin-bottom: 6px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 10px 14px;
              font-size: 11px;
              color: #92400e;
              border-radius: 6px;
              text-align: left;
              margin-top: 16px;
            }
            .footer-url {
              font-size: 11px;
              color: #64748b;
              margin-top: 20px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="header-badge">SESI CONNECT • SEGURANÇA ESCOLAR</div>
            <h1>${tituloCartaz}</h1>
            <p class="sub">${subtituloCartaz}</p>
            
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="steps">
              <div class="step-box">
                <span class="step-number">1</span>
                <div><strong>Aponte a Câmera</strong><br>Abra a câmera do celular e escaneie o código acima.</div>
              </div>
              <div class="step-box">
                <span class="step-number">2</span>
                <div><strong>Informe os Dados</strong><br>Seus dados ficam salvos. Indique andar, local, horário e relato.</div>
              </div>
              <div class="step-box">
                <span class="step-number">3</span>
                <div><strong>Acompanhe</strong><br>Veja o status em tempo real na aba "Meus Chamados".</div>
              </div>
            </div>

            <div class="warning">
              <strong>Regra de Precisão:</strong> O intervalo aproximado deve ser de no máximo 1 hora. Solicitações com intervalo amplo estão sujeitas a análise estendida ou cancelamento.
            </div>

            <div class="footer-url">
              Acesso direto: ${url}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <QrIcon size={26} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">QR Code de Solicitação CFTV</h2>
                <p className="text-xs text-on-surface-variant">Escaneie com a câmera do celular ou imprima o cartaz para afixar na escola</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cartaz Preview */}
          <div 
            ref={printRef}
            className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black tracking-widest uppercase mb-3">
              <Shield size={12} /> SESI Connect • CFTV
            </span>

            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
              {tituloCartaz}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-5 max-w-md">
              {subtituloCartaz}
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-amber-400/80 mb-4 inline-block">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Solicitação de Câmeras" 
                  className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black">
                  Carregando QR Code...
                </div>
              )}
            </div>

            {/* Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full text-left text-[11px] mt-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <span className="inline-block w-4 h-4 rounded-full bg-primary text-black font-bold text-center text-[10px] mr-1.5">1</span>
                <span className="text-zinc-300 font-semibold">Aponte a câmera</span>
                <p className="text-zinc-500 text-[10px] mt-0.5">Abra no celular sem precisar de login prévio</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <span className="inline-block w-4 h-4 rounded-full bg-primary text-black font-bold text-center text-[10px] mr-1.5">2</span>
                <span className="text-zinc-300 font-semibold">Preencha o formulário</span>
                <p className="text-zinc-500 text-[10px] mt-0.5">Andar, ambiente, horário e descrição</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <span className="inline-block w-4 h-4 rounded-full bg-primary text-black font-bold text-center text-[10px] mr-1.5">3</span>
                <span className="text-zinc-300 font-semibold">Acompanhe o status</span>
                <p className="text-zinc-500 text-[10px] mt-0.5">Consulte o retorno em Meus Chamados</p>
              </div>
            </div>

            {/* URL Display */}
            <div className="mt-4 text-[10px] text-zinc-400 font-mono break-all bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 w-full text-center">
              Link: {url}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopiarLink}
                className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-2"
              >
                {copiado ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copiado ? 'Link Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={handleBaixarPNG}
                className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-2"
              >
                <Download size={16} />
                Baixar Imagem PNG
              </button>
            </div>

            <button
              onClick={handleImprimir}
              className="btn-primary !py-2.5 !px-5 text-xs flex items-center gap-2 shadow-glow-yellow"
            >
              <Printer size={16} />
              Imprimir Cartaz A4
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
