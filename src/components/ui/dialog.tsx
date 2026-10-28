"use client";

import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Where the panel slides from. */
  side?: "left" | "right" | "top" | "full";
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * Modal built on the native <dialog>: focus trapping, Escape-to-close, inert background and
 * focus restoration are handled by the platform. Backdrop clicks close it.
 */
export function Dialog({ open, onClose, side = "right", label, className = "", children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`dlg dlg--${side} ${className}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
