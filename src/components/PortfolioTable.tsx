'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
  exchange: string;
  cmp: number;
  change: number;
  changePct: string;
  prevClose: number | string;
  volume: string;
  peRatio: number | string;
  earnings: string;
  investment: number;
  presentValue: number;
  gainLoss: number;
  portfolioPercent: number;
}

interface PortfolioTableProps {
  data: StockData[];
  onRemove?: (symbol: string) => void;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const columnHelper = createColumnHelper<StockData>();

const PortfolioTable = React.memo(function PortfolioTable({ data, onRemove }: PortfolioTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Particulars',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-semibold text-white">{info.getValue()}</span>
            <span className="text-xs text-slate-400">{info.row.original.symbol} · {info.row.original.exchange}</span>
          </div>
        ),
      }),
      columnHelper.accessor('purchasePrice', {
        header: 'Buy Price',
        cell: info => fmt(info.getValue()),
      }),
      columnHelper.accessor('quantity', {
        header: 'Qty',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('investment', {
        header: 'Investment',
        cell: info => <span className="text-slate-200">{fmt(info.getValue())}</span>,
      }),
      columnHelper.accessor('portfolioPercent', {
        header: 'Weight',
        cell: info => `${info.getValue().toFixed(2)}%`,
      }),
      columnHelper.accessor('cmp', {
        header: 'CMP',
        cell: info => {
          const row = info.row.original;
          const isUp = row.change >= 0;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-white">{fmt(info.getValue())}</span>
              <span className={`text-xs ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'} {row.changePct}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('presentValue', {
        header: 'Present Value',
        cell: info => fmt(info.getValue()),
      }),
      columnHelper.accessor('gainLoss', {
        header: 'Gain / Loss',
        cell: info => {
          const val = Number(info.getValue()) || 0;
          const color = val >= 0 ? 'text-emerald-400' : 'text-red-400';
          const sign = val > 0 ? '+' : '';
          return <span className={`font-semibold ${color}`}>{sign}{fmt(val)}</span>;
        },
      }),
      columnHelper.accessor('volume', {
        header: 'Volume',
        cell: info => <span className="text-slate-400 text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('peRatio', {
        header: 'P/E',
        cell: info => <span className="text-slate-300">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <button
            onClick={() => onRemove && onRemove(info.row.original.symbol)}
            className="text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 text-xs font-semibold"
          >
            Remove
          </button>
        ),
      }),
    ],
    [onRemove]
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto bg-slate-800/50 backdrop-blur-md">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 sticky top-0 z-10 shadow-md">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-5 py-4 font-semibold tracking-wider whitespace-nowrap">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-5 py-3.5 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default PortfolioTable;
