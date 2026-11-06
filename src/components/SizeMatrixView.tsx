/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MergedProduct } from '../types';
import { Grid3X3, ShoppingBag } from 'lucide-react';

interface SizeMatrixViewProps {
  products: MergedProduct[];
  onOpenDetail: (product: MergedProduct) => void;
}

export const SizeMatrixView: React.FC<SizeMatrixViewProps> = ({
  products,
  onOpenDetail,
}) => {
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('ALL');

  const sizeSummary = React.useMemo(() => {
    const sizeMap: Record<
      string,
      {
        size: string;
        ordered: number;
        sold: number;
        remaining: number;
        stylesWithStock: Array<{ product: MergedProduct; stockInSize: number }>;
      }
    > = {};

    products.forEach((p) => {
      Object.entries(p.sizesOrdered).forEach(([sz, ord]) => {
        if (!sizeMap[sz]) {
          sizeMap[sz] = {
            size: sz,
            ordered: 0,
            sold: 0,
            remaining: 0,
            stylesWithStock: [],
          };
        }
        const soldInSz = p.sizesSold[sz] || 0;
        const rem = ord - soldInSz;

        sizeMap[sz].ordered += ord;
        sizeMap[sz].sold += soldInSz;
        sizeMap[sz].remaining += rem;

        if (rem > 0) {
          sizeMap[sz].stylesWithStock.push({
            product: p,
            stockInSize: rem,
          });
        }
      });
    });

    const standardOrder = [
      'XS', 'S', 'M', 'L', 'XL', 'XXL',
      '38', '40', '42', '44', '46', '48', '50', '52',
      'U', 'UNI',
    ];

    return Object.values(sizeMap).sort((a, b) => {
      const idxA = standardOrder.indexOf(a.size.toUpperCase());
      const idxB = standardOrder.indexOf(b.size.toUpperCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.size.localeCompare(b.size);
    });
  }, [products]);

  const totalOrdered = sizeSummary.reduce((acc, s) => acc + s.ordered, 0);
  const totalSold = sizeSummary.reduce((acc, s) => acc + s.sold, 0);
  const totalRemaining = sizeSummary.reduce((acc, s) => acc + s.remaining, 0);

  const activeSizeData = sizeSummary.find((s) => s.size === selectedSizeFilter);

  return (
    <div className="space-y-4">
      {/* Banner Summary in Russian */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-[#1A1A1A] font-semibold">
              Размерная сетка и кривая запасов
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Мониторинг доступности по размерам и анализ продаж Sell-Out для предотвращения дефицита.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Размеров в сетке</span>
            <span className="text-[#1A1A1A] font-semibold">{sizeSummary.length}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Заказано единиц</span>
            <span className="text-[#C27803] font-semibold">{totalOrdered} шт.</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Продано единиц</span>
            <span className="text-[#0B5C37] font-semibold">{totalSold} шт.</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[10px] uppercase">Остаток на складе</span>
            <span className="text-[#1A1A1A] font-semibold">{totalRemaining} шт.</span>
          </div>
        </div>
      </div>

      {/* Grid of Size Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {sizeSummary.map((item) => {
          const sellOutRate =
            item.ordered > 0 ? (item.sold / item.ordered) * 100 : 0;
          const isSelected = selectedSizeFilter === item.size;
          const isDepleted = item.remaining === 0;
          const isCritical = item.remaining <= 2 && item.remaining > 0;

          return (
            <div
              key={item.size}
              onClick={() =>
                setSelectedSizeFilter(isSelected ? 'ALL' : item.size)
              }
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#FFF9EA] border-[#C27803] shadow-xs ring-1 ring-[#C27803]/40'
                  : 'bg-white border-[#E5E3DC] hover:border-[#DCD9CE] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-lg font-bold text-[#1A1A1A]">
                  {item.size}
                </span>
                {isDepleted ? (
                  <span className="w-2 h-2 rounded-full bg-[#7A152E]" title="Распродано" />
                ) : isCritical ? (
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" title="Критический остаток" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#0B5C37]" title="В наличии" />
                )}
              </div>

              <div className="text-xs font-mono">
                <div className="text-[#0B5C37] font-semibold">
                  {item.sold}{' '}
                  <span className="text-[#6B7280] font-normal">/ {item.ordered} прод.</span>
                </div>
                <div className="text-[#6B7280] text-[11px] mt-0.5">
                  Ост: <strong className="text-[#1A1A1A]">{item.remaining} шт.</strong>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#0D7A53] rounded-full"
                  style={{ width: `${Math.min(100, sellOutRate)}%` }}
                />
              </div>

              <div className="text-[10px] text-right font-mono text-[#C27803] mt-1 font-medium">
                {sellOutRate.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer: Detailed list of styles available in selected size */}
      {activeSizeData && (
        <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg text-[#1A1A1A]">
                Модели в наличии в размере{' '}
                <strong className="text-[#C27803]">{activeSizeData.size}</strong>
              </span>
              <span className="text-xs text-[#6B7280]">
                ({activeSizeData.stylesWithStock.length} моделей в наличии)
              </span>
            </div>

            <button
              onClick={() => setSelectedSizeFilter('ALL')}
              className="text-xs text-[#6B7280] hover:text-[#1A1A1A] cursor-pointer"
            >
              Сбросить фильтр размера ✕
            </button>
          </div>

          {activeSizeData.stylesWithStock.length === 0 ? (
            <div className="p-6 text-center text-[#6B7280] text-xs">
              Нет доступных моделей в размере {activeSizeData.size}. Все заказанные единицы проданы.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeSizeData.stylesWithStock.map(({ product, stockInSize }) => (
                <div
                  key={product.id}
                  onClick={() => onOpenDetail(product)}
                  className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] hover:border-[#C27803] cursor-pointer transition-colors flex items-center gap-3 shadow-2xs"
                >
                  <div className="w-12 h-14 bg-white rounded-lg overflow-hidden shrink-0 border border-[#E5E3DC] flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.styleName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-medium text-[#1A1A1A] truncate">
                      {product.styleName}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {product.color || product.colorCode}
                    </p>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="font-mono text-[#0B5C37] font-semibold">
                        €{product.suggRetailEur}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#FFF9EA] text-[#C27803] font-bold border border-[#F3E5AB]">
                        {stockInSize} шт. ост.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
