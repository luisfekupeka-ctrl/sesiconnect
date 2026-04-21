import { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, GraduationCap, MapPin, Clock, Users } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<string | null>(null);

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

      {/* Painel de Alunos Expandido (Opcional se houver dados) */}
      {labAberto && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-[2.5rem] p-8 editorial-shadow text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-on-surface">{labAberto.nivel}</h3>
              <p className="text-sm text-on-surface-variant font-bold">Turma: {labAberto.turma} • Professor: {labAberto.professor}</p>
            </div>
            <div className="px-6 py-2 bg-primary text-on-surface-bright text-xs font-black rounded-full uppercase tracking-widest">
              Local: {labAberto.sala}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
