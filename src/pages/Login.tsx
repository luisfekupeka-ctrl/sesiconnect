import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const { data, error } = await supabase
        .from('config_acesso')
        .select('*')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single();

      if (error || !data) {
        setErro('Usuário ou senha incorretos.');
      } else {
        localStorage.setItem('sesi_auth', 'true');
        navigate('/admin');
      }
    } catch (err) {
      setErro('Erro ao conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-container-lowest relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent-cyan/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-container-low p-10 rounded-[3rem] editorial-shadow border border-outline-variant/10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2 text-on-surface-bright">Acesso Restrito</h1>
          <p className="text-on-surface-variant text-sm font-medium">Entre com suas credenciais para gerenciar o sistema.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Usuário</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="text" 
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-14 pr-6 text-sm font-bold transition-all outline-none"
                placeholder="Ex: admin"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="password" 
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-14 pr-6 text-sm font-bold transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {erro && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 text-xs font-bold"
            >
              <AlertCircle size={16} />
              {erro}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={carregando}
            className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {carregando ? 'Verificando...' : 'Entrar no Painel'}
            {!carregando && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">
          SESI Connect — Sistema de Gestão Live
        </p>
      </motion.div>
    </div>
  );
}
