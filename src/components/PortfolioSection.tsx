'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useLocalPortfolio, PortfolioEntry } from '../hooks/useLocalPortfolio';
import AddEditStockModal from './AddEditStockModal';
import AllocationChart from './AllocationChart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

interface EnrichedStock {
  symbol: string; name: string; sector: string; exchange: string;
  purchasePrice: number; quantity: number;
  cmp: number; change: number; changePct: string;
  investment: number; presentValue: number; gainLoss: number; portfolioPercent: number;
  peRatio: string; earnings: string;
}

interface Summary {
  totalInvestment: number; totalPresentValue: number;
  totalGainLoss: number; totalReturnPct: number;
}

// ── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Sector Group Row ────────────────────────────────────────────────────────
function SectorAccordion({ sector, stocks, onEdit, onDelete }: {
  sector: string; stocks: EnrichedStock[];
  onEdit: (s: EnrichedStock) => void; onDelete: (sym: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const inv   = stocks.reduce((s, x) => s + x.investment, 0);
  const val   = stocks.reduce((s, x) => s + x.presentValue, 0);
  const gl    = val - inv;
  const isUp  = gl >= 0;

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/60">
      {/* Sector header */}
      <div onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between bg-slate-800/80 px-5 py-4 cursor-pointer hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">{sector}</span>
          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
            {stocks.length} stocks
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-xs">Invested</p>
            <p className="text-white font-medium">{fmt(inv)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-xs">Value</p>
            <p className="text-white font-medium">{fmt(val)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Return</p>
            <p className={`font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(gl)}</p>
          </div>
          <span className={`text-slate-400 text-xs transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        </div>
      </div>

      {/* Stock rows */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                {['Stock','Buy Price','Qty','Investment','Weight','CMP','Present Value','Gain/Loss','P/E','Actions']
                  .map(h => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stocks.map(s => {
                const isGain = s.gainLoss >= 0;
                const isUp   = s.change >= 0;
                return (
                  <tr key={s.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.symbol} · {s.exchange}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(s.purchasePrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">{fmt(s.investment)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">{s.portfolioPercent.toFixed(2)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-white">{s.cmp > 0 ? fmt(s.cmp) : '—'}</div>
                      <div className={`text-xs ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '▲' : '▼'} {s.changePct}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.cmp > 0 ? fmt(s.presentValue) : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-semibold ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isGain ? '+' : ''}{fmt(s.gainLoss)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">{s.peRatio}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(s)}
                          className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => onDelete(s.symbol)}
                          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Portfolio Section ──────────────────────────────────────────────────
export default function PortfolioSection() {
  const { entries, addEntry, editEntry, removeEntry } = useLocalPortfolio();
  const [enriched, setEnriched]   = useState<EnrichedStock[]>([]);
  const [summary,  setSummary]    = useState<Summary | null>(null);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState('');
  const [modal,    setModal]      = useState<'add' | PortfolioEntry | null>(null);
  const [search,   setSearch]     = useState('');
  const [filterSector, setFilterSector] = useState('All');
  const [filterGL,     setFilterGL]     = useState<'all' | 'gain' | 'loss'>('all');

  // Fetch enriched data whenever entries change
  const fetchEnriched = useCallback(async () => {
    if (entries.length === 0) { setEnriched([]); setSummary(null); return; }
    setLoading(true); setError('');
    try {
      const payload = entries.map(e => ({ symbol: e.symbol, buyPrice: e.buyPrice, qty: e.qty, name: e.name, sector: e.sector, exchange: e.exchange }));
      const res = await axios.post(`${API_BASE_URL}/portfolio/enrich`, payload);
      setEnriched(res.data.data);
      setSummary(res.data.summary);
    } catch {
      setError('Failed to load portfolio data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [entries]);

  useEffect(() => { fetchEnriched(); }, [fetchEnriched]);

  // Filtering
  const sectors = useMemo(() => ['All', ...Array.from(new Set(enriched.map(e => e.sector)))], [enriched]);

  const filtered = useMemo(() => enriched.filter(e => {
    const matchSearch = !search || e.symbol.includes(search.toUpperCase()) || e.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = filterSector === 'All' || e.sector === filterSector;
    const matchGL = filterGL === 'all' || (filterGL === 'gain' ? e.gainLoss >= 0 : e.gainLoss < 0);
    return matchSearch && matchSector && matchGL;
  }), [enriched, search, filterSector, filterGL]);

  // Group by sector
  const bySector = useMemo(() => {
    const map: Record<string, EnrichedStock[]> = {};
    filtered.forEach(s => { (map[s.sector] ??= []).push(s); });
    return map;
  }, [filtered]);

  const handleEdit = (s: EnrichedStock) => {
    setModal({ symbol: s.symbol, name: s.name, sector: s.sector, exchange: s.exchange, buyPrice: s.purchasePrice, qty: s.quantity });
  };
  const handleDelete = (sym: string) => { removeEntry(sym); };
  const handleSave = (entry: PortfolioEntry) => {
    if (typeof modal === 'object' && modal !== null && (modal as PortfolioEntry).symbol) {
      editEntry(entry.symbol, entry);
    } else {
      addEntry(entry);
    }
  };

  const isGain = (summary?.totalGainLoss ?? 0) >= 0;
  const totalRet = summary?.totalReturnPct ?? 0;

  return (
    <section className="mt-12 pt-10 border-t border-slate-800">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white">My Portfolio</h2>
          <p className="text-slate-500 text-sm mt-1">Track your investments with real-time P&amp;L calculations</p>
        </div>
        <button onClick={() => setModal('add')}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
          + Add Stock
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchEnriched} className="ml-auto text-xs underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-400 text-lg mb-2">No holdings yet</p>
          <p className="text-slate-600 text-sm mb-6">Add your first stock to start tracking your portfolio P&amp;L</p>
          <button onClick={() => setModal('add')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all">
            Add First Stock
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {loading && entries.length > 0 && (
        <div className="flex items-center gap-3 text-slate-400 text-sm mb-6">
          <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
          Fetching live prices…
        </div>
      )}

      {/* Summary Cards */}
      {summary && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total Investment"   value={fmt(summary.totalInvestment)}   color="text-white" />
          <SummaryCard label="Present Value"      value={fmt(summary.totalPresentValue)} color="text-white" />
          <SummaryCard
            label="Total Gain / Loss"
            value={`${isGain ? '+' : ''}${fmt(summary.totalGainLoss)}`}
            sub={fmtPct(totalRet)}
            color={isGain ? 'text-emerald-400' : 'text-red-400'}
          />
          <SummaryCard
            label="Return %"
            value={fmtPct(totalRet)}
            color={isGain ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      )}

      {/* Charts + Filters row */}
      {enriched.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Allocation Chart */}
          <div className="lg:col-span-1">
            <AllocationChart data={enriched} />
          </div>

          {/* Search & Filters */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">🔍 Search & Filter</h3>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by symbol or name…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
            <div className="flex flex-wrap gap-3">
              {/* Sector filter */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Sector</label>
                <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Gain/Loss filter */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Profit / Loss</label>
                <select value={filterGL} onChange={e => setFilterGL(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option value="all">All</option>
                  <option value="gain">In Profit</option>
                  <option value="loss">In Loss</option>
                </select>
              </div>
              {/* Reset */}
              <div className="flex items-end">
                <button onClick={() => { setSearch(''); setFilterSector('All'); setFilterGL('all'); }}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-lg transition-all">
                  Reset
                </button>
              </div>
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-auto pt-2">
              {[
                { label: 'Showing',  value: filtered.length, color: 'text-white' },
                { label: 'Gainers',  value: filtered.filter(e => e.gainLoss >= 0).length, color: 'text-emerald-400' },
                { label: 'Losers',   value: filtered.filter(e => e.gainLoss < 0).length,  color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sector-grouped table */}
      {Object.keys(bySector).length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Holdings by Sector</h3>
            <button onClick={fetchEnriched}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-all">
              ↻ Refresh Prices
            </button>
          </div>
          {Object.entries(bySector).map(([sector, stocks]) => (
            <SectorAccordion key={sector} sector={sector} stocks={stocks} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <AddEditStockModal
          initial={typeof modal === 'object' ? modal : undefined}
          existingSymbols={entries.map(e => e.symbol)}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
