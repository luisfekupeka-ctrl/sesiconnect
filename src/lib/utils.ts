import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizarNomeComum(input: string, listaCanonical: string[]): string {
  if (!input) return '—';
  const cleanInput = input.trim();
  if (cleanInput === '—' || cleanInput.toUpperCase() === 'A DEFINIR' || cleanInput === '') return cleanInput;

  // Helper to remove accents and lower-case
  const normalizeStr = (s: string) => 
    s.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/\s+/g, ' ')
     .trim();

  const normalizedInput = normalizeStr(cleanInput);

  // 1. Exact match (case & accent insensitive)
  for (const canon of listaCanonical) {
    if (normalizeStr(canon) === normalizedInput) {
      return canon;
    }
  }

  // 2. Partial/Starts-with match (e.g. "Alessandro" matches "Alessandro Goulart")
  for (const canon of listaCanonical) {
    const normCanon = normalizeStr(canon);
    if (normCanon.startsWith(normalizedInput) || normalizedInput.startsWith(normCanon)) {
      return canon;
    }
  }

  // 3. Word-based intersection (e.g. "Alessandro G." matches "Alessandro Goulart")
  const inputWords = normalizedInput.split(' ').filter(w => w.length > 1);
  if (inputWords.length > 0) {
    for (const canon of listaCanonical) {
      const canonWords = normalizeStr(canon).split(' ');
      const matchesAll = inputWords.every(iw => canonWords.some(cw => cw.startsWith(iw) || iw.startsWith(cw)));
      if (matchesAll) {
        return canon;
      }
    }
  }

  // Fallback: If not found, return input as-is
  return cleanInput;
}
