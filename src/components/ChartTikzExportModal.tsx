import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  Download,
  FileCode,
  Image as ImageIcon,
  Layers,
  Sparkles,
  BarChart3,
  GitBranch,
  Award,
  RefreshCw,
  BookOpen,
  FolderArchive,
  Info,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import {
  StudentScore,
  MeetingMinutesData,
  TeacherProfile,
} from '../types';
import { SAMPLE_STUDENTS, SAMPLE_TEACHERS } from '../data/mockData';
import { MONTHLY_MEETING_MINUTES } from '../data/monthlyMeetingMinutes';
import {
  generateScoreSpectrumTikz,
  generateDbscanScatterTikz,
  generateClusterDonutTikz,
  generateLessonStudyWorkflowTikz,
  generateAiWorkflowTikz,
  generateTemisRadarTikz,
  generateOnlineExamSpectrumTikz,
  generateAllChartsBundleTikz,
  downloadTexFile,
} from '../services/chartToTikzExportService';
import {
  renderTikzToSvgString,
  downloadTikzAsSvg,
  downloadTikzAsPng,
} from '../services/tikzSvgRenderer';

export type ChartTikzId =
  | 'score-spectrum'
  | 'dbscan-scatter'
  | 'cluster-donut'
  | 'lesson-study'
  | 'ai-workflow'
  | 'temis-radar'
  | 'online-spectrum';

export interface ChartTikzExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChartId?: ChartTikzId;
  students?: StudentScore[];
  meetingData?: MeetingMinutesData;
  teacher?: TeacherProfile;
  onlineScores?: number[];
  examTitle?: string;
}

interface ChartItemMeta {
  id: ChartTikzId;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  packageReqs: string[];
}

const CHART_ITEMS: ChartItemMeta[] = [
  {
    id: 'score-spectrum',
    title: 'Biểu đồ Phổ điểm Khảo sát Môn Toán (pgfplots)',
    category: 'Phân tích điểm số',
    badge: 'pgfplots / ybar',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: BarChart3,
    description: 'Biểu đồ cột phân bố điểm số khảo sát môn Toán khối 12 với dải 6 mức điểm, nhãn giá trị và lưới tọa độ chuyên nghiệp.',
    packageReqs: ['tikz', 'pgfplots', 'compat=1.18'],
  },
  {
    id: 'dbscan-scatter',
    title: 'Biểu đồ Phân tán Gom cụm DBSCAN (2D Scatter Plot)',
    category: 'Phân loại học sinh',
    badge: 'DBSCAN 2D',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Sparkles,
    description: 'Tọa độ phân tán 2 chiều (Điểm thường xuyên vs Điểm khảo sát), tô màu vùng cảnh báo điểm liệt (<=1.5đ và <=3.5đ) và 3 cụm hình học.',
    packageReqs: ['tikz', 'shapes.geometric', 'arrows.meta'],
  },
  {
    id: 'cluster-donut',
    title: 'Biểu đồ Vành khăn Tỷ lệ 3 Cụm Năng lực',
    category: 'Cơ cấu phân hóa',
    badge: 'Donut Sector',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Layers,
    description: 'Biểu đồ tròn vành khăn thể hiện tỷ lệ % chính xác giữa 3 nhóm: Mũi nhọn, An toàn và Nguy cơ liệt kèm chú giải trực quan.',
    packageReqs: ['tikz', 'arrows.meta'],
  },
  {
    id: 'lesson-study',
    title: 'Sơ đồ Chu trình Nghiên cứu Bài học 4 Bước (CV 5555)',
    category: 'Sinh hoạt chuyên môn',
    badge: 'Công văn 5555',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: GitBranch,
    description: 'Sơ đồ 4 khối khép kín thể hiện quy trình sinh hoạt tổ chuyên môn: Xây dựng bài dạy -> Dạy & Quan sát -> Suy ngẫm thảo luận -> Áp dụng.',
    packageReqs: ['tikz', 'arrows.meta', 'shapes.geometric'],
  },
  {
    id: 'ai-workflow',
    title: 'Sơ đồ Quy trình Quản trị Chuyên môn AI 4 Bước',
    category: 'Khung nghiệp vụ AI',
    badge: 'NĐ 30 & CV 5512',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: BookOpen,
    description: 'Quy trình quản lý hồ sơ chuyên môn số hóa khép kín: Khởi tạo hồ sơ -> Nạp dữ liệu Excel -> AI Phân cụm DBSCAN -> Xuất văn bản.',
    packageReqs: ['tikz', 'arrows.meta'],
  },
  {
    id: 'temis-radar',
    title: 'Biểu đồ Radar Năng lực Nghề nghiệp Giáo viên TEMIS',
    category: 'Chuẩn nghề nghiệp',
    badge: 'Thông tư 20/2018',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Award,
    description: 'Biểu đồ mạng nhện 5 trục đánh giá 5 tiêu chuẩn chuẩn nghề nghiệp giáo viên cơ sở giáo dục phổ thông theo Thông tư 20/2018/TT-BGDĐT.',
    packageReqs: ['tikz', 'calc'],
  },
  {
    id: 'online-spectrum',
    title: 'Phổ điểm Phòng thi Trực tuyến Chấm tự động 2025',
    category: 'Thi trực tuyến',
    badge: 'Bộ GD 2025',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: BarChart3,
    description: 'Phổ điểm tự động tổng hợp từ tất cả các thí sinh nộp bài thi trắc nghiệm trực tuyến theo cấu trúc đổi mới 2025 của Bộ GD&ĐT.',
    packageReqs: ['tikz', 'pgfplots', 'compat=1.18'],
  },
];

