import React, { useState, useEffect, useMemo } from 'react';
import {
  Sprout,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  HeartHandshake,
  Gift,
  Calendar,
  Layers,
  Users,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Eye,
  Check,
  ShieldCheck,
  Clock,
  Save,
  Sliders,
  X,
  FileDown,
} from 'lucide-react';
import { StudentHappyTree, TreeStageKey, TreeStageInfo } from '../types/happyTree';
import {
  TREE_STAGES,
  INITIAL_HAPPY_TREE_STUDENTS,
  getStageFromTicks,
  POSITIVE_CRITERIA,
  NEGATIVE_CRITERIA,
} from '../data/happyTreeData';
import { HappyTreeAssessmentModal } from './HappyTreeAssessmentModal';
import { LevelUpModal } from './LevelUpModal';
import { HappyTreeCertificateModal } from './HappyTreeCertificateModal';
import { exportToWordDocument } from '../services/aiService';
import { broadcastHappyTreeUpdate, HAPPY_TREE_STORAGE_KEY } from '../services/happyTreeSyncService';

const STORAGE_KEY = HAPPY_TREE_STORAGE_KEY;

export const HappyTreeView: React.FC = () => {
  // Students state with localStorage hydration
  const [students, setStudents] = useState<StudentHappyTree[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return INITIAL_HAPPY_TREE_STUDENTS;
  });

  // Auto-save toggle
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('Vừa xong');

  // Filter states
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sheet' | 'shop' | 'chart'>('sheet');

  // Modals state
  const [assessingStudent, setAssessingStudent] = useState<StudentHappyTree | null>(null);
  const [isAssessModalOpen, setIsAssessModalOpen] = useState<boolean>(false);

  // Level Up modal state
  const [levelUpData, setLevelUpData] = useState<{
    student: StudentHappyTree;
    oldStage: TreeStageInfo;
    newStage: TreeStageInfo;
  } | null>(null);

  // Certificate modal state
  const [certificateStudent, setCertificateStudent] = useState<StudentHappyTree | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-save to localStorage whenever students change
  useEffect(() => {
    if (isAutoSaveEnabled) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        const now = new Date();
        setLastAutoSaveTime(now.toLocaleTimeString('vi-VN'));
        broadcastHappyTreeUpdate(students);
      } catch (e) {
        console.error('Auto-save error', e);
      }
    }
  }, [students, isAutoSaveEnabled]);

  // Handle direct tick toggle in row
  const handleToggleTick = (studentId: string, tickIndex: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        const currentTicks = [...s.ticks] as [boolean, boolean, boolean, boolean, boolean, boolean];
        // Toggle the target tick
        const nextState = !currentTicks[tickIndex];
        currentTicks[tickIndex] = nextState;

        // If toggling on, also make sure preceding ticks are true for sequential growth
        if (nextState) {
          for (let i = 0; i < tickIndex; i++) {
            currentTicks[i] = true;
          }
        } else {
          // If toggling off, uncheck subsequent ticks
          for (let i = tickIndex + 1; i < 6; i++) {
            currentTicks[i] = false;
          }
        }

        const completedCount = currentTicks.filter(Boolean).length;
        const newStageKey = getStageFromTicks(completedCount);
        const oldStageKey = s.currentStage;
        const progressPercent = Math.round((completedCount / 6) * 100);
        const nowStr = new Date().toLocaleDateString('vi-VN');

        const updatedStudent: StudentHappyTree = {
          ...s,
          ticks: currentTicks,
          completedCount,
          progressPercent,
          currentStage: newStageKey,
          currentPoints: Math.max(s.currentPoints, completedCount * 5),
          status: completedCount === 6 ? 'Hoàn thành' : 'Chưa xong',
          lastUpdated: nowStr,
          history: [
            {
              date: nowStr,
              action: `Chỉnh sửa trực tiếp ô tick ${tickIndex + 1}`,
              pointsChange: 0,
              newTotal: Math.max(s.currentPoints, completedCount * 5),
            },
            ...s.history,
          ],
        };

        // Check if level-up occurred
        const oldStageInfo = TREE_STAGES[oldStageKey];
        const newStageInfo = TREE_STAGES[newStageKey];
        if (newStageInfo.level > oldStageInfo.level) {
          setLevelUpData({
            student: updatedStudent,
            oldStage: oldStageInfo,
            newStage: newStageInfo,
          });
        }

        return updatedStudent;
      })
    );

    showToast(`Đã tự động lưu tick ô ${tickIndex + 1}!`);
  };

  // Handle saving assessment modal
  const handleSaveAssessment = (
    studentId: string,
    newPoints: number,
    newTicks: [boolean, boolean, boolean, boolean, boolean, boolean],
    actionDescription: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        const completedCount = newTicks.filter(Boolean).length;
        const newStageKey = getStageFromTicks(completedCount);
        const oldStageKey = s.currentStage;
        const progressPercent = Math.round((completedCount / 6) * 100);
        const nowStr = new Date().toLocaleDateString('vi-VN');

        const updatedStudent: StudentHappyTree = {
          ...s,
          currentPoints: newPoints,
          ticks: newTicks,
          completedCount,
          progressPercent,
          currentStage: newStageKey,
          status: completedCount === 6 ? 'Hoàn thành' : 'Chưa xong',
          lastUpdated: nowStr,
          history: [
            {
              date: nowStr,
              action: actionDescription,
              pointsChange: newPoints - s.currentPoints,
              newTotal: newPoints,
            },
            ...s.history,
          ],
        };

        const oldStageInfo = TREE_STAGES[oldStageKey];
        const newStageInfo = TREE_STAGES[newStageKey];
        if (newStageInfo.level > oldStageInfo.level) {
          setLevelUpData({
            student: updatedStudent,
            oldStage: oldStageInfo,
            newStage: newStageInfo,
          });
        }

        return updatedStudent;
      })
    );

    showToast('Đã lưu đánh giá & tự động cập nhật số Tick Cây Hạnh Phúc!');
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'all' && s.className !== selectedClass) return false;
      if (selectedStage !== 'all' && s.currentStage !== selectedStage) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(query) || s.className.toLowerCase().includes(query);
      }
      return true;
    });
  }, [students, selectedClass, selectedStage, searchQuery]);

  // Stage distribution counts
  const stageCounts = useMemo(() => {
    const counts: Record<TreeStageKey, number> = {
      hatmam: 0,
      mamxanh: 0,
      choinon: 0,
      la: 0,
      hoa: 0,
      trai: 0,
    };
    students.forEach((s) => {
      if (counts[s.currentStage] !== undefined) {
        counts[s.currentStage]++;
      }
    });
    return counts;
  }, [students]);

  const atSafeCount = students.filter(
    (s) => s.currentStage === 'la' || s.currentStage === 'hoa' || s.currentStage === 'trai'
  ).length;

  const safePercent = Math.round((atSafeCount / (students.length || 1)) * 100);

  // Reset to initial sample data
  const handleResetData = () => {
    if (window.confirm('Khôi phục danh sách học viên Cây Hạnh Phúc ban đầu từ báo cáo SKKN Ba Tri?')) {
      setStudents(INITIAL_HAPPY_TREE_STUDENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HAPPY_TREE_STUDENTS));
      showToast('Đã khôi phục dữ liệu gốc!');
    }
  };

  // Export Table to Word
  const handleExportWord = () => {
    const content = `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 13pt;">
        <h2 style="text-align: center; text-transform: uppercase; color: #1e3a8a;">
          BẢNG THEO DÕI TIẾN ĐỘ HỆ SINH THÁI CÂY HẠNH PHÚC
        </h2>
        <p style="text-align: center; font-style: italic;">Trường THPT Phan Thanh Giản | Tổ Toán - Tin - Công nghệ</p>
        <p style="text-align: center;"><b>Tỷ lệ học sinh đạt ngưỡng an toàn thoát liệt (Cấp Lá trở lên):</b> ${safePercent}%</p>
        <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11pt; text-align: center;">
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="padding: 6px;">STT</th>
            <th style="padding: 6px;">Lớp</th>
            <th style="padding: 6px; text-align: left;">Họ và tên</th>
            <th style="padding: 6px;">Điểm CP</th>
            <th style="padding: 6px;">Ô 1</th>
            <th style="padding: 6px;">Ô 2</th>
            <th style="padding: 6px;">Ô 3</th>
            <th style="padding: 6px;">Ô 4</th>
            <th style="padding: 6px;">Ô 5</th>
            <th style="padding: 6px;">Ô 6</th>
            <th style="padding: 6px;">Cấp độ Cây</th>
            <th style="padding: 6px;">Tiến độ</th>
          </tr>
          ${filteredStudents
            .map(
              (s, i) => `
            <tr>
              <td style="padding: 5px;">${i + 1}</td>
              <td style="padding: 5px;">${s.className}</td>
              <td style="padding: 5px; text-align: left;"><b>${s.name}</b></td>
              <td style="padding: 5px;">${s.currentPoints}</td>
              <td style="padding: 5px; background-color: ${s.ticks[0] ? '#fecdd3' : '#ffffff'};">${s.ticks[0] ? '✓' : ''}</td>
              <td style="padding: 5px; background-color: ${s.ticks[1] ? '#fef08a' : '#ffffff'};">${s.ticks[1] ? '✓' : ''}</td>
              <td style="padding: 5px; background-color: ${s.ticks[2] ? '#bfdbfe' : '#ffffff'};">${s.ticks[2] ? '✓' : ''}</td>
              <td style="padding: 5px; background-color: ${s.ticks[3] ? '#bbf7d0' : '#ffffff'};">${s.ticks[3] ? '✓' : ''}</td>
              <td style="padding: 5px; background-color: ${s.ticks[4] ? '#e9d5ff' : '#ffffff'};">${s.ticks[4] ? '✓' : ''}</td>
              <td style="padding: 5px; background-color: ${s.ticks[5] ? '#fed7aa' : '#ffffff'};">${s.ticks[5] ? '✓' : ''}</td>
              <td style="padding: 5px; font-weight: bold;">${TREE_STAGES[s.currentStage].name}</td>
              <td style="padding: 5px;">${s.progressPercent}%</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>
    `;
    exportToWordDocument('Bang_Theo_Doi_Cay_Hanh_Phuc_Ba_Tri', content);
    showToast('Đã xuất bảng theo dõi Cây Hạnh Phúc ra file Word!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Dự Án Nghiên Cứu Khoa Học Kỹ Thuật • Trường THPT Phan Thanh Giản (GVHD: Nguyễn Thị Kiều Ân)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Hệ Sinh Thái “Cây Hạnh Phúc” & Cá Nhân Hóa Ôn Thi Tốt Nghiệp
          </h2>

          <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Dựa trên thuật toán phân cụm <b>DBSCAN</b> và cơ chế quản trị động lực: Biến áp lực ôn thi thành hành
            trình từng bước tích lũy điểm ClassClap, đổi lấy lượt <b>Tick tự động</b>, nuôi dưỡng cây qua <b>6 giai đoạn</b>{' '}
            từ <b>Hạt mầm</b> vươn lên thành <b>Trái ngọt</b> (100% thoát liệt môn Toán).
          </p>

          {/* Quick Auto-save indicator & Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAutoSaveEnabled((prev) => !prev)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                isAutoSaveEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt chế độ tự động lưu dữ liệu ngay khi đánh giá hoặc bấm tick"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isAutoSaveEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>Chế độ Tick lưu tự động: <b>{isAutoSaveEnabled ? 'BẬT' : 'TẮT'}</b></span>
              <span className="text-[10px] text-emerald-200/70">({lastAutoSaveTime})</span>
            </button>

            <button
              onClick={handleExportWord}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition backdrop-blur-xs"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span>Xuất Bảng Word</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition backdrop-blur-xs"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>In Ấn Chuẩn A4</span>
            </button>

            <button
              onClick={handleResetData}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-semibold text-xs border border-white/10 transition"
              title="Khôi phục danh sách học sinh theo báo cáo gốc"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khôi Phục Dữ Liệu Gốc</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 TREE STAGES DISTRIBUTION CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(TREE_STAGES) as TreeStageKey[]).map((key) => {
          const stage = TREE_STAGES[key];
          const count = stageCounts[key] || 0;
          const isSelected = selectedStage === key;

          return (
            <div
              key={key}
              onClick={() => setSelectedStage(isSelected ? 'all' : key)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-emerald-500 shadow-md scale-102 bg-white'
                  : 'bg-white hover:border-emerald-300 hover:shadow-xs'
              } ${stage.borderColor}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stage.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${stage.bgColor} ${stage.textColor}`}
                  >
                    {stage.requiredTicks} Tick ({stage.requiredPoints}đ)
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-800 mt-2">{stage.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{stage.scoreRange}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Số học viên:</span>
                <b className="text-sm font-black text-slate-900">{count} em</b>
              </div>
            </div>
          );
        })}
      </div>

      {/* NAV TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white rounded-2xl p-2 px-3 shadow-xs">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'sheet'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bảng Tính Cây Hạnh Phúc (Ô 1 - 6)</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'shop'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Cửa Hàng Hạnh Phúc & Đổi Quà</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-semibold pr-2">
          <span>Ngưỡng an toàn:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {safePercent}% (Cấp Lá trở lên)
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GOOGLE SHEETS / CLASSCLAP INTERACTIVE TICK MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'sheet' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="all">Tất cả các lớp</option>
                <option value="12A3">Lớp 12A3 (Trọng điểm)</option>
                <option value="12A4">Lớp 12A4</option>
                <option value="12A5">Lớp 12A5</option>
              </select>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="all">Tất cả giai đoạn cây</option>
                <option value="hatmam">🌱 Hạt mầm (1 Tick - 5đ)</option>
                <option value="mamxanh">🌿 Mầm xanh (2 Ticks - 10đ)</option>
                <option value="choinon">🌲 Chồi non (3 Ticks - 15đ)</option>
                <option value="la">🍃 Lá (4 Ticks - 20đ)</option>
                <option value="hoa">🌸 Hoa (5 Ticks - 25đ)</option>
                <option value="trai">🍎 Trái (6 Ticks - 30đ)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold">
                Hiển thị: <b>{filteredStudents.length}</b> / {students.length} học viên
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Nhấp trực tiếp vào ô để Tick (Tự động lưu)
              </span>
            </div>
          </div>

          {/* Interactive Spreadsheet Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                  <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
                  <th className="p-3 text-center w-16 border-r border-slate-200">Lớp</th>
                  <th className="p-3 min-w-[180px] border-r border-slate-200">Họ Và Tên Học Viên</th>
                  <th className="p-3 text-center min-w-[70px] border-r border-slate-200 bg-amber-50 text-amber-900">
                    Điểm CP
                  </th>
                  <th className="p-2 text-center w-12 bg-rose-50 text-rose-800 border-r border-slate-200" title="Ô 1: Hạt mầm (5 điểm)">
                    Ô 1 🌱
                  </th>
                  <th className="p-2 text-center w-12 bg-amber-50 text-amber-800 border-r border-slate-200" title="Ô 2: Mầm xanh (10 điểm)">
                    Ô 2 🌿
                  </th>
                  <th className="p-2 text-center w-12 bg-blue-50 text-blue-800 border-r border-slate-200" title="Ô 3: Chồi non (15 điểm)">
                    Ô 3 🌲
                  </th>
                  <th className="p-2 text-center w-12 bg-emerald-50 text-emerald-800 border-r border-slate-200" title="Ô 4: Lá (20 điểm)">
                    Ô 4 🍃
                  </th>
                  <th className="p-2 text-center w-12 bg-purple-50 text-purple-800 border-r border-slate-200" title="Ô 5: Hoa (25 điểm)">
                    Ô 5 🌸
                  </th>
                  <th className="p-2 text-center w-12 bg-orange-50 text-orange-800 border-r border-slate-200" title="Ô 6: Trái (30 điểm)">
                    Ô 6 🍎
                  </th>
                  <th className="p-3 text-center min-w-[120px] border-r border-slate-200">
                    Trồng Cây
                  </th>
                  <th className="p-3 text-center w-20 border-r border-slate-200">
                    Tiến Độ
                  </th>
                  <th className="p-3 text-center min-w-[150px]">
                    Thao Tác Chuyên Môn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStudents.map((student, idx) => {
                  const stage = TREE_STAGES[student.currentStage] || TREE_STAGES.hatmam;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700 border-r border-slate-100">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                          {student.className}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-100">
                        <div className="flex items-center justify-between">
                          <span>{student.name}</span>
                          {student.isPeerTutor && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 ml-1.5 shrink-0 flex items-center gap-1"
                              title="Sứ giả Hạnh phúc (Nhóm Trái / Hoa hỗ trợ bạn bè)"
                            >
                              <Award className="w-3 h-3 text-amber-600" />
                              Sứ giả
                            </span>
                          )}
                        </div>
                        {student.assignedTutorName && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            Gia sư kèm cặp: <b>{student.assignedTutorName}</b>
                          </span>
                        )}
                      </td>

                      {/* Điểm ClassClap */}
                      <td className="p-3 text-center font-black text-blue-700 border-r border-slate-100 bg-blue-50/30">
                        {student.currentPoints} đ
                      </td>

                      {/* 6 Ô TICK TƯƠNG TÁC LƯU TỰ ĐỘNG */}
                      {[0, 1, 2, 3, 4, 5].map((tickIdx) => {
                        const isChecked = student.ticks[tickIdx];
                        const bgColors = [
                          'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200',
                          'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
                          'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
                          'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
                          'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
                          'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
                        ];

                        return (
                          <td
                            key={tickIdx}
                            onClick={() => handleToggleTick(student.id, tickIdx)}
                            className="p-2 text-center cursor-pointer border-r border-slate-100 select-none hover:bg-slate-100/80 transition-colors"
                            title={`Nhấp để đổi tick Ô ${tickIdx + 1} (${(tickIdx + 1) * 5} điểm)`}
                          >
                            <div
                              className={`w-7 h-7 mx-auto rounded-lg border flex items-center justify-center font-black text-xs transition-all transform group-hover:scale-105 ${
                                isChecked
                                  ? `${bgColors[tickIdx]} shadow-xs ring-1`
                                  : 'bg-slate-100/60 border-slate-200 text-transparent hover:text-slate-300'
                              }`}
                            >
                              ✓
                            </div>
                          </td>
                        );
                      })}

                      {/* Trồng Cây Stage Badge */}
                      <td className="p-3 text-center border-r border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${stage.bgColor} ${stage.textColor} ${stage.borderColor}`}
                        >
                          <span>{stage.icon}</span>
                          <span>{stage.name}</span>
                        </span>
                      </td>

                      {/* Tiến độ % */}
                      <td className="p-3 text-center border-r border-slate-100 font-bold">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              student.progressPercent >= 100
                                ? 'bg-orange-500'
                                : student.progressPercent >= 66
                                ? 'bg-emerald-500'
                                : student.progressPercent >= 33
                                ? 'bg-blue-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${student.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {student.completedCount}/6 ({student.progressPercent}%)
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAssessingStudent(student);
                              setIsAssessModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            title="Mở bảng 18 tiêu chí tích cực & 11 tiêu chí cần cải thiện ClassClap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Chấm Điểm</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCertificateStudent(student)}
                            className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-xl transition border border-amber-300"
                            title="Xem và in Giấy Chứng Nhận Thăng Hạng / Sứ Giả Hạnh Phúc"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* TAB 4: HAPPY SHOP (CỬA HÀNG HẠNH PHÚC & ĐỔI QUÀ CHỦ NHẬT) */}
      {/* ========================================================================= */}
      {activeTab === 'shop' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="max-w-3xl">
            <span className="text-xs font-black tracking-widest text-orange-700 uppercase bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
              Ngày Hội Thu Hoạch & Vinh Danh Chủ Nhật
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              Cửa Hàng Hạnh Phúc (Happy Shop) • Đổi Điểm Lấy Quà
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Vật chất và tinh thần song hành: Học viên dùng điểm ClassClap tích lũy trong tuần để đổi lấy những món quà
              dễ thương (như vòng đeo tay, tập viết) hoặc các đặc cách học đường (chọn chỗ ngồi, cộng điểm kiểm tra).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                id: 'gift-1',
                name: 'Huy Hiệu "Bản Lĩnh Số" & Vòng Tay Tự Chủ',
                costPoints: 15,
                icon: '🎖️',
                imageNote: 'Ghi nhận 7 ngày kiểm soát màn hình dưới 45p',
                desc: 'Huy hiệu đeo áo và vòng handmade biểu trưng cho năng lực làm chủ công nghệ.',
              },
              {
                id: 'gift-2',
                name: 'Voucher Sách Đọc & Thẻ Thư Viện Khám Phá',
                costPoints: 20,
                icon: '📚',
                imageNote: 'Khuyến khích đọc sách đổi 15 phút màn hình',
                desc: 'Chọn sách văn học, kỹ năng sống hoặc khoa học tại thư viện nhà trường.',
              },
              {
                id: 'gift-3',
                name: 'Dây Nhảy Thể Thao / Quả Cầu Lông Rèn Luyện',
                costPoints: 25,
                icon: '🏸',
                imageNote: 'Phần thưởng vận động thể chất giờ giải lao',
                desc: 'Kích hoạt Dopamine tự nhiên qua vận động thể chất lành mạnh 15 phút.',
              },
              {
                id: 'gift-4',
                name: 'Tập Vở 200 Trang & Bộ Bút Gel Môn Toán',
                costPoints: 10,
                icon: '📓',
                imageNote: 'Phát thưởng rèn luyện thói quen làm bài tập',
                desc: 'Vở ghi chép công thức Casio fx-580VNX và 10 dạng toán nhận biết chống liệt.',
              },
              {
                id: 'gift-5',
                name: 'Đặc Cách Chọn Chỗ Ngồi Ưu Tiên Cùng Bạn Kèm',
                costPoints: 20,
                icon: '💺',
                imageNote: 'Gắn kết mô hình Đôi bạn cùng tiến',
                desc: 'Được ưu tiên chọn ngồi cạnh Sứ giả Hạnh phúc để cùng nhắc nhở và học tập.',
              },
              {
                id: 'gift-6',
                name: 'Cộng +1 Điểm TX & Giấy Khen Toàn Trường',
                costPoints: 30,
                icon: '📜',
                imageNote: 'Vinh danh chuyển hóa thói quen xuất sắc',
                desc: 'Quy đổi nỗ lực tự chủ vào sổ điểm và nhận giấy khen tuyên dương trước cờ.',
              },
            ].map((gift) => (
              <div
                key={gift.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{gift.icon}</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      {gift.costPoints} Điểm
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-2">{gift.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{gift.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 italic">{gift.imageNote}</span>
                  <button
                    type="button"
                    onClick={() => showToast(`Đã ghi nhận học viên đổi quà "${gift.name}"!`)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Đổi Quà
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSESSMENT MODAL (18 TÍCH CỰC, 11 CẢI THIỆN) */}
      <HappyTreeAssessmentModal
        isOpen={isAssessModalOpen}
        onClose={() => setIsAssessModalOpen(false)}
        student={assessingStudent}
        onSaveAssessment={handleSaveAssessment}
      />

      {/* MODAL 2: LEVEL UP CONGRATULATIONS */}
      {levelUpData && (
        <LevelUpModal
          isOpen={!!levelUpData}
          onClose={() => setLevelUpData(null)}
          student={levelUpData.student}
          oldStage={levelUpData.oldStage}
          newStage={levelUpData.newStage}
          onOpenCertificate={() => setCertificateStudent(levelUpData.student)}
        />
      )}

      {/* MODAL 3: CERTIFICATE VIEW & PRINT */}
      <HappyTreeCertificateModal
        isOpen={!!certificateStudent}
        onClose={() => setCertificateStudent(null)}
        student={certificateStudent}
      />
    </div>
  );
};
