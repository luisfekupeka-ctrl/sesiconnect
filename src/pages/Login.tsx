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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface p-8 rounded-3xl border border-outline/20 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-on-surface-bright mx-auto mb-4">
            <Shield size={36} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2 text-on-surface-bright">Acesso Restrito</h1>
          <p className="text-on-surface-variant text-sm font-medium">Entre com suas credenciais.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input 
                type="text" 
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-white/20 rounded-2xl py-4 pl-12 pr-4 text-base font-medium transition-all outline-none text-on-surface"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input 
                type="password" 
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-white/20 rounded-2xl py-4 pl-12 pr-4 text-base font-medium transition-all outline-none text-on-surface"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {erro && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-sm font-medium"
            >
              <AlertCircle size={16} />
              {erro}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={carregando}
            className="w-full bg-white/10 text-on-surface-bright py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all hover:bg-white/15 disabled:opacity-50 border border-outline/20"
          >
            {carregando ? 'Verificando...' : 'Entrar'}
            {!carregando && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-on-surface-variant/30 font-medium">
          SESI Connect
        </p>
      </motion.div>
    </div>
  );
}