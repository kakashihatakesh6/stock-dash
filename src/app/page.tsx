'use client';

import React, { useState, useCallback } from 'react';
import { usePortfolio, LiveQuote } from '../hooks/usePortfolio';
import PortfolioSection from '../components/PortfolioSection';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

// ── Stock card ─────────────────────────────────────────────────────────────
const StockCard = React.memo(function StockCard({ quote }: { quote: LiveQuote }) {
  const isUp = quote.change >= 0;
  return (
    <div className={`bg-slate-900/60 border ${isUp ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-red-500/20 hover:border-red-500/40'} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${isUp ? 'from-emerald-500/5' : 'from-red-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-lg font-extrabold text-white tracking-tight">{quote.symbol}</span>
          <div className={`inline-flex ml-3 items-center px-2 py-0.5 text-xs font-semibold rounded-full ${isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {isUp ? '▲' : '▼'} {quote.changePct}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${isUp ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isUp ? '📈' : '📉'}
        </div>
      </div>

      {/* Price */}
      <p className="text-3xl font-bold text-white mb-4 tracking-tight">
        {quote.cmp > 0 ? fmt(quote.cmp) : <span className="text-slate-500 text-xl">Loading…</span>}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-800/60 rounded-lg p-2.5">
          <p className="text-slate-500 uppercase tracking-wider mb-1">Daily Change</p>
          <p className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{fmt(quote.change)}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-2.5">
          <p className="text-slate-500 uppercase tracking-wider mb-1">Prev Close</p>
          <p className="font-semibold text-slate-200">
            {typeof quote.prevClose === 'number' ? fmt(quote.prevClose) : quote.prevClose}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-2.5 col-span-2">
          <p className="text-slate-500 uppercase tracking-wider mb-1">Volume</p>
          <p className="font-semibold text-slate-200">{quote.volume}</p>
        </div>
      </div>
    </div>
  );
});

// ── Add symbol form ────────────────────────────────────────────────────────
function AddSymbolForm({ onSuccess }: { onSuccess: () => void }) {
  const [sym, setSym] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sym.trim()) return;
    setErr(''); setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/portfolio/symbol`, { symbol: sym.trim() });
      setSym('');
      onSuccess();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to add symbol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Add Symbol</label>
        <input
          type="text"
          placeholder="e.g. TSLA"
          value={sym}
          onChange={e => setSym(e.target.value.toUpperCase())}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase w-36 transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-all uppercase tracking-wide"
      >
        {loading ? '…' : 'Track'}
      </button>
      {err && <span className="text-red-400 text-xs">{err}</span>}
    </form>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data, loading, error, lastRefreshed, refetch } = usePortfolio();
  const quotes: LiveQuote[] = data?.data ?? [];

  // Summary stats
  const avgChange = quotes.length
    ? quotes.reduce((s, q) => s + q.change, 0) / quotes.length
    : 0;
  const gainers  = quotes.filter(q => q.change > 0).length;
  const losers   = quotes.filter(q => q.change < 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090e17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-blue-400 font-medium tracking-wide">Fetching live prices from Alpha Vantage…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-200 font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              Live Stock Prices
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Powered by Alpha Vantage · Last updated:{' '}
              <span className="text-slate-300">{lastRefreshed ? lastRefreshed.toLocaleTimeString() : '…'}</span>
              {' '}· Auto-refresh every 10m
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {error && (
              <span className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 flex items-center gap-2">
                ⚠️ {error}
              </span>
            )}
            <AddSymbolForm onSuccess={refetch} />
            <button
              onClick={refetch}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all uppercase tracking-wide"
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Stocks Tracked', value: quotes.length, color: 'text-white' },
            { label: 'Gainers Today',  value: gainers, color: 'text-emerald-400' },
            { label: 'Losers Today',   value: losers,  color: 'text-red-400' },
            {
              label: 'Avg Daily Move',
              value: `${avgChange >= 0 ? '+' : ''}${fmt(avgChange)}`,
              color: avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Stock grid */}
        {quotes.length === 0 && !loading ? (
          <div className="text-center py-24 bg-slate-900/30 border border-slate-800 rounded-2xl border-dashed">
            <div className="text-5xl mb-4">📡</div>
            <p className="text-slate-400 text-lg">No stock data available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {quotes.map(q => <StockCard key={q.symbol} quote={q} />)}
          </div>
        )}

        {/* ── My Portfolio Section (additive) ─────────────────────────────── */}
        <PortfolioSection />

      </div>
    </div>
  );
}

