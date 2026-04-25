import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, XCircle, Clock, FileText, Save } from 'lucide-react';
import { EntradaGradeSala, Aluno, StatusPresenca } from '../types';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';
import { salvarChamadas, buscarChamadas } from '../services/dataService';

interface ModalChamadaProps {
  aula: EntradaGradeSala;
  onClose: () => void;
}

export default function ModalChamada({ aula, onClose }: ModalChamadaProps) {
  const { alunos } = useEscola();
  const [presencas, setPresencas] = useState<Record<string, StatusPresenca>>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Filtrar alunos desta sala/turma
  // O filtro ideal depende da regra da escola. Por enquanto, se a aula tem uma 'turma', filtramos alunos por turma.
  // Se não, pegamos todos daquela sala. Vamos tentar pela turma primeiro, depois pela sala.
  const alunosDaTurma = alunos.filter(a => {
    if (aula.turma && aula.turma !== 'A DEFINIR' && aula.turma !== '—') {
      return a.turma === aula.turma;
    }
    return a.numeroSala === aula.numeroSala;
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  useEffect(() => {
    // Tenta carregar chamada existente para esta aula
    const carregarChamada = async () => {
      setLoading(true);
      const dataHoje = new Date().toISOString().split('T')[0];
      const registros = await buscarChamadas({
        data: dataHoje,
        sala: aula.numeroSala.toString(),
        horario: aula.horario,
      });

      if (registros.length > 0) {
        const estadoInicial: Record<string, StatusPresenca> = {};
        registros.forEach(r => {
          estadoInicial[r.idAluno] = r.status;
        });
        setPresencas(estadoInicial);
      } else {
        // Se não houver chamada, marca todos como presente por padrão (facilita pro professor)
        const estadoInicial: Record<string, StatusPresenca> = {};
        alunosDaTurma.forEach(a => {
          estadoInicial[a.id] = 'presente';
        });
        setPresencas(estadoInicial);
      }
      setLoading(false);
    };

    carregarChamada();
  }, [aula]);

  const marcar = (idAluno: string, status: StatusPresenca) => {
    setPresencas(prev => ({ ...prev, [idAluno]: status }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    const dataHoje = new Date().toISOString().split('T')[0];
    
    const registros = alunosDaTurma.map(aluno => ({
      data: dataHoje,
      horario: aula.horario,
      professor: aula.nomeProfessor,
      sala: aula.numeroSala.toString(),
      materia: aula.materia,
      idAluno: aluno.id,
      nomeAluno: aluno.nome,
      turmaAluno: aluno.turma,
      status: presencas[aluno.id] || 'falta'
    }));

    const sucesso = await salvarChamadas(registros);
    setSalvando(false);

    if (sucesso) {
      setSalvo(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      alert("Erro ao salvar chamada. Tente novamente.");
    }
  };

  const botoesStatus = [
    { valor: 'presente', icone: Check, cor: 'bg-emerald-500', hover: 'hover:bg-emerald-500/20 hover:text-emerald-500' },
    { valor: 'falta', icone: XCircle, cor: 'bg-rose-500', hover: 'hover:bg-rose-500/20 hover:text-rose-500' },
    { valor: 'atraso', icone: Clock, cor: 'bg-amber-500', hover: 'hover:bg-amber-500/20 hover:text-amber-500' },
    { valor: 'justificado', icone: FileText, cor: 'bg-blue-500', hover: 'hover:bg-blue-500/20 hover:text-blue-500' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-start justify-between bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-black tracking-tighter mb-1">Chamada</h2>
            <p className="text-on-surface-variant font-bold text-sm">
              {aula.materia} • {aula.turma} • Sala {aula.numeroSala}
            </p>
            <p className="text-on-surface-variant text-xs mt-1 bg-surface-container-high px-2 py-0.5 rounded-md w-fit">
              {aula.horario}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-surface-container-highest hover:bg-hover rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Alunos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alunosDaTurma.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <p className="font-bold">Nenhum aluno cadastrado nesta turma/sala.</p>
            </div>
          ) : (
            alunosDaTurma.map((aluno, index) => (
              <div key={aluno.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-black text-sm">{aluno.nome}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{aluno.turma}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {botoesStatus.map(btn => {
                    const ativo = presencas[aluno.id] === btn.valor;
                    const Icone = btn.icone;
                    return (
                      <button
                        key={btn.valor}
                        onClick={() => marcar(aluno.id, btn.valor)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          ativo ? `${btn.cor} text-white shadow-md` : `bg-surface-container-highest text-on-surface-variant ${btn.hover}`
                        )}
                        title={btn.valor.charAt(0).toUpperCase() + btn.valor.slice(1)}
                      >
                        <Icone size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={loading || salvando || alunosDaTurma.length === 0}
            className={cn(
              "px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2",
              salvo ? "bg-emerald-500 text-white" : "bg-primary text-on-primary hover:bg-primary/90",
              (loading || salvando) && "opacity-50 cursor-not-allowed"
            )}
          >
            {salvo ? (
              <>
                <Check size={20} />
                Salvo com Sucesso
              </>
            ) : salvando ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Confirmar Chamada
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
