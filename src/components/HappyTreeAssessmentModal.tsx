import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  Award,
  Save,
  RotateCcw,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { StudentHappyTree, TreeStageKey } from '../types/happyTree';
import { POSITIVE_CRITERIA, NEGATIVE_CRITERIA, TREE_STAGES, getStageFromTicks } from '../data/happyTreeData';

interface HappyTreeAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentHappyTree | null;
  onSaveAssessment: (
    studentId: string,
    newPoints: number,
    newTicks: [boolean, boolean, boolean, boolean, boolean, boolean],
    actionDescription: string
  ) => void;
}

export const HappyTreeAssessmentModal: React.FC<HappyTreeAssessmentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveAssessment,
}) => {
  const [selectedPositives, setSelectedPositives] = useState<{ [id: number]: number }>({});
  const [selectedNegatives, setSelectedNegatives] = useState<{ [id: number]: number }>({});
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen || !student) return null;

  // Calculate delta points from selections
  const positiveSum = Object.entries(selectedPositives).reduce((sum, [id, count]) => {
    const crit = POSITIVE_CRITERIA.find((c) => c.id === Number(id));
    return sum + (crit ? crit.points * count : 0);
  }, 0);

  const negativeSum = Object.entries(selectedNegatives).reduce((sum, [id, count]) => {
    const crit = NEGATIVE_CRITERIA.find((c) => c.id === Number(id));
    return sum + (crit ? crit.points * count : 0);
  }, 0);

  const deltaPoints = positiveSum + negativeSum;
  const projectedPoints = Math.max(0, student.currentPoints + deltaPoints);

  // Convert points to ticks: 5 points = 1 tick (max 6 ticks)
  const projectedTickCount = Math.min(6, Math.floor(projectedPoints / 5));
  const projectedTicks: [boolean, boolean, boolean, boolean, boolean, boolean] = [
    projectedTickCount >= 1,
    projectedTickCount >= 2,
    projectedTickCount >= 3,
    projectedTickCount >= 4,
    projectedTickCount >= 5,
    projectedTickCount >= 6,
  ];

  const projectedStageKey = getStageFromTicks(projectedTickCount);
  const projectedStage = TREE_STAGES[projectedStageKey];
  const currentStage = TREE_STAGES[student.currentStage];
  const isLevelUp = projectedStage.level > currentStage.level;

  const handleTogglePositive = (id: number) => {
    setSelectedPositives((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) > 0 ? 0 : 1,
    }));
  };

  const handleToggleNegative = (id: number) => {
    setSelectedNegatives((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) > 0 ? 0 : 1,
    }));
  };

  const handleSave = () => {
    const actionParts: string[] = [];
    Object.entries(selectedPositives).forEach(([id, count]) => {
      if (count > 0) {
        const crit = POSITIVE_CRITERIA.find((c) => c.id === Number(id));
        if (crit) actionParts.push(`${crit.name} (+${crit.points})`);
      }
    });
    Object.entries(selectedNegatives).forEach(([id, count]) => {
      if (count > 0) {
        const crit = NEGATIVE_CRITERIA.find((c) => c.id === Number(id));
        if (crit) actionParts.push(`${crit.name} (${crit.points})`);
      }
    });

    const description = actionParts.length > 0 ? actionParts.join(', ') : customNote || 'Cập nhật tiêu chí';

    onSaveAssessment(student.id, projectedPoints, projectedTicks, description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-xl">
              {currentStage.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Đánh Giá Thói Quen Số &amp; Tích Lũy Dưỡng Chất Cây Hạnh Phúc
                </h3>
                <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Tâm lý &amp; Tự chủ 2026
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Học sinh: <b className="text-white">{student.name}</b> (Lớp {student.className}) • Điểm hiện tại:{' '}
                <b className="text-amber-200">{student.currentPoints} điểm</b> ({student.completedCount} Ticks - Cấp{' '}
                {currentStage.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Điểm hiện tại</span>
              <span className="font-bold text-slate-700">{student.currentPoints} đ</span>
            </div>
            <div className="text-slate-400 font-bold">+</div>
            <div>
              <span className="text-slate-500 block text-[10px]">Điểm thay đổi</span>
              <span
                className={`font-black ${
                  deltaPoints > 0 ? 'text-emerald-600' : deltaPoints < 0 ? 'text-rose-600' : 'text-slate-600'
                }`}
              >
                {deltaPoints > 0 ? `+${deltaPoints}` : deltaPoints} đ
              </span>
            </div>
            <div className="text-slate-400 font-bold">=</div>
            <div>
              <span className="text-slate-500 block text-[10px]">Điểm sau lưu</span>
              <span className="font-black text-blue-700 text-sm">{projectedPoints} đ</span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block text-[10px]">Quy đổi Ticks (5đ = 1 tick)</span>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5, 6].map((tickNum) => (
                  <span
                    key={tickNum}
                    className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${
                      projectedTickCount >= tickNum
                        ? 'bg-emerald-500 text-white shadow-xs scale-105'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                ))}
                <span className="ml-1 font-bold text-slate-700">({projectedTickCount}/6 Ticks)</span>
              </div>
            </div>
          </div>

          {isLevelUp && (
            <div className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                Sẽ THĂNG HẠNG: {currentStage.icon} {currentStage.name} ➔ {projectedStage.icon} {projectedStage.name}!
              </span>
            </div>
          )}
        </div>

        {/* Criteria Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* POSITIVE CRITERIA SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                  I. Tiêu Chí Tích Cực — Nuôi Dưỡng Cây Hạnh Phúc (+ Điểm)
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đã chọn: +{positiveSum} điểm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {POSITIVE_CRITERIA.map((criterion) => {
                const isSelected = !!selectedPositives[criterion.id];
                return (
                  <div
                    key={criterion.id}
                    onClick={() => handleTogglePositive(criterion.id)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 select-none ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-slate-800 leading-snug">
                        {criterion.id}. {criterion.name}
                      </div>
                      {criterion.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      +{criterion.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEGATIVE CRITERIA SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                  II. Tiêu Chí Cần Cải Thiện — Cần Khắc Phục (- Điểm)
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Đã chọn: {negativeSum} điểm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {NEGATIVE_CRITERIA.map((criterion) => {
                const isSelected = !!selectedNegatives[criterion.id];
                return (
                  <div
                    key={criterion.id}
                    onClick={() => handleToggleNegative(criterion.id)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 select-none ${
                      isSelected
                        ? 'bg-rose-50/90 border-rose-500 shadow-sm ring-1 ring-rose-500'
                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-slate-800 leading-snug">
                        {criterion.id}. {criterion.name}
                      </div>
                      {criterion.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {criterion.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Cơ chế tự động: Cứ mỗi <b>5 điểm</b> tích lũy, hệ thống tự động đổi <b>1 lượt Tick</b> và kiểm tra thăng hạng.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Đánh Giá & Tự Động Đổi Tick</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
