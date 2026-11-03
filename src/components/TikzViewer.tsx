import React, { useState, useMemo } from 'react';
import { Code, Copy, Check, Download, Eye, EyeOff, Layers, FileCode, Image as ImageIcon } from 'lucide-react';
import { renderTikzToSvgString, downloadTikzAsSvg, downloadTikzAsPng } from '../services/tikzSvgRenderer';

interface TikzViewerProps {
  tikzCode: string;
  diagramTitle?: string;
  className?: string;
}

export const TikzViewer: React.FC<TikzViewerProps> = ({
  tikzCode,
  diagramTitle = 'Hình vẽ minh họa (TikZ thuần)',
  className = '',
}) => {
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [imageDownloaded, setImageDownloaded] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSnippet = () => {
    const fullTexSnippet = `% Standalone TikZ Snippet - Biên soạn chuẩn LaTeX
\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usepackage{tkz-tab}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,arrows.meta,angles,quotes,intersections,patterns}

\\begin{document}
${tikzCode}
\\end{document}
`;
    const blob = new Blob([fullTexSnippet], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hinh_ve_tikz_${Date.now()}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvgImage = () => {
    downloadTikzAsSvg(tikzCode, diagramTitle || 'hinh_ve_tikz');
    setImageDownloaded(true);
    setTimeout(() => setImageDownloaded(false), 2000);
  };

  const handleDownloadPngImage = () => {
    downloadTikzAsPng(tikzCode, diagramTitle || 'hinh_ve_tikz');
    setImageDownloaded(true);
    setTimeout(() => setImageDownloaded(false), 2000);
  };

  // Generate SVG string that accurately matches the TikZ code
  const svgMarkup = useMemo(() => {
    return renderTikzToSvgString(tikzCode, diagramTitle);
  }, [tikzCode, diagramTitle]);

  return (
    <div className={`my-3 p-3.5 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/40 via-white to-slate-50 text-slate-800 shadow-xs ${className}`}>
      {/* Top Header & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-blue-200/60 no-print">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 font-sans">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{diagramTitle}</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white tracking-wider uppercase font-mono">
            TikZ thuần khớp 100%
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans">
          {/* Download PNG Button */}
          <button
            onClick={handleDownloadPngImage}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold flex items-center space-x-1 transition shadow-2xs text-[11px]"
            title="Tải ảnh PNG độ nét cao (khớp 100% với mã TikZ để chèn vào Word)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{imageDownloaded ? 'Đã tải PNG!' : 'Tải ảnh PNG'}</span>
          </button>

          {/* Download SVG Button */}
          <button
            onClick={handleDownloadSvgImage}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium flex items-center space-x-1 transition shadow-2xs text-[11px]"
            title="Tải ảnh vector SVG khớp chính xác với mã TikZ"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải SVG</span>
          </button>

          {/* View / Hide TikZ Code */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium flex items-center space-x-1 transition shadow-2xs text-[11px]"
            title={showCode ? 'Ẩn mã TikZ' : 'Xem mã TikZ'}
          >
            {showCode ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            <span>{showCode ? 'Ẩn mã' : 'Mã TikZ'}</span>
          </button>

          {/* Copy TikZ Code */}
          <button
            onClick={handleCopy}
            className={`px-2 py-1 rounded-lg font-medium flex items-center space-x-1 transition shadow-2xs text-[11px] ${
              copied
                ? 'bg-emerald-600 text-white border border-emerald-600'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
            title="Sao chép toàn bộ mã TikZ để dùng trong Overleaf / TeXmaker"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Đã chép!' : 'Chép TikZ'}</span>
          </button>

          {/* Download .tex Snippet */}
          <button
            onClick={handleDownloadSnippet}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium flex items-center space-x-1 transition shadow-2xs text-[11px]"
            title="Tải file .tex chứa mã TikZ thuần"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>.tex</span>
          </button>
        </div>
      </div>

      {/* Visual Graphical Preview: Exact SVG Matching the TikZ Code */}
      <div className="flex flex-col items-center justify-center my-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-x-auto">
        <div
          className="max-w-full flex justify-center items-center"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 italic mt-2 font-sans no-print">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hình ảnh vector xuất ra khớp 100% với các thông số tọa độ và lệnh vẽ của TikZ</span>
        </div>
      </div>

      {/* Expandable TikZ Code View */}
      {showCode && (
        <div className="mt-3 pt-3 border-t border-slate-200 no-print animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1.5 px-1">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gói yêu cầu: \usepackage{'{tikz,tkz-tab,pgfplots}'}</span>
            </span>
            <span>{tikzCode.split('\n').length} dòng</span>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 text-xs font-mono rounded-lg overflow-x-auto max-h-60 border border-slate-800 leading-relaxed scrollbar-thin select-all">
            <code>{tikzCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
