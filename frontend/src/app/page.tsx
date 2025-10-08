'use client';

import { useEffect, useState } from 'react';

type Product = {
  name: string;
  priceText: string;
  url: string;
  productName?: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([
    { name: 'Katom', priceText: '$0.00', url: '', productName: 'Product Loading' },
    { name: 'WebstaurantStore', priceText: '$0.00', url: '', productName: 'Product Loading' },
    { name: 'RestaurantSupply', priceText: '$0.00', url: '', productName: 'Product Loading' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPrices = async () => {
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
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 4_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Price Tracker</h1>
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
            <p className="text-lg font-bold mt-2">{product.priceText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
