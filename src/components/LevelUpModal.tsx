import React, { useEffect } from 'react';
import {
  Award,
  Sparkles,
  ArrowRight,
  Printer,
  X,
  CheckCircle2,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { StudentHappyTree, TreeStageInfo } from '../types/happyTree';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentHappyTree | null;
  oldStage: TreeStageInfo;
  newStage: TreeStageInfo;
  onOpenCertificate: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  student,
  oldStage,
  newStage,
  onOpenCertificate,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-400/80 max-w-lg w-full p-6 sm:p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Glow / Confetti Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Celebration Icon */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-1 mx-auto shadow-xl shadow-amber-500/30 animate-bounce duration-1000">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl">
              {newStage.icon}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-white rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        {/* Level Up Announcement */}
        <div className="space-y-1">
          <span className="text-[11px] font-black tracking-widest text-amber-600 uppercase bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            🎉 THÔNG BÁO THĂNG HẠNG CÂY HẠNH PHÚC!
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Chúc Mừng {student.name}!
          </h2>
          <p className="text-xs text-slate-500">
            Học viên lớp <b className="text-slate-800">{student.className}</b> • Điểm tích lũy:{' '}
            <b className="text-blue-700">{student.currentPoints} điểm</b>
          </p>
        </div>

        {/* Stage Comparison Card */}
        <div className="my-5 p-4 bg-gradient-to-r from-slate-50 via-amber-50/50 to-slate-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 shadow-inner">
          {/* Old Stage */}
          <div className="flex-1 text-center">
            <div className="text-2xl mb-1">{oldStage.icon}</div>
            <div className="text-xs font-bold text-slate-700">{oldStage.name}</div>
            <span className="text-[10px] text-slate-500">Cấp độ {oldStage.level}</span>
          </div>

          {/* Transition Arrow */}
          <div className="flex flex-col items-center shrink-0">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-emerald-500 text-white rounded-full shadow-md">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-emerald-700 mt-1 uppercase tracking-wider">
              LÊN CẤP!
            </span>
          </div>

          {/* New Stage */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1 scale-110 transform transition">{newStage.icon}</div>
            <div className="text-xs font-black text-emerald-800">{newStage.name}</div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Cấp độ {newStage.level}
            </span>
          </div>
        </div>

        {/* Pedagogical Encouragement */}
        <div className="text-xs text-slate-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left space-y-1 mb-5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thành quả đạt được:</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {newStage.description}
          </p>
          <div className="mt-2 pt-2 border-t border-emerald-200/80 text-[11px] text-slate-600">
            <b>Định hướng tiếp theo:</b> {newStage.pedagogicalAction}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            Tiếp Tục Chấm Điểm
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCertificate();
            }}
            className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In Giấy Chứng Nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
};
