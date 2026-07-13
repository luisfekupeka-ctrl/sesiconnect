import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Check, XCircle, Clock, FileText, Save, Search, AlertCircle } from 'lucide-react';
import { EntradaGradeSala, Aluno, StatusPresenca } from '../types';
import { useEscola } from '../context/ContextoEscola';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { salvarChamadas, buscarChamadas } from '../services/dataService';

interface ModalChamadaProps {
  aula: EntradaGradeSala;
  onClose: () => void;
}

export default function ModalChamada({ aula, onClose }: ModalChamadaProps) {
  const { alunos, professores } = useEscola();
  const { user, profile } = useAuth();
  const [presencas, setPresencas] = useState<Record<string, StatusPresenca>>({});
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Somente o professor responsável pela aula ou administrador pode realizar a chamada
  const isDocenteResponsavel = useMemo(() => {
    if (!profile) return false;
    // Admins e Super Admins têm acesso total
    if (profile.role === 'admin' || profile.role === 'super_admin') return true;
    
    // Se for professor, deve bater o user_id cadastrado na tabela de professores_cms
    if (profile.role === 'professor') {
      const meuProf = professores.find(p => p.user_id === user?.id);
      return meuProf ? meuProf.nome === aula.nomeProfessor : false;
    }

    return false;
  }, [profile, user, professores, aula]);

  // Carregar alunos da turma correspondente
  const alunosDaTurma = useMemo(() => {
    return alunos.filter(a => a.turma === aula.turma).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, aula.turma]);

  useEffect(() => {
    async function carregarFaltasExistentes() {
      setLoading(true);
      const dataHoje = new Date().toISOString().split('T')[0];
      const registros = await buscarChamadas({
        data: dataHoje,
        horario: aula.horario,
        sala: aula.numeroSala > 0 ? aula.numeroSala.toString() : aula.nomeSala
      });

      const mapaExistente: Record<string, StatusPresenca> = {};
      registros.forEach(r => {
        mapaExistente[r.idAluno] = r.status;
      });
      setPresencas(mapaExistente);
      setLoading(false);
    }
    carregarFaltasExistentes();
  }, [aula]);

  const marcar = (idAluno: string, status: StatusPresenca) => {
    if (!isDocenteResponsavel) return; // Bloquear clique se não for o responsável
    setPresencas(prev => ({ ...prev, [idAluno]: status }));
  };

  const handleSalvar = async () => {
    if (!isDocenteResponsavel) return;
    setSalvando(true);
    const dataHoje = new Date().toISOString().split('T')[0];

    const registros = alunosDaTurma.map(aluno => ({
      data: dataHoje,
      horario: aula.horario,
      professor: aula.nomeProfessor,
      sala: aula.numeroSala > 0 ? aula.numeroSala.toString() : aula.nomeSala,
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

        {/* Alerta de Acesso Negado */}
        {!isDocenteResponsavel && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 text-xs font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Apenas Visualização: Somente o professor responsável ({aula.nomeProfessor}) pode realizar ou editar esta chamada.</span>
          </div>
        )}

        {/* Search & Stats */}
        <div className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={14} />
            <input 
              type="text" 
              placeholder="Pesquisar aluno..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/10 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-primary/20"
            />
          </div>
          <div className="flex gap-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
              {Object.values(presencas).filter(v => v === 'presente').length} Presentes
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              {Object.values(presencas).filter(v => v === 'falta').length} Faltas
            </div>
          </div>
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
            alunosDaTurma.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).map((aluno, index) => (
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

                <div className={cn("flex gap-2", !isDocenteResponsavel && "opacity-50 pointer-events-none")}>
                  {botoesStatus.map(btn => {
                    const ativo = presencas[aluno.id] === btn.valor;
                    const Icone = btn.icone;
                    return (
                      <button
                        key={btn.valor}
                        onClick={() => marcar(aluno.id, btn.valor)}
                        disabled={!isDocenteResponsavel}
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
            disabled={loading || salvando || alunosDaTurma.length === 0 || !isDocenteResponsavel}
            className={cn(
              "px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2",
              salvo ? "bg-emerald-500 text-white" : "bg-primary text-on-primary hover:bg-primary/90",
              (loading || salvando || !isDocenteResponsavel) && "opacity-50 cursor-not-allowed"
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
