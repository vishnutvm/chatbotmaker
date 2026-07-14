/** Word-aware company initials (max 2). Avoids "vishnu's Company" → "VI". */
export function companyInitials(name: string | null | undefined): string {
  const cleaned = (name ?? '')
    .replace(/['’]s\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();

  if (!cleaned) return 'C';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export function greetingForName(fullName: string | null | undefined, now = new Date()): string {
  const hour = now.getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = (fullName ?? '').trim().split(/\s+/)[0];
  if (!first) return 'Welcome back';
  return `${part}, ${first}`;
}
