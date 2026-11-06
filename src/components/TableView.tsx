/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MergedProduct } from '../types';
import { getSwatchHex, getSellOutPieColor } from '../utils/etl';
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  BookOpen, 
  ShoppingBag,
  PieChart as PieIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TableViewProps {
  products: MergedProduct[];
  onOpenDetail: (product: MergedProduct) => void;
  onOpenTraining: (product: MergedProduct) => void;
  boutiqueName: string;
}

export const TableView: React.FC<TableViewProps> = ({
  products,
  onOpenDetail,
  onOpenTraining,
  boutiqueName,
}) => {
  const [sortField, setSortField] = useState<keyof MergedProduct>('sellOutPct');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: keyof MergedProduct) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const cmp = (valA as string).localeCompare(valB as string);
        return sortAsc ? cmp : -cmp;
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [products, sortField, sortAsc]);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const exportToExcel = () => {
    const exportRows = sortedProducts.map((p) => {
      const sizesSoldStr = Object.entries(p.sizesSold)
        .map(([sz, q]) => `${sz}: ${q}`)
        .join(', ');
      const sizesOrderedStr = Object.entries(p.sizesOrdered)
        .map(([sz, q]) => `${sz}: ${q}`)
        .join(', ');

      return {
        'Артикул': p.styleNumber,
        'Модель': p.styleName,
        'Цвет': p.color || p.colorCode,
        'Категория': p.silhouette || p.category,
        'Ткань / Состав': p.fabrication || '',
        'Опт (€)': p.wholesaleEur,
        'Розница (€)': p.suggRetailEur,
        'Заказано (Sell-In)': p.unitsOrdered,
        'Продано (Sell-Out)': p.unitsSold,
        'Остаток на складе': p.stockRemaining,
        '% Продаж (Sell-Out)': `${p.sellOutPct.toFixed(1)}%`,
        'Выручка Sell-Out (€)': p.realizedRevenueEur,
        'Заказ PO#': p.poNumbers.join(', '),
        'Размеры заказано': sizesOrderedStr,
        'Размеры продано': sizesSoldStr,
        'Бутик': boutiqueName,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Luisa Spagnoli FW26');

    const maxWidths = Object.keys(exportRows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(
      workbook,
      `Luisa_Spagnoli_FW26_Wholesale_SellOut_${boutiqueName.replace(/\s+/g, '_')}.xlsx`
    );
  };

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-xl overflow-hidden shadow-2xs">
      {/* Table Action Bar */}
      <div className="p-3.5 bg-white border-b border-[#E5E3DC] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-semibold text-[#1A1A1A]">
            Аналитическая таблица моделей и Sell-Out
          </span>
          <span className="text-[#6B7280]">({sortedProducts.length} артикулов)</span>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#C27803]" />
          <span>Экспорт в Excel XLSX</span>
        </button>
      </div>

      {/* Interactive Table Container */}
      <div className="overflow-x-auto max-h-[750px] scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#FAF9F5] text-[#6B7280] sticky top-0 z-20 border-b border-[#E5E3DC]">
            <tr>
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-2 w-12">Фото</th>
              <th
                onClick={() => handleSort('styleName')}
                className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center gap-1">
                  <span>Модель и артикул</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('silhouette')}
                className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center gap-1">
                  <span>Категория</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-medium">Ткань и цвет</th>
              <th
                onClick={() => handleSort('wholesaleEur')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Опт (€)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('suggRetailEur')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Розница (€)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('unitsOrdered')}
                className="py-2.5 px-3 text-center cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Заказ (Sell-In)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('unitsSold')}
                className="py-2.5 px-3 text-center cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Продано (Sell-Out)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('stockRemaining')}
                className="py-2.5 px-3 text-center cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Остаток</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sellOutPct')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>% Продаж</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('realizedRevenueEur')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1A1A1A] font-medium"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Выручка (€)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFEA]">
            {sortedProducts.map((p) => {
              const isExpanded = expandedRow === p.id;
              const hasSales = p.unitsSold > 0;
              const isSoldOut = p.stockRemaining === 0 && p.unitsOrdered > 0;
              const swatch = getSwatchHex(p.colorCode || p.color);

              return (
                <React.Fragment key={p.id}>
                  <tr
                    className={`hover:bg-[#FAF9F5] transition-colors cursor-pointer ${
                      isExpanded ? 'bg-[#FFF9EA]' : ''
                    }`}
                    onClick={() => toggleExpand(p.id)}
                  >
                    <td className="py-2 px-3 text-[#9CA3AF]">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#C27803]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </td>

                    {/* Thumbnail Image */}
                    <td className="py-2 px-2">
                      <div className="w-8 h-10 rounded bg-[#FAF9F5] border border-[#E5E3DC] overflow-hidden flex items-center justify-center shrink-0">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.styleName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
                        )}
                      </div>
                    </td>

                    {/* Style Name & Code */}
                    <td className="py-2 px-3">
                      <div className="font-serif font-medium text-[#1A1A1A]">{p.styleName}</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">#{p.styleNumber}</div>
                    </td>

                    {/* Silhouette */}
                    <td className="py-2 px-3 text-[#6B7280]">
                      <span className="capitalize">{p.silhouette || p.category || 'Apparel'}</span>
                    </td>

                    {/* Fabric & Color */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: swatch }}
                        />
                        <span className="text-[11px] text-[#1A1A1A] truncate max-w-[140px]" title={p.color || p.colorCode}>
                          {p.color || p.colorCode}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] truncate max-w-[140px]" title={p.fabrication}>
                        {p.fabrication}
                      </div>
                    </td>

                    {/* Wholesale */}
                    <td className="py-2 px-3 text-right font-mono text-[#6B7280]">
                      {formatEuro(p.wholesaleEur)}
                    </td>

                    {/* MSRP Retail */}
                    <td className="py-2 px-3 text-right font-mono text-[#1A1A1A] font-medium">
                      {formatEuro(p.suggRetailEur)}
                    </td>

                    {/* Units Ordered */}
                    <td className="py-2 px-3 text-center font-mono text-[#1A1A1A]">
                      {p.unitsOrdered}
                    </td>

                    {/* Units Sold */}
                    <td className="py-2 px-3 text-center font-mono font-bold">
                      <span className={hasSales ? 'text-[#0B5C37]' : 'text-[#6B7280]'}>
                        {p.unitsSold}
                      </span>
                    </td>

                    {/* Stock Remaining */}
                    <td className="py-2 px-3 text-center font-mono">
                      {isSoldOut ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#7A152E] text-white font-bold">
                          0
                        </span>
                      ) : p.stockRemaining === 1 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FFF9EA] text-[#C27803] font-bold border border-[#F3E5AB]">
                          1 шт.
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">{p.stockRemaining}</span>
                      )}
                    </td>

                    {/* Sell-out Percentage */}
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span 
                        className="inline-block px-1.5 py-0.5 rounded text-xs"
                        style={{ color: getSellOutPieColor(p.sellOutPct) }}
                      >
                        {p.sellOutPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Realized Revenue */}
                    <td className="py-2 px-3 text-right font-mono text-[#0B5C37] font-semibold">
                      {formatEuro(p.realizedRevenueEur)}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenDetail(p)}
                          className="p-1 rounded hover:bg-[#FAF9F5] text-[#6B7280] hover:text-[#1A1A1A] cursor-pointer"
                          title="Открыть карточку модели"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenTraining(p)}
                          className="p-1 rounded hover:bg-[#FFF9EA] text-[#C27803] cursor-pointer"
                          title="Материалы обучения продавцов"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Breakdown */}
                  {isExpanded && (
                    <tr className="bg-[#FAF9F5] border-b border-[#E5E3DC]">
                      <td colSpan={13} className="p-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E3DC]">
                            <span className="font-semibold text-xs text-[#1A1A1A]">
                              Детализация заказа и проданные размеры ({p.styleName})
                            </span>
                            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                              <span>Заказы PO: <strong className="font-mono text-[#1A1A1A]">{p.poNumbers.join(', ')}</strong></span>
                              <span>Коллекция: <strong className="text-[#1A1A1A]">{p.linesheet || 'Fw 2026 - Sfilata'}</strong></span>
                              <span>Страна: <strong className="text-[#1A1A1A]">{p.countryOfOrigin || 'Italia'}</strong></span>
                            </div>
                          </div>

                          {/* Sizes Breakdown Grid */}
                          <div>
                            <span className="text-[11px] font-medium text-[#6B7280] block mb-1.5">
                              Размерная сетка: Продано / Заказано (Остаток на складе)
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(p.sizesOrdered).map(([sz, orderedQty]) => {
                                const soldQty = p.sizesSold[sz] || 0;
                                const remaining = Math.max(0, orderedQty - soldQty);
                                const isSzSoldOut = remaining === 0;

                                return (
                                  <div
                                    key={sz}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                                      isSzSoldOut
                                        ? 'bg-[#FFF0F2] border-[#FECDD3] text-[#B91C1C]'
                                        : soldQty > 0
                                        ? 'bg-[#E8F5E9] border-[#0B5C37]/30 text-[#0B5C37]'
                                        : 'bg-white border-[#E5E3DC] text-[#4B5563]'
                                    }`}
                                  >
                                    <span className="font-bold">{sz}</span>
                                    <span>·</span>
                                    <span>
                                      {soldQty} / {orderedQty} шт.
                                    </span>
                                    {isSzSoldOut ? (
                                      <span className="text-[10px] font-bold px-1 rounded bg-[#7A152E] text-white">
                                        0
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-[#6B7280]">
                                        (ост. {remaining})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