export const ChartTikzExportModal: React.FC<ChartTikzExportModalProps> = ({
  isOpen,
  onClose,
  initialChartId = 'score-spectrum',
  students = SAMPLE_STUDENTS,
  meetingData = MONTHLY_MEETING_MINUTES[1],
  teacher = SAMPLE_TEACHERS[0],
  onlineScores = [8.5, 7.8, 6.2, 5.5, 4.0, 9.0, 8.2, 7.0, 3.5, 2.0, 7.5, 6.8, 5.0, 8.8, 1.5],
  examTitle = 'Đề Khảo Sát Ôn Thi Tốt Nghiệp THPT 2025 - Môn Toán',
}) => {
  const [selectedChartId, setSelectedChartId] = useState<ChartTikzId>(initialChartId);
  const [viewTab, setViewTab] = useState<'preview' | 'code' | 'guide'>('preview');
  const [copied, setCopied] = useState<boolean>(false);
  const [pngCopied, setPngCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialChartId) {
      setSelectedChartId(initialChartId);
    }
  }, [initialChartId, isOpen]);

  const activeMeta = CHART_ITEMS.find((c) => c.id === selectedChartId) || CHART_ITEMS[0];

  // Generate current TikZ source code
  const currentTikzCode = useMemo(() => {
    switch (selectedChartId) {
      case 'score-spectrum':
        return generateScoreSpectrumTikz(students);
      case 'dbscan-scatter':
        return generateDbscanScatterTikz(students);
      case 'cluster-donut':
        return generateClusterDonutTikz(students);
      case 'lesson-study':
        return generateLessonStudyWorkflowTikz(meetingData);
      case 'ai-workflow':
        return generateAiWorkflowTikz();
      case 'temis-radar':
        return generateTemisRadarTikz(teacher);
      case 'online-spectrum':
        return generateOnlineExamSpectrumTikz(onlineScores, examTitle);
      default:
        return generateScoreSpectrumTikz(students);
    }
  }, [selectedChartId, students, meetingData, teacher, onlineScores, examTitle]);

  // Generate exact matching vector SVG string
  const currentSvgString = useMemo(() => {
    return renderTikzToSvgString(currentTikzCode, activeMeta.title);
  }, [currentTikzCode, activeMeta.title]);

  const handleCopyTikz = () => {
    navigator.clipboard.writeText(currentTikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadTex = () => {
    downloadTexFile(`${selectedChartId}_latex_tikz`, currentTikzCode);
  };

  const handleDownloadSvg = () => {
    downloadTikzAsSvg(currentTikzCode, selectedChartId);
  };

  const handleDownloadPng = () => {
    downloadTikzAsPng(currentTikzCode, selectedChartId);
    setPngCopied(true);
    setTimeout(() => setPngCopied(false), 2200);
  };

  const handleDownloadAllBundle = () => {
    const bundleContent = generateAllChartsBundleTikz(students, meetingData, teacher);
    downloadTexFile('ho_so_toan_bo_bieu_do_tikz_chuyen_mon', bundleContent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileCode className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Xuất Biểu Đồ & Sơ Đồ Sang Mã Nguồn TikZ (LaTeX)
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  Chuẩn pgfplots & TikZ thuần
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Chất lượng hiển thị vector sắc nét 100% trong văn bản LaTeX, Overleaf và Microsoft Word
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadAllBundle}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Tải toàn bộ 6 biểu đồ trong 1 file LaTeX tổng hợp có Mục lục"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Gói tất cả biểu đồ (.tex)</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart Selector Pills Carousel */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-thin">
          <div className="flex items-center space-x-2 min-w-max">
            {CHART_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === selectedChartId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedChartId(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.title.split(' (')[0]}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-indigo-700 text-indigo-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content View Tabs & Action Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hình vẽ Vector SVG (Xem trước)
            </button>
            <button
              onClick={() => setViewTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewTab === 'code'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã nguồn TikZ (LaTeX)</span>
            </button>
            <button
              onClick={() => setViewTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewTab === 'guide'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Hướng dẫn biên dịch</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy TikZ */}
            <button
              onClick={handleCopyTikz}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
              }`}
              title="Sao chép toàn bộ mã nguồn TikZ vào bộ nhớ đệm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép TikZ!' : 'Chép mã TikZ'}</span>
            </button>

            {/* Download .tex */}
            <button
              onClick={handleDownloadTex}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Tải file .tex biên dịch trực tiếp bằng pdflatex hoặc xelatex"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file .tex</span>
            </button>

            {/* Download PNG (300 DPI for Word) */}
            <button
              onClick={handleDownloadPng}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                pngCopied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
              }`}
              title="Tải ảnh PNG độ nét cao (khớp 100% bản vẽ TikZ) để chèn vào Microsoft Word"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>{pngCopied ? 'Đã tải ảnh PNG!' : 'Tải PNG (cho Word)'}</span>
            </button>

            {/* Download SVG */}
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Tải ảnh vector SVG nguyên gốc"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Tải SVG</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Chart Description Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${activeMeta.badgeColor}`}>
                  {activeMeta.category}
                </span>
                <span className="font-extrabold text-sm text-slate-900">{activeMeta.title}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{activeMeta.description}</p>
            </div>
            <div className="text-right flex-shrink-0 text-[11px] font-mono text-indigo-700 font-semibold bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
              Gói: {activeMeta.packageReqs.join(', ')}
            </div>
          </div>

          {/* VIEW TAB 1: VECTOR SVG PREVIEW */}
          {viewTab === 'preview' && (
            <div className="space-y-3">
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[340px]">
                <div
                  className="max-w-full overflow-x-auto flex justify-center items-center shadow-xs bg-white p-4 rounded-xl border border-slate-200"
                  dangerouslySetInnerHTML={{ __html: currentSvgString }}
                />
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-3 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hình ảnh vector trực quan khớp chính xác 100% với các thông số tọa độ và lệnh vẽ của TikZ</span>
                </div>
              </div>

              {/* Quick Code Peek */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>Trích đoạn mã nguồn TikZ:</span>
                  <button
                    onClick={() => setViewTab('code')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                  >
                    Xem toàn bộ mã nguồn →
                  </button>
                </div>
                <pre className="mt-2 text-slate-300 max-h-24 overflow-y-auto scrollbar-thin">
                  {currentTikzCode.slice(0, 400)}...
                </pre>
              </div>
            </div>
          )}

          {/* VIEW TAB 2: TIKZ CODE */}
          {viewTab === 'code' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-5 font-mono text-xs shadow-inner border border-slate-800">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                    <span className="font-bold text-slate-300 ml-2">Mã nguồn LaTeX / TikZ thuần</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">
                      {currentTikzCode.split('\n').length} dòng
                    </span>
                    <button
                      onClick={handleCopyTikz}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={currentTikzCode}
                  className="w-full h-[400px] bg-transparent text-slate-200 font-mono text-xs focus:outline-hidden resize-none leading-relaxed select-all"
                />
              </div>
            </div>
          )}

          {/* VIEW TAB 3: COMPILATION GUIDE */}
          {viewTab === 'guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overleaf / Cloud LaTeX */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-sm">
                    <ExternalLink className="w-4 h-4" />
                    <h4>Biên dịch trên Overleaf / Trực tuyến</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Tạo dự án mới <strong>Blank Project</strong> trên Overleaf.<br />
                    2. Dán toàn bộ mã nguồn TikZ đã sao chép từ cửa sổ này vào file <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-[11px]">main.tex</code>.<br />
                    3. Chọn Compiler là <strong>pdfLaTeX</strong> hoặc <strong>XeLaTeX</strong> và bấm <strong>Recompile</strong> (Ctrl + Enter).<br />
                    4. Bản vẽ sẽ được render ở chế độ standalone với viền gọn gàng.
                  </p>
                </div>

                {/* Microsoft Word / PowerPoint */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <h4>Chèn vào Microsoft Word & PowerPoint</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Bấm nút <strong>"Tải PNG (cho Word)"</strong> ở góc phải trên cùng.<br />
                    2. File ảnh PNG được tạo với độ phân giải siêu nét (gấp đôi kích thước hiển thị) giúp in ấn tài liệu không bị mờ hay vỡ nét.<br />
                    3. Trong Word, vào <em>Insert -&gt; Pictures</em> và chọn file ảnh vừa tải về.<br />
                    4. Hoặc bạn có thể tải file vector <strong>.svg</strong> để chèn trực tiếp vào Word 365.
                  </p>
                </div>
              </div>

              {/* Minimal Preamble Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                  <span className="font-bold text-slate-300">Preamble chuẩn LaTeX để nhúng vào tài liệu sẵn có:</span>
                  <button
                    onClick={() => {
                      const preamble = `\\usepackage{amsmath,amsfonts,amssymb}\n\\usepackage{tikz}\n\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}\n\\usetikzlibrary{calc,arrows.meta,shapes.geometric,patterns}`;
                      navigator.clipboard.writeText(preamble);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                  >
                    Sao chép Preamble
                  </button>
                </div>
                <pre className="text-emerald-300 leading-relaxed">
{`\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,arrows.meta,shapes.geometric,patterns}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Tổng cộng:</span>
            <span>7 loại biểu đồ & sơ đồ chuyên môn đã sẵn sàng xuất mã nguồn TikZ</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadAllBundle}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Xuất tất cả 7 biểu đồ (.tex)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
