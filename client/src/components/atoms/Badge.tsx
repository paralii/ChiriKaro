import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  pill: 'bg-[#e1f4ed] text-[#286d5b]',
  pending: 'bg-[#fff2dc] text-[#925712]',
  approved: 'bg-[#e6f5ed] text-[#276d59]',
  rejected: 'bg-[#ffedeb] text-[#943b37]',
  blocked: 'bg-[#eaebf0] text-[#555b69]',
  neutral: 'bg-[#eef0f6] text-[#6d7180]',
};
export type BadgeTone = keyof typeof tones;

export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s.includes('pending')) return 'pending';
  if (s.includes('approved') || s.includes('verified')) return 'approved';
  if (s.includes('rejected')) return 'rejected';
  if (s.includes('blocked')) return 'blocked';
  return 'neutral';
}

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-block rounded-[4px] px-2 py-[5px] text-[9px] font-bold', tones[tone], className)}>{children}</span>;
}