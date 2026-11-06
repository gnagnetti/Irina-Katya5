/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { MergedProduct, OrderItem } from '../types';
import { BOUTIQUES_CATALOG } from '../data/initialData';

interface BoutiqueBrowserViewProps {
  products: MergedProduct[];
  orders: OrderItem[];
  selectedRetailer: string;
  onSelectRetailer: (retailer: string) => void;
  onSwitchToLookbook: () => void;
}

export const BoutiqueBrowserView: React.FC<BoutiqueBrowserViewProps> = ({
  products,
  orders,
  selectedRetailer,
  onSelectRetailer,
  onSwitchToLookbook,
}) => {
  const targetBoutiques = [
    'Boutique Nizhniy Novgorod',
    'Boutique Spb Bolshoy',
    'Boutique Ufa',
    "Boutique Perm'",
    'Boutique Samara',
    'Boutique Spb Nevskiy',
  ];

  const formatRussianName = (name: string) => {
    if (name.includes('Nizhniy')) return 'Бутик Нижний Новгород';
    if (name.includes('Bolshoy')) return 'Бутик СПб Большой пр.';
    if (name.includes('Nevskiy')) return 'Бутик СПб Невский пр.';
    if (name.includes('Ufa')) return 'Бутик Уфа';
    if (name.includes('Perm')) return 'Бутик Пермь';
    if (name.includes('Samara')) return 'Бутик Самара';
    return name;
  };

  const cleanRussianCity = (name: string) => {
    if (name.includes('Nizhniy')) return 'Нижний Новгород';
    if (name.includes('Bolshoy')) return 'Санкт-Петербург (Большой)';
    if (name.includes('Nevskiy')) return 'Санкт-Петербург (Невский)';
    if (name.includes('Ufa')) return 'Уфа';
    if (name.includes('Perm')) return 'Пермь';
    if (name.includes('Samara')) return 'Самара';
    return 'Россия';
  };

  const boutiqueData = React.useMemo(() => {
    return targetBoutiques.map((boutiqueName) => {
      const boutiqueOrders = orders.filter((o) => o.retailer === boutiqueName);
      const catalogInfo = BOUTIQUES_CATALOG.find((b) => b.name === boutiqueName);

      let totalUnits = 0;
      let totalWholesale = 0;
      let totalRetail = 0;
      const poSet = new Set<string>();
      const styleMap = new Map<string, { name: string; image: string; units: number; color: string; wholesale: number }>();

      boutiqueOrders.forEach((o) => {
        const u = o.units || 1;
        totalUnits += u;
        totalWholesale += u * (o.minWholesalePrice || 0);
        totalRetail += u * (o.minRetailPrice || 0);
        if (o.poNumber) poSet.add(o.poNumber);

        const key = `${o.styleName}_${o.colorCode || o.colorName}`;
        const existing = styleMap.get(key);
        if (existing) {
          existing.units += u;
        } else {
          styleMap.set(key, {
            name: o.styleName,
            image: o.image || '',
            units: u,
            color: o.colorName || o.colorCode,
            wholesale: o.minWholesalePrice || 0,
          });
        }
      });

      const topStyles = Array.from(styleMap.values())
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

      return {
        name: boutiqueName,
        catalogInfo,
        totalUnits,
        totalWholesale,
        totalRetail,
        distinctStylesCount: styleMap.size,
        posCount: poSet.size,
        topStyles,
      };
    });
  }, [orders]);

  const totalAllUnits = orders.reduce((acc, it) => acc + (it.units || 0), 0);
  const totalAllWholesale = orders.reduce((acc, it) => acc + ((it.units || 1) * (it.minWholesalePrice || 0)), 0);

  const formatEuro = (amount: number) => {
    return '€' + new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner in Russian */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#1A1A1A] font-semibold">
                Обзор 6 бутиков (Официальная сеть РФ)
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Структура оптовых заказов B2B JOOR по каждому бутику сети.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectRetailer('ALL');
                onSwitchToLookbook();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1A1A1A] hover:bg-[#333333] text-white transition-colors cursor-pointer shadow-sm"
            >
              Открыть общий каталог (Все модели)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 6 Boutique Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {boutiqueData.map((b, idx) => {
          const isSelected = selectedRetailer === b.name;
          const russianTitle = formatRussianName(b.name);
          const russianCity = cleanRussianCity(b.name);

          return (
            <div
              key={b.name}
              className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs ${
                isSelected
                  ? 'bg-[#FFF9EA] border-[#C27803] ring-1 ring-[#C27803]/40'
                  : 'bg-white border-[#E5E3DC] hover:border-[#DCD9CE]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#F0EFEA]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold font-serif text-sm ${
                      isSelected
                        ? 'bg-[#C27803] text-white'
                        : 'bg-[#FAF9F5] text-[#1A1A1A] border border-[#E5E3DC]'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-1">
                        {russianTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5">
                        <MapPin className="w-3 h-3 text-[#C27803] shrink-0" />
                        <span>{russianCity}</span>
                        {b.catalogInfo?.customerCode && (
                          <span className="font-mono text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-1.5 py-0.2 rounded text-[10px]">
                            ID {b.catalogInfo.customerCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0B5C37] border border-[#0B5C37]/30 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Активен
                    </span>
                  )}
                </div>

                {b.catalogInfo?.address && (
                  <p className="text-[11px] text-[#6B7280] mt-2 line-clamp-1 italic">
                    {b.catalogInfo.address}
                  </p>
                )}
              </div>

              {/* Financial & Volume Metrics */}
              <div className="p-4 bg-[#FAF9F5] grid grid-cols-3 gap-2 text-center border-b border-[#E5E3DC]">
                <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">
                    Заказ (Sell-In)
                  </span>
                  <span className="text-base font-bold font-mono text-[#C27803]">
                    {b.totalUnits} шт.
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">
                    Опт Wholesale
                  </span>
                  <span className="text-xs font-bold font-mono text-[#1A1A1A]">
                    {formatEuro(b.totalWholesale)}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">
                    Моделей FW26
                  </span>
                  <span className="text-xs font-bold font-mono text-[#0284C7]">
                    {b.distinctStylesCount}
                  </span>
                </div>
              </div>

              {/* Top Styles Preview Strip */}
              <div className="p-4">
                <span className="text-[11px] text-[#6B7280] font-medium block mb-2">
                  Образцы моделей бутика:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {b.topStyles.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="w-14 shrink-0 rounded-lg bg-[#FAF9F5] border border-[#E5E3DC] p-1 flex flex-col items-center text-center shadow-2xs"
                    >
                      <div className="w-12 h-14 rounded overflow-hidden bg-white mb-1 flex items-center justify-center">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-stone-300" />
                        )}
                      </div>
                      <span className="text-[9px] font-serif text-[#1A1A1A] line-clamp-1 w-full font-medium">
                        {s.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#C27803]">
                        {s.units} шт.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 bg-white border-t border-[#F0EFEA]">
                <button
                  onClick={() => {
                    onSelectRetailer(b.name);
                    onSwitchToLookbook();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#C27803] hover:bg-[#A86402] text-white'
                      : 'bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE]'
                  }`}
                >
                  <span>{isSelected ? 'Открыть каталог этого бутика' : 'Выбрать бутик и перейти в каталог'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
