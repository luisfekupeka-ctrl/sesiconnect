import { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, GraduationCap, MapPin, Clock, Users } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const labAberto = languageLab.find(n => n.id === labSelecionado);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-4">
          <Languages size={14} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Language Lab</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-2">Language Lab</h1>
        <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
          Ensalamento especial por níveis de proficiência. Substitui a lógica das salas durante o horário de inglês.
        </p>
      </header>

      {/* Cards de Níveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languageLab.map((lab) => {
          const selecionado = labSelecionado === lab.id;
          return (
            <motion.div
              key={lab.id}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLabSelecionado(selecionado ? null : lab.id)}
              className={cn(
                "bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-xl border-2 transition-all group cursor-pointer relative overflow-hidden",
                selecionado ? "border-primary shadow-primary/10" : "border-transparent hover:border-primary/10"
              )}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  selecionado ? "bg-primary text-on-surface-bright" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-surface-bright"
                )}>
                  <GraduationCap size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Horário</p>
                  <div className="flex items-center gap-1.5 text-on-surface font-black bg-surface-container-low px-3 py-1.5 rounded-xl">
                    <Clock size={14} className="text-primary" />
                    <span className="text-xs">{lab.horarioInicio} - {lab.horarioFim}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-black text-on-surface leading-tight tracking-tighter group-hover:text-primary transition-colors">
                    {lab.nivel}
                  </h3>
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">{lab.turma}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-container-low">
                  <div>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 flex items-center gap-1">
                      <MapPin size={10} /> Local
                    </p>
                    <p className="text-sm font-black text-on-surface truncate">{lab.sala}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 flex items-center gap-1">
                      <GraduationCap size={10} /> Docente
                    </p>
                    <p className="text-sm font-black text-on-surface truncate">{lab.professor}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{lab.diaSemana}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Painel de Alunos Expandido */}
      {labAberto && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-[3rem] p-8 md:p-10 editorial-shadow border border-primary/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center text-on-surface-bright shadow-2xl shadow-primary/20">
                <GraduationCap size={36} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Ensalamento Nominal</p>
                <h3 className="text-4xl font-black text-on-surface tracking-tighter italic leading-none">{labAberto.nivel}</h3>
                <p className="text-sm text-on-surface-variant font-bold mt-2">
                   {labAberto.turma} • {labAberto.professor} • <span className="text-primary">{labAberto.sala}</span>
                </p>
              </div>
            </div>

            <div className="relative group min-w-[300px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                 <Users size={18} />
              </div>
              <input 
                type="text"
                placeholder="Pesquisar aluno no lab..."
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {(labAberto.listaAlunos || [])
              .filter(a => a.toLowerCase().includes(busca.toLowerCase()))
              .map((aluno, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.01 }}
                key={idx} 
                className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-transparent hover:border-primary/20 transition-all group"
              >
                 <div className="w-8 h-8 bg-surface-container-high text-on-surface-variant rounded-xl flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-on-surface-bright transition-all shadow-sm">
                    {(idx + 1).toString().padStart(2, '0')}
                 </div>
                 <span className="font-bold text-on-surface group-hover:text-primary transition-colors">{aluno}</span>
              </motion.div>
            ))}

            {(labAberto.listaAlunos || []).length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30 italic font-medium">
                 Nenhum aluno registrado neste nível de Language Lab.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
