/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MergedProduct } from '../types';
import { PO_SCHEDULE_TIMELINE } from '../data/initialData';
import { GitCompare, Calendar, ArrowRight, PieChart as PieIcon } from 'lucide-react';

interface PoComparisonViewProps {
  products: MergedProduct[];
  onSelectPo: (poNumber: string) => void;
}

export const PoComparisonView: React.FC<PoComparisonViewProps> = ({
  products,
  onSelectPo,
}) => {
  const poStats = React.useMemo(() => {
    const map: Record<
      string,
      {
        poNumber: string;
        productsCount: number;
        unitsOrdered: number;
        unitsSold: number;
        wholesaleEur: number;
        retailEur: number;
        realizedRevenueEur: number;
        silhouettes: Record<string, number>;
        styles: string[];
      }
    > = {};

    products.forEach((p) => {
      p.poNumbers.forEach((po) => {
        if (!map[po]) {
          map[po] = {
            poNumber: po,
            productsCount: 0,
            unitsOrdered: 0,
            unitsSold: 0,
            wholesaleEur: 0,
            retailEur: 0,
            realizedRevenueEur: 0,
            silhouettes: {},
            styles: [],
          };
        }
        map[po].productsCount += 1;
        map[po].unitsOrdered += p.unitsOrdered;
        map[po].unitsSold += p.unitsSold;
        map[po].wholesaleEur += p.totalWholesaleEur;
        map[po].retailEur += p.totalRetailEur;
        map[po].realizedRevenueEur += p.realizedRevenueEur;
        map[po].silhouettes[p.silhouette] =
          (map[po].silhouettes[p.silhouette] || 0) + p.unitsOrdered;
        if (!map[po].styles.includes(p.styleClean)) {
          map[po].styles.push(p.styleClean);
        }
      });
    });

    return Object.values(map).map((item) => {
      const sellOutPct =
        item.unitsOrdered > 0 ? (item.unitsSold / item.unitsOrdered) * 100 : 0;
      const meta = PO_SCHEDULE_TIMELINE[item.poNumber] || {
        title: `Заказ PO #${item.poNumber}`,
        window: 'Поставка: Осень/Зима 2026',
        focus: 'Коллекция FW26 Runway & Main Collection',
        linesheet: 'Fw 2026 - Sfilata',
      };

      return {
        ...item,
        sellOutPct,
        meta,
      };
    });
  }, [products]);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  return (
    <div className="space-y-4">
      {/* Banner in Russian */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-[#1A1A1A] font-semibold">
              Сравнение заказов PO и окон поставок (Drops)
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Анализ эффективности и оборачиваемости Sell-Out по номерам оптовых заказов.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-[#6B7280]">
          Активных заказов PO: <strong className="text-[#1A1A1A]">{poStats.length}</strong>
        </div>
      </div>

      {/* Grid of PO Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {poStats.map((po) => {
          return (
            <div
              key={po.poNumber}
              className="bg-white border border-[#E5E3DC] hover:border-[#DCD9CE] rounded-xl p-4 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
            >
              {/* Card Background Watermark Pie */}
              <div className="absolute -right-3 -bottom-3 pointer-events-none opacity-[0.05] select-none">
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#0B5C37" strokeWidth="14" strokeDasharray="238.7" strokeDashoffset={238.7 * (1 - po.sellOutPct / 100)} transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#E5E3DC" strokeWidth="14" strokeDasharray="238.7" strokeDashoffset="0" opacity="0.3" />
                </svg>
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#332A15] px-2 py-0.5 rounded bg-[#FFF9EA] border border-[#F3E5AB] font-semibold">
                      PO #{po.poNumber}
                    </span>
                    <h3 className="font-serif text-base text-[#1A1A1A] font-medium mt-1">
                      {po.meta.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#6B7280]">
                    {po.productsCount} мод.
                  </span>
                </div>

                {/* Delivery Window */}
                <div className="flex items-center gap-1.5 text-xs text-[#0284C7] bg-[#F0F9FF] p-2 rounded-lg border border-[#BAE6FD] my-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{po.meta.window}</span>
                </div>

                {/* Focus */}
                <p className="text-[11px] text-[#6B7280] italic mb-4">
                  {po.meta.focus}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#F0EFEA]">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Оптовая стоимость</span>
                    <span className="font-mono text-[#1A1A1A] font-medium">
                      {formatEuro(po.wholesaleEur)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Выручка Sell-Out</span>
                    <span className="font-mono text-[#0B5C37] font-semibold">
                      {formatEuro(po.realizedRevenueEur)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Продано единиц</span>
                    <span className="font-mono text-[#1A1A1A]">
                      {po.unitsSold} <span className="text-[#6B7280]">/ {po.unitsOrdered} шт.</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">% Продаж (Sell-Out)</span>
                    <span
                      className={`font-mono font-bold ${
                        po.sellOutPct >= 65
                          ? 'text-[#0B5C37]'
                          : po.sellOutPct >= 40
                          ? 'text-[#C27803]'
                          : 'text-[#B91C1C]'
                      }`}
                    >
                      {po.sellOutPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Category Mix preview */}
                <div className="mt-3 pt-3 border-t border-[#F0EFEA]">
                  <span className="text-[10px] text-[#6B7280] uppercase block mb-1.5">
                    Структура категорий (единиц)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(po.silhouettes).map(([sil, cnt]) => (
                      <span
                        key={sil}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FAF9F5] text-[#374151] border border-[#E5E3DC]"
                      >
                        {sil}: {cnt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => onSelectPo(po.poNumber)}
                className="mt-4 w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer relative z-10"
              >
                <span>Показать модели заказа PO #{po.poNumber}</span>
                <ArrowRight className="w-3 h-3 text-[#C27803]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
