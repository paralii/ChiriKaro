import { useState, type InputHTMLAttributes } from 'react';
import { FormField } from './FormField';
import { Input } from '@/components/atoms/Input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string };

export function PasswordField({ label = 'Password', ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <FormField label={label}>
      <span className="relative block">
        <Input {...props} type={show ? 'text' : 'password'} className="pr-[58px]" />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-[11px] -translate-y-1/2 cursor-pointer border-0 bg-transparent p-[3px] text-[11px] font-semibold text-brand-deep">
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </FormField>
  );
}