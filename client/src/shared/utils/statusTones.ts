import type { BadgeTone } from "@/components/atoms/Badge";

export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s.includes('pending')) return 'pending';
  if (s.includes('approved') || s.includes('verified')) return 'approved';
  if (s.includes('rejected')) return 'rejected';
  if (s.includes('blocked')) return 'blocked';
  return 'neutral';
}