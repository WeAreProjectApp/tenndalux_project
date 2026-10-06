'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { listWarrantyDocuments, type WarrantyDocument } from '@/lib/services/site';
import { mediaUrl } from '@/lib/services/content';
import messages from '@/messages/es.json';

export default function WarrantyDocuments() {
  return (
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota">
      <Documents />
    </NextIntlClientProvider>
  );
}

function Documents() {
  const t = useTranslations('warranties');
  const [documents, setDocuments] = useState<WarrantyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    listWarrantyDocuments().then((items) => {
      if (active) setDocuments(items);
    }).catch(() => {
      if (active) setFailed(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-40 sm:px-8">
      <h1 className="mb-6 text-4xl font-semibold text-stone-900">{t('title')}</h1>
      <p className="mb-10 text-stone-600">{t('intro')}</p>
      <a
        href="/legal/politica-de-garantia.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-8 inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-5 py-3 text-stone-900 underline"
      >
        {t('policy')}
      </a>
      {loading && <p role="status">{t('loading')}</p>}
      {failed && (
        <div role="alert" className="space-y-4 text-stone-700">
          <p>{t('error')}</p>
          <button type="button" onClick={retry} className="min-h-11 rounded-lg bg-stone-900 px-5 py-3 text-white">
            {t('retry')}
          </button>
        </div>
      )}
      {!loading && !failed && documents.length === 0 && <p>{t('empty')}</p>}
      <ul className="space-y-4">
        {documents.map((document) => (
          <li key={document.id} className="rounded-lg border border-stone-200 bg-white p-5">
            <a
              href={mediaUrl(document.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center break-words text-stone-900 underline"
            >
              {t('download', { title: document.title })}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
