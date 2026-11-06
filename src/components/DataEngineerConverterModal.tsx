/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowRight, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { cleanRawValue, normalizeSize, baseStyleName, extractColorPrefix } from '../utils/etl';

interface DataEngineerConverterModalProps {
  onClose: () => void;
}

export const DataEngineerConverterModal: React.FC<DataEngineerConverterModalProps> = ({ onClose }) => {
  const sampleInput = `Capo,CodiceColore,TagliaGrezza,PrezzoWholesale,PrezzoRetail,Venduti
"Xariel A.","Mostarda(1948)"," 042 ",183.0,620.0,2
"Collisione","194800000000","u",258.5,877.0,1
"Dominanza B","Nero_Oro(0101 0002)","  UNI ",60.0,202.0,2`;

  const [inputData, setInputData] = useState(sampleInput);
  const [outputResult, setOutputResult] = useState<string>('');

  const handleConvert = () => {
    try {
      const lines = inputData.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return;

      const converted = lines.slice(1).map(line => {
        const parts = line.split(',').map(p => cleanRawValue(p));
        const rawStyle = parts[0] || '';
        const rawColor = parts[1] || '';
        const rawSize = parts[2] || '';
        const wholesale = parseFloat(parts[3]) || 0;
        const retail = parseFloat(parts[4]) || 0;
        const units = parseInt(parts[5], 10) || 1;

        return {
          original_style: rawStyle,
          clean_style_name: baseStyleName(rawStyle),
          normalized_size: normalizeSize(rawSize),
          color_prefix: extractColorPrefix(rawColor, rawColor),
          wholesale_eur: wholesale,
          retail_msrp_eur: retail,
          units,
          calculated_markup: wholesale > 0 ? (retail / wholesale).toFixed(2) : '0',
          reconciliation_key: `${baseStyleName(rawStyle).toUpperCase()}_${extractColorPrefix(rawColor, rawColor)}`
        };
      });

      setOutputResult(JSON.stringify(converted, null, 2));
    } catch (err: unknown) {
      setOutputResult(`Errore nella conversione: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  React.useEffect(() => {
    handleConvert();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                Convertitore Formati Cassa & JOOR (Data Engineering Workbench)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Strumento di allineamento per importazioni eterogenee da gestionali cassa locali
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workbench Body */}
        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Side */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#1A1A1A]">Dati Grezzi Cassa / File Locale (CSV)</span>
                <button
                  onClick={() => {
                    setInputData(sampleInput);
                    handleConvert();
                  }}
                  className="text-[11px] text-[#C27803] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Ripristina Esempio</span>
                </button>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={12}
                className="w-full bg-[#FAF9F5] border border-[#E5E3DC] rounded-xl p-3 font-mono text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C27803]"
                placeholder="Incolla qui righe CSV da convertire..."
              />
              <button
                onClick={handleConvert}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] text-white font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Esegui Sanitizzazione Deterministica</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C27803]" />
              </button>
            </div>

            {/* Output Side */}
            <div>
              <span className="font-semibold text-[#1A1A1A] block mb-2">
                Output Normalizzato Luisa Spagnoli (JSON Schema)
              </span>
              <pre className="w-full h-[280px] bg-[#18181B] border border-[#27272A] rounded-xl p-3 font-mono text-xs text-[#34D399] overflow-auto shadow-inner">
                {outputResult}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E3DC] bg-[#FAF9F5] flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">
            Algoritmi attivi: cleanRawValue · normalizeSize · baseStyleName · extractColorPrefix
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
