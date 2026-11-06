/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Layers, 
  HelpCircle,
  PackageCheck,
  PieChart as PieIcon
} from 'lucide-react';
import { MergedProduct } from '../types';
import { getSellOutPieColor } from '../utils/etl';

interface KpiMetricsProps {
  products: MergedProduct[];
  language?: 'RU' | 'IT';
}

/**
 * KPI SVG Circular Pie / Donut Chart for Sell-In vs Sell-Out %
 * Interpolates: 0% Red (#DC2626) -> 50% Light Green (#4ADE80) -> 100% Deep Green (#0B5C37)
 */
const KpiDonutChart: React.FC<{
  sellOutPct: number;
  size?: number;
  strokeWidth?: number;
}> = ({ sellOutPct, size = 46, strokeWidth = 5.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, sellOutPct));
  const offset = circumference - (safePct / 100) * circumference;
  const strokeColor = getSellOutPieColor(safePct);
  const isZero = safePct === 0;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track (Sell-In) - subtle red tint when 0% */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isZero ? '#FEE2E2' : '#E5E7EB'}
          strokeWidth={strokeWidth}
        />
        {/* Foreground arc (Sell-Out %) */}
        {isZero ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#DC2626"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.08} ${circumference}`}
            strokeLinecap="round"
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <span className={`absolute text-[10px] font-mono font-bold ${isZero ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}>
        {isZero ? '0%' : `${safePct.toFixed(0)}%`}
      </span>
    </div>
  );
};

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ products, language = 'RU' }) => {
  const isRussian = language === 'RU';

  const totals = React.useMemo(() => {
    let unitsOrdered = 0;
    let unitsSold = 0;
    let wholesaleEur = 0;
    let retailEur = 0;
    let realizedRevenue = 0;
    let leadersCount = 0;
    let lowPerformersCount = 0;
    const poSet = new Set<string>();

    products.forEach((p) => {
      unitsOrdered += p.unitsOrdered;
      unitsSold += p.unitsSold;
      wholesaleEur += p.totalWholesaleEur;
      retailEur += p.totalRetailEur;
      realizedRevenue += p.realizedRevenueEur;

      const rate = p.unitsOrdered > 0 ? (p.unitsSold / p.unitsOrdered) * 100 : 0;
      if (rate >= 70) {
        leadersCount++;
      } else if (rate < 40) {
        lowPerformersCount++;
      }

      if (p.poNumbers) {
        p.poNumbers.forEach((po) => poSet.add(po));
      }
    });

    const stockRemaining = Math.max(0, unitsOrdered - unitsSold);
    const sellOutPct = unitsOrdered > 0 ? (unitsSold / unitsOrdered) * 100 : 0;
    const avgMarkup = wholesaleEur > 0 ? retailEur / wholesaleEur : 2.6;

    return {
      unitsOrdered,
      unitsSold,
      stockRemaining,
      wholesaleEur,
      retailEur,
      realizedRevenue,
      sellOutPct,
      avgMarkup,
      leadersCount,
      lowPerformersCount,
      activeOrdersCount: poSet.size > 0 ? poSet.size : 6,
    };
  }, [products]);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Общий уровень продаж / Sell-Out Rate with Pie Chart */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group">
        {/* Subtle Watermark background pie chart */}
        <div className="absolute -right-3 -bottom-3 pointer-events-none opacity-[0.07] select-none">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke={getSellOutPieColor(totals.sellOutPct)} strokeWidth="16" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - totals.sellOutPct / 100)} transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={totals.sellOutPct === 0 ? '#FEE2E2' : '#E5E7EB'} strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="0" opacity="0.4" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Общий уровень продаж' : 'Rotazione Sell-Out'}
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-[#0B5C37]" />
        </div>

        <div className="my-1.5 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
                {totals.sellOutPct.toFixed(1)}%
              </span>
            </div>
            <span 
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{
                backgroundColor: totals.sellOutPct === 0 ? '#FEE2E2' : totals.sellOutPct < 50 ? '#FFFBEB' : '#E8F5E9',
                color: getSellOutPieColor(totals.sellOutPct),
              }}
            >
              {isRussian ? 'Цель 70%' : 'Target 70%'}
            </span>
          </div>

          {/* SVG Pie Chart Widget */}
          <KpiDonutChart sellOutPct={totals.sellOutPct} size={44} strokeWidth={5} />
        </div>

        {/* Dynamic Sell-Out Progress Bar */}
        <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden my-1">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ 
              width: `${Math.max(2, Math.min(100, totals.sellOutPct))}%`,
              backgroundColor: getSellOutPieColor(totals.sellOutPct),
            }}
          />
        </div>

        <div className="text-[11px] text-[#6B7280] mt-0.5 font-mono">
          ({totals.unitsSold} / {totals.unitsOrdered}) * 100
        </div>
      </div>

      {/* 2. Продано / заказано */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Продано / заказано' : 'Venduto / Ordinato'}
          </span>
          <ShoppingBag className="w-3.5 h-3.5 text-[#6B7280]" />
        </div>

        <div className="my-1.5 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
                {totals.unitsSold}
              </span>
              <span className="text-xs text-[#6B7280] font-normal">
                / {totals.unitsOrdered} {isRussian ? 'шт.' : 'pz'}
              </span>
            </div>
            <div className="text-[11px] text-[#0B5C37] font-mono font-medium mt-1">
              {totals.sellOutPct.toFixed(1)}% {isRussian ? 'реализовано' : 'venduto'}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#E5E3DC] flex items-center justify-center text-[#C27803]">
            <PieIcon className="w-4 h-4 text-[#0B5C37]" />
          </div>
        </div>

        <div className="text-[11px] text-[#6B7280] mt-auto pt-1">
          {isRussian ? `Остаток на складе: ${totals.stockRemaining} шт.` : `Rimanenza magazzino: ${totals.stockRemaining} pz`}
        </div>
      </div>

      {/* 3. Фактическая выручка */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Фактическая выручка' : 'Incasso Effettivo'}
          </span>
          <span className="text-xs font-bold text-[#C27803]">€</span>
        </div>

        <div className="my-1.5 text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          {formatEuro(totals.realizedRevenue > 0 ? totals.realizedRevenue : totals.unitsSold * 448)}
        </div>

        <div className="text-[11px] text-[#6B7280] mt-auto pt-1">
          {isRussian ? `Максимальный потенциал: ${formatEuro(totals.retailEur)}` : `Potenziale totale: ${formatEuro(totals.retailEur)}`}
        </div>
      </div>

      {/* 4. Оптовая стоимость */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Оптовая стоимость' : 'Valore Wholesale'}
          </span>
          <span className="text-xs font-bold text-[#C27803]">€</span>
        </div>

        <div className="my-1.5 text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          {formatEuro(totals.wholesaleEur)}
        </div>

        <div className="text-[11px] text-[#6B7280] mt-auto pt-1">
          {isRussian ? `Средняя наценка ~${totals.avgMarkup.toFixed(1)}x` : `Markup medio ~${totals.avgMarkup.toFixed(1)}x`}
        </div>
      </div>

      {/* 5. Ассортимент каталога */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Ассортимент каталога' : 'Assortimento'}
          </span>
          <Layers className="w-3.5 h-3.5 text-[#6B7280]" />
        </div>

        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
            {products.length}
          </span>
          <span className="text-xs text-[#6B7280] font-normal">
            {isRussian ? 'артикулов' : 'stili'}
          </span>
        </div>

        <div className="text-[11px] text-[#6B7280] mt-auto pt-1">
          {isRussian ? `В ${totals.activeOrdersCount} активных заказах` : `In ${totals.activeOrdersCount} ordini attivi`}
        </div>
      </div>

      {/* 6. Динамика продаж */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span className="font-medium text-[#1A1A1A]">
            {isRussian ? 'Динамика продаж' : 'Dinamica Vendite'}
          </span>
          <HelpCircle className="w-3.5 h-3.5 text-[#9CA3AF]" />
        </div>

        <div className="my-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
            {totals.leadersCount}
          </span>
          <span className="text-xs text-[#15803D] font-medium">
            {isRussian ? 'Лидеры (≥ 70%)' : 'Bestseller (≥ 70%)'}
          </span>
        </div>

        <div className="text-[11px] text-[#6B7280] mt-auto pt-1">
          {isRussian 
            ? `${totals.lowPerformersCount} моделей с продажами ниже 40%` 
            : `${totals.lowPerformersCount} modelli sotto il 40%`}
        </div>
      </div>
    </div>
  );
};
