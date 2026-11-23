import { useState, type InputHTMLAttributes } from 'react';
import { FormField } from './FormField';
import { Input } from '@components/atoms/Input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string };

export function PasswordField({ label = 'Password', ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <FormField label={label}>
      <span className="relative block">
        <Input {...props} type={show ? 'text' : 'password'} className="pr-16" />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-sm border-0 bg-transparent px-2 py-1.5 text-xs font-semibold text-primary-hover transition-colors duration-interactive hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </FormField>
  );
}
