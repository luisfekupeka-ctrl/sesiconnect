import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Image as ImageIcon, Sparkles, Send, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImportadorGradeIAProps {
  onClose: () => void;
  salaAtual?: number;
}

export default function ImportadorGradeIA({ onClose, salaAtual }: ImportadorGradeIAProps) {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pasted' | 'sending'>('idle');

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0];
    if (item?.type.includes('image')) {
      const blob = item.getAsFile();
      if (blob) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
          setStatus('pasted');
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onPaste={handlePaste}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0d1117] border border-primary/30 p-10 rounded-[3.5rem] max-w-2xl w-full shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
              <Zap size={24} className="fill-primary" />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tighter italic text-white">Importador <span className="text-primary">IA</span></h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sincronização Visual de Grade</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {!image ? (
            <div className="aspect-video border-2 border-dashed border-primary/20 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group hover:border-primary/50 transition-all bg-primary/5 cursor-pointer">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-black italic text-white/80 uppercase tracking-tight">Cole (Ctrl+V) ou Arraste a imagem do horário aqui</p>
              <p className="text-[10px] font-medium text-white/40 mt-2 max-w-xs">O Antigravity processará os dados e atualizará a sala {salaAtual || 'selecionada'} automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
                <img src={image} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-primary/20 backdrop-blur-md px-6 py-3 rounded-full border border-primary/40 flex items-center gap-3">
                      <Sparkles size={18} className="text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">Imagem Identificada</span>
                   </div>
                </div>
                <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Send size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white italic">Como prosseguir:</p>
                    <p className="text-[10px] font-medium text-white/60 mt-1 leading-relaxed">
                      1. Clique no botão abaixo para copiar o comando de importação.<br/>
                      2. Cole no chat do **Antigravity** junto com a imagem que você acabou de capturar.<br/>
                      3. Eu farei o parse visual e aplicarei as mudanças diretamente no banco.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const text = `Antigravity, processe esta imagem de horário para a Sala ${salaAtual || 'selecionada'} e atualize a grade no banco de dados.`;
                    navigator.clipboard.writeText(text);
                    setStatus('sending');
                    setTimeout(() => setStatus('pasted'), 2000);
                  }}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                    status === 'sending' ? "bg-emerald-500 text-black" : "bg-primary text-black shadow-xl shadow-primary/20 hover:scale-[1.02]"
                  )}
                >
                  {status === 'sending' ? <Check size={18} /> : <Zap size={18} className="fill-current" />}
                  {status === 'sending' ? 'Comando Copiado!' : 'Copiar Comando de Importação'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
