import { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, GraduationCap, MapPin, Clock, Users } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { laboratorioIdiomas, estadoEscola } = useEscola();
  const [nivelSelecionado, setNivelSelecionado] = useState<string | null>(null);

  const nivelAberto = laboratorioIdiomas.find(n => n.id === nivelSelecionado);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-4">
          <Languages size={14} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Programa de Idiomas</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-2">Laboratório de Idiomas</h1>
        <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
          Ensalamento especial temporário. Substitui a lógica das salas durante o horário de idiomas e organiza alunos por nível.
        </p>
      </header>

      {/* Cards de Níveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laboratorioIdiomas.map((nivel) => {
          const selecionado = nivelSelecionado === nivel.id;
          return (
            <motion.div
              key={nivel.id}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setNivelSelecionado(selecionado ? null : nivel.id)}
              className={cn(
                "bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-xl border-2 transition-all group cursor-pointer relative overflow-hidden",
                selecionado ? "border-primary shadow-primary/10" : "border-transparent hover:border-primary/10"
              )}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  selecionado ? "bg-primary text-white" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                )}>
                  <GraduationCap size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Horário</p>
                  <div className="flex items-center gap-1.5 text-on-surface font-black bg-surface-container-low px-3 py-1.5 rounded-xl">
                    <Clock size={14} className="text-primary" />
                    <span className="text-xs">{nivel.horarioInicio} - {nivel.horarioFim}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                <h3 className="text-xl font-black text-on-surface leading-tight tracking-tighter group-hover:text-primary transition-colors">
                  {nivel.nivel}
                </h3>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-container-low">
                  <div>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 flex items-center gap-1">
                      <MapPin size={10} /> Sala
                    </p>
                    <p className="text-sm font-black text-on-surface">Sala {nivel.numeroSala.toString().padStart(2, '0')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 flex items-center gap-1">
                      <Languages size={10} /> Docente
                    </p>
                    <p className="text-sm font-black text-on-surface">{nivel.nomeProfessor}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ativo</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-on-surface-variant">
                    <Users size={12} />
                    {nivel.quantidadeAlunos} alunos
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Painel de Alunos Expandido */}
      {nivelAberto && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-[2.5rem] p-8 editorial-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface">{nivelAberto.nivel}</h3>
                <p className="text-sm text-on-surface-variant font-bold">{nivelAberto.grupoAlunos} • {nivelAberto.nomeProfessor}</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl">{nivelAberto.quantidadeAlunos} Alunos</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-container-low bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">#</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nome do Aluno</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {nivelAberto.listaAlunos.map((aluno, i) => (
                  <tr key={i} className="border-t border-surface-container-low hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-3 text-xs font-bold text-on-surface-variant">{i + 1}</td>
                    <td className="px-6 py-3 text-sm font-bold text-on-surface">{aluno}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        Presente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
