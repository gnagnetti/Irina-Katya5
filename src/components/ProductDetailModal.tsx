/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MergedProduct } from '../types';
import { getSwatchHex, getSellOutPieColor } from '../utils/etl';
import { 
  X, 
  BookOpen, 
  ShoppingBag, 
  MapPin, 
  Printer
} from 'lucide-react';

interface ProductDetailModalProps {
  product: MergedProduct | null;
  onClose: () => void;
  onOpenTraining: (product: MergedProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenTraining,
}) => {
  if (!product) return null;

  const swatchHex = getSwatchHex(product.colorPrefix);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header bar in Russian */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-[#332A15] font-semibold px-2.5 py-0.5 rounded bg-[#FFF9EA] border border-[#F3E5AB]">
              Техническая карточка модели
            </span>
            <span className="text-xs font-mono text-[#6B7280]">
              Арт. {product.styleNumber} · PO #{product.poNumbers.join(', ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
              title="Печать карточки"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Garment Image */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="aspect-[3/4] bg-[#FAF9F6] rounded-xl overflow-hidden border border-[#E5E3DC] relative flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.styleName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-300 p-4">
                  <ShoppingBag className="w-16 h-16 mb-2" />
                  <span className="font-serif text-sm text-stone-700">{product.styleClean}</span>
                </div>
              )}
            </div>

            {/* Color Swatch & Code */}
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: swatchHex }}
                />
                <span className="text-xs font-medium text-[#1A1A1A]">
                  {product.color || product.colorCode}
                </span>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">
                {product.colorPrefix}
              </span>
            </div>
          </div>

          {/* Right Column: Garment Specifications & Metrics */}
          <div className="md:col-span-7 flex flex-col justify-between gap-5">
            <div>
              {/* Title & Line */}
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] font-normal">
                  {product.styleName}
                </h2>
                <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-2">
                  <span className="text-[#C27803] font-medium">{product.linesheet}</span>
                  <span>·</span>
                  <span>{product.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#6B7280]" />
                    Производство: {product.countryOfOrigin}
                  </span>
                </p>
              </div>

              {/* Fabric Specification */}
              <div className="mt-4 p-3.5 bg-[#FAF9F5] rounded-xl border border-[#E5E3DC]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6B7280] mb-1">
                  Состав ткани и отделка
                </div>
                <div className="text-sm text-[#1A1A1A] font-medium">
                  {product.fabrication}
                </div>
                {product.styleTags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.styleTags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-white text-[#374151] border border-[#E5E3DC]"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Commercial Economics Matrix */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] text-[#6B7280] uppercase block">Оптовая цена B2B</span>
                  <span className="text-sm font-mono font-semibold text-[#1A1A1A]">
                    {formatEuro(product.wholesaleEur)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] text-[#6B7280] uppercase block">Розница (MSRP)</span>
                  <span className="text-sm font-mono font-semibold text-[#C27803]">
                    {formatEuro(product.suggRetailEur)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] text-[#6B7280] uppercase block">Наценка (Markup)</span>
                  <span className="text-sm font-mono font-semibold text-[#0B5C37]">
                    {product.markup}x
                  </span>
                </div>
              </div>

              {/* Sell-Out & Inventory Performance */}
              <div className="mt-4 p-3.5 bg-[#FAF9F5] rounded-xl border border-[#E5E3DC]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#6B7280] uppercase text-[10px] font-mono">
                    Продажи в кассе бутика
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: getSellOutPieColor(product.sellOutPct) }}
                  >
                    {product.sellOutPct.toFixed(1)}% Sell-Out
                  </span>
                </div>

                <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, product.sellOutPct)}%`,
                      backgroundColor: getSellOutPieColor(product.sellOutPct),
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Заказано</span>
                    <span className="font-mono font-medium text-[#1A1A1A]">
                      {product.unitsOrdered} шт.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Продано</span>
                    <span className="font-mono font-bold text-[#0B5C37]">
                      {product.unitsSold} шт.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Остаток</span>
                    <span className="font-mono font-bold text-[#C27803]">
                      {product.stockRemaining} шт.
                    </span>
                  </div>
                </div>
              </div>

              {/* Sizes Breakdown Matrix */}
              <div className="mt-4">
                <span className="text-[11px] font-medium text-[#6B7280] block mb-2">
                  Размерная сетка модели (Продано / Заказано):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(product.sizesOrdered).map(([sz, ord]) => {
                    const sold = product.sizesSold[sz] || 0;
                    const isSoldOut = ord - sold === 0;

                    return (
                      <div
                        key={sz}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                          isSoldOut
                            ? 'bg-[#FFF0F2] border-[#FECDD3] text-[#B91C1C]'
                            : sold > 0
                            ? 'bg-[#E8F5E9] border-[#0B5C37]/30 text-[#0B5C37]'
                            : 'bg-white border-[#E5E3DC] text-[#4B5563]'
                        }`}
                      >
                        <span className="font-bold">{sz}</span>: {sold}/{ord}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#F0EFEA] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => onOpenTraining(product)}
                className="px-4 py-2 rounded-xl bg-[#FFF9EA] hover:bg-[#FDF4D4] text-[#332A15] border border-[#F3E5AB] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-[#C27803]" />
                <span>Открыть обучение продавцов (Total Look & Objections)</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
