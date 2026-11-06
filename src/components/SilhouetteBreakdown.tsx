/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MergedProduct } from '../types';
import { PieChart, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { getSellOutPieColor } from '../utils/etl';

interface SilhouetteBreakdownProps {
  products: MergedProduct[];
  onSelectSilhouette: (silhouette: string) => void;
}

export const SilhouetteBreakdown: React.FC<SilhouetteBreakdownProps> = ({
  products,
  onSelectSilhouette,
}) => {
  const stats = React.useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        count: number;
        unitsOrdered: number;
        unitsSold: number;
        wholesaleEur: number;
        retailEur: number;
        realizedRevenueEur: number;
        styles: string[];
      }
    > = {};

    let grandUnits = 0;
    let grandWholesale = 0;
    let grandRevenue = 0;

    products.forEach((p) => {
      const sil = p.silhouette || 'Altro';
      if (!map[sil]) {
        map[sil] = {
          name: sil,
          count: 0,
          unitsOrdered: 0,
          unitsSold: 0,
          wholesaleEur: 0,
          retailEur: 0,
          realizedRevenueEur: 0,
          styles: [],
        };
      }
      map[sil].count += 1;
      map[sil].unitsOrdered += p.unitsOrdered;
      map[sil].unitsSold += p.unitsSold;
      map[sil].wholesaleEur += p.totalWholesaleEur;
      map[sil].retailEur += p.totalRetailEur;
      map[sil].realizedRevenueEur += p.realizedRevenueEur;
      if (!map[sil].styles.includes(p.styleClean)) {
        map[sil].styles.push(p.styleClean);
      }

      grandUnits += p.unitsOrdered;
      grandWholesale += p.totalWholesaleEur;
      grandRevenue += p.realizedRevenueEur;
    });

    const list = Object.values(map).map((item) => {
      const sellOutPct =
        item.unitsOrdered > 0 ? (item.unitsSold / item.unitsOrdered) * 100 : 0;
      const wholesaleSharePct =
        grandWholesale > 0 ? (item.wholesaleEur / grandWholesale) * 100 : 0;

      return {
        ...item,
        sellOutPct,
        wholesaleSharePct,
      };
    });

    list.sort((a, b) => b.unitsSold - a.unitsSold);

    return {
      list,
      grandUnits,
      grandWholesale,
      grandRevenue,
    };
  }, [products]);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  return (
    <div className="space-y-4">
      {/* Category Overview Banner */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-[#1A1A1A] font-semibold">
              Анализ категорий и силуэтов (FW26)
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Распределение продаж Sell-Out по товарным категориям коллекции.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Всего артикулов</span>
            <span className="text-[#1A1A1A] font-semibold">{products.length}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Заказано единиц</span>
            <span className="text-[#C27803] font-semibold">{stats.grandUnits} шт.</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Выручка касс</span>
            <span className="text-[#0B5C37] font-semibold">{formatEuro(stats.grandRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Grid of Silhouette Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.list.map((cat) => {
          const isHighVelocity = cat.sellOutPct >= 65;
          const isSlow = cat.sellOutPct < 40;

          return (
            <div
              key={cat.name}
              className="bg-white border border-[#E5E3DC] hover:border-[#DCD9CE] rounded-xl p-4 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
            >
              {/* Card Background Watermark Pie */}
              <div className="absolute -right-3 -bottom-3 pointer-events-none opacity-[0.06] select-none">
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke={getSellOutPieColor(cat.sellOutPct)} strokeWidth="14" strokeDasharray="238.7" strokeDashoffset={238.7 * (1 - cat.sellOutPct / 100)} transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke={cat.sellOutPct === 0 ? '#FEE2E2' : '#E5E3DC'} strokeWidth="14" strokeDasharray="238.7" strokeDashoffset="0" opacity="0.3" />
                </svg>
              </div>

              {/* Category Title & Badge */}
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-serif text-base text-[#1A1A1A] font-medium flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-xs font-sans text-[#6B7280] font-normal">
                        ({cat.count} мод.)
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 truncate max-w-[240px]">
                      {cat.styles.slice(0, 3).join(', ')}
                      {cat.styles.length > 3 ? ` +${cat.styles.length - 3}` : ''}
                    </p>
                  </div>

                  {isHighVelocity ? (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#E8F5E9] text-[#0B5C37] border border-[#0B5C37]/30 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Лидер продаж
                    </span>
                  ) : isSlow ? (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#FFF0F2] text-[#B91C1C] border border-[#FECDD3] flex items-center gap-1 shrink-0">
                      <AlertCircle className="w-2.5 h-2.5" /> Медленный
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#FAF9F5] text-[#6B7280] border border-[#E5E3DC] shrink-0">
                      Средний
                    </span>
                  )}
                </div>

                {/* Progress Bar of Sell-Out */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-[#6B7280]">Sell-Out категории</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: getSellOutPieColor(cat.sellOutPct) }}
                    >
                      {cat.sellOutPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, cat.sellOutPct)}%`,
                        backgroundColor: getSellOutPieColor(cat.sellOutPct),
                      }}
                    />
                  </div>
                </div>

                {/* Financial & Unit Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F0EFEA] text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Продано единиц</span>
                    <span className="font-mono text-[#1A1A1A] font-semibold">
                      {cat.unitsSold}{' '}
                      <span className="text-[#6B7280] font-normal">/ {cat.unitsOrdered} шт.</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Доля в бюджете</span>
                    <span className="font-mono text-[#C27803] font-semibold">
                      {cat.wholesaleSharePct.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Оптовая стоимость</span>
                    <span className="font-mono text-[#1A1A1A]">
                      {formatEuro(cat.wholesaleEur)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block">Выручка Sell-Out</span>
                    <span className="font-mono text-[#0B5C37] font-semibold">
                      {formatEuro(cat.realizedRevenueEur)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[#F0EFEA] relative z-10">
                <button
                  onClick={() => onSelectSilhouette(cat.name)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#FAF9F5] hover:bg-white text-[#1A1A1A] border border-[#E5E3DC] hover:border-[#C27803] text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group-hover:bg-[#FFF9EA]"
                >
                  <span>Показать модели этой категории</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C27803]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
