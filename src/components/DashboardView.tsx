import React from 'react';
import {
  Users,
  GraduationCap,
  Award,
  FileText,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  ShieldAlert,
  CheckSquare,
  Laptop,
  FileCode,
  Sprout,
} from 'lucide-react';
import { ActiveTab, StudentScore } from '../types';
import { SAMPLE_STUDENTS, SAMPLE_TEACHERS } from '../data/mockData';
import { ChartTikzExportModal } from './ChartTikzExportModal';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenWorkflow: () => void;
  students?: StudentScore[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenWorkflow,
  students: propStudents,
}) => {
  const [isTikzModalOpen, setIsTikzModalOpen] = React.useState<boolean>(false);
  const currentStudents = propStudents && propStudents.length > 0 ? propStudents : SAMPLE_STUDENTS;
  const atRiskStudents = currentStudents.filter((s) => s.cluster === 'hatmam' || s.cluster === 'nguyco' || s.scoreFinal <= 2.0);
  const safeStudents = currentStudents.filter((s) => s.cluster === 'la' || s.cluster === 'choinon' || s.cluster === 'antoan');
  const topStudents = currentStudents.filter((s) => s.cluster === 'trai' || s.cluster === 'hoa' || s.cluster === 'muinhon');
  const avgStudentScore = (
    currentStudents.reduce((sum, s) => sum + s.scoreFinal, 0) / (currentStudents.length || 1)
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-400/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Hệ thống Quản lý Tâm lý &amp; Thói quen Học đường 2026 - 2027</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Nhóm nghiên cứu Khoa học Kỹ thuật về xã hội hành vi
          </h2>
          <p className="text-teal-100/90 text-sm mt-2 leading-relaxed">
            Giáo viên hướng dẫn: Nguyễn Thị Kiều Ân
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('video-psychology')}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 hover:scale-105 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Quản lý Video Ngắn (Dừng 10s · Đổi 15p)</span>
            </button>
            <button
              onClick={() => onNavigate('happy-tree')}
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition border border-emerald-400/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Sprout className="w-4 h-4 text-emerald-200" />
              <span>Cây Hạnh Phúc (Nuôi dưỡng tinh thần)</span>
            </button>
            <button
              onClick={() => onNavigate('score-analysis')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Phân tích Phổ điểm &amp; DBSCAN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          onClick={() => onNavigate('video-psychology')}
          className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs hover:border-teal-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Thói quen Video Ngắn
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            45 <span className="text-xs font-semibold text-slate-400">phút/ngày</span>
          </div>
          <div className="mt-2 text-xs text-teal-700 font-semibold flex items-center gap-1">
            <span>Ngưỡng an toàn khuyến cáo</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('happy-tree')}
          className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Cây Hạnh Phúc
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            6 Cấp Độ
          </div>
          <div className="mt-2 text-xs text-emerald-800 font-semibold flex items-center gap-1">
            <span>Hạt mầm → Mầm xanh → Chồi non → Lá → Hoa → Trái</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('score-analysis')}
          className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-400 transition cursor-pointer group bg-gradient-to-b from-white to-rose-50/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Nguy cơ điểm liệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {atRiskStudents.length}{' '}
            <span className="text-xs font-semibold text-rose-400">học sinh (&le; 3.5)</span>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-bold flex items-center gap-1">
            <span>DBSCAN phát hiện do thức khuya</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('score-analysis')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Phổ điểm khảo sát
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {avgStudentScore} <span className="text-xs font-semibold text-slate-400">điểm TB</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-1">
            <span>{currentStudents.length} học sinh toàn khối</span>
          </div>
        </div>
      </div>

             {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent At-Risk Intervention Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Danh Sách Học Sinh Nguy Cơ Cần Can Thiệp
                  </h3>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-slate-200">
                    <th className="py-2.5 px-3">Học sinh</th>
                    <th className="py-2.5 px-3">Lớp</th>
                    <th className="py-2.5 px-3 text-center">Điểm thi</th>
                    <th className="py-2.5 px-3">Vấn đề cốt lõi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {atRiskStudents.slice(0, 4).map((st) => (
                    <tr key={st.id} className="hover:bg-red-50/30 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {st.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{st.className}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-red-600 bg-red-100 px-2 py-0.5 rounded">
                          {st.scoreFinal} đ
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {st.riskFactors[0] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts to 4 Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4">
              Lối Tắt Nghiệp Vụ Chuyên Môn Trực Tuyến
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => onNavigate('lesson-plan')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Kế hoạch Giáo dục CV 5512</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phân phối chương trình, chuyên đề dạy học
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('meeting')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Biên bản SHCM NĐ 30/2020</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      4 bước nghiên cứu bài học, xuất Word chuẩn
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('score-analysis')}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/30 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Gom Cụm Phổ Điểm DBSCAN</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phân hóa năng lực
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('happy-tree')}
                className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40 hover:border-emerald-500 hover:bg-emerald-50/60 transition cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-900 text-sm">Cây Hạnh Phúc</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Timeline & Notices */}
        <div className="space-y-6">
          {/* Upcoming Department Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Lịch Sinh Hoạt Chuyên Môn</span>
            </h3>

            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                  <span>Thứ Năm, 19/11 - 14h15</span>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    NCBH Đợt 1
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  Nghiên cứu bài học Tin học 12: Tiết dạy minh họa ThS. Nguyễn Bảo Ngưng
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Địa điểm: Phòng Thư viện
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-800">
                  <span>Thứ Năm, 18/03 - 14h00</span>
                  <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    NCBH Đợt 2
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  Nghiên cứu bài học Toán 12: Tiết dạy minh họa Thầy Lê Trung Hậu
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Địa điểm: Phòng Thư viện</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Thứ Năm, 07/11 - 14h00</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  Rà soát hồ sơ minh chứng TEMIS học kỳ I của {SAMPLE_TEACHERS.length} giáo viên (100% Mức Tốt)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổ trưởng & Tổ phó tổng hợp biên bản
                </p>
              </div>
            </div>
          </div>

          {/* Department Members Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Thành Viên Trong Tổ ({SAMPLE_TEACHERS.length})</span>
              </span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                100% Xếp loại Tốt
              </span>
            </h3>

            <div className="space-y-3">
              {SAMPLE_TEACHERS.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{tc.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {tc.subject} • {tc.duty}
                    </p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      tc.temisRating === 'Tốt'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    TEMIS: {tc.temisRating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TikZ LaTeX Chart Export Modal */}
      <ChartTikzExportModal
        isOpen={isTikzModalOpen}
        onClose={() => setIsTikzModalOpen(false)}
        initialChartId="score-spectrum"
        students={currentStudents}
      />
    </div>
  );
};
