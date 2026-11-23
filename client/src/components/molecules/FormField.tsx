import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { Input } from '@components/atoms/Input';

export function FormField({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
  return <label className={cn('grid gap-2 text-sm leading-normal font-medium text-text-secondary', className)}>{label}{children}</label>;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; fieldClassName?: string };

export function TextField({ label, fieldClassName, ...input }: TextFieldProps) {
  return <FormField label={label} className={fieldClassName}><Input {...input} /></FormField>;
}
