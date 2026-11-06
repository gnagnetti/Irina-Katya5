/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FilterState, 
  MergedProduct, 
  OrderItem, 
  SellOutItem, 
  UploadedFileInfo, 
  VerificationAuditReport, 
  ViewMode 
} from './types';
import { PackageCheck, Upload, PieChart as PieIcon } from 'lucide-react';
import { 
  mergeOrderAndSellOut, 
  parseJoorCsv, 
  runSellOutVerificationAudit,
  generateDemoSellOutRecords,
  generateDemoSellOutRecordsForBoutique,
  normalizeBoutiqueSellOut,
  getSellOutPieColor,
  extractSellOutFromOrders,
  deriveUploadedFilesFromOrders
} from './utils/etl';
import { Header } from './components/Header';
import { UploadedFilesBanner } from './components/UploadedFilesBanner';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { TableView } from './components/TableView';
import { SilhouetteBreakdown } from './components/SilhouetteBreakdown';
import { SizeMatrixView } from './components/SizeMatrixView';
import { PoComparisonView } from './components/PoComparisonView';
import { BoutiqueBrowserBar } from './components/BoutiqueBrowserBar';
import { BoutiqueBrowserView } from './components/BoutiqueBrowserView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ModelTrainingSheet } from './components/ModelTrainingSheet';
import { VerificationLoopModal } from './components/VerificationLoopModal';
import { FileUploadModal } from './components/FileUploadModal';
import { PythonScriptModal } from './components/PythonScriptModal';
import { DataEngineerConverterModal } from './components/DataEngineerConverterModal';
import { PythonAnalystView } from './components/PythonAnalystView';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_WORKSPACE_KEY = 'luisa-spagnoli-boutiques-fw26-v4';

