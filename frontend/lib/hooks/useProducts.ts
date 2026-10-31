'use client';

import { useEffect, useState } from 'react';
import { listProducts, type Product } from '@/lib/services/products';

/** Each visit reads the admin's saved values; failed reads can be retried. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = () => {
    setError(false);
    setLoading(true);
    setAttempt((previous) => previous + 1);
  };

  return { products, loading, error, retry };
}
