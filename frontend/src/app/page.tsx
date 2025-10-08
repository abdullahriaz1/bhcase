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
      const response = await fetch('http://localhost:8000/prices').catch(() => null);
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
      const response = await fetch(
        `http://localhost:8000/price-history-paginated?site=${encodeURIComponent(site)}&offset=${offset}&limit=${recordsPerPage}`
      ).catch(() => null);
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

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">SKU Price Tracker</h1>
        <button
          onClick={fetchPrices}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.name} className="border rounded-lg p-4">
            <p className="font-bold text-lg">{product.productName || 'Product Loading'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {product.name}
              {product.url ? (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  ↗
                </a>
              ) : (
                <span className="text-gray-400 cursor-not-allowed">↗</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-lg font-bold">{product.currency || '$'}{product.price.toFixed(2)}</p>
              <button
                onClick={() => {
                  setSelectedProduct(product.name);
                  setCurrentPage(0);
                  fetchPriceHistory(product.name, 0);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Price History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Price History - {selectedProduct}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage)}
                  disabled={isLoadingHistory}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoadingHistory ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="text-gray-600">
              {isLoadingHistory ? (
                <p>Loading price history...</p>
              ) : priceHistory.length > 0 ? (
                <>
                  <div className="space-y-2 mb-4">
                    {priceHistory.map((record, index: number) => (
                      <div key={index} className="flex justify-between border-b pb-2">
                        <span>{new Date(record.timestamp).toLocaleString()}</span>
                        <span className="font-semibold">{record.currency}{record.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 ">
                    <div className="text-sm text-gray-600">
                      Showing {currentPage * recordsPerPage + 1} - {Math.min((currentPage + 1) * recordsPerPage, totalRecords)} of {totalRecords}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage - 1)}
                        disabled={currentPage === 0 || isLoadingHistory}
                        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => selectedProduct && fetchPriceHistory(selectedProduct, currentPage + 1)}
                        disabled={!hasMore || isLoadingHistory}
                        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p>No price history available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
