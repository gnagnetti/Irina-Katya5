/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, Play } from 'lucide-react';
import { PYTHON_REFERENCE_SCRIPT, downloadPythonScriptFile } from '../utils/etl';

interface PythonScriptModalProps {
  onClose: () => void;
  onOpenInteractiveAnalyst?: () => void;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ 
  onClose,
  onOpenInteractiveAnalyst 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PYTHON_REFERENCE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                Script Python Universale (Consolidamento Multi-Store & Indice Dinamico)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Funzioni parse_sell_in, parse_sell_out (con ricerca dinamica 'Количество' riga 6) ed elabora_tutti_i_negozi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#0B5C37]" /> : <Copy className="w-3.5 h-3.5 text-[#C27803]" />}
              <span>{copied ? 'Copiato!' : 'Copia Codice Python'}</span>
            </button>
            <button
              onClick={downloadPythonScriptFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#0284C7] border border-[#BAE6FD] text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica .py</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Script Code Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between text-xs text-[#6B7280] gap-2">
            <span>Linguaggio: Python 3.10+ · Dipendenze: <code className="text-[#C27803]">pip install pandas openpyxl</code></span>
            <span className="text-[#0284C7] font-medium">Compatibile con Google Colab, Jupyter Notebook & Script Locale</span>
          </div>

          <div className="relative rounded-xl bg-[#18181B] border border-[#27272A] p-4 font-mono text-xs text-[#E4E4E7] overflow-x-auto leading-relaxed shadow-inner">
            <pre>{PYTHON_REFERENCE_SCRIPT}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E3DC] bg-[#FAF9F5] flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">
            Ingegneria Dati Fashion / Retail · Luca Gnagnetti
          </span>
          <div className="flex items-center gap-2.5">
            {onOpenInteractiveAnalyst && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInteractiveAnalyst();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#C27803]" />
                <span>Apri Strumento Analisi Interattivo</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
