import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, User, ArrowRight, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register' | 'success';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) {
          setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        } else {
          navigate('/');
        }
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { full_name: nome }
          }
        });

        if (error) {
          setErro(error.message);
        } else if (data.user) {
          // Criar perfil pendente (Trigger do DB geralmente faz isso, mas garantimos aqui)
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: nome,
            email: email,
            role: 'user',
            status: 'pending'
          });
          setMode('success');
        }
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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-900/50 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-900/30 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-10 backdrop-blur-md"
      >
        <AnimatePresence mode="wait">
          {mode === 'success' ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-on-surface-bright mb-2">Solicitação Enviada!</h2>
                <p className="text-on-surface-variant text-sm">Seu cadastro foi recebido. O administrador principal precisa aprovar seu acesso antes de você entrar.</p>
              </div>
              <button onClick={() => setMode('login')} className="btn-primary w-full justify-center">Voltar para Login</button>
            </motion.div>
          ) : (
            <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-yellow">
                  <Shield size={36} />
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-2 text-on-surface-bright">
                  {mode === 'login' ? 'SESI Connect' : 'Criar Conta'}
                </h1>
                <p className="text-on-surface-variant text-sm font-medium">
                  {mode === 'login' ? 'Acesse o comando central da unidade.' : 'Solicite seu acesso ao sistema.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={18} />
                      <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                        className="w-full bg-surface-container-low border-2 border-white/5 focus:border-primary/50 rounded-2xl py-4 pl-14 pr-4 text-base font-medium transition-all outline-none text-on-surface"
                        placeholder="Seu Nome" required />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">E-mail Institucional</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={18} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-surface-container-low border-2 border-white/5 focus:border-primary/50 rounded-2xl py-4 pl-14 pr-4 text-base font-medium transition-all outline-none text-on-surface"
                      placeholder="seu@email.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={18} />
                    <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                      className="w-full bg-surface-container-low border-2 border-white/5 focus:border-primary/50 rounded-2xl py-4 pl-14 pr-4 text-base font-medium transition-all outline-none text-on-surface"
                      placeholder="••••••••" required />
                  </div>
                </div>

                {erro && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-xs font-bold">
                    <AlertCircle size={16} /> {erro}
                  </motion.div>
                )}

                <button type="submit" disabled={carregando} className="btn-primary w-full justify-center py-5">
                  {carregando ? 'Processando...' : (mode === 'login' ? 'Entrar no Sistema' : 'Solicitar Acesso')}
                  {!carregando && <ArrowRight size={18} />}
                </button>

                <div className="pt-4 text-center">
                  <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                    {mode === 'login' ? 'Não tem conta? Solicite acesso' : 'Já tem conta? Faça login'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-[8px] font-black text-on-surface-variant/20 uppercase tracking-[0.5em]">
          SESI Connect · Unidade Segura
        </p>
      </motion.div>
    </div>
  );
}

    </div>
  );
}