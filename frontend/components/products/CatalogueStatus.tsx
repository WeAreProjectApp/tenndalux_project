'use client';

import { useTranslations } from 'next-intl';

type Props = { loading: boolean; error: boolean; empty: boolean; onRetry: () => void };

export default function CatalogueStatus({ loading, error, empty, onRetry }: Props) {
  const t = useTranslations('productCatalogue');
  if (loading) return <p role="status" className="py-8 text-center text-stone-600">{t('loading')}</p>;
  if (error) return (
    <div role="alert" className="py-8 text-center text-stone-600">
      <p>{t('error')}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-full border border-stone-300 px-6 py-3">
        {t('retry')}
      </button>
    </div>
  );
  if (empty) return <p role="status" className="py-8 text-center text-stone-600">{t('empty')}</p>;
  return null;
}
