/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MergedProduct } from '../types';
import { Eye, ShoppingBag, AlertTriangle, BookOpen } from 'lucide-react';
import { getSellOutPieColor } from '../utils/etl';

interface ProductCardProps {
  product: MergedProduct;
  onOpenDetail: (product: MergedProduct) => void;
  onOpenTraining?: (product: MergedProduct) => void;
  language?: 'RU' | 'IT';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onOpenTraining,
  language = 'RU',
}) => {
  const [imgError, setImgError] = useState(false);
  const isRussian = language === 'RU';

  const isSoldOut = product.stockRemaining === 0 && product.unitsOrdered > 0;
  const isSingleLeft = product.stockRemaining === 1;
  const hasSales = product.unitsSold > 0;

  // Extract clean PO number
  const primaryPo = (product.poNumbers && product.poNumbers[0]) || '18858382';

  // Format euro price cleanly
  const formatEur = (val: number) => {
    return Number.isInteger(val) ? `€${val}` : `€${val.toFixed(1)}`;
  };

  // Silhouette / Category display
  const categoryLabel = product.silhouette || product.category || 'Apparel';

  // Subtitle display: e.g. Marrone(0927) · #543779
  const colorDisplay = product.colorCode || product.color;
  const subtitle = `${colorDisplay} · #${product.styleNumber}`;

  // Progress percentage
  const progressPct = product.unitsOrdered > 0
    ? Math.min(100, Math.max(0, (product.unitsSold / product.unitsOrdered) * 100))
    : 0;

  const t = {
    sold: isRussian ? 'Продано:' : 'Venduto:',
    ordered: isRussian ? 'Заказано:' : 'Ordinato:',
    stock: isRussian ? 'Остаток:' : 'Giacenza:',
    stockLabel: isRussian ? 'Остаток' : 'Giacenza',
    pricing: isRussian ? 'Розница / опт' : 'Розница / опт',
    openCard: isRussian ? 'Открыть карточку' : 'Dossier Capo',
    soldOutBadge: isRussian ? 'РАСПРОДАНО' : 'РАСПРОДАНО',
    unitsShort: isRussian ? 'шт.' : 'шт.',
    inStock: isRussian ? 'В наличии:' : 'Disponibile:',
    oneLeft: isRussian ? '1 Left' : '1 Rimanente',
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E3DC] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Image Container */}
      <div className="relative aspect-[3/4] bg-[#FBFBF9] overflow-hidden flex items-center justify-center border-b border-[#F0EFEA]">
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          {/* Category Pill */}
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-sm bg-white/95 text-[#374151] border border-[#E5E3DC] shadow-2xs capitalize">
            {categoryLabel}
          </span>

          {/* Status Badge: Emerald green for sold, Burgundy wine for sold out */}
          {isSoldOut ? (
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-xs bg-[#7A152E] text-white shadow-2xs">
              {t.soldOutBadge}
            </span>
          ) : hasSales ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-xs bg-[#0B5C37] text-white shadow-2xs">
              {t.sold} {product.unitsSold} {t.unitsShort}
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs bg-white/90 text-[#4B5563] border border-[#E5E3DC] shadow-2xs">
              {t.inStock} {product.stockRemaining} {t.unitsShort}
            </span>
          )}
        </div>

        {/* Product Image */}
        {!imgError && product.image ? (
          <img
            src={product.image}
            alt={product.styleName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-2.5 group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 p-4 text-center">
            <ShoppingBag className="w-12 h-12 mb-2 text-stone-300" />
            <span className="font-serif text-sm text-stone-700">{product.styleClean}</span>
            <span className="text-[10px] text-stone-400 mt-1">{product.styleNumber}</span>
          </div>
        )}

        {/* Centered Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
          <button
            onClick={() => onOpenDetail(product)}
            className="bg-white hover:bg-[#F8F7F4] text-[#1A1A1A] border border-[#DCD9CE] shadow-md px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-transform transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C27803]" />
            <span>{t.openCard}</span>
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
        {/* Style Name & Code */}
        <div>
          <h3
            onClick={() => onOpenDetail(product)}
            className="text-base sm:text-lg font-serif font-normal text-[#1A1A1A] hover:text-[#C27803] transition-colors cursor-pointer line-clamp-1"
            title={product.styleName}
          >
            {product.styleName}
          </h3>
          <p className="text-xs text-[#6B7280] font-normal mt-0.5 line-clamp-1" title={subtitle}>
            {subtitle}
          </p>
        </div>

        {/* Units Sold / Ordered & Emerald Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="text-[#1A1A1A]">
              {t.sold} <strong className="font-bold text-[#1A1A1A]">{product.unitsSold} {t.unitsShort}</strong>
            </span>
            <span className="text-[#6B7280]">
              {t.ordered} {product.unitsOrdered} {t.unitsShort}
            </span>
          </div>

          {/* Dynamic Progress Bar: 0% Red -> 50% Light Green -> 100% Green */}
          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${progressPct}%`,
                backgroundColor: getSellOutPieColor(progressPct),
              }}
            />
          </div>

          {/* Stock remaining subtitle */}
          <div className="text-[11px] text-[#6B7280] mt-1">
            {t.stock} {product.stockRemaining} {t.unitsShort}
          </div>
        </div>

        {/* Pricing Row: Retail / Wholesale & Stock */}
        <div className="flex items-end justify-between pt-1 border-t border-[#F0EFEA]">
          <div>
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider block font-medium">
              {t.pricing}
            </span>
            <div className="text-sm font-semibold text-[#1A1A1A]">
              {formatEur(product.suggRetailEur)} <span className="text-[#9CA3AF] font-normal">/</span> {formatEur(product.wholesaleEur)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider block font-medium">
              {t.stockLabel}
            </span>
            <div
              className={`text-sm font-semibold ${
                isSoldOut ? 'text-[#DC2626] font-bold' : 'text-[#1A1A1A]'
              }`}
            >
              {product.stockRemaining} {t.unitsShort}
            </div>
          </div>
        </div>

        {/* Sizes Ordered Matrix Chips - Pink tags for sold sizes matching screenshot */}
        <div className="pt-2 border-t border-[#F0EFEA] flex flex-wrap gap-1.5">
          {Object.entries(product.sizesOrdered).map(([sz, qty]) => {
            const soldInSz = product.sizesSold[sz] || 0;
            const hasSoldInSz = soldInSz > 0;

            return (
              <span
                key={sz}
                className={`text-[11px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                  hasSoldInSz
                    ? 'bg-[#FFF0F2] text-[#B91C1C] border border-[#FECDD3] font-medium'
                    : 'bg-[#F8F9FA] text-[#4B5563] border border-[#E5E7EB] font-normal'
                }`}
                title={`Taglia ${sz}: ${soldInSz}/${qty} ${t.unitsShort} (${qty - soldInSz} disponibili)`}
              >
                {sz}:{soldInSz}/{qty}
              </span>
            );
          })}
        </div>

        {/* Card Footer: PO# & Warning / Sold Out Badge */}
        <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#9CA3AF] font-mono">
          <span>PO# {primaryPo}</span>

          {isSoldOut ? (
            <span className="text-[#7A152E] font-semibold tracking-wider text-[11px] font-sans">
              {t.soldOutBadge}
            </span>
          ) : isSingleLeft ? (
            <span className="text-[#B45309] font-medium flex items-center gap-1 text-[11px] font-sans">
              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
              <span>{t.oneLeft}</span>
            </span>
          ) : onOpenTraining ? (
            <button
              onClick={() => onOpenTraining(product)}
              className="text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors flex items-center gap-1 text-[11px] font-sans font-normal cursor-pointer"
              title="Apri scheda consigli vendita e styling"
            >
              <BookOpen className="w-3 h-3 text-[#9CA3AF]" />
              <span>Styling</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