// Safe wrapper around browser localStorage to handle QuotaExceededError gracefully
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[Storage] Salvataggio offline per "${key}" non riuscito:`, e);
      return false;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// Default Initial 6 Russian Boutique POS Files matching official database
const INITIAL_BOUTIQUE_FILES: UploadedFileInfo[] = [
  {
    id: 'demo-nn',
    fileName: 'Нижний зима 2026.xlsx',
    boutique: 'Boutique Nizhniy Novgorod',
    recordsCount: 140,
    unitsSold: 140,
    timestamp: '10:28:15',
    parsingMethod: '1С POS Принцип Невский',
  },
  {
    id: 'demo-bolshoy',
    fileName: 'большой зима 2026.xlsx',
    boutique: 'Boutique Spb Bolshoy',
    recordsCount: 284,
    unitsSold: 284,
    timestamp: '10:29:40',
    parsingMethod: '1С POS Принцип Невский',
  },
  {
    id: 'demo-ufa',
    fileName: 'Уфа зима 15.10.xlsx',
    boutique: 'Boutique Ufa',
    recordsCount: 45,
    unitsSold: 45,
    timestamp: '10:31:02',
    parsingMethod: '1С POS Принцип Невский',
  },
  {
    id: 'demo-perm',
    fileName: 'Пермь зима 10.xlsx',
    boutique: "Boutique Perm'",
    recordsCount: 122,
    unitsSold: 122,
    timestamp: '10:32:18',
    parsingMethod: '1С POS Принцип Невский',
  },
  {
    id: 'demo-samara',
    fileName: 'Самара зима 2026.xlsx',
    boutique: 'Boutique Samara',
    recordsCount: 185,
    unitsSold: 185,
    timestamp: '10:33:55',
    parsingMethod: '1С POS Принцип Невский',
  },
  {
    id: 'demo-nevskiy',
    fileName: 'невский зима 2026.xlsx',
    boutique: 'Boutique Spb Nevskiy',
    recordsCount: 331,
    unitsSold: 331,
    timestamp: '10:35:10',
    parsingMethod: '1С POS Принцип Невский',
  },
];

export default function App() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [sellOutItems, setSellOutItems] = useState<SellOutItem[]>(() => {
    try {
      const cached = safeStorage.getItem('smykova-uploaded-sellout-v6');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>(() => {
    try {
      const cached = safeStorage.getItem('smykova-uploaded-files-meta-v6');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_BOUTIQUE_FILES;
  });

  const [selectedRetailer, setSelectedRetailer] = useState<string>('Boutique Nizhniy Novgorod');
  const [language, setLanguage] = useState<'RU' | 'IT'>('RU');
  const [viewMode, setViewMode] = useState<ViewMode>('lookbook');
  const [selectedLinesheet, setSelectedLinesheet] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadModalTab, setUploadModalTab] = useState<'sell-out' | 'sell-in'>('sell-out');
  const [showDashboard, setShowDashboard] = useState<boolean>(true);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    linesheet: 'ALL',
    silhouette: 'ALL',
    sellOutStatus: 'ALL',
    poNumber: 'ALL',
    sortBy: 'sellOutDesc',
  });

  // Modals
  const [detailProduct, setDetailProduct] = useState<MergedProduct | null>(null);
  const [trainingProduct, setTrainingProduct] = useState<MergedProduct | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPythonScriptOpen, setIsPythonScriptOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  // Load initial orders from the new official database CSV (5,048 records)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch new official database CSV from assets
        let response = await fetch('/assets/aistudio/database_ordini__1__7caa154e.csv');
        if (!response.ok) {
          response = await fetch('./assets/aistudio/database_ordini__1__7caa154e.csv');
        }
        if (!response.ok) {
          response = await fetch('/assets/aistudio/database_ordini.csv');
        }
        if (!response.ok) {
          response = await fetch('./assets/aistudio/database_ordini.csv');
        }
        if (!response.ok) {
          response = await fetch('/assets/aistudio/Ordini_CSV_82299fcf.csv');
        }
        if (!response.ok) {
          response = await fetch('./assets/aistudio/Ordini_CSV_82299fcf.csv');
        }

        if (response.ok) {
          const csvText = await response.text();
          const parsed = parseJoorCsv(csvText);
          if (parsed.length > 0) {
            setOrders(parsed);

            // Extract exact sell-out records directly from the loaded database
            const dbSellOut = extractSellOutFromOrders(parsed);
            if (dbSellOut.length > 0) {
              setSellOutItems(dbSellOut);
              safeStorage.setItem('smykova-uploaded-sellout-v6', JSON.stringify(dbSellOut));
            }

            // Derive authentic POS metadata from database
            const dbFiles = deriveUploadedFilesFromOrders(parsed);
            setUploadedFiles(dbFiles);
            safeStorage.setItem('smykova-uploaded-files-meta-v6', JSON.stringify(dbFiles));
          }
        }
      } catch (err) {
        console.error('Error loading initial orders dataset:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Dynamic unique retailers extracted from loaded Sell-In data ordered by boutique network
  const retailers = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.retailer && o.retailer.trim()) {
        set.add(o.retailer.trim());
      }
    });

    const targetOrder = [
      'Boutique Nizhniy Novgorod',
      'Boutique Spb Bolshoy',
      'Boutique Ufa',
      "Boutique Perm'",
      'Boutique Samara',
      'Boutique Spb Nevskiy',
    ];

    if (set.size === 0) {
      return targetOrder;
    }

    const list = Array.from(set);
    return list.sort((a, b) => {
      const idxA = targetOrder.indexOf(a);
      const idxB = targetOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [orders]);

  // Set default retailer to first available boutique
  useEffect(() => {
    if (retailers.length > 0) {
      if (selectedRetailer !== 'ALL' && !retailers.includes(selectedRetailer)) {
        const preferred = retailers.find(r => r.includes('Nizhniy')) || retailers[0];
        setSelectedRetailer(preferred);
      }
    }
  }, [retailers, selectedRetailer]);

  // Filter orders by chosen retailer
  const retailerFilteredOrders = useMemo(() => {
    if (selectedRetailer === 'ALL') {
      return orders;
    }
    return orders.filter(
      (o) => o.retailer?.toLowerCase().trim() === selectedRetailer.toLowerCase().trim()
    );
  }, [orders, selectedRetailer]);

  // Consolidated products from current retailer selection and optional sell-out
  const products = useMemo(() => {
    return mergeOrderAndSellOut(retailerFilteredOrders, sellOutItems);
  }, [retailerFilteredOrders, sellOutItems]);

  const totalSellOutUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.unitsSold, 0);
  }, [products]);

  // Retailer metadata details
  const selectedRetailerInfo = useMemo(() => {
    const matching = retailerFilteredOrders[0] || orders.find(o => o.retailer === selectedRetailer) || orders[0];
    if (!matching) return undefined;
    return {
      customerCode: matching.customerCode || '39663',
      city: matching.city || 'Nizhny Novgorod',
      country: matching.country || 'Russia',
      door: matching.door || selectedRetailer,
    };
  }, [retailerFilteredOrders, orders, selectedRetailer]);

  // Distinct linesheets
  const linesheets = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.linesheet) set.add(o.linesheet);
    });
    return ['ALL', ...Array.from(set)];
  }, [orders]);

  // Distinct silhouettes
  const silhouettes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.silhouette) set.add(p.silhouette);
    });
    return Array.from(set).sort();
  }, [products]);

  // Distinct POs
  const poNumbers = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.poNumbers.forEach((po) => set.add(po));
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Linesheet filter (top tab or dropdown)
        const targetLinesheet =
          selectedLinesheet !== 'ALL' ? selectedLinesheet : filters.linesheet;
        if (targetLinesheet !== 'ALL' && p.linesheet !== targetLinesheet) {
          return false;
        }

        // Silhouette filter
        if (filters.silhouette !== 'ALL' && p.silhouette !== filters.silhouette) {
          return false;
        }

        // PO filter
        if (filters.poNumber !== 'ALL' && !p.poNumbers.includes(filters.poNumber)) {
          return false;
        }

        // Sell-out status filter
        if (filters.sellOutStatus === 'BESTSELLER' && p.sellOutPct < 70) {
          return false;
        }
        if (
          filters.sellOutStatus === 'HEALTHY' &&
          (p.sellOutPct < 40 || p.sellOutPct >= 70)
        ) {
          return false;
        }
        if (filters.sellOutStatus === 'SLOW' && p.sellOutPct >= 40) {
          return false;
        }
        if (filters.sellOutStatus === 'OUT_OF_STOCK' && p.stockRemaining > 0) {
          return false;
        }

        // Search query
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          const matchName = p.styleName.toLowerCase().includes(q);
          const matchCode = p.styleNumber.toLowerCase().includes(q);
          const matchColor = (p.color || p.colorCode).toLowerCase().includes(q);
          const matchFab = (p.fabrication || '').toLowerCase().includes(q);
          const matchSil = (p.silhouette || '').toLowerCase().includes(q);

          if (!matchName && !matchCode && !matchColor && !matchFab && !matchSil) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'sellOutDesc':
            return b.sellOutPct - a.sellOutPct;
          case 'unitsDesc':
            return b.unitsOrdered - a.unitsOrdered;
          case 'wholesaleDesc':
            return b.totalWholesaleEur - a.totalWholesaleEur;
          case 'retailDesc':
            return b.totalRetailEur - a.totalRetailEur;
          case 'nameAsc':
            return a.styleName.localeCompare(b.styleName);
          default:
            return 0;
        }
      });
  }, [products, selectedLinesheet, filters]);

  // Overall aggregated sell-out rate across visible products
  const overallSellOutStats = useMemo(() => {
    let ordered = 0;
    let sold = 0;
    products.forEach((p) => {
      ordered += p.unitsOrdered;
      sold += p.unitsSold;
    });
    const pct = ordered > 0 ? (sold / ordered) * 100 : 0;
    return { ordered, sold, pct };
  }, [products]);

  // Verification audit report
  const auditReport: VerificationAuditReport = useMemo(() => {
    return runSellOutVerificationAudit(products);
  }, [products]);

  // Handlers for data upload and reset
  const handleApplyNewOrders = (newOrders: OrderItem[]) => {
    setOrders(newOrders);
    safeStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, JSON.stringify(newOrders));
  };

  const handleResetToDefault = async () => {
    safeStorage.removeItem(LOCAL_STORAGE_WORKSPACE_KEY);
    safeStorage.removeItem('smykova-uploaded-sellout-v6');
    safeStorage.removeItem('smykova-uploaded-files-meta-v6');
    try {
      let response = await fetch('/assets/aistudio/database_ordini__1__7caa154e.csv');
      if (!response.ok) response = await fetch('./assets/aistudio/database_ordini__1__7caa154e.csv');
      if (!response.ok) response = await fetch('/assets/aistudio/database_ordini.csv');
      if (response.ok) {
        const csvText = await response.text();
        const parsed = parseJoorCsv(csvText);
        setOrders(parsed);
        const dbSellOut = extractSellOutFromOrders(parsed);
        setSellOutItems(dbSellOut);
        const dbFiles = deriveUploadedFilesFromOrders(parsed);
        setUploadedFiles(dbFiles);
      }
    } catch (e) {
      console.error('Error resetting dataset:', e);
    }
  };

  const handleApplySellOut = (
    newSellOut: SellOutItem[], 
    targetBoutique?: string,
    fileInfo?: UploadedFileInfo
  ) => {
    let merged: SellOutItem[];
    if (targetBoutique && targetBoutique !== 'ALL') {
      const others = sellOutItems.filter(s => s.door && s.door !== targetBoutique);
      const tagged = newSellOut.map(s => ({
        ...s,
        door: s.door || targetBoutique,
      }));
      merged = [...others, ...tagged];
    } else {
      merged = newSellOut;
    }
    setSellOutItems(merged);
    safeStorage.setItem('smykova-uploaded-sellout', JSON.stringify(merged));

    if (fileInfo) {
      setUploadedFiles(prev => {
        const filtered = prev.filter(f => !(f.boutique === fileInfo.boutique && f.fileName === fileInfo.fileName));
        const updated = [fileInfo, ...filtered];
        safeStorage.setItem('smykova-uploaded-files-meta-v6', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleRemoveUploadedFile = (fileId: string) => {
    const targetFile = uploadedFiles.find(f => f.id === fileId);
    if (!targetFile) return;

    const remainingFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(remainingFiles);
    safeStorage.setItem('smykova-uploaded-files-meta-v6', JSON.stringify(remainingFiles));

    const otherFileForBoutique = remainingFiles.find(f => f.boutique === targetFile.boutique);
    if (!otherFileForBoutique) {
      const remainingSellOut = sellOutItems.filter(s => s.door !== targetFile.boutique);
      setSellOutItems(remainingSellOut);
      safeStorage.setItem('smykova-uploaded-sellout-v6', JSON.stringify(remainingSellOut));
    }
  };

  const handleClearSellOut = (targetBoutique?: string) => {
    if (targetBoutique && targetBoutique !== 'ALL') {
      const remaining = sellOutItems.filter(s => s.door !== targetBoutique);
      setSellOutItems(remaining);
      safeStorage.setItem('smykova-uploaded-sellout-v6', JSON.stringify(remaining));
      const remainingFiles = uploadedFiles.filter(f => f.boutique !== targetBoutique);
      setUploadedFiles(remainingFiles);
      safeStorage.setItem('smykova-uploaded-files-meta-v6', JSON.stringify(remainingFiles));
    } else {
      setSellOutItems([]);
      safeStorage.removeItem('smykova-uploaded-sellout-v6');
      setUploadedFiles([]);
      safeStorage.removeItem('smykova-uploaded-files-meta-v6');
    }
  };

  const handleOpenUpload = (tab: 'sell-out' | 'sell-in' = 'sell-out') => {
    setUploadModalTab(tab);
    setIsUploadOpen(true);
  };

  const handleExportExcel = () => {
    const exportRows = filteredProducts.map((p) => ({
      'Модель': p.styleName,
      'Артикул': p.styleNumber,
      'Цвет': p.color || p.colorCode,
      'Категория': p.silhouette || p.category,
      'Ткань': p.fabrication || '',
      'Опт (€)': p.wholesaleEur,
      'Розница (€)': p.suggRetailEur,
      'Заказ (Sell-In)': p.unitsOrdered,
      'Продажи (Sell-Out)': p.unitsSold,
      'Остаток на складе': p.stockRemaining,
      '% Продаж (Sell-Out)': `${p.sellOutPct.toFixed(1)}%`,
      'Выручка (€)': p.realizedRevenueEur,
      'Заказ PO#': p.poNumbers.join(', '),
      'Бутик': selectedRetailer !== 'ALL' ? selectedRetailer : 'Все бутики',
      'Город': selectedRetailerInfo?.city || 'Нижний Новгород',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Luisa Spagnoli FW26');
    const safeName = (selectedRetailer !== 'ALL' ? selectedRetailer : 'Consolidato').replace(/[^\w-]/g, '_');
    XLSX.writeFile(
      wb,
      `Luisa_Spagnoli_FW26_SellIn_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Decorative Sell-In / Sell-Out % Pie Charts across the Dashboard */}
      {showDashboard && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Left Upper Pie Chart Watermark */}
          <div className="absolute top-28 -left-20 opacity-[0.04]">
            <svg width="420" height="420" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="82" fill="none" stroke="#C27803" strokeWidth="1.5" strokeDasharray="3 4" />
              <circle 
                cx="100" 
                cy="100" 
                r="66" 
                fill="none" 
                stroke={getSellOutPieColor(overallSellOutStats.pct)} 
                strokeWidth="22" 
                strokeDasharray="414.7" 
                strokeDashoffset={414.7 * (1 - (overallSellOutStats.pct || 44.5) / 100)} 
                transform="rotate(-90 100 100)" 
              />
              <circle cx="100" cy="100" r="66" fill="none" stroke="#1A1A1A" strokeWidth="22" strokeDasharray="414.7" strokeDashoffset="0" opacity="0.2" />
              <circle cx="100" cy="100" r="32" fill="#FAF9F5" stroke="#E5E3DC" strokeWidth="1" />
              <line x1="18" y1="100" x2="182" y2="100" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="100" y1="18" x2="100" y2="182" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
              <text x="100" y="97" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1A1A1A" fontFamily="monospace">
                {overallSellOutStats.pct > 0 ? `${overallSellOutStats.pct.toFixed(1)}%` : '0%'}
              </text>
              <text x="100" y="111" textAnchor="middle" fontSize="7" fill={getSellOutPieColor(overallSellOutStats.pct)} fontFamily="sans-serif">SELL-OUT %</text>
            </svg>
          </div>

          {/* Right Lower Pie Chart Watermark */}
          <div className="absolute bottom-20 -right-24 opacity-[0.04]">
            <svg width="480" height="480" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="#8C7A5E" strokeWidth="1" strokeDasharray="3 4" />
              <circle 
                cx="100" 
                cy="100" 
                r="70" 
                fill="none" 
                stroke={getSellOutPieColor(overallSellOutStats.pct)} 
                strokeWidth="18" 
                strokeDasharray="439.8" 
                strokeDashoffset={439.8 * (1 - (overallSellOutStats.pct || 44.5) / 100)} 
                transform="rotate(-90 100 100)" 
              />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#C27803" strokeWidth="18" strokeDasharray="439.8" strokeDashoffset="0" opacity="0.15" />
              <circle cx="100" cy="100" r="36" fill="#FAF9F5" stroke="#E5E3DC" strokeWidth="1" />
              <line x1="12" y1="100" x2="188" y2="100" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="100" y1="12" x2="100" y2="188" stroke="#8C7A5E" strokeWidth="0.8" strokeDasharray="2 2" />
              <text x="100" y="97" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1A1A1A" fontFamily="monospace">
                {(100 - overallSellOutStats.pct).toFixed(1)}%
              </text>
              <text x="100" y="111" textAnchor="middle" fontSize="7" fill="#8C7A5E" fontFamily="sans-serif">SELL-IN %</text>
            </svg>
          </div>
        </div>
      )}

      {/* 1. Header with brand identity, retailer selector, linesheets & views */}
      <Header
        selectedRetailer={selectedRetailer}
        retailers={retailers}
        onSelectRetailer={setSelectedRetailer}
        retailerCustomerCode={selectedRetailerInfo?.customerCode}
        retailerCity={selectedRetailerInfo?.city}
        retailerCountry={selectedRetailerInfo?.country}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        selectedLinesheet={selectedLinesheet}
        linesheets={linesheets}
        onSelectLinesheet={setSelectedLinesheet}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenUpload={() => handleOpenUpload('sell-in')}
        onOpenSellOutUpload={() => handleOpenUpload('sell-out')}
        onOpenPythonScript={() => setIsPythonScriptOpen(true)}
        onOpenConverter={() => setIsConverterOpen(true)}
        onExportExcel={handleExportExcel}
        totalProductsCount={products.length}
        sellOutUnitsCount={totalSellOutUnits}
        uploadedFiles={uploadedFiles}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'RU' ? 'IT' : 'RU'))}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Loading state in Russian */}
        {isLoading ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C27803] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-serif text-lg text-[#1A1A1A]">
              Загрузка каталога Luisa Spagnoli FW26 и заказов JOOR (Sell-In)...
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Сверка артикулов, цветов и заказов B2B по бутикам.
            </p>
          </div>
        ) : (
          <>
            {showDashboard && (
              <>
                {/* 1. Sfoglia per Negozio (Retailer) Bar with Pie Charts */}
                <BoutiqueBrowserBar
                  retailers={retailers}
                  selectedRetailer={selectedRetailer}
                  onSelectRetailer={setSelectedRetailer}
                  orders={orders}
                  uploadedFiles={uploadedFiles}
                  sellOutItems={sellOutItems}
                  onOpenUploadForBoutique={(b) => {
                    setSelectedRetailer(b);
                    handleOpenUpload('sell-out');
                  }}
                  language={language}
                />

                {/* 2. Uploaded File & Parsing Status Banner (Principio Nevskiy 1C) */}
                <UploadedFilesBanner
                  uploadedFiles={uploadedFiles}
                  totalSellOutUnits={totalSellOutUnits}
                  totalSellInUnits={orders.reduce((acc, it) => acc + (it.units || 0), 0)}
                  selectedRetailer={selectedRetailer}
                  onSelectRetailer={setSelectedRetailer}
                  onOpenUpload={handleOpenUpload}
                  onOpenAudit={() => setIsAuditOpen(true)}
                  onRemoveFile={handleRemoveUploadedFile}
                  onClearAll={() => handleClearSellOut()}
                  onSimulateDemo={() => {
                    const dbSellOut = extractSellOutFromOrders(orders);
                    setSellOutItems(dbSellOut);
                    safeStorage.setItem('smykova-uploaded-sellout-v6', JSON.stringify(dbSellOut));
                    const dbFiles = deriveUploadedFilesFromOrders(orders);
                    setUploadedFiles(dbFiles);
                    safeStorage.setItem('smykova-uploaded-files-meta-v6', JSON.stringify(dbFiles));
                  }}
                  language={language}
                />

                {/* 3. Executive KPI Metrics with Pie Charts */}
                <KpiMetrics products={filteredProducts} language={language} />
              </>
            )}

            {/* 3. Filter Bar in Russian */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              silhouettes={silhouettes}
              poNumbers={poNumbers}
              totalResults={filteredProducts.length}
              language={language}
            />

            {/* 4. Active View Content */}
            {viewMode === 'lookbook' && (
              <div>
                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center text-[#6B7280] bg-white border border-[#E5E3DC] rounded-xl shadow-xs">
                    Ни одной модели не найдено с выбранными фильтрами. Попробуйте изменить параметры поиска или сбросить фильтры.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onOpenDetail={setDetailProduct}
                        onOpenTraining={setTrainingProduct}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <TableView
                products={filteredProducts}
                onOpenDetail={setDetailProduct}
                onOpenTraining={setTrainingProduct}
                boutiqueName={selectedRetailer !== 'ALL' ? selectedRetailer : 'Все бутики'}
              />
            )}

            {viewMode === 'silhouettes' && (
              <SilhouetteBreakdown
                products={filteredProducts}
                onSelectSilhouette={(sil) => {
                  setFilters({ ...filters, silhouette: sil });
                  setViewMode('lookbook');
                }}
              />
            )}

            {viewMode === 'sizes' && (
              <SizeMatrixView
                products={filteredProducts}
                onOpenDetail={setDetailProduct}
              />
            )}

            {viewMode === 'boutiques' && (
              <BoutiqueBrowserView
                products={products}
                orders={orders}
                selectedRetailer={selectedRetailer}
                onSelectRetailer={setSelectedRetailer}
                onSwitchToLookbook={() => setViewMode('lookbook')}
              />
            )}

            {viewMode === 'po-compare' && (
              <PoComparisonView
                products={products}
                onSelectPo={(po) => {
                  setFilters({ ...filters, poNumber: po });
                  setViewMode('lookbook');
                }}
              />
            )}

            {viewMode === 'python-analyst' && (
              <PythonAnalystView
                orders={orders}
                currentSellOut={sellOutItems}
                selectedRetailer={selectedRetailer}
              />
            )}
          </>
        )}
      </main>

      {/* Footer in Russian */}
      <footer className="border-t border-[#E5E3DC] bg-white py-6 text-xs text-[#6B7280] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold text-[#1A1A1A]">Luisa Spagnoli</span>
            <span>·</span>
            <span>Осень / Зима 2026 (FW26 / 226FW)</span>
            <span>·</span>
            <span className="text-[#C27803] font-medium">Wholesale Sell-In & Sell-Out Аналитика</span>
          </div>

          <div className="flex items-center gap-4 text-[#6B7280]">
            <span>
              Клиент: {selectedRetailer !== 'ALL' ? selectedRetailer : 'Консолидированный отчет (Все бутики)'}
              {selectedRetailerInfo?.customerCode ? ` (ID ${selectedRetailerInfo.customerCode})` : ''}
            </span>
            <span>·</span>
            <span>Представитель: Luca Gnagnetti</span>
            <span>·</span>
            <button
              onClick={() => setIsAuditOpen(true)}
              className="text-[#0B5C37] font-medium hover:underline cursor-pointer"
            >
              Zero-Discrepancy Сверка 1С POS ✓
            </button>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onOpenTraining={(prod) => {
            setDetailProduct(null);
            setTrainingProduct(prod);
          }}
        />
      )}

      {trainingProduct && (
        <ModelTrainingSheet
          product={trainingProduct}
          onClose={() => setTrainingProduct(null)}
          allProducts={products}
          onSelectProduct={(prod) => setTrainingProduct(prod)}
        />
      )}

      {isAuditOpen && (
        <VerificationLoopModal
          auditReport={auditReport}
          onClose={() => setIsAuditOpen(false)}
          boutiqueName={selectedRetailer !== 'ALL' ? selectedRetailer : 'Все бутики РФ'}
          products={products}
        />
      )}

      {isUploadOpen && (
        <FileUploadModal
          onClose={() => setIsUploadOpen(false)}
          onApplyNewOrders={handleApplyNewOrders}
          onApplySellOut={handleApplySellOut}
          onClearSellOut={handleClearSellOut}
          onResetToDefault={handleResetToDefault}
          currentOrdersCount={orders.length}
          currentSellOutCount={totalSellOutUnits}
          initialTab={uploadModalTab}
          products={products}
          orders={orders}
          selectedRetailer={selectedRetailer}
          onSelectRetailer={setSelectedRetailer}
          currentSellOutItems={sellOutItems}
        />
      )}

      {isPythonScriptOpen && (
        <PythonScriptModal 
          onClose={() => setIsPythonScriptOpen(false)} 
          onOpenInteractiveAnalyst={() => setViewMode('python-analyst')}
        />
      )}

      {isConverterOpen && (
        <DataEngineerConverterModal onClose={() => setIsConverterOpen(false)} />
      )}
    </div>
  );
}
