'use client';

import { useEffect, useState } from 'react';

type Product = {
  name: string;
  price: number;
  currency?: string;
  url: string;
  productName?: string;
};

type PriceHistoryRecord = {
  timestamp: string;
  price: number;
  currency: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([
    { name: 'Burkett', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
    { name: 'WebstaurantStore', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
    { name: 'RestaurantSupply', price: 0.0, currency: '$', url: '', productName: 'Product Loading' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const recordsPerPage = 10;

  const fetchPrices = async () => {
    setIsRefreshing(true);
    try {
      const url = '/api/prices';
      const response = await fetch(url).catch((error) => {
        console.error('Fetch error:', error);
        return null;
      });
      if (!response) {
        console.warn('Unable to connect to API server');
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data.sites);
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Silently fail - keep existing data
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPriceHistory = async (site: string, page = 0) => {
    setIsLoadingHistory(true);
    try {
      const offset = page * recordsPerPage;
      const url = `/api/price-history-paginated?site=${encodeURIComponent(site)}&offset=${offset}&limit=${recordsPerPage}`;
      const response = await fetch(url).catch((error) => {
        console.error('Fetch error:', error);
        return null;
      });
      if (!response) {
        console.warn('Unable to connect to API server');
        setPriceHistory([]);
        setTotalRecords(0);
        setHasMore(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPriceHistory(data.data || []);
      setTotalRecords(data.total || 0);
      setHasMore(data.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching price history:', error);
      // Silently fail - show empty state
      setPriceHistory([]);
      setTotalRecords(0);
      setHasMore(false);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5_000);
    return () => clearInterval(interval);
  }, []);

  const Spinner = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );

  const ArrowTopRight = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M10 7h7v7" />
    </svg>
  );

  const XIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );

  const SkeletonCard = () => (
    <div className="rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm">
      <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );

  const EmptyIcon = ({ className = 'h-10 w-10 text-gray-300' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              $ 
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">SKU Price Tracker</h1>
            <span className="ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
              live
            </span>
          </div>
          <button
            onClick={fetchPrices}
            disabled={isRefreshing}
            className="group inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
          >
            {isRefreshing ? <Spinner /> : null}
            <span className="translate-y-px">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Show skeletons while the very first refresh is happening and placeholders are present */}
          {isRefreshing && products.every(p => p.price === 0) ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.name}
                className="group relative rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="h-50 text-lg font-semibold text-slate-800">
                    {product.productName || 'Product Loading'}
                  </p>
                  
                </div>
                
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {product.name}
                  </span>
                  {product.url ? (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
                      title="Open product page"
                    >
                      <ArrowTopRight />
                      <span className="sr-only">Open</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-300" title="No link available">
                      <ArrowTopRight />
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {(product.currency || '$')}
                    {Number.isFinite(product.price) ? product.price.toFixed(2) : '—'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProduct(product.name);
                      setCurrentPage(0);
                      fetchPriceHistory(product.name, 0);
                    }}
                    className="text-sm font-medium text-blue-700 underline underline-offset-4 transition hover:text-blue-900"
                  >
                    Price history
                  </button>
                </div>

                {/* subtle bottom border accent on hover */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <EmptyIcon />
                <p className="mt-3 text-sm text-slate-600">No products found.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
          aria-modal="true"
          role="dialog"
          aria-label={`Price history for ${selectedProduct}`}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Price History
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {selectedProduct}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage)}
                  disabled={isLoadingHistory}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
                >
                  {isLoadingHistory ? <Spinner /> : null}
                  {isLoadingHistory ? 'Loading…' : 'Refresh'}
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                  title="Close"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                      <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : priceHistory.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {priceHistory.map((record, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 text-sm">
                        <span className="text-slate-600">
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {record.currency}
                          {Number.isFinite(record.price) ? record.price.toFixed(2) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <EmptyIcon />
                  <p className="mt-3 text-sm text-slate-600">No price history available.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t bg-slate-50/60 px-5 py-3">
              <div className="text-xs text-slate-600">
                {totalRecords > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-medium">
                      {currentPage * recordsPerPage + 1} – {Math.min((currentPage + 1) * recordsPerPage, totalRecords)}
                    </span>{' '}
                    of <span className="font-medium">{totalRecords}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage - 1)}
                  disabled={currentPage === 0 || isLoadingHistory}
                  className="rounded-lg border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage + 1)}
                  disabled={!hasMore || isLoadingHistory}
                  className="rounded-lg border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
