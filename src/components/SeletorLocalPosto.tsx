import React, { useMemo } from 'react';
import { LOCAIS_MONITORIA } from '../lib/locations';

interface SeletorLocalPostoProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function SeletorLocalPosto({ value, onChange, className }: SeletorLocalPostoProps) {
  const opcoesPosto = useMemo(() => {
    const valorPosto = (value || '').trim().toUpperCase();
    const base = ['', ...LOCAIS_MONITORIA];
    if (valorPosto && !LOCAIS_MONITORIA.includes(valorPosto)) {
      base.push(valorPosto);
    }
    return base;
  }, [value]);

  return (
    <select
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
