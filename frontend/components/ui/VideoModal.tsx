'use client';

import { useEffect, useId, useRef, type RefObject } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import messages from './videoModal.messages.json';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export default function VideoModal(props: VideoModalProps) {
  return <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota"><VideoDialog {...props} /></NextIntlClientProvider>;
}

function VideoDialog({ isOpen, onClose, videoSrc, title, returnFocusRef }: VideoModalProps) {
  const t = useTranslations('VideoModal');
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const video = videoRef.current;
    const previousFocus = returnFocusRef?.current ?? document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    // Autoplay can be blocked; the native player remains available to the user.
    void video?.play().catch(() => {});
    return () => {
      video?.pause();
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen, returnFocusRef]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none bg-transparent p-4 text-white backdrop:bg-black/90 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
      onKeyDown={(event) => {
        if (event.key === 'Tab' && event.shiftKey && document.activeElement === closeRef.current) {
          event.preventDefault();
          videoRef.current?.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-full w-full max-w-[420px] flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h3 id={titleId} className={title ? 'min-w-0 text-lg font-medium' : 'sr-only'}>
            {title || t('title')}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center text-white/80 transition-colors hover:text-white"
            aria-label={t('close')}
          >
            <XMarkIcon className="h-8 w-8" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto rounded-3xl bg-black shadow-2xl">
          <video
            ref={videoRef}
            tabIndex={0}
            controls
            autoPlay
            playsInline
            aria-label={title || t('title')}
            className="h-auto max-h-[calc(100dvh-6rem)] w-full object-contain"
          >
            <source data-testid="video-webm-source" src={videoSrc} type="video/webm" />
            <source src={videoSrc.replace('.webm', '.mp4')} type="video/mp4" />
            {t('unsupported')}
          </video>
        </div>
      </div>
    </dialog>
  );
}
