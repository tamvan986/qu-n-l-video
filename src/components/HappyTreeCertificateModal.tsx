import React, { useRef } from 'react';
import { X, Printer, Award, Download, CheckCircle2, HeartHandshake, Sparkles } from 'lucide-react';
import { StudentHappyTree, TreeStageInfo } from '../types/happyTree';
import { TREE_STAGES } from '../data/happyTreeData';

interface HappyTreeCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentHappyTree | null;
  stage?: TreeStageInfo;
}

export const HappyTreeCertificateModal: React.FC<HappyTreeCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  stage: propStage,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const currentStage = propStage || TREE_STAGES[student.currentStage] || TREE_STAGES.hatmam;
  const isFruitOrFlower = currentStage.key === 'trai' || currentStage.key === 'hoa' || student.isPeerTutor;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top action bar */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold">
              Giấy Chứng Nhận Thăng Hạng - Hệ Sinh Thái Cây Hạnh Phúc
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              In Giấy Chứng Nhận
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Viewable / Printable Content */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-amber-50/40 flex items-center justify-center print:p-0 print:bg-white">
          <div
            ref={printRef}
            className="w-full max-w-2xl bg-white border-8 border-double border-amber-600/80 rounded-2xl p-6 sm:p-10 shadow-xl relative text-center text-slate-800 font-serif overflow-hidden print:shadow-none print:border-4"
          >
            {/* Background watermarks */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <span className="text-[160px] select-none">🌳</span>
            </div>

            {/* Header */}
            <div className="text-xs uppercase tracking-widest text-slate-500 font-sans font-bold border-b border-amber-200/80 pb-3 mb-4">
              SỞ GD&ĐT TỈNH BẾN TRE • TRƯỜNG THPT PHAN THANH GIẢN
            </div>

            <div className="space-y-1 mb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-800 tracking-wide uppercase font-serif">
                {isFruitOrFlower ? 'GIẤY CHỨNG NHẬN SỨ GIẢ HẠNH PHÚC' : 'GIẤY CHỨNG NHẬN THĂNG HẠNG'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-sans italic">
                HỆ SINH THÁI CÂY HẠNH PHÚC - ĐỔI MỚI ÔN THI TỐT NGHIỆP MÔN TOÁN
              </p>
            </div>

            <div className="my-4 flex items-center justify-center gap-3">
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-amber-500" />
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border border-amber-300 shadow-inner">
                <span className="text-lg">{currentStage.icon}</span>
              </div>
              <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-amber-500" />
            </div>

            {/* Student Name */}
            <div className="my-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-sans font-semibold">
                TRÂN TRỌNG TRAO TẶNG CHO HỌC VIÊN:
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1 uppercase tracking-normal">
                {student.name}
              </h2>
              <p className="text-xs font-sans font-semibold text-slate-600 mt-0.5">
                Lớp: <b>{student.className}</b> • Năm học 2024 - 2025 / 2026 - 2027
              </p>
            </div>

            {/* Achievement details */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-xs sm:text-sm font-sans text-slate-700 leading-relaxed max-w-lg mx-auto mb-6">
              <p>
                Đã nỗ lực xuất sắc tích lũy <b>{student.currentPoints} điểm ClassClap</b>, hoàn thành{' '}
                <b>{student.completedCount} lượt Tick</b> và chính thức thăng hạng lên cấp độ{' '}
                <b className="text-amber-900">
                  {currentStage.icon} {currentStage.name.toUpperCase()} (Cấp {currentStage.level})
                </b>
                .
              </p>
              <p className="text-[11px] text-slate-600 mt-1.5 italic">
                {isFruitOrFlower
                  ? 'Ghi nhận tinh thần cống hiến vì cộng đồng, tích cực hướng dẫn bạn bè nhóm Hạt mầm bứt phá thoát liệt môn Toán.'
                  : currentStage.description}
              </p>
            </div>

            {/* Footer signatures */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-amber-200/80 text-xs font-sans">
              <div className="text-center">
                <p className="text-slate-500">Giáo viên hướng dẫn / Chủ nhiệm</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-blue-900 text-lg font-bold">
                    Nguyễn Thị Kiều Ân
                  </span>
                </div>
                <p className="font-bold text-slate-800">Cô Nguyễn Thị Kiều Ân</p>
              </div>

              <div className="text-center">
                <p className="text-slate-500">Ba Tri, ngày {student.lastUpdated}</p>
                <p className="text-slate-500 font-semibold">HIỆU TRƯỞNG TRƯỜNG THPT PHAN THANH GIẢN</p>
                <div className="h-14 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500 text-[8px] text-red-600 flex items-center justify-center font-sans font-bold uppercase rotate-[-6deg] opacity-75 text-center leading-tight">
                    THPT PHAN THANH GIẢN
                  </div>
                </div>
                <p className="font-bold text-slate-800">Ban Giám Hiệu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Giấy chứng nhận được lưu trữ tự động trong hồ sơ năng lực của học viên.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
