import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
    ClipboardCheck, Users, DoorOpen, Clock,
    Calendar, Search, Filter, FileDown, CheckCircle2,
    AlertCircle, ChevronRight, BarChart3
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';
import { buscarChamadas } from '../services/dataService';
import { buscarRealocacoes } from '../services/motorRealocacao';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { RegistroChamada, ResultadoRealocacao } from '../types';

export default function RelatorioDiario() {
    const { gradeCompleta, salas, professoresCMS, periodos, horaAtual } = useEscola();
    const [dataSel, setDataSel] = useState(new Date().toISOString().split('T')[0]);
    const [agrupamento, setAgrupamento] = useState<'sala' | 'professor'>('sala');
    const [busca, setBusca] = useState('');
    const [chamadas, setChamadas] = useState<RegistroChamada[]>([]);
    const [substituicoes, setSubstituicoes] = useState<ResultadoRealocacao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const diaSemana = obterDiaSemana(new Date(dataSel + 'T12:00:00'));
    const blocos = obterBlocosDeHorario(periodos);

    useEffect(() => {
        async function carregarDados() {
            setCarregando(true);
            const [resChamadas, resSubs] = await Promise.all([
                buscarChamadas({ data: dataSel }),
                buscarRealocacoes()
            ]);
            setChamadas(resChamadas);
            setSubstituicoes(resSubs.filter(s => s.status === 'EFETIVADO' && s.dia === diaSemana));
            setCarregando(false);
        }
        carregarDados();
    }, [dataSel, diaSemana]);

    // Helper para normalizar o nome da sala (ex: "SALA 01" -> "01")
    const limparSala = (nome: string) => nome.replace(/SALA\s+/i, '').trim().toUpperCase();

    // Processamento da Grade Real (Regular + Substituições)
    const relatorio = useMemo(() => {
        // Normalizamos a chave para garantir o encontro dos dados
        const mapaConcluidas = new Set(chamadas.map(c => {
            return `${c.horario.trim()}|${limparSala(c.sala)}`;
        }));

        const dados: any[] = [];

        if (agrupamento === 'sala') {
            salas.forEach(sala => {
                const aulasSala: any[] = [];
                blocos.forEach(bloco => {
                    const range = `${bloco.inicio} - ${bloco.fim}`;

                    // 1. Verificar se houve substituição nesta sala/horário
                    const sub = substituicoes.find(s => s.turma.includes(`SALA ${sala.numero}`) && s.horario === range);
                    // 2. Senão, pegar a aula regular
                    const reg = gradeCompleta.find(g => g.numeroSala === sala.numero && g.diaSemana === diaSemana && g.horario === range);

                    if (sub || reg) {
                        const prof = sub ? sub.professorSubstituto : reg?.nomeProfessor || '—';

                        // Verificação robusta por número ou nome
                        const rangeKey = range.trim();
                        const concluida =
                            mapaConcluidas.has(`${rangeKey}|${sala.numero}`) ||
                            mapaConcluidas.has(`${rangeKey}|${sala.numero.toString().padStart(2, '0')}`) ||
                            mapaConcluidas.has(`${rangeKey}|${limparSala(sala.nome)}`);

                        aulasSala.push({
                            horario: range,
                            materia: sub ? (sub.tipo === 'PROVA' ? 'PROVA' : 'SUBSTITUIÇÃO') : reg?.materia,
                            professor: prof,
                            status: concluida ? 'concluida' : 'pendente',
                            tipo: sub ? 'sub' : 'regular'
                        });
                    }
                });
                if (aulasSala.length > 0) {
                    dados.push({ id: sala.numero, titulo: `Sala ${sala.numero.toString().padStart(2, '0')} - ${sala.nome}`, itens: aulasSala });
                }
            });
        } else {
            professoresCMS.forEach(p => {
                const aulasProf: any[] = [];
                blocos.forEach(bloco => {
                    const range = `${bloco.inicio} - ${bloco.fim}`;

                    const sub = substituicoes.find(s => s.professorSubstituto === p.nome && s.horario === range);
                    const reg = gradeCompleta.find(g => g.nomeProfessor === p.nome && g.diaSemana === diaSemana && g.horario === range);

                    if (sub || reg) {
                        const salaInfo = sub ? sub.turma : `Sala ${reg?.numeroSala}`;
                        const concluida = mapaConcluidas.has(`${range}|${limparSala(salaInfo)}`);

                        aulasProf.push({
                            horario: range,
                            local: salaInfo,
                            materia: sub ? 'SUBSTITUIÇÃO' : reg?.materia,
                            status: concluida ? 'concluida' : 'pendente'
                        });
                    }
                });
                if (aulasProf.length > 0) {
                    dados.push({ id: p.id, titulo: p.nome, itens: aulasProf });
                }
            });
        }

        return dados.filter(d => d.titulo.toLowerCase().includes(busca.toLowerCase()));
    }, [agrupamento, salas, professoresCMS, gradeCompleta, substituicoes, chamadas, diaSemana, blocos, busca]);

    const stats = useMemo(() => {
        const total = relatorio.reduce((acc, curr) => acc + curr.itens.length, 0);
        const feitas = relatorio.reduce((acc, curr) => acc + curr.itens.filter((i: any) => i.status === 'concluida').length, 0);
        return { total, feitas, pct: total > 0 ? Math.round((feitas / total) * 100) : 0 };
    }, [relatorio]);

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-primary">
                        <BarChart3 size={32} />
                        <h1 className="text-4xl font-black tracking-tighter">Relatório de Chamadas</h1>
                    </div>
                    <p className="text-on-surface-variant font-medium">Controle de produtividade e registros diários.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/10">
                        <Calendar size={18} className="text-primary" />
                        <input type="date" value={dataSel} onChange={e => setDataSel(e.target.value)} className="bg-transparent font-black text-sm outline-none" />
                    </div>
                    <button onClick={() => window.print()} className="btn-secondary !rounded-2xl !py-3"><FileDown size={18} /> PDF</button>
                </div>
            </header>

            {/* Resumo de Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow border border-outline-variant/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Total de Aulas Previstas</p>
                    <p className="text-4xl font-black">{stats.total}</p>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow border border-emerald-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Chamadas Realizadas</p>
                    <p className="text-4xl font-black text-emerald-600">{stats.feitas}</p>
                </div>
                <div className="bg-primary text-on-primary p-8 rounded-[2.5rem] shadow-xl shadow-primary/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Eficiência de Registro</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black">{stats.pct}%</p>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-amber" style={{ width: `${stats.pct}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controles de Visualização */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
                    <button onClick={() => setAgrupamento('sala')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", agrupamento === 'sala' ? "bg-primary text-white shadow-md" : "text-on-surface-variant")}>
                        <DoorOpen size={14} className="inline mr-2" /> Por Sala
                    </button>
                    <button onClick={() => setAgrupamento('professor')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", agrupamento === 'professor' ? "bg-primary text-white shadow-md" : "text-on-surface-variant")}>
                        <Users size={14} className="inline mr-2" /> Por Professor
                    </button>
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                    <input type="text" placeholder={`Buscar ${agrupamento}...`} value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20" />
                </div>
            </div>

            {/* Listagem */}
            <div className="space-y-6">
                {carregando ? (
                    <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest text-on-surface-variant">Carregando auditoria...</div>
                ) : relatorio.length === 0 ? (
                    <div className="p-20 text-center bg-surface-container-low rounded-[3rem] border-2 border-dashed border-outline-variant/20">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-black text-on-surface-variant">Nenhuma aula encontrada para este dia.</p>
                    </div>
                ) : (
                    relatorio.map(grupo => (
                        <div key={grupo.id} className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow border border-outline-variant/5 overflow-hidden">
                            <div className="p-6 bg-surface-container-low/50 border-b border-outline-variant/10 flex justify-between items-center">
                                <h3 className="font-black text-lg tracking-tight">{grupo.titulo}</h3>
                                <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">
                                    {grupo.itens.filter((i: any) => i.status === 'concluida').length} / {grupo.itens.length} completas
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/5">
                                            <th className="p-5">Horário</th>
                                            <th className="p-5">{agrupamento === 'sala' ? 'Professor' : 'Local'}</th>
                                            <th className="p-5">Matéria</th>
                                            <th className="p-5">Status Chamada</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/5">
                                        {grupo.itens.map((item: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-on-surface-variant" />
                                                        <span className="text-xs font-black">{item.horario}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-xs font-bold text-on-surface">
                                                        {agrupamento === 'sala' ? item.professor : item.local}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium">{item.materia || '—'}</span>
                                                        {item.tipo === 'sub' && <span className="text-[8px] font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded uppercase">Substituição</span>}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {item.status === 'concluida' ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            <CheckCircle2 size={12} /> Realizada
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            <AlertCircle size={12} /> Pendente
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}