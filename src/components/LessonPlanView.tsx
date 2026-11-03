import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Printer,
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { LessonPlan5512 } from '../types';
import { INITIAL_LESSON_PLAN_5512 } from '../data/mockData';
import { exportToWordDocument, callAiAssistant } from '../services/aiService';

export const LessonPlanView: React.FC = () => {
  const [plan, setPlan] = useState<LessonPlan5512>(INITIAL_LESSON_PLAN_5512);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  const handleExportWord = () => {
    const content = `
      <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 45%; text-align: center; border: none;">
              <b>${plan.schoolName}</b><br/>
              <b>${plan.deptName}</b><br/>
              <hr style="width: 120px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
            <td style="width: 55%; text-align: center; border: none;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b>Độc lập - Tự do - Hạnh phúc</b>
              <hr style="width: 160px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
          </tr>
        </table>

        <h2 style="text-align: center; margin-top: 25px; text-transform: uppercase;">
          KẾ HOẠCH DẠY HỌC CỦA TỔ CHUYÊN MÔN<br/>
          <span style="font-size: 13pt; font-weight: normal;">MÔN HỌC: ${plan.subject} - ${plan.grade} (NĂM HỌC ${plan.schoolYear})</span><br/>
          <span style="font-size: 11pt; font-weight: normal; font-style: italic;">(Kèm theo Công văn số 5512/BGDĐT-GDTrH ngày 18 tháng 12 năm 2020 của Bộ GDĐT)</span>
        </h2>

        <h3>I. Phân phối chương trình:</h3>
        <p>- Cả năm: 35 tuần (${plan.timeAllocation.totalPeriods} tiết)</p>
        <p>- Học kỳ I: ${plan.timeAllocation.term1Weeks} tuần (${plan.timeAllocation.term1Periods} tiết)</p>
        <p>- Học kỳ II: ${plan.timeAllocation.term2Weeks} tuần (${plan.timeAllocation.term2Periods} tiết)</p>

        <h3>II. Kế hoạch dạy học chi tiết:</h3>
        <table border="1" style="width: 100%; border-collapse: collapse; font-size: 12pt;">
          <tr style="background-color: #f2f2f2;">
            <th>STT</th>
            <th>Bài học / Chuyên đề</th>
            <th>Số tiết</th>
            <th>Thời điểm</th>
            <th>Thiết bị dạy học</th>
            <th>Yêu cầu cần đạt</th>
          </tr>
          ${plan.topics
            .map(
              (t) => `
            <tr>
              <td align="center">${t.order}</td>
              <td><b>${t.name}</b></td>
              <td align="center">${t.periods}</td>
              <td align="center">${t.deliveryTime}</td>
              <td>${t.deviceTools}</td>
              <td>${t.learningOutcomes}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center; border: none; font-size: 13pt;">
              <b>HIỆU TRƯỞNG / GIÁM ĐỐC</b><br/>
              <i>(Ký và phê duyệt)</i><br/><br/><br/><br/>
            </td>
            <td style="width: 50%; text-align: center; border: none; font-size: 13pt;">
              <b>TỔ TRƯỞNG CHUYÊN MÔN</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/>
              <b>Nguyễn Văn Tâm</b>
            </td>
          </tr>
        </table>
      </div>
    `;

    exportToWordDocument('Ke_Hoach_Day_Hoc_To_5512', content);
  };

  const handleAiSuggestTopic = async () => {
    setIsAiGenerating(true);
    try {
      const res = await callAiAssistant({
        type: 'lesson-plan',
        prompt:
          'Gợi ý thêm 01 chuyên đề ôn thi tốt nghiệp môn Toán chống liệt cho học sinh GDTX theo chuẩn CV 5512.',
        context: {
          subject: plan.subject,
          grade: plan.grade,
        },
      });

      // Add suggested topic
      setPlan((prev) => ({
        ...prev,
        topics: [
          ...prev.topics,
          {
            order: prev.topics.length + 1,
            name: 'Chuyên đề: Rèn luyện 15 kỹ năng sử dụng máy tính Casio fx-580VNX chống liệt tốt nghiệp',
            periods: 6,
            deliveryTime: 'Tuần 20 - Tuần 22',
            deviceTools: 'Máy chiếu, giả lập máy tính Casio trên máy vi tính',
            learningOutcomes:
              'Thực hành thành thạo giải phương trình, tính tích phân, tìm nghiệm số phức và tọa độ vecto bằng Casio.',
          },
        ],
      }));
    } catch (e) {
      console.warn('AI Error', e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-1 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Phụ lục 1 • Công văn 5512/BGDĐT-GDTrH</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Kế Hoạch Giáo Dục Của Tổ Chuyên Môn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Phân phối chương trình chi tiết môn Toán 12 (105 tiết) & Kế hoạch kiểm tra định kỳ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAiSuggestTopic}
            disabled={isAiGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAiGenerating ? 'Đang thêm...' : 'AI Thêm chuyên đề'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>In A4</span>
          </button>

          <button
            onClick={handleExportWord}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <FileDown className="w-4 h-4" />
            <span>Xuất Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-bold uppercase">Tổng số tuần</span>
          <div className="text-2xl font-black text-slate-800 mt-1">35 tuần</div>
          <span className="text-xs text-slate-500">Chuẩn Bộ GD&ĐT</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-bold uppercase">Học kỳ I</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {plan.timeAllocation.term1Periods} tiết
          </div>
          <span className="text-xs text-slate-500">18 tuần x 3 tiết</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-bold uppercase">Học kỳ II</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {plan.timeAllocation.term2Periods} tiết
          </div>
          <span className="text-xs text-slate-500">17 tuần x 3 tiết</span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-xs text-emerald-800 font-bold uppercase">Tổng thời lượng</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {plan.timeAllocation.totalPeriods} tiết
          </div>
          <span className="text-xs text-emerald-700">Đã cân đối kiểm tra</span>
        </div>
      </div>

      {/* Table of Topics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Phân Phối Chương Trình Chi Tiết (Công Văn 5512)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {plan.topics.length} bài học / chuyên đề
          </span>
        </div>

        <table className="w-full text-xs text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <th className="p-3 border-r border-slate-300 text-center w-12">STT</th>
              <th className="p-3 border-r border-slate-300 w-1/4">Tên bài học / chuyên đề</th>
              <th className="p-3 border-r border-slate-300 text-center w-16">Số tiết</th>
              <th className="p-3 border-r border-slate-300 text-center w-28">Thời điểm</th>
              <th className="p-3 border-r border-slate-300 w-1/5">Thiết bị dạy học</th>
              <th className="p-3">Yêu cầu cần đạt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {plan.topics.map((t, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">
                  {t.order}
                </td>
                <td className="p-3 font-bold text-slate-800 border-r border-slate-200">{t.name}</td>
                <td className="p-3 text-center font-black text-blue-600 border-r border-slate-200">
                  {t.periods}
                </td>
                <td className="p-3 text-center font-medium text-slate-600 border-r border-slate-200">
                  {t.deliveryTime}
                </td>
                <td className="p-3 text-slate-600 border-r border-slate-200">{t.deviceTools}</td>
                <td className="p-3 text-slate-700 leading-relaxed">{t.learningOutcomes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
