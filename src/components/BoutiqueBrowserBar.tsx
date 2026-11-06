/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  PieChart as PieIcon
} from 'lucide-react';
import { OrderItem, UploadedFileInfo, SellOutItem } from '../types';
import { getSellOutPieColor } from '../utils/etl';

interface BoutiqueBrowserBarProps {
  retailers: string[];
  selectedRetailer: string;
  onSelectRetailer: (retailer: string) => void;
  orders: OrderItem[];
  uploadedFiles?: UploadedFileInfo[];
  sellOutItems?: SellOutItem[];
  onOpenUploadForBoutique?: (boutique: string) => void;
  language?: 'RU' | 'IT';
}

/**
 * Compact SVG Donut / Pie Chart widget displaying Sell-Out % vs remaining Sell-In stock.
 * Scales dynamically: 0% Red (#DC2626) -> 50% Light Green (#4ADE80) -> 100% Deep Green (#0B5C37)
 */
const BoutiqueDonutChart: React.FC<{
  sellOutPct: number;
  size?: number;
  strokeWidth?: number;
}> = ({ sellOutPct, size = 38, strokeWidth = 4.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, sellOutPct));
  const offset = circumference - (safePct / 100) * circumference;

  // Dynamic color interpolation from 0% Red to 50% Light Green to 100% Green
  const strokeColor = getSellOutPieColor(safePct);
  const isZero = safePct === 0;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" title={`Sell-Out: ${safePct.toFixed(1)}%`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle (Sell-In / remaining stock) - subtle red tint when 0% to clearly show 0% status */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isZero ? '#FEE2E2' : '#EAE8E1'}
          strokeWidth={strokeWidth}
        />
        {/* Fill arc (Sell-Out %) */}
        {isZero ? (
          /* Subtle red indicator tick at 0% */
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
      <span className={`absolute text-[9px] font-mono font-bold ${isZero ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}>
        {isZero ? '0%' : `${Math.round(safePct)}%`}
      </span>
    </div>
  );
};

/**
 * Background Watermark Pie Chart with radial segments representing Sell-In vs Sell-Out %
 * Uses dynamic 0% red -> 50% light green -> 100% green palette.
 */
const CardWatermarkPie: React.FC<{
  sellOutPct: number;
  size?: number;
  opacity?: number;
}> = ({ sellOutPct, size = 96, opacity = 0.08 }) => {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, sellOutPct));
  const offset = circumference - (safePct / 100) * circumference;
  const pieColor = getSellOutPieColor(safePct);
  const isZero = safePct === 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute -right-3 -bottom-3 pointer-events-none select-none transition-opacity duration-300"
      style={{ opacity }}
    >
      {/* Outer subtle dashed guideline */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius + 6}
        fill="none"
        stroke={isZero ? '#DC2626' : '#8C7A5E'}
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Background track (Sell-In total) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isZero ? '#FEE2E2' : '#D5D2C7'}
        strokeWidth={size * 0.22}
      />
      {/* Sell-Out sold slice */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={pieColor}
        strokeWidth={size * 0.22}
        strokeDasharray={circumference}
        strokeDashoffset={isZero ? circumference * 0.92 : offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Crosshair lines */}
      <line x1={size / 2} y1="4" x2={size / 2} y2={size - 4} stroke={isZero ? '#FCA5A5' : '#8C7A5E'} strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="4" y1={size / 2} x2={size - 4} y2={size / 2} stroke={isZero ? '#FCA5A5' : '#8C7A5E'} strokeWidth="0.5" strokeDasharray="2 2" />
    </svg>
  );
};

export const BoutiqueBrowserBar: React.FC<BoutiqueBrowserBarProps> = ({
  retailers,
  selectedRetailer,
  onSelectRetailer,
  orders,
  uploadedFiles = [],
  sellOutItems = [],
}) => {
  // Aggregate stats per boutique from all orders and sell-out data
  const boutiqueStats = React.useMemo(() => {
    const stats: Record<string, { 
      units: number; 
      unitsSold: number;
      sellOutPct: number;
      styles: Set<string>; 
      wholesale: number; 
      city: string; 
      po: string 
    }> = {};

    // 1. Process Sell-In orders
    orders.forEach((o) => {
      const ret = o.retailer || 'Boutique';
      if (!stats[ret]) {
        stats[ret] = {
          units: 0,
          unitsSold: 0,
          sellOutPct: 0,
          styles: new Set(),
          wholesale: 0,
          city: o.city || 'Russia',
          po: o.poNumber || '',
        };
      }
      stats[ret].units += o.units || 1;
      stats[ret].styles.add(o.styleName);
      stats[ret].wholesale += (o.units || 1) * (o.minWholesalePrice || 0);
      if (o.city && !stats[ret].city) stats[ret].city = o.city;
    });

    // 2. Determine units sold per boutique avoiding double counting between uploadedFiles and sellOutItems
    const canonicalBoutiques = [
      'Boutique Nizhniy Novgorod',
      'Boutique Spb Bolshoy',
      'Boutique Ufa',
      "Boutique Perm'",
      'Boutique Samara',
      'Boutique Spb Nevskiy',
    ];

    canonicalBoutiques.forEach((ret) => {
      if (stats[ret]) {
        const ordersForBoutique = orders.filter(o => o.retailer && o.retailer.toLowerCase().trim() === ret.toLowerCase().trim());
        const ordersSellOutSum = ordersForBoutique.reduce((acc, it) => acc + (it.sellOutUnits || 0), 0);
        const sellOutsForBoutique = sellOutItems.filter(so => so.door && so.door.toLowerCase().trim() === ret.toLowerCase().trim());
        const sellOutSum = sellOutsForBoutique.reduce((acc, it) => acc + (it.unitsSold || 0), 0);
        const fileForBoutique = uploadedFiles.find(f => f.boutique === ret);

        if (sellOutSum > 0) {
          stats[ret].unitsSold = sellOutSum;
        } else if (ordersSellOutSum > 0) {
          stats[ret].unitsSold = ordersSellOutSum;
        } else if (fileForBoutique) {
          stats[ret].unitsSold = fileForBoutique.unitsSold || 0;
        } else {
          stats[ret].unitsSold = 0;
        }
      }
    });

    // Compute sellOutPct and ensure mathematical precision
    Object.keys(stats).forEach((k) => {
      const s = stats[k];
      s.sellOutPct = s.units > 0 ? Number(((s.unitsSold / s.units) * 100).toFixed(1)) : 0;
    });

    return stats;
  }, [orders, uploadedFiles, sellOutItems]);

  // Target 6 Russian boutique list in canonical order
  const targetBoutiques = [
    'Boutique Nizhniy Novgorod',
    'Boutique Spb Bolshoy',
    'Boutique Ufa',
    "Boutique Perm'",
    'Boutique Samara',
    'Boutique Spb Nevskiy',
  ];

  // Helper to format Russian city names
  const cleanRussianCity = (name: string) => {
    if (name.includes('Nizhniy')) return 'Нижний Новгород';
    if (name.includes('Bolshoy')) return 'Санкт-Петербург (Большой)';
    if (name.includes('Nevskiy')) return 'Санкт-Петербург (Невский)';
    if (name.includes('Ufa')) return 'Уфа';
    if (name.includes('Perm')) return 'Пермь';
    if (name.includes('Samara')) return 'Самара';
    return 'Россия';
  };

  // Short Russian boutique titles for cards
  const formatRussianBoutiqueName = (name: string) => {
    if (name.includes('Nizhniy')) return 'Бутик Нижний Новгород';
    if (name.includes('Bolshoy')) return 'Бутик СПб Большой';
    if (name.includes('Nevskiy')) return 'Бутик СПб Невский';
    if (name.includes('Ufa')) return 'Бутик Уфа';
    if (name.includes('Perm')) return 'Бутик Пермь';
    if (name.includes('Samara')) return 'Бутик Самара';
    return name;
  };

  // Previous & Next navigation for browsing
  const currentIndex = targetBoutiques.indexOf(selectedRetailer);
  
  const handlePrev = () => {
    if (currentIndex <= 0) {
      onSelectRetailer(targetBoutiques[targetBoutiques.length - 1]);
    } else {
      onSelectRetailer(targetBoutiques[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex === -1 || currentIndex >= targetBoutiques.length - 1) {
      onSelectRetailer(targetBoutiques[0]);
    } else {
      onSelectRetailer(targetBoutiques[currentIndex + 1]);
    }
  };

  const totalAllUnits = orders.reduce((acc, it) => acc + (it.units || 0), 0);
  const totalAllSold = Object.values(boutiqueStats).reduce((acc, s) => acc + s.unitsSold, 0);
  const globalSellOutPct = totalAllUnits > 0 ? (totalAllSold / totalAllUnits) * 100 : 0;

  return (
    <section className="mb-6 bg-white border border-[#E5E3DC] rounded-xl p-3.5 sm:p-4 shadow-2xs relative overflow-hidden">
      {/* Background Decorative Pie Charts for the Dashboard Section */}
      <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden opacity-[0.045] flex items-center justify-end pr-4">
        <svg width="240" height="240" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="85" fill="none" stroke="#C27803" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="68" fill="none" stroke={getSellOutPieColor(globalSellOutPct)} strokeWidth="22" strokeDasharray="427.2" strokeDashoffset={427.2 * (1 - (globalSellOutPct || 44.5) / 100)} transform="rotate(-90 100 100)" />
          <circle cx="100" cy="100" r="68" fill="none" stroke="#E5E3DC" strokeWidth="22" strokeDasharray="427.2" strokeDashoffset="0" opacity="0.35" />
          <line x1="15" y1="100" x2="185" y2="100" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="100" y1="15" x2="100" y2="185" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="100" cy="100" r="30" fill="#FAF9F5" stroke="#E5E3DC" strokeWidth="1" />
          <text x="100" y="98" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1A1A1A" fontFamily="monospace">
            {globalSellOutPct > 0 ? `${globalSellOutPct.toFixed(1)}%` : 'SELL-OUT'}
          </text>
          <text x="100" y="112" textAnchor="middle" fontSize="7" fill="#8C7A5E" fontFamily="sans-serif">
            SELL-IN / OUT
          </text>
        </svg>
      </div>

      {/* Top Banner: Sfoglia Negozi Header & Controls in Russian */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#F0EFEA]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-serif font-semibold text-[#1A1A1A] tracking-wide">
                Навигация по бутикам (Ритейлеры)
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FAF9F5] text-[#8C7A5E] border border-[#E5E3DC]">
                6 Официальных бутиков
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#FAF9F5] text-[#374151] border border-[#E5E3DC]">
                <PieIcon className="w-3 h-3 text-[#C27803]" />
                <span className="font-semibold">Шкала Sell-Out:</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#DC2626]" title="0% Красный"></span>
                  <span className="text-[#DC2626] font-bold">0%</span>
                  <span className="text-[#9CA3AF]">→</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#4ADE80]" title="50% Светло-зеленый"></span>
                  <span className="text-[#16A34A] font-bold">50%</span>
                  <span className="text-[#9CA3AF]">→</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0B5C37]" title="100% Зеленый"></span>
                  <span className="text-[#0B5C37] font-bold">100%</span>
                </span>
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Выберите бутик для детального анализа заказов Sell-In и продаж Sell-Out или переключайтесь стрелками.
            </p>
          </div>
        </div>

        {/* Carousel / Sequential Browse Controls in Russian */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-[#FAF9F5] text-[#2C2B29] border border-[#DCD9CE] transition-all cursor-pointer shadow-2xs"
            title="Предыдущий бутик"
          >
            <ChevronLeft className="w-4 h-4 text-[#C27803]" />
            <span className="hidden sm:inline">Назад</span>
          </button>

          <span className="text-[11px] font-mono text-[#6B7280] px-2 py-1 rounded bg-[#FAF9F5] border border-[#E5E3DC]">
            {currentIndex >= 0 ? `${currentIndex + 1} из 6` : 'Все бутики'}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-[#FAF9F5] text-[#2C2B29] border border-[#DCD9CE] transition-all cursor-pointer shadow-2xs"
            title="Следующий бутик"
          >
            <span className="hidden sm:inline">Вперед</span>
            <ChevronRight className="w-4 h-4 text-[#C27803]" />
          </button>

          <button
            onClick={() => onSelectRetailer('ALL')}
            className={`ml-1 text-xs px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer border ${
              selectedRetailer === 'ALL'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-semibold shadow-2xs'
                : 'bg-white text-[#6B7280] hover:text-[#1A1A1A] border-[#DCD9CE] hover:bg-[#FAF9F5]'
            }`}
            title="Показать консолидированные данные по всем 6 бутикам"
          >
            Все бутики ({totalAllUnits} шт.)
          </button>
        </div>
      </div>

      {/* Boutique Cards Grid with Pie Charts */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {targetBoutiques.map((name, idx) => {
          const isSelected = selectedRetailer === name;
          const stat = boutiqueStats[name] || {
            units: 0,
            unitsSold: 0,
            sellOutPct: 0,
            styles: new Set(),
            wholesale: 0,
            city: '',
            po: '',
          };
          const cityLabel = cleanRussianCity(name);
          const boutiqueTitle = formatRussianBoutiqueName(name);

          // Find file info for this boutique
          const bFile = uploadedFiles.find((f) => f.boutique === name);
          const effectiveUnitsSold = bFile ? bFile.unitsSold : stat.unitsSold;
          const effectiveSellOutPct = stat.units > 0 ? (effectiveUnitsSold / stat.units) * 100 : 0;

          return (
            <button
              key={name}
              onClick={() => onSelectRetailer(name)}
              className={`relative text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col justify-between border group overflow-hidden ${
                isSelected
                  ? 'bg-[#FFF9EA] border-[#C27803] shadow-xs ring-1 ring-[#C27803]/40'
                  : 'bg-[#FAF9F5] hover:bg-white border-[#E5E3DC] hover:border-[#DCD9CE] shadow-2xs'
              }`}
            >
              {/* Card Background Watermark Pie Chart */}
              <CardWatermarkPie
                sellOutPct={effectiveSellOutPct}
                size={88}
                opacity={isSelected ? 0.12 : 0.065}
              />

              {/* Badge Number & Selected Tag */}
              <div className="flex items-center justify-between gap-1 mb-1.5 relative z-10">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  isSelected ? 'bg-[#C27803] text-white' : 'bg-white border border-[#E5E3DC] text-[#6B7280]'
                }`}>
                  #{idx + 1}
                </span>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0B5C37]">
                    <CheckCircle2 className="w-3 h-3 text-[#0B5C37]" />
                    <span>Активен</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#1A1A1A] flex items-center gap-0.5 transition-colors">
                    <span>Выбрать</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Boutique Name & City */}
              <div className="mb-2 relative z-10">
                <h4 className={`text-xs font-semibold leading-tight line-clamp-2 ${
                  isSelected ? 'text-[#1A1A1A]' : 'text-[#374151] group-hover:text-[#1A1A1A]'
                }`}>
                  {boutiqueTitle}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-[#6B7280] mt-1">
                  <MapPin className="w-2.5 h-2.5 text-[#C27803] shrink-0" />
                  <span className="truncate">{cityLabel}</span>
                </div>

                {/* Uploaded File badge if present */}
                {bFile && (
                  <div className="mt-1.5 p-1 rounded bg-[#E8F5E9] border border-[#0B5C37]/30 text-[10px] text-[#0B5C37] font-mono flex items-center justify-between">
                    <span className="truncate max-w-[85px]" title={bFile.fileName}>
                      📄 {bFile.fileName}
                    </span>
                    <span className="font-bold text-[#0B5C37] ml-1">+{bFile.unitsSold} шт.</span>
                  </div>
                )}
              </div>

              {/* Interactive Donut / Pie Chart & Metrics Container */}
              <div className={`mt-auto pt-2 border-t relative z-10 ${
                isSelected ? 'border-[#C27803]/30' : 'border-[#E5E3DC]'
              }`}>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#6B7280] font-mono leading-none">Sell-In</span>
                    <span className={`font-mono font-bold text-xs mt-0.5 ${isSelected ? 'text-[#C27803]' : 'text-[#1A1A1A]'}`}>
                      {stat.units} шт.
                    </span>
                    {effectiveUnitsSold > 0 && (
                      <span className="text-[9px] font-mono text-[#0B5C37] font-semibold mt-0.5">
                        Прод: {effectiveUnitsSold} шт.
                      </span>
                    )}
                  </div>

                  {/* Visual Donut Chart showing Sell-Out % */}
                  <div className="flex flex-col items-center">
                    <BoutiqueDonutChart sellOutPct={effectiveSellOutPct} size={36} strokeWidth={4} />
                    <span className="text-[8px] font-mono uppercase text-[#8C7A5E] mt-0.5">
                      Sell-Out
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Boutique Highlight Ribbon in Russian */}
      {selectedRetailer !== 'ALL' && (
        <div className="relative z-10 mt-3 pt-2.5 border-t border-[#F0EFEA] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#0B5C37] animate-pulse" />
            <span>
              Каталог заказов: <strong className="text-[#1A1A1A]">{formatRussianBoutiqueName(selectedRetailer)}</strong>
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-[#C27803] font-medium font-mono">
              {boutiqueStats[selectedRetailer]?.units || 0} единиц заказано
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-[#6B7280]">
              {boutiqueStats[selectedRetailer]?.styles.size || 0} моделей в коллекции
            </span>
            {boutiqueStats[selectedRetailer]?.unitsSold > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-[#0B5C37] font-semibold font-mono">
                  {boutiqueStats[selectedRetailer].unitsSold} шт. продано ({boutiqueStats[selectedRetailer].sellOutPct.toFixed(1)}%)
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => onSelectRetailer('ALL')}
            className="text-[11px] text-[#0284C7] hover:underline font-mono flex items-center gap-1 cursor-pointer"
          >
            Вернуться к общему каталогу (Все бутики) →
          </button>
        </div>
      )}
    </section>
  );
};
