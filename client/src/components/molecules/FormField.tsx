import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/atoms/Input';

export function FormField({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
  return <label className={cn('grid gap-[7px] text-xs font-semibold text-[#424756]', className)}>{label}{children}</label>;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; fieldClassName?: string };

export function TextField({ label, fieldClassName, ...input }: TextFieldProps) {
  return <FormField label={label} className={fieldClassName}><Input {...input} /></FormField>;
}