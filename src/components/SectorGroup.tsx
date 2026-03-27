'use client';

import React, { useState } from 'react';
import PortfolioTable, { StockData } from './PortfolioTable';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

interface SectorGroupProps {
  sectorName: string;
  data: StockData[];
  onRemove?: (symbol: string) => void;
}

const SectorGroup = React.memo(function SectorGroup({ sectorName, data, onRemove }: SectorGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalInvestment = data.reduce((acc, stock) => acc + stock.investment, 0);
  const totalPresentValue = data.reduce((acc, stock) => acc + stock.presentValue, 0);
  const totalGainLoss = data.reduce((acc, stock) => acc + stock.gainLoss, 0);

  const gainLossColor = totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400';
  const gainLossSign = totalGainLoss > 0 ? '+' : '';

  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between bg-slate-800/80 p-5 rounded-t-xl cursor-pointer border border-slate-700 hover:bg-slate-800 transition-colors shadow-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold text-white tracking-wide">{sectorName}</span>
          <span className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 font-medium">
            {data.length} Assets
          </span>
        </div>
        <div className="flex divide-x divide-slate-600/50 items-center">
          <div className="px-6 text-sm text-right hidden sm:block">
            <p className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-0.5">Total Inv.</p>
            <p className="font-semibold text-white text-base">{formatCurrency(totalInvestment)}</p>
          </div>
          <div className="px-6 text-sm text-right hidden sm:block">
            <p className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-0.5">Curr. Val.</p>
            <p className="font-semibold text-white text-base">{formatCurrency(totalPresentValue)}</p>
          </div>
          <div className="px-6 text-sm text-right">
            <p className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-0.5">Return</p>
            <p className={`font-bold text-base ${gainLossColor}`}>{gainLossSign}{formatCurrency(totalGainLoss)}</p>
          </div>
          <div className="pl-6 flex items-center justify-center">
            <div className={`transform transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border border-t-0 border-slate-700 rounded-b-xl overflow-hidden shadow-xl">
          <PortfolioTable data={data} onRemove={onRemove} />
        </div>
      )}
    </div>
  );
});

export default SectorGroup;
