import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseTableInfo = (description: string) => {
  const tablePattern = /'([^']+)':\s*'([^']+)'/g;
  const tables = [];
  let match;
  while ((match = tablePattern.exec(description)) !== null) {
    tables.push({ name: match[1], description: match[2] });
  }
  return tables;
};

export const parseListItems = (description: string) => {
  const listPattern = /^\d+\.\s+(.+?):\s+(.+)$/gm;
  const matches = [...description.matchAll(listPattern)];
  return matches.map((match) => ({
    title: match[1],
    content: match[2],
  }));
};

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function diffDescriptions(
  current: Record<string, string>,
  initial: Record<string, string>
): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const key in current) {
    if (current[key] !== initial[key]) {
      changed[key] = current[key];
    }
  }
  return changed;
}
