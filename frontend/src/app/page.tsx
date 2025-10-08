'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

type Product = {
  name: string;
  price: number;
  currency?: string;
  url: string;
  productName?: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([
    { name: 'Burkett', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
    { name: 'WebstaurantStore', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
    { name: 'RestaurantSupply', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchPrices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:8000/prices');
      const data = await response.json();
      setProducts(data.sites);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchPriceHistory = useCallback(async (site: string) => {
    setIsLoadingHistory(true);
    try {
      const limit = 10;
      const response = await fetch(
        `http://localhost:8000/price-history?site=${encodeURIComponent(site)}&limit=${limit}`
      );
      const data = await response.json();
      setPriceHistory(data.priceHistory || []);
    } catch (error) {
      console.error('Error fetching price history:', error);
      setPriceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const cheapest = useMemo(() => {
    if (!products?.length) return null;
    const nonZero = products.filter(p => Number.isFinite(p.price) && p.price > 0);
    if (!nonZero.length) return null;
    return nonZero.reduce((min, p) => (p.price < min.price ? p : min), nonZero[0]);
  }, [products]);

  const openHistory = (site: string) => {
    setSelectedProduct(site);
    fetchPriceHistory(site);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center text-sm font-semibold">PT</div>
            <div>
              <h1 className="text-xl font-semibold">SKU Price Tracker</h1>
              <p className="text-xs text-slate-500">Auto-refreshes every 30s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                isRefreshing ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
              aria-live="polite"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isRefreshing ? 'Refreshing' : 'Live'}
            </span>
            <button
              onClick={fetchPrices}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? <Spinner className="h-4 w-4" /> : <IconRefresh className="h-4 w-4" />}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.name}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md`}
            >
              {/* Top ribbon if cheapest */}
              {cheapest?.name === product.name && (
                <div className="absolute right-3 top-3 z-10 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow">
                  Lowest
                </div>
              )}

              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">
                      {product.productName || 'Product Loading'}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <VendorBadge name={product.name} />
                      {product.url ? (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                          title="Open product page"
                        >
                          <IconExternal className="h-3.5 w-3.5" />
                          <span className="sr-only">Open external</span>
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-400"
                          aria-disabled="true"
                        >
                          <IconExternal className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums tracking-tight">
                      {(product.currency || '$')}{Number.isFinite(product.price) ? product.price.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-slate-500">Current price</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => openHistory(product.name)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    <IconChart className="h-4 w-4" />
                    Price history
                  </button>

                  <div
                    className={`text-xs ${
                      cheapest?.name === product.name ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {cheapest?.name === product.name ? 'Best offer right now' : '—'}
                  </div>
                </div>
              </div>

              {/* subtle hover bg */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-50/40 to-slate-100/60" />
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onClick={() => setSelectedProduct(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold">Price History</h3>
                <p className="text-xs text-slate-500">{selectedProduct}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedProduct && fetchPriceHistory(selectedProduct)}
                  disabled={isLoadingHistory}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingHistory ? <Spinner className="h-4 w-4" /> : <IconRefresh className="h-4 w-4" />}
                  {isLoadingHistory ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto px-5 py-4">
              {isLoadingHistory ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : priceHistory.length > 0 ? (
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-2 font-medium">Timestamp</th>
                        <th className="px-4 py-2 font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((record: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 font-semibold tabular-nums">
                            {(record.currency ?? '$')}{Number(record.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No price history available.</p>
              )}
            </div>

            <div className="border-t px-5 py-3 text-right text-xs text-slate-500">
              Prices update continuously; history shows the most recent {Math.max(priceHistory.length, 0)} records.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI bits (no external deps) ---------- */

function VendorBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
        {name?.[0]?.toUpperCase() || '?'}
      </span>
      {name}
    </span>
  );
}


function SkeletonRow() {
  return (
    <div className="flex justify-between rounded-lg border p-3">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 10-2.34 5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 8v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconExternal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 14.5l5.8-5.8M12.5 8.7h4.8v4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 13.5V18a2 2 0 01-2 2h-9a2 2 0 01-2-2v-9a2 2 0 012-2h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V6M10 20V10M16 20v-8M22 20H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
