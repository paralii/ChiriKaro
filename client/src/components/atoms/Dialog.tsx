import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/shared/lib/cn';

type DialogVariant = 'default' | 'warning' | 'error' | 'success';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: DialogVariant;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: { current: HTMLElement | null };
  className?: string;
};

const accentStyles: Record<DialogVariant, string> = {
  default: 'border-primary/20',
  warning: 'border-warning/35',
  error: 'border-danger/35',
  success: 'border-success/35',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'default',
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const focusTarget = initialFocusRef?.current ?? dialog.querySelector<HTMLElement>('[autofocus]') ?? dialog;
      focusTarget.focus();

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        if (dialog.open) dialog.close();
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
      };
    }

    if (!open && dialog.open) dialog.close();
    return undefined;
  }, [open, initialFocusRef]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (!closeOnEscape) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    onCloseRef.current();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-0 bg-transparent p-0 text-text-primary shadow-none backdrop:bg-text-primary/55 backdrop:backdrop-blur-[2px]"
    >
      <section className={cn('overflow-hidden rounded-lg border bg-surface-elevated shadow-lg', accentStyles[variant], className)}>
        <header className="border-b border-border px-4 py-4 sm:px-6">
          <h2 id={titleId} className="m-0 text-lg font-semibold text-text-primary">{title}</h2>
          {description ? <p id={descriptionId} className="mb-0 mt-1 text-sm leading-relaxed text-text-secondary">{description}</p> : null}
        </header>
        <div className="max-h-[min(60dvh,36rem)] overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-page px-4 py-3 sm:px-6">{footer}</footer> : null}
      </section>
    </dialog>
  );
}

type DialogActionProps = {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  autoFocus?: boolean;
};

export function DialogAction({ onClick, children, disabled, variant = 'primary', type = 'button', autoFocus }: DialogActionProps) {
  return <Button type={type} variant={variant} disabled={disabled} autoFocus={autoFocus} onClick={onClick}>{children}</Button>;
}
