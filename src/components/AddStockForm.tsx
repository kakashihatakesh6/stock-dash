'use client';

import React, { useState } from 'react';
import { addStock } from '../lib/api';

interface AddStockFormProps {
  onSuccess: () => void;
}

export default function AddStockForm({ onSuccess }: AddStockFormProps) {
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price || !quantity) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      await addStock({
        symbol: symbol.toUpperCase(),
        purchasePrice: Number(price),
        quantity: Number(quantity)
      });
      setSymbol('');
      setPrice('');
      setQuantity('');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-8 max-w-4xl mx-auto backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-4">Add Asset to Portfolio</h3>
      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Symbol</label>
          <input 
            type="text" 
            placeholder="e.g. AAPL" 
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase transition-all"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Avg Buy Price</label>
          <input 
            type="number" 
            step="0.01"
            placeholder="150.00" 
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Quantity</label>
          <input 
            type="number" 
            step="1"
            placeholder="10" 
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-2.5 rounded-lg font-semibold transition-all shadow-lg space-x-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm h-[42px]"
        >
          {loading ? 'Adding...' : 'Add Asset'}
        </button>
      </form>
    </div>
  );
}
