import React, { useMemo } from 'react';
import { LOCAIS_MONITORIA } from '../lib/locations';
import { useEscola } from '../context/ContextoEscola';

interface SeletorLocalPostoProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function SeletorLocalPosto({ value, onChange, className }: SeletorLocalPostoProps) {
  const { locaisCMS } = useEscola();

  const opcoesPosto = useMemo(() => {
    const valorPosto = (value || '').trim().toUpperCase();
    
    // Nomes cadastrados no banco
    const nomesCMS = (locaisCMS || []).map(l => l.nome.trim().toUpperCase());
    
    // Combina os locais estáticos com os dinâmicos
    const todosLocais = Array.from(new Set([
      ...LOCAIS_MONITORIA.map(l => l.toUpperCase()),
      ...nomesCMS
    ])).sort((a, b) => a.localeCompare(b));

    const base = ['', ...todosLocais];
    
    if (valorPosto && !todosLocais.includes(valorPosto)) {
      base.push(valorPosto);
    }
    
    return base;
  }, [value, locaisCMS]);

  return (
    <select
      id="seletor-local-posto"
      name="local_posto"
      value={value?.toUpperCase() || ''}
      onChange={e => onChange(e.target.value)}
      className={className}
    >
      <option value="" className="text-white/40 bg-[#1a1a1a]">SELECIONE O LOCAL...</option>
      {opcoesPosto.filter(Boolean).map(l => (
        <option key={l} value={l} className="bg-[#1a1a1a] text-white">
          {l}
        </option>
      ))}
    </select>
  );
}
