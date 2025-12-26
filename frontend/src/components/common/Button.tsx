// src/components/common/Button.tsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Props base que heredan todas las propiedades nativas del button de React
 */
export interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Permite customizar el color principal del botón
   * Ej: "bg-black hover:bg-zinc-800"
   */
  colorClassName?: string;
}

/**
 * Botón genérico del e‑commerce
 * Negro por defecto, pero personalizable vía Tailwind
 */
export const Button: React.FC<BaseButtonProps> = ({
  children,
  className,
  colorClassName = 'bg-black hover:bg-zinc-800',
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed',
        colorClassName,
        className
      )}
    >
      {children}
    </button>
  );
};

/**
 * Botón específico de WhatsApp
 * Estilo oficial verde + ícono blanco
 */
export const WhatsappButton: React.FC<BaseButtonProps> = ({
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1EBE5D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <WhatsappIcon className="h-5 w-5 fill-white" />
      {children}
    </button>
  );
};

/**
 * Ícono de WhatsApp en SVG
 */
const WhatsappIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M16.02 3C9.383 3 4 8.383 4 15.02c0 2.65.86 5.097 2.32 7.08L4 29l7.11-2.26a11.93 11.93 0 0 0 4.91 1.05h.01c6.637 0 12.02-5.383 12.02-12.02C28.04 8.383 22.657 3 16.02 3zm0 21.79h-.01a9.77 9.77 0 0 1-4.99-1.37l-.36-.21-4.22 1.34 1.38-4.11-.23-.38a9.76 9.76 0 0 1-1.5-5.04c0-5.38 4.38-9.76 9.77-9.76s9.77 4.38 9.77 9.76-4.38 9.76-9.77 9.76zm5.36-7.32c-.29-.15-1.72-.85-1.98-.94-.27-.1-.47-.15-.67.15-.2.29-.77.94-.94 1.13-.17.2-.35.22-.64.07-.29-.15-1.24-.46-2.36-1.47-.87-.78-1.46-1.75-1.63-2.04-.17-.29-.02-.45.13-.6.13-.13.29-.35.44-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.19-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.49 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.35.2 1.86.12.57-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.35z" />
  </svg>
);
