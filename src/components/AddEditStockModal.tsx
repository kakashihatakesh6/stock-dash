'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PortfolioEntry } from '../hooks/useLocalPortfolio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Props {
  initial?: PortfolioEntry;
  existingSymbols: string[];
  onSave: (entry: PortfolioEntry) => void;
  onClose: () => void;
}

export default function AddEditStockModal({ initial, existingSymbols, onSave, onClose }: Props) {
  const isEdit = !!initial;
  const [symbol,   setSymbol]   = useState(initial?.symbol   || '');
  const [name,     setName]     = useState(initial?.name     || '');
  const [sector,   setSector]   = useState(initial?.sector   || '');
  const [exchange, setExchange] = useState(initial?.exchange || '');
  const [buyPrice, setBuyPrice] = useState(initial?.buyPrice?.toString() || '');
  const [qty,      setQty]      = useState(initial?.qty?.toString()      || '');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Auto-fill name/sector/exchange when user types a symbol
  useEffect(() => {
    if (isEdit || !symbol || symbol.length < 2) return;
    const sym = symbol.toUpperCase();
    axios.get(`${API_BASE_URL}/portfolio/meta/${sym}`)
      .then(r => {
        const d = r.data?.data;
        if (d) {
          if (!name)     setName(d.name);
          if (!sector)   setSector(d.sector);
          if (!exchange) setExchange(d.exchange);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sym = symbol.trim().toUpperCase();
    if (!sym || !buyPrice || !qty) { setError('All fields are required'); return; }
    if (!isEdit && existingSymbols.includes(sym)) { setError(`${sym} is already in your portfolio`); return; }
    if (Number(buyPrice) <= 0 || Number(qty) <= 0) { setError('Price and quantity must be positive'); return; }

    setLoading(true);
    try {
      // Validate symbol has a live price
      const meta = await axios.get(`${API_BASE_URL}/portfolio/meta/${sym}`);
      onSave({
        symbol: sym,
        name:     name.trim()     || meta.data?.data?.name     || sym,
        sector:   sector.trim()   || meta.data?.data?.sector   || 'Other',
        exchange: exchange.trim() || meta.data?.data?.exchange || 'N/A',
        buyPrice: Number(buyPrice),
        qty:      Number(qty),
      });
      onClose();
    } catch {
      setError('Failed to verify symbol. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isEdit ? `Edit ${initial?.symbol}` : 'Add Stock to Portfolio'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {error && <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Symbol *</label>
              <input
                disabled={isEdit}
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white uppercase disabled:opacity-50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Exchange</label>
              <input value={exchange} onChange={e => setExchange(e.target.value)} placeholder="NASDAQ"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Apple Inc."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Sector</label>
            <input value={sector} onChange={e => setSector(e.target.value)} placeholder="Technology"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Buy Price ($) *</label>
              <input type="number" step="0.01" min="0" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                placeholder="150.00"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Quantity *</label>
              <input type="number" step="1" min="1" value={qty} onChange={e => setQty(e.target.value)}
                placeholder="10"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-2.5 rounded-lg font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50">
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
