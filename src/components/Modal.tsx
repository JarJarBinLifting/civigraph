'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);
  return <dialog className="modal" ref={dialog} onCancel={onClose} aria-label={title} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Fermer la fenêtre" onClick={onClose}><X size={20} /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}
